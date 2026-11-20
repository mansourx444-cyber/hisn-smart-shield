/* الدرع الذكي — خادم صغير بلا مكتبات خارجية (Node 22+)
 * - يقدّم ملفات الواجهة
 * - يربط الهاتفين في غرفة مؤقتة (إشارات WebRTC عبر SSE + POST)
 * - يمرّر صوت المتصل إلى خدمة التفريغ اللحظي (OpenAI Realtime) ويحتفظ بالمفتاح هنا
 * - يفحص كل عبارة مكتملة ويرسل التنبيه لهاتف المستخدم
 * لا يحفظ الصوت ولا نص المكالمة في أي سجل؛ السياق القريب في الذاكرة فقط ويُحذف بإنهاء المكالمة.
 */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const engine = require('./public/engine.js');

const PORT = Number(process.env.PORT) || 3000;
const KEY = process.env.OPENAI_API_KEY || '';
const STT_MODEL = process.env.STT_MODEL || 'gpt-4o-transcribe';
const STT_API = (process.env.STT_API || 'ga').toLowerCase(); // ga | beta
const STT_URL = process.env.STT_URL || 'wss://api.openai.com/v1/realtime?intent=transcription';
const TURN = process.env.TURN_URL ? { urls: process.env.TURN_URL, username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' } : null;
const PUBLIC = path.join(__dirname, 'public');
const ROOM_TTL_MS = 30 * 60 * 1000; // تُحذف الغرفة إذا غاب هاتف المستخدم 30 دقيقة
const ASSIST_MODEL = process.env.ASSIST_MODEL || 'gpt-4o-mini';
const REALERT_MS = 6000;

const AUDIO_MIME = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.webm': 'audio/webm', '.opus': 'audio/ogg' };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

/** @type {Map<string, any>} */
const rooms = new Map();

/* ------------------------------ ممارسات الاحتيال التي تنشرها الجهات ------------------------------ */
const DATA_DIR = path.join(__dirname, 'data');
const PAT_FILE = path.join(DATA_DIR, 'patterns.json');
const SEED = [{
  id: 'seed-police-safe-account', orgId: 'adpolice', org: { ar: 'شرطة أبوظبي', en: 'Abu Dhabi Police' },
  title: { ar: 'انتحال صفة الشرطة وطلب التحويل إلى «حساب آمن»', en: 'Police impersonation asking for a “safe account” transfer' },
  channel: 'call', description: 'يتصل المحتال مدّعيًا أنه محقق، ويخوّف الضحية من تورط حسابها، ثم يطلب تحويل الرصيد إلى «حساب آمن».',
  phrases: ['حساب آمن', 'حساب امن', 'safe account'], domains: [], official: 'adpolice.gov.ae', severity: 'high', createdAt: Date.now() - 86400000 * 2,
}];
let patterns = [];
let partnerTokens = new Map(); // token -> orgId (ذاكرة فقط)
const hits = {};
function loadPatterns() {
  try { patterns = JSON.parse(fs.readFileSync(PAT_FILE, 'utf8')); } catch { patterns = SEED.slice(); }
  applyPatterns();
}
function savePatterns() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(PAT_FILE, JSON.stringify(patterns, null, 2)); } catch (e) { log('[patterns] save failed', e.message); }
}
function withPred(p) { return { ...p, predicted: p.official ? engine.predictDomains(p.official) : [] }; }
function applyPatterns() { engine.setPatterns(patterns.map(withPred)); }
function broadcastAll(type, data) { for (const r of rooms.values()) send(r, 'user', type, data); }
loadPatterns();

