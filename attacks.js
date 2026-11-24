/* «حِصن» — سجل الهجمات لخريطة الإمارات
 * كل هجمة صدّها «حِصن» أو أبلغ عنها مستخدم أو كشفها الماسح تُسجَّل بلا بيانات شخصية:
 * النوع، والإمارة فقط (لا إحداثيات ولا عنوان IP)، ودولة استضافة الرابط إن وُجدت، والنطاق للروابط فقط.
 * الإمارة: من الجهاز (إن سمح المستخدم بالموقع، يُرسل اسم الإمارة فقط)، وإلا من عنوان IP عبر ipwho.is ثم يُحذف العنوان.
 * عنوان MAC لا يُستخدم: لا يخرج من الشبكة المحلية ولا يدل على موقع.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const ISO = ['AE-AZ', 'AE-DU', 'AE-SH', 'AE-AJ', 'AE-UQ', 'AE-RK', 'AE-FU'];
const TYPES = ['sms', 'call', 'link', 'wa', 'email', 'social', 'qr', 'app'];
const REGION = [[/abu\s*dhabi|abū|al\s*ain|العين|أبوظبي/i, 'AE-AZ'], [/dubai|دبي/i, 'AE-DU'], [/sharjah|الشارقة/i, 'AE-SH'], [/ajman|عجمان/i, 'AE-AJ'], [/umm\s*al|quwain|أم القيوين/i, 'AE-UQ'], [/ras\s*al|khaimah|رأس الخيمة/i, 'AE-RK'], [/fujair|الفجيرة/i, 'AE-FU']];

let FILE = null, list = [], seq = 0, dirty = false;
const ipCache = new Map(); // ip -> { v, t } (في الذاكرة فقط لساعة، لتقليل الطلبات)

function init(dataDir) {
  FILE = path.join(dataDir, 'attacks.json');
  try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); list = Array.isArray(j) ? j : []; seq = list.reduce((m, x) => Math.max(m, x.n || 0), 0); } catch { list = []; }
  setInterval(save, 15000).unref();
}
function save() {
  if (!dirty || !FILE) return; dirty = false;
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(list)); } catch {}
}
function clientIp(req) {
  const xf = String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket.remoteAddress || '';
}
function isPrivate(ip) {
  ip = ip.replace(/^::ffff:/, '');
  if (!net.isIP(ip)) return true;
  if (net.isIPv4(ip)) { const [a, b] = ip.split('.').map(Number); return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a === 0 || a >= 224; }
  return /^(::1|fc|fd|fe80)/i.test(ip);
}
// موقع تقريبي من عنوان IP (الدولة والمنطقة فقط)
async function geoIp(ip) {
  ip = String(ip || '').replace(/^::ffff:/, '');
  if (!ip || isPrivate(ip)) return null;
  const c = ipCache.get(ip); if (c && Date.now() - c.t < 3600000) return c.v;
  let v = null;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 4000);
    const j = await fetch('https://ipwho.is/' + encodeURIComponent(ip) + '?fields=success,country_code,region,city', { signal: ctl.signal }).then((r) => r.json()).finally(() => clearTimeout(tm));
    if (j && j.success) { const txt = `${j.region || ''} ${j.city || ''}`; const hit = REGION.find(([re]) => re.test(txt)); v = { country: j.country_code || null, emirate: j.country_code === 'AE' && hit ? hit[1] : null }; }
  } catch {}
  ipCache.set(ip, { v, t: Date.now() }); if (ipCache.size > 2000) ipCache.delete(ipCache.keys().next().value);
  return v;
}
function add(ev) {
  const e = {
    n: ++seq, id: crypto.randomBytes(5).toString('hex'), at: Date.now(),
    type: TYPES.includes(ev.type) ? ev.type : 'sms',
    kind: ev.kind ? String(ev.kind).replace(/[^a-z-]/gi, '').slice(0, 16) : null,
    emirate: ISO.includes(ev.emirate) ? ev.emirate : null,
    country: ev.country && /^[A-Z]{2}$/.test(ev.country) ? ev.country : null,
    domain: ev.domain ? String(ev.domain).toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').slice(0, 80) : null,
    src: ['device', 'report', 'scan', 'sim'].includes(ev.src) ? ev.src : 'device',
    sim: !!ev.sim,
  };
  list.push(e); if (list.length > 3000) list = list.slice(-3000);
  dirty = true;
  return e;
}
// يسجّل هجمة من طلب: يأخذ الإمارة من الجهاز إن أرسلها، وإلا من عنوان IP (ولا يحفظه)
async function record(req, ev) {
  let emirate = ISO.includes(ev.emirate) ? ev.emirate : null;
  if (!emirate) { const g = await geoIp(clientIp(req)); if (g) emirate = g.emirate; }
  return add({ ...ev, emirate });
}
// دولة استضافة رابط احتيالي (من أول عنوان IP للخادم)
async function hostCountry(ips, rdapCountry) {
  if (rdapCountry && /^[A-Z]{2}$/.test(rdapCountry)) return rdapCountry;
  const ip = (ips || []).find((x) => net.isIPv4(x)) || (ips || [])[0];
  const g = ip ? await geoIp(ip) : null;
  return g ? g.country : null;
}
function since(afterN, days) {
  const from = Date.now() - Math.min(30, Math.max(1, days || 30)) * 86400000;
  return list.filter((e) => e.at >= from && (!afterN || e.n > afterN)).slice(-1500);
}
// محاكاة للعرض (مُعلَّمة بوضوح "محاكاة"): أنواع وإمارات بأوزان تقريبية
const SIM = {
  em: [['AE-DU', 30], ['AE-AZ', 28], ['AE-SH', 18], ['AE-AJ', 7], ['AE-RK', 7], ['AE-FU', 5], ['AE-UQ', 5]],
  ty: [['sms', 30], ['call', 22], ['link', 18], ['wa', 14], ['email', 6], ['social', 5], ['qr', 3], ['app', 2]],
  kinds: { sms: ['otp', 'delivery', 'fine'], call: ['otp', 'transfer', 'remote', 'police'], link: ['login', 'card'], wa: ['otp', 'boss'], email: ['login'], social: ['brand'], qr: ['donate'], app: ['apk'] },
  hosts: [['adcb-verify-account.top', 'NL'], ['uaepass-login.xyz', 'US'], ['rta-fines-pay.online', 'RU'], ['emiratespost-track.info', 'SG'], ['dewa-refund.site', 'DE'], ['tamm-gov.ae-pay.com', 'US'], ['etisalat-gift.live', 'HK']],
};
const pick = (arr) => { const t = arr.reduce((a, x) => a + x[1], 0); let r = Math.random() * t; for (const x of arr) { r -= x[1]; if (r <= 0) return x[0]; } return arr[0][0]; };
function simulate(n) {
  const out = [];
  for (let i = 0; i < Math.min(30, n || 1); i++) {
    const type = pick(SIM.ty); const ks = SIM.kinds[type];
    const h = (type === 'link' || type === 'email' || type === 'sms') && Math.random() < 0.6 ? SIM.hosts[Math.floor(Math.random() * SIM.hosts.length)] : null;
    out.push(add({ type, kind: ks[Math.floor(Math.random() * ks.length)], emirate: pick(SIM.em), domain: h && h[0], country: h && h[1], src: 'sim', sim: true }));
  }
  return out;
}
function clearSim() { const b = list.length; list = list.filter((e) => !e.sim); dirty = dirty || b !== list.length; return b - list.length; }

module.exports = { init, record, add, since, simulate, clearSim, hostCountry, clientIp, ISO, TYPES, save };
