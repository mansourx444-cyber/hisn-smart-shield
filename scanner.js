/* «حِصن» — الفحص العميق للروابط على الخادم (يحتاج اتصالًا بالإنترنت)
 * - يتتبّع إعادة التوجيه والروابط المختصرة حتى الوجهة النهائية (حتى 8 خطوات)، ويلتقط إعادة التوجيه داخل الصفحة (meta/JS)
 * - يكشف الإخفاء (Cloaking): يقارن ما يراه متصفح هاتف بما يراه روبوت فحص
 * - يقرأ محتوى الصفحة: العنوان، حقول كلمة المرور وبيانات البطاقة، والعلامات المذكورة
 * - يجمع أدلة للشرطة: تاريخ تسجيل النطاق والمسجّل وبريد البلاغات (RDAP/WHOIS)، وعناوين IP والاستضافة والدولة، وبصمة الصفحة والوقت
 * - الرصد المبكر: نطاقات جديدة تحمل اسم علامة محلية من سجلات شفافية الشهادات (crt.sh)
 * أمان: لا يزور إلا http/https، ويرفض العناوين الداخلية والخاصة (حماية من SSRF)، ولا ينفّذ أي سكربت من الصفحة.
 */
'use strict';
const dns = require('dns').promises;
const net = require('net');
const crypto = require('crypto');
const engine = require('./public/engine.js');

const UA_PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const UA_BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const ALLOW_PRIVATE = process.env.SCAN_ALLOW_PRIVATE === '1'; // للاختبارات المحلية فقط

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const l = ip.toLowerCase();
  return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:127.') || l.startsWith('::ffff:10.') || l.startsWith('::ffff:192.168.');
}
async function resolveHost(host) {
  if (net.isIP(host)) return [host];
  try { const r = await dns.lookup(host, { all: true }); return r.map((x) => x.address); } catch { return []; }
}
async function safeTarget(u) {
  let url; try { url = new URL(u); } catch { return { ok: false, why: 'invalid' }; }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, why: 'scheme' };
  const ips = await resolveHost(url.hostname.replace(/^\[|\]$/g, ''));
  if (!ips.length) return { ok: false, why: 'dns', ips };
  if (!ALLOW_PRIVATE && ips.some(privateIp)) return { ok: false, why: 'private', ips };
  return { ok: true, url, ips };
}
function withTimeout(ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return { signal: c.signal, done: () => clearTimeout(t) }; }
async function readLimited(res, max) {
  if (!res.body) return '';
  const reader = res.body.getReader(); const chunks = []; let n = 0;
  while (n < max) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); n += value.length; }
  try { reader.cancel(); } catch {}
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