/* ------------------------------ تسجيلات المكالمات (أصوات يرفعها المستخدم) ------------------------------ */
const CLIP_DIR = path.join(DATA_DIR, 'clips');
const CLIP_KEY = /^(bank|police|approve|remote|refuse):(dialog|cont|comply|line):\d{1,2}$/;
const TYPE_EXT = { 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/ogg': '.ogg', 'audio/webm': '.webm' };
const clipFile = (key) => key.replace(/:/g, '_');
function listClips() {
  const out = {};
  try {
    for (const f of fs.readdirSync(CLIP_DIR)) {
      const ext = path.extname(f), base = path.basename(f, ext), key = base.replace(/_/g, ':');
      if (!CLIP_KEY.test(key) || !AUDIO_MIME[ext]) continue;
      const st = fs.statSync(path.join(CLIP_DIR, f));
      out[key] = { url: '/clips/' + f + '?v=' + Math.round(st.mtimeMs), size: st.size };
    }
  } catch {}
  return out;
}
// الرفع والحذف من هذا الجهاز فقط (وليس من الإنترنت عبر رابط cloudflared)
function isLocalAdmin(req) {
  const a = req.socket.remoteAddress || '';
  return /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(a) && !req.headers['cf-connecting-ip'] && !req.headers['x-forwarded-for'];
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a); // أحداث فقط، بلا محتوى

function newCode() { let c; do { c = String(crypto.randomInt(1000, 10000)); } while (rooms.has(c)); return c; }
function analysisState(room) { if (room.outage) return 'paused'; if (!KEY) return 'demo'; return room.sttState === 'active' ? 'active' : room.sttState === 'paused' ? 'paused' : 'connecting'; }
function send(room, role, type, data) {
  const res = room.sse[role];
  if (!res) return false;
  try { res.write(`event: ${type}\ndata: ${JSON.stringify(data || {})}\n\n`); return true; } catch { return false; }
}
function broadcast(room, type, data) { send(room, 'user', type, data); send(room, 'caller', type, data); }
function pushState(room) { broadcast(room, 'analysis', { state: analysisState(room) }); }

/* ------------------------------ التفريغ اللحظي ------------------------------ */
function sessionUpdate(lang) {
  const language = lang === 'en' ? 'en' : 'ar';
  const vad = { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 450 };
  if (STT_API === 'beta') {
    return { type: 'transcription_session.update', session: { input_audio_format: 'pcm16', input_audio_transcription: { model: STT_MODEL, language }, turn_detection: vad } };
  }
  return { type: 'session.update', session: { type: 'transcription', audio: { input: { format: { type: 'audio/pcm', rate: 24000 }, transcription: { model: STT_MODEL, language }, turn_detection: vad } } } };
}

function ensureStt(room) {
  if (!KEY || room.stt || room.outage || !room.inCall) return;
  if (Date.now() - room.lastSttAttempt < 3000) return;
  room.lastSttAttempt = Date.now();
  room.sttState = 'connecting';
  const protocols = ['realtime', 'openai-insecure-api-key.' + KEY];
  const headers = { Authorization: 'Bearer ' + KEY };
  if (STT_API === 'beta') { protocols.push('openai-beta.realtime-v1'); headers['OpenAI-Beta'] = 'realtime=v1'; }
  let ws;
  try { ws = new WebSocket(STT_URL, { protocols, headers }); }
  catch (e) { log('[stt] cannot open', e.message); room.sttState = 'paused'; pushState(room); return; }
  room.stt = ws;
  ws.onopen = () => {
    ws.send(JSON.stringify(sessionUpdate(room.lang)));
    room.sttState = 'active';
    for (const b64 of room.sttQueue.splice(0)) ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
    log('[stt] open', room.code);
    pushState(room);
  };
  ws.onmessage = (m) => {
    let ev; try { ev = JSON.parse(typeof m.data === 'string' ? m.data : Buffer.from(m.data).toString()); } catch { return; }
    if (ev.type === 'conversation.item.input_audio_transcription.completed') handlePhrase(room, ev.transcript || '', 'stt');
    else if (ev.type === 'error') log('[stt] error', ev.error && (ev.error.code || ev.error.type));
  };
  const down = () => {
    if (room.stt !== ws) return;
    room.stt = null;
    if (room.inCall) { room.sttState = 'paused'; log('[stt] closed', room.code); pushState(room); }
  };
  ws.onclose = down;
  ws.onerror = down;
}
function closeStt(room) {
  const ws = room.stt; room.stt = null; room.sttQueue = [];
  if (ws) try { ws.close(); } catch {}
}

/* ------------------------------ فحص العبارات ------------------------------ */
function handlePhrase(room, text, source) {
  if (!room.inCall || room.outage || !text.trim()) return;
  const t0 = Date.now();
  const { alerts, nlp } = engine.analyzeUtterance(text, room.ctx, room.lang);
  room.ctx.push(text); if (room.ctx.length > 6) room.ctx.shift();
  send(room, 'user', 'heard', { text, source, nlp, ms: Date.now() - t0 }); // يُعرض لحظيًا ولا يُحفظ
  for (const a of alerts) {
    const last = room.alerted[a.type];
    if (last && last.text === text && Date.now() - last.t < REALERT_MS) continue; // لا نكرر التنبيه لنفس الجملة فقط
    room.alerted[a.type] = { t: Date.now(), text };
    send(room, 'user', 'alert', { ...a, engineMs: Date.now() - t0, source });
    if (a.pattern) hits[a.pattern] = (hits[a.pattern] || 0) + 1;
    log('[alert]', room.code, a.type);
  }
}

function endCall(room, by, scammed) {
  if (!room.inCall && !room.ringing) return;
  room.inCall = false; room.ringing = false;
  closeStt(room);
  room.ctx = []; room.alerted = {}; room.outage = false; room.sttState = 'idle';
  broadcast(room, 'callEnded', { by, scammed: scammed || null });
  log('[call] ended', room.code, by);
}
function deleteRoom(room) {
  endCall(room, 'timeout');
  for (const r of ['user', 'caller']) { try { room.sse[r] && room.sse[r].end(); } catch {} room.sse[r] = null; }
  rooms.delete(room.code);
  log('[room] deleted', room.code);
}
setInterval(() => { for (const r of rooms.values()) if (!r.sse.user && Date.now() - r.last > ROOM_TTL_MS) deleteRoom(r); }, 60000).unref();
setInterval(() => { for (const r of rooms.values()) for (const role of ['user', 'caller']) if (r.sse[role]) try { r.sse[role].write(': ping\n\n'); } catch {} }, 15000).unref();

/* ------------------------------ المساعد الذكي ------------------------------ */
async function assist(text, lang) {
  const sys = 'You are a fraud-prevention assistant for UAE residents. Judge ONLY the message given. ' +
    'Signals: impersonating an organisation, urgency or threats, requests to pay, to share a verification code (OTP), card or login details, links whose domain does not match the claimed organisation, prizes. ' +
    'A message that warns the user NOT to share a code is protective, not a scam. Never invent facts. ' +
    'Reply as JSON: {"risk":"high|medium|low","why":"<one short sentence in ' + (lang === 'en' ? 'English' : 'Arabic') + ' explaining the main reason>"}';
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ASSIST_MODEL, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: text }] }),
    });
    if (!r.ok) { log('[assist] http', r.status); return { available: false }; }
    const j = await r.json();
    const out = JSON.parse(j.choices[0].message.content);
    const risk = ['high', 'medium', 'low'].includes(out.risk) ? out.risk : 'low';
    return { available: true, risk, why: String(out.why || '').slice(0, 220) };
  } catch (e) { log('[assist] failed', e.name); return { available: false }; }
  finally { clearTimeout(timer); }
}

