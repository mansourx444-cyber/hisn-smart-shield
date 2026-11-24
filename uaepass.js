/* «حِصن» — الدخول بالهوية الرقمية (UAE PASS) عبر OAuth 2.0
 * الافتراضي: بيئة الاختبار الرسمية لـ UAE PASS وبيانات الاعتماد العامة المخصّصة لإثبات المفهوم (sandbox_stage).
 * للتشغيل الفعلي: UAEPASS_ENV=prod مع UAEPASS_CLIENT_ID و UAEPASS_CLIENT_SECRET الصادرين للجهة بعد الانضمام.
 * لا نطلب كلمة مرور ولا نخزّن رقم الهوية: نأخذ الاسم ونوع الحساب فقط، ولا تُحفظ الجلسة على الخادم.
 */
'use strict';
const crypto = require('crypto');

const ENV = process.env.UAEPASS_ENV === 'prod' ? 'prod' : 'stg';
const BASE = ENV === 'prod' ? 'https://id.uaepass.ae/idshub' : 'https://stg-id.uaepass.ae/idshub';
const CLIENT_ID = process.env.UAEPASS_CLIENT_ID || 'sandbox_stage';
const CLIENT_SECRET = process.env.UAEPASS_CLIENT_SECRET || 'sandbox_stage';
const states = new Map(); // state -> { role, orgId, lang, next, t }
const recent = []; // آخر نتائج الدخول بلا بيانات شخصية (للتشخيص)
function note(x) { recent.push({ at: new Date().toISOString(), ...x }); if (recent.length > 10) recent.shift(); }
const safeNext = (n, d) => (typeof n === 'string' && /^\/(?!\/)[^\s\\]*$/.test(n) && n.length < 300 ? n : d);

function baseUrl(req, publicUrl) {
  if (publicUrl) return publicUrl;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0] || (req.socket.encrypted ? 'https' : 'http');
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
function sweep() { const now = Date.now(); for (const [k, v] of states) if (now - v.t > 600000) states.delete(k); }

// صفحة صغيرة تعيد النتيجة للنافذة التي فتحت الدخول ثم تُغلق
function finishPage(res, payload, lang) {
  const data = JSON.stringify(payload).replace(/</g, '\\u003c');
  const msg = payload.ok ? (lang === 'en' ? 'Signed in. You can close this window.' : 'تم الدخول، يمكنك إغلاق هذه النافذة.') : (lang === 'en' ? 'Sign-in was not completed.' : 'لم يكتمل الدخول.');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAE PASS</title>
<body style="font-family:system-ui;text-align:center;padding:40px" dir="${lang === 'en' ? 'ltr' : 'rtl'}"><p>${msg}</p>
<script>const d=${data};try{if(window.opener){window.opener.postMessage({uaepass:d},location.origin);setTimeout(()=>window.close(),300);}else{sessionStorage.setItem('uaepass.result',JSON.stringify(d));location.replace(d.next||'/');}}catch(e){location.replace('/');}</script></body>`);
}

async function handle(req, res, url, ctx) {
  const p = url.pathname;
  if (p === '/auth/uaepass/start') {
    sweep();
    const state = crypto.randomBytes(16).toString('hex');
    const role = url.searchParams.get('role') === 'partner' ? 'partner' : 'user';
    states.set(state, { role, orgId: url.searchParams.get('org') || '', lang: url.searchParams.get('lang') === 'en' ? 'en' : 'ar', next: safeNext(url.searchParams.get('next'), role === 'partner' ? '/partners' : '/index.html'), t: Date.now() });
    const q = new URLSearchParams({
      response_type: 'code', client_id: CLIENT_ID, scope: 'urn:uae:digitalid:profile:general', state,
      redirect_uri: baseUrl(req, ctx.publicUrl) + '/auth/uaepass/callback',
      acr_values: 'urn:safelayer:tws:policies:authentication:level:low', ui_locales: url.searchParams.get('lang') === 'en' ? 'en' : 'ar',
    });
    res.writeHead(302, { Location: `${BASE}/authorize?${q}`, 'Cache-Control': 'no-store' });
    res.end();
    return true;
  }
  if (p === '/auth/uaepass/callback') {
    const st = states.get(url.searchParams.get('state') || '');
    if (!st) { note({ ok: false, error: 'state' }); finishPage(res, { ok: false, error: 'state' }, 'ar'); return true; }
    states.delete(url.searchParams.get('state'));
    const code = url.searchParams.get('code');
    if (!code) { note({ ok: false, error: url.searchParams.get('error') || 'cancelled' }); finishPage(res, { ok: false, error: url.searchParams.get('error') || 'cancelled', next: st.next }, st.lang); return true; }
    try {
      const redirect = baseUrl(req, ctx.publicUrl) + '/auth/uaepass/callback';
      const form = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect });
      const tr = await fetch(`${BASE}/token?${form}`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
      const tok = await tr.json();
      if (!tok.access_token) throw new Error('token');
      const ur = await fetch(`${BASE}/userinfo`, { headers: { Authorization: 'Bearer ' + tok.access_token } });
      const u = await ur.json();
      const user = {
        name: st.lang === 'en' ? (u.fullnameEN || [u.firstnameEN, u.lastnameEN].filter(Boolean).join(' ')) : (u.fullnameAR || u.firstnameAR || u.fullnameEN),
        userType: u.userType || null, // SOP1 / SOP2 / SOP3 (مستوى توثيق الحساب)
        env: ENV, verifiedAt: Date.now(),
      };
      const out = { ok: true, role: st.role, user, next: st.next };
      if (st.role === 'partner') { const s = ctx.partnerLogin(st.orgId); if (!s) throw new Error('org'); out.session = s; }
      ctx.log('[uaepass]', st.role, ENV, user.userType || '');
      note({ ok: true, role: st.role, env: ENV, userType: user.userType, hasName: !!user.name });
      finishPage(res, out, st.lang);
    } catch (e) {
      ctx.log('[uaepass] failed', e.message);
      note({ ok: false, error: 'exchange', detail: String(e.message).slice(0, 80) });
      finishPage(res, { ok: false, error: 'exchange', next: st.next }, st.lang);
    }
    return true;
  }
  if (p === '/auth/uaepass/status') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ env: ENV, recent })); return true; }
  return false;
}

module.exports = { handle, ENV };