// يتتبّع التحويلات يدويًا (حتى يتحقق من كل خطوة) ويلتقط التحويل داخل الصفحة
async function follow(start, ua) {
  const chain = []; let cur = start; let html = ''; let status = 0; let ctype = '';
  for (let hop = 0; hop < 8; hop++) {
    const st = await safeTarget(cur);
    if (!st.ok) return { chain, final: cur, error: st.why, ips: st.ips || [] };
    const to = withTimeout(6000);
    let res;
    try { res = await fetch(cur, { redirect: 'manual', signal: to.signal, headers: { 'user-agent': ua, accept: 'text/html,*/*;q=0.8', 'accept-language': 'ar,en;q=0.8' } }); }
    catch (e) { to.done(); return { chain, final: cur, error: e.name === 'AbortError' ? 'timeout' : 'fetch', ips: st.ips }; }
    status = res.status; ctype = res.headers.get('content-type') || '';
    chain.push({ url: cur, status, ips: st.ips });
    const loc = res.headers.get('location');
    if (status >= 300 && status < 400 && loc) { to.done(); cur = new URL(loc, cur).href; continue; }
    html = /html|text/.test(ctype) ? await readLimited(res, 400000) : '';
    to.done();
    const meta = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i);
    const js = html.length < 6000 ? html.match(/(?:window\.)?location(?:\.href)?\s*(?:=|\.replace\(|\.assign\()\s*["']([^"']+)["']/i) : null;
    const next = (meta && meta[1]) || (js && js[1]);
    if (next && hop < 7) { try { const nu = new URL(next, cur).href; if (nu !== cur) { cur = nu; continue; } } catch {} }
    return { chain, final: cur, status, html, ips: st.ips };
  }
  return { chain, final: cur, error: 'too-many-redirects' };
}
function pageInfo(html) {
  const title = ((html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return {
    title,
    hasPassword: /type=["']?password/i.test(html),
    hasCard: /(card.?number|cardnumber|cc-number|cvv|cvc|رقم البطاق|تاريخ الانتهاء|expiry)/i.test(html),
    brands: engine.brandsInText(title + ' ' + text.slice(0, 20000)),
    sha256: crypto.createHash('sha256').update(html).digest('hex'),
    bytes: Buffer.byteLength(html),
  };
}
async function getJson(url, ms) {
  const to = withTimeout(ms || 6000);
  try { const r = await fetch(url, { signal: to.signal, headers: { accept: 'application/rdap+json, application/json' } }); if (!r.ok) return null; return await r.json(); }
  catch { return null; } finally { to.done(); }
}
function vcardName(ent) { try { const fn = (ent.vcardArray[1] || []).find((x) => x[0] === 'fn'); return fn ? fn[3] : null; } catch { return null; } }
function vcardEmail(ent) { try { const em = (ent.vcardArray[1] || []).find((x) => x[0] === 'email'); return em ? em[3] : null; } catch { return null; } }
// بيانات تسجيل النطاق (RDAP — البديل الحديث لـ WHOIS)
async function rdapDomain(domain) {
  const j = await getJson('https://rdap.org/domain/' + encodeURIComponent(domain), 7000);
  if (!j) return null;
  const ev = (a) => ((j.events || []).find((e) => e.eventAction === a) || {}).eventDate || null;
  let registrar = null, abuse = null;
  for (const e of j.entities || []) {
    if ((e.roles || []).includes('registrar')) { registrar = vcardName(e) || registrar; for (const s of e.entities || []) if ((s.roles || []).includes('abuse')) abuse = vcardEmail(s) || abuse; }
    if ((e.roles || []).includes('abuse')) abuse = vcardEmail(e) || abuse;
  }
  const created = ev('registration');
  return { created, updated: ev('last changed'), expires: ev('expiration'), registrar, abuse, status: j.status || [], nameservers: (j.nameservers || []).map((n) => n.ldhName).slice(0, 4) };
}
// الاستضافة: مالك عنوان IP ودولته
async function rdapIp(ip) {
  const j = await getJson('https://rdap.org/ip/' + encodeURIComponent(ip), 7000);
  if (!j) return null;
  let org = j.name || null, abuse = null;
  for (const e of j.entities || []) { if ((e.roles || []).includes('registrant')) org = vcardName(e) || org; if ((e.roles || []).includes('abuse')) abuse = vcardEmail(e) || abuse; for (const s of e.entities || []) if ((s.roles || []).includes('abuse')) abuse = vcardEmail(s) || abuse; }
  return { ip, org, country: j.country || null, range: j.handle || null, abuse };
}
const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86400000)) : null);

// فحص رابط واحد: سريع (تحليل فقط) أو عميق (تتبع + محتوى + أدلة)
async function scanOne(raw, opts) {
  const lang = (opts && opts.lang) || 'ar';
  const scannedAt = new Date().toISOString();
  const quick = engine.scanUrl(raw, { lang });
  if (!opts || !opts.deep) return { ...quick, scannedAt, deep: false };
  const startUrl = /^[a-z]+:\/\//i.test(raw) ? raw : 'http://' + raw;
  const ev = { scannedAt, input: raw };
  const [phone, bot] = await Promise.all([follow(startUrl, UA_PHONE), follow(startUrl, UA_BOT)]);
  ev.chain = phone.chain; ev.finalUrl = phone.final; ev.fetchError = phone.error || null;
  let page = null; if (phone.html) page = pageInfo(phone.html);
  let cloaked = false;
  if (!phone.error && !bot.error) {
    const h1 = (() => { try { return new URL(phone.final).hostname; } catch { return ''; } })();
    const h2 = (() => { try { return new URL(bot.final).hostname; } catch { return ''; } })();
    const b = bot.html ? pageInfo(bot.html) : null;
    cloaked = (h1 && h2 && engine.registrable(h1) !== engine.registrable(h2)) || (page && b && page.hasPassword !== b.hasPassword) || (page && b && page.title && b.title && page.title !== b.title && (page.brands.length !== b.brands.length));
  }
  let host = ''; try { host = new URL(phone.final || startUrl).hostname; } catch {}
  const reg = host ? engine.registrable(host) : '';
  const [whois, ipInfo] = await Promise.all([reg && !net.isIP(host) ? rdapDomain(reg) : null, (phone.ips && phone.ips[0]) ? rdapIp(phone.ips[0]) : null]);
  ev.whois = whois; ev.hosting = ipInfo; ev.ips = phone.ips || [];
  ev.page = page ? { title: page.title, hasPassword: page.hasPassword, hasCard: page.hasCard, brands: page.brands, sha256: page.sha256, bytes: page.bytes, status: phone.status } : null;
  ev.cloaked = !!cloaked;
  const ageDays = whois ? daysSince(whois.created) : null;
  const final = phone.final && phone.final !== startUrl ? phone.final : null;
  const r = engine.scanUrl(raw, { lang, finalUrl: final, chain: phone.chain, ageDays, cloaked, page });
  ev.screenshot = 'https://image.thum.io/get/width/1024/crop/1400/' + (phone.final || startUrl);
  return { ...r, scannedAt, deep: true, ageDays, evidence: ev };
}
async function scanMany(urls, opts) {
  const list = [...new Set(urls.map((u) => String(u).trim()).filter(Boolean))].slice(0, (opts && opts.deep) ? 60 : 2000);
  const out = new Array(list.length); let i = 0;
  const workers = Array.from({ length: (opts && opts.deep) ? 6 : 1 }, async () => { while (i < list.length) { const k = i++; try { out[k] = await scanOne(list[k], opts); } catch (e) { out[k] = { url: list[k], verdict: 'error', score: null, reasons: [{ key: 'error', text: String(e.message || e) }] }; } } });
  await Promise.all(workers);
  return out;
}

// الرصد المبكر: شهادات أمان صدرت حديثًا لنطاقات تحمل اسم علامة محلية (سجلات شفافية الشهادات)
async function watchBrand(keyword, days, lang) {
  const kw = String(keyword || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  if (kw.length < 3) return { keyword: kw, error: 'keyword', items: [] };
  const j = await getJson(`https://crt.sh/?q=${encodeURIComponent('%' + kw + '%')}&output=json&exclude=expired`, 20000);
  if (!Array.isArray(j)) return { keyword: kw, error: 'source', items: [] };
  const since = Date.now() - (days || 30) * 86400000; const seen = new Map();
  for (const c of j) {
    const t = Date.parse(c.not_before || c.entry_timestamp || ''); if (!t || t < since) continue;
    for (let name of String(c.name_value || '').split('\n')) {
      name = name.replace(/^\*\./, '').toLowerCase(); if (!name.includes(kw) || seen.has(name)) continue;
      seen.set(name, { domain: name, firstSeen: new Date(t).toISOString(), issuer: (c.issuer_name || '').replace(/.*O=([^,]+).*/, '$1') });
    }
  }
  const items = [...seen.values()].map((x) => { const r = engine.scanUrl('https://' + x.domain, { lang, ageDays: daysSince(x.firstSeen) }); return { ...x, score: r.score, verdict: r.verdict, official: r.official, reasons: r.reasons.map((y) => y.text) }; })
    .filter((x) => !x.official).sort((a, b) => b.score - a.score || b.firstSeen.localeCompare(a.firstSeen)).slice(0, 60);
  return { keyword: kw, days: days || 30, checkedAt: new Date().toISOString(), total: seen.size, items };
}

module.exports = { scanOne, scanMany, watchBrand, privateIp };