/* ------------------------------ HTTP ------------------------------ */
function readBody(req, limit = 1 << 20) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) { try { return JSON.parse((await readBody(req, 65536)).toString() || '{}'); } catch { return {}; } }
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }

function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p === '/' || p === '/iphone') p = '/index.html';
  else if (p === '/demo') p = '/demo.html';
  else if (p === '/scammer') p = '/scammer.html';
  else if (p === '/partners') p = '/partners.html';
  else if (p === '/settings') p = '/settings.html';
  else if (p === '/phones') p = '/phones.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Permissions-Policy': 'microphone=(self)', 'Referrer-Policy': 'no-referrer' });
    res.end(buf);
  });
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const roomOf = (code) => { const r = rooms.get(String(code || '')); if (r) r.last = Date.now(); return r; };

  if (p === '/api/tunnel' && req.method === 'GET') {
    if (!isLocalAdmin(req)) return json(res, 403, { error: 'local-only' });
    const list = [...rooms.values()].sort((a, b) => b.created - a.created).slice(0, 5).map((r) => ({ code: r.code, user: !!r.sse.user, caller: !!r.sse.caller, created: r.created }));
    return json(res, 200, { ...tunnel, port: PORT, rooms: list });
  }
  if (p === '/api/clips' && req.method === 'GET') return json(res, 200, { clips: listClips(), canEdit: isLocalAdmin(req) });
  if (p === '/api/clips' && (req.method === 'POST' || req.method === 'DELETE')) {
    if (!isLocalAdmin(req)) { req.resume(); return json(res, 403, { error: 'local-only' }); }
    const key = url.searchParams.get('key') || '';
    if (!CLIP_KEY.test(key)) { req.resume(); return json(res, 400, { error: 'key' }); }
    fs.mkdirSync(CLIP_DIR, { recursive: true });
    for (const f of fs.readdirSync(CLIP_DIR)) if (path.basename(f, path.extname(f)) === clipFile(key)) fs.unlinkSync(path.join(CLIP_DIR, f));
    if (req.method === 'DELETE') return json(res, 200, { ok: true, clips: listClips() });
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const ext = TYPE_EXT[type] || (AUDIO_MIME[(url.searchParams.get('ext') || '').toLowerCase()] ? url.searchParams.get('ext').toLowerCase() : null);
    if (!ext) { req.resume(); return json(res, 415, { error: 'type' }); }
    const buf = await readBody(req, 20 * 1024 * 1024).catch(() => null);
    if (!buf || !buf.length) return json(res, 413, { error: 'size' });
    fs.writeFileSync(path.join(CLIP_DIR, clipFile(key) + ext), buf);
    log('[clips] saved', key, buf.length);
    return json(res, 200, { ok: true, clips: listClips() });
  }
  if (p.startsWith('/clips/') && req.method === 'GET') {
    const f = path.basename(decodeURIComponent(p.slice(7)));
    const fp = path.join(CLIP_DIR, f), ext = path.extname(f).toLowerCase();
    if (!AUDIO_MIME[ext] || !fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
    const st = fs.statSync(fp), range = req.headers.range;
    if (range) { // دعم التقديم والتشغيل الجزئي للصوت
      const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      const start = m[1] ? +m[1] : 0, end = m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { 'Content-Type': AUDIO_MIME[ext], 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
      return fs.createReadStream(fp, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': AUDIO_MIME[ext], 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (p === '/api/config' && req.method === 'GET') {
    const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
    if (TURN) ice.push(TURN);
    return json(res, 200, { stt: !!KEY, assist: !!KEY, ice });
  }
  if (p === '/api/room' && req.method === 'GET') return json(res, rooms.has(url.searchParams.get('code') || '') ? 200 : 404, {});
  if (p === '/api/room' && req.method === 'POST') {
    const body = await readJson(req);
    const code = newCode();
    rooms.set(code, { code, lang: body.lang === 'en' ? 'en' : 'ar', created: Date.now(), last: Date.now(), sse: { user: null, caller: null }, stt: null, sttState: 'idle', sttQueue: [], lastSttAttempt: 0, outage: false, ctx: [], alerted: {}, inCall: false, ringing: false });
    log('[room] created', code);
    return json(res, 200, { code });
  }
  if (p === '/api/events' && req.method === 'GET') {
    const room = roomOf(url.searchParams.get('room'));
    const role = url.searchParams.get('role') === 'caller' ? 'caller' : 'user';
    if (!room) return json(res, 404, { error: 'room' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const old = room.sse[role]; if (old) try { old.end(); } catch {}
    room.sse[role] = res;
    const other = role === 'user' ? 'caller' : 'user';
    send(room, role, 'hello', { role, lang: room.lang, peer: !!room.sse[other], state: analysisState(room), inCall: room.inCall });
    send(room, other, 'peer', { joined: true });
    req.on('close', () => { if (room.sse[role] === res) { room.sse[role] = null; room.last = Date.now(); send(room, other, 'peer', { joined: false }); } });
    return;
  }
  if (p === '/api/signal' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    send(room, b.role === 'caller' ? 'user' : 'caller', 'signal', b.data || {});
    return json(res, 200, { ok: true });
  }
  if (p === '/api/audio' && req.method === 'POST') {
    const room = roomOf(url.searchParams.get('room'));
    if (!room) { req.resume(); return json(res, 404, { error: 'room' }); }
    const buf = await readBody(req, 512 * 1024).catch(() => null);
    if (!KEY || !room.inCall) { res.writeHead(204); return res.end(); }
    if (room.outage) return json(res, 503, { state: 'paused' });
    ensureStt(room);
    if (buf && buf.length) {
      const b64 = buf.toString('base64');
      if (room.stt && room.stt.readyState === 1) room.stt.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
      else { room.sttQueue.push(b64); if (room.sttQueue.length > 15) room.sttQueue.shift(); }
    }
    const st = analysisState(room);
    if (st === 'paused') return json(res, 503, { state: st });
    res.writeHead(204); return res.end();
  }
  if (p === '/api/phrase' && req.method === 'POST') { // عبارات تمثيلية من أدوات العرض
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    if (room.outage) return json(res, 503, { state: 'paused' });
    if (!room.inCall) return json(res, 409, { error: 'nocall' });
    handlePhrase(room, String(b.text || '').slice(0, 500), ['asr', 'typed', 'clip'].includes(b.source) ? b.source : 'demo');
    return json(res, 200, { ok: true });
  }
  // حوار صوتي للعرض: المحتال يطلب من هاتف الضحية نطق ردّها، والضحية تُبلغ عند الانتهاء أو باختيارها
  if (p === '/api/say' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room || !room.inCall) return json(res, 409, { error: 'nocall' });
    send(room, 'user', 'say', { text: String(b.text || '').slice(0, 400), id: String(b.id || ''), clip: /^\/clips\/[\w.\-]+(\?v=\d+)?$/.test(b.clip || '') ? b.clip : null });
    return json(res, 200, { ok: true });
  }
  if (p === '/api/said' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    send(room, 'caller', 'said', { id: String(b.id || ''), choice: String(b.choice || 'spoke') });
    return json(res, 200, { ok: true });
  }
  if (p === '/api/outage' && req.method === 'POST') { // محاكاة انقطاع خدمة التحليل
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    room.outage = !!b.on;
    if (room.outage) { closeStt(room); room.sttState = 'paused'; } else { room.sttState = 'idle'; room.lastSttAttempt = 0; }
    pushState(room);
    return json(res, 200, { state: analysisState(room) });
  }
  // بوابة الجهات (طرف ثالث): الدخول بالهوية الرقمية (محاكاة) ثم نشر الممارسات
  if (p === '/api/patterns' && req.method === 'GET') return json(res, 200, { patterns: patterns.map(withPred), hits });
  if (p === '/api/partner/login' && req.method === 'POST') {
    const b = await readJson(req);
    const org = engine.ENTITIES.find((e) => e.id === b.orgId);
    if (!org) return json(res, 400, { error: 'org' });
    const token = crypto.randomBytes(16).toString('hex');
    partnerTokens.set(token, org.id);
    log('[partner] login', org.id);
    return json(res, 200, { token, org: { id: org.id, ar: org.ar, en: org.en, domains: org.domains } });
  }
  if (p === '/api/patterns' && (req.method === 'POST' || req.method === 'DELETE')) {
    const b = await readJson(req);
    const orgId = partnerTokens.get(String(b.token || ''));
    if (!orgId) return json(res, 401, { error: 'auth' });
    const org = engine.ENTITIES.find((e) => e.id === orgId);
    if (req.method === 'DELETE') {
      const before = patterns.length;
      patterns = patterns.filter((x) => !(x.id === b.id && x.orgId === orgId));
      if (patterns.length !== before) { savePatterns(); applyPatterns(); broadcastAll('patterns', { patterns: patterns.map(withPred) }); }
      return json(res, 200, { ok: true });
    }
    const clean = (a, n) => (Array.isArray(a) ? a : String(a || '').split(/[,،\n]+/)).map((x) => String(x).trim()).filter(Boolean).slice(0, n);
    const pat = {
      id: crypto.randomUUID(), orgId, org: { ar: org.ar, en: org.en },
      title: { ar: String(b.title || '').slice(0, 120), en: String(b.titleEn || b.title || '').slice(0, 120) },
      channel: ['sms', 'call', 'link', 'email', 'wa', 'social', 'any'].includes(b.channel) ? b.channel : 'any',
      description: String(b.description || '').slice(0, 600), sample: String(b.sample || '').slice(0, 600),
      phrases: clean(b.phrases, 12), domains: clean(b.domains, 20).map((d) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')),
      official: org.domains[0], severity: ['high', 'medium'].includes(b.severity) ? b.severity : 'high', createdAt: Date.now(),
    };
    if (!pat.title.ar || (!pat.phrases.length && !pat.domains.length)) return json(res, 400, { error: 'fields' });
    patterns.unshift(pat); if (patterns.length > 200) patterns.pop();
    savePatterns(); applyPatterns();
    broadcastAll('pattern', { pattern: withPred(pat) });
    log('[patterns] published by', orgId);
    return json(res, 200, { pattern: withPred(pat) });
  }
  if (p === '/api/hit' && req.method === 'POST') { // عدّاد مجهول: أي ممارسة منشورة ساعدت في الصد (بلا محتوى)
    const b = await readJson(req);
    if (patterns.some((x) => x.id === b.id)) hits[b.id] = (hits[b.id] || 0) + 1;
    return json(res, 200, { ok: true });
  }
  if (p === '/api/lang' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (room) room.lang = b.lang === 'en' ? 'en' : 'ar';
    return json(res, 200, { ok: !!room });
  }
  // رسالة تجريبية من الهاتف الثاني: تُمرَّر فورًا لهاتف المستخدم ولا تُحفظ. الفحص يجري على هاتف المستخدم.
  if (p === '/api/sms' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    const msg = { id: crypto.randomUUID(), channel: b.channel === 'wa' ? 'wa' : 'sms', from: String(b.from || 'SMS').slice(0, 40), fromLabel: String(b.fromLabel || '').slice(0, 60), text: String(b.text || '').slice(0, 1200), at: Date.now() };
    const delivered = send(room, 'user', 'sms', msg);
    log('[sms] relayed', room.code, delivered ? 'delivered' : 'offline');
    return json(res, 200, { delivered });
  }
  // المكالمة داخل التطبيق: رنين ← قبول/رفض ← WebRTC ← إنهاء
  if (p === '/api/call' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room) return json(res, 404, { error: 'room' });
    const act = b.action;
    if (act === 'ring') {
      if (!room.sse.user) return json(res, 409, { error: 'offline' });
      if (room.inCall || room.ringing) return json(res, 409, { error: 'busy' });
      room.ringing = true; send(room, 'user', 'ring', { from: String(b.from || '').slice(0, 40), label: String(b.label || '').slice(0, 60) });
      log('[call] ring', room.code);
    } else if (act === 'accept') {
      room.ringing = false; room.inCall = true; room.ctx = []; room.alerted = {};
      send(room, 'caller', 'accepted', {}); pushState(room);
      log('[call] accepted', room.code);
    } else if (act === 'decline') {
      room.ringing = false; send(room, 'caller', 'declined', {});
    } else if (act === 'end') endCall(room, b.role === 'caller' ? 'caller' : 'user', ['otp', 'transfer', 'approval', 'remote'].includes(b.scammed) ? b.scammed : null);
    return json(res, 200, { ok: true });
  }
  // المساعد الذكي (اختياري): رأي ثانٍ من نموذج لغوي يشرح الخطر بلغة بسيطة. لا يُحفظ النص.
  if (p === '/api/assist' && req.method === 'POST') {
    const b = await readJson(req);
    if (!KEY) return json(res, 200, { available: false });
    return json(res, 200, await assist(String(b.text || '').slice(0, 1500), b.lang === 'en' ? 'en' : 'ar'));
  }
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, p);
  res.writeHead(405); res.end();
}

const onReq = (req, res) => handler(req, res).catch((e) => { log('[http] error', e.message); try { json(res, 500, { error: 'server' }); } catch {} });
let server;
if (process.env.SSL_KEY && process.env.SSL_CERT) server = https.createServer({ key: fs.readFileSync(process.env.SSL_KEY), cert: fs.readFileSync(process.env.SSL_CERT) }, onReq);
else server = http.createServer(onReq);
/* ------------------------------ رابط آمن للهواتف (Cloudflare Tunnel) ------------------------------ */
// عند التشغيل بـ TUNNEL=1 يفتح الخادم رابط https عامًا مؤقتًا حتى تتصل به الهواتف من أي شبكة (والميكروفون يحتاج https)
const tunnel = { status: process.env.TUNNEL === '1' ? 'starting' : 'off', url: null, error: null };
function startTunnel() {
  const { spawn } = require('child_process');
  const cands = ['cloudflared'];
  if (process.platform === 'win32') for (const base of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links')]) if (base) cands.push(path.join(base, base.endsWith('Links') ? '' : 'cloudflared', 'cloudflared.exe'));
  const tryNext = (i) => {
    if (i >= cands.length) { tunnel.status = 'missing'; tunnel.error = 'cloudflared not found'; log('[tunnel] cloudflared غير مثبت'); return; }
    let cp; try { cp = spawn(cands[i], ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { windowsHide: true }); } catch { return tryNext(i + 1); }
    let started = false;
    cp.on('error', () => { if (!started) tryNext(i + 1); });
    const onData = (buf) => {
      started = true;
      const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m && tunnel.url !== m[0]) { tunnel.url = m[0]; tunnel.status = 'ready'; log('[tunnel]', m[0]); }
    };
    cp.stdout.on('data', onData); cp.stderr.on('data', onData);
    cp.on('exit', (c) => { if (started) { tunnel.status = 'error'; tunnel.error = 'cloudflared exited ' + c; tunnel.url = null; log('[tunnel] توقف', c); setTimeout(() => { tunnel.status = 'starting'; startTunnel(); }, 5000); } });
    process.on('exit', () => { try { cp.kill(); } catch {} });
  };
  tryNext(0);
}
if (process.env.TUNNEL === '1') startTunnel();

server.listen(PORT, () => log(`الدرع الذكي يعمل على المنفذ ${PORT} — التفريغ اللحظي: ${KEY ? STT_MODEL + ' (' + STT_API + ')' : 'متوقف (وضع العرض بعبارات تمثيلية)'}`));
