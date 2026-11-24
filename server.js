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
const learn = require('./public/learn.js');
const scanner = require('./scanner.js');
const LSEED = require('./learn-seed.js');

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
}, {
  id: 'seed-otp-share', orgId: 'adpolice-cbuae', org: { ar: 'شرطة أبوظبي والمصرف المركزي', en: 'Abu Dhabi Police and the Central Bank' },
  title: { ar: 'طلب مشاركة الرمز أو الرسالة التي وصلتك — لا البنك ولا شركة الاتصالات ولا الشرطة ولا أي جهة تطلبه، لا بالاتصال ولا بالرسائل', en: 'Asking you to share your code or the SMS you received — no bank, telecom, police or any authority ever asks for it, by call or message' },
  channel: 'any', description: 'المحتال يطلب الرمز أو الرقم أو OTP، أو يطلب مشاركة الرسالة التي وصلتك أو إعادة إرسالها له أو إلى بريد إلكتروني. موظف البنك لا يطلب الرقم السري ولا رمز التحقق، ورجل الأمن كذلك.',
  phrases: [
    'ترسل لي الرمز', 'ترسلي الرمز', 'ارسل لي الرمز', 'ارسلي الرمز', 'ارسل الرمز', 'ممكن الرمز', 'قول لي الرمز', 'قولي الرمز', 'عطني الرمز', 'اعطني الرمز',
    'ترسل لي الرقم', 'ارسل لي الرقم', 'ارسلي الرقم', 'عطني الرقم اللي', 'عطني الرقم الي', 'الرقم اللي وصلك', 'الرقم الي وصلك',
    'ترسل لي otp', 'ارسل لي otp', 'ارسلي otp', 'عطني otp', 'رمز otp', 'otp اللي', 'otp الي',
    'المسج اللي وصلك', 'المسج الي وصلك', 'المسج اللي وصلتك', 'المسج الي وصلتك', 'الرساله اللي وصلتك', 'الرساله الي وصلتك', 'الرساله اللي وصلتج', 'الرساله الي وصلتج',
    'شاركني اياه', 'شاركني اياها', 'شاركها وياي', 'شاركه وياي', 'ارسلي الرساله', 'ارسل لي الرساله', 'ارسلي المسج', 'ارسل لي المسج',
    'اعاده ارسال للمسج', 'اعاده ارسال للرساله', 'سوي اعاده ارسال', 'سويلها اعاده ارسال', 'سوي لها اعاده ارسال', 'سويله اعاده ارسال', 'فورورد', 'على هذا الايميل',
    'شاركني الرمز', 'شاركنا الرمز', 'تشاركني الرمز', 'تشاركنا الرمز', 'شاركني الكود', 'شاركنا الكود', 'تشاركني الكود', 'شاركني رمز', 'تشاركني رمز',
    'ابعت الرمز', 'ابعت الكود', 'ابعتلي الرمز', 'ابعتلي الكود', 'ابعث الرمز', 'ابعث الكود', 'ابعثلي الرمز', 'دز الرمز', 'دز الكود', 'دزلي الرمز', 'دزلي الكود',
    'عطني الكود', 'عطنا الكود', 'عطنا الرمز', 'ارسل الكود', 'ارسلي الكود', 'ارسل لي الكود', 'ارسل لنا الرمز', 'ارسلوا الرمز',
    'الرمز على الايميل', 'الرمز على البريد', 'الرمز على بريد', 'الرمز على ايميل', 'الكود على الايميل', 'الكود على البريد', 'الرمز بالايميل', 'الرمز بالبريد', 'الرمز عبر البريد', 'رمز التحقق عبر البريد', 'الرمز برساله', 'الرمز في رساله', 'الرمز على الواتساب', 'الرمز على واتساب', 'رد على هذه الرساله بالرمز', 'رد بالرمز',
    'send me the code', 'tell me the code', 'share your code', 'email the code', 'reply with the code', 'send the code to', 'share the code', 'give me the otp', 'send me the otp', 'forward the message', 'forward the sms', 'the message you received', 'the sms you received', 'to this email',
  ], domains: [], official: 'adpolice.gov.ae', severity: 'high', createdAt: Date.now() - 86400000,
}, {
  id: 'seed-police-transfer', orgId: 'adpolice', org: { ar: 'شرطة أبوظبي', en: 'Abu Dhabi Police' },
  title: { ar: 'انتحال صفة رجل الأمن وطلب تحويل أموال — رجل الأمن لا يطلب أي تحويل', en: 'Police impersonation asking for a money transfer — police never ask you to transfer money' },
  channel: 'any', description: 'يدّعي المتصل أنه من الشرطة أو جهة أمنية ويطلب تحويل مبلغ أو دفع غرامة أو كفالة عبر الهاتف. رجل الأمن لا يطلب أي تحويل أموال.',
  phrases: ['حول المبلغ', 'تحول المبلغ', 'تحويل المبلغ', 'حول رصيدك', 'تحول رصيدك', 'حول الفلوس', 'تحول الفلوس', 'حوله لحساب', 'حولها لحساب', 'حول لنا', 'حول لي',
    'ادفع الغرامه الحين', 'سدد الغرامه الحين', 'ادفع الكفاله', 'تدفع الكفاله', 'transfer the amount', 'transfer your balance', 'pay the fine now'],
  domains: [], official: 'adpolice.gov.ae', severity: 'high', createdAt: Date.now() - 3600000 * 20,
}, {
  id: 'seed-telecom-remote', orgId: 'tdra', org: { ar: 'هيئة تنظيم الاتصالات والحكومة الرقمية', en: 'TDRA' },
  title: { ar: 'دعم فني يطلب صلاحية الدخول لهاتفك — الدعم الفني لا يطلبها، راجع أقرب مركز خدمة عملاء', en: 'Tech support asking for access to your phone — real support never does; visit the nearest customer service centre' },
  channel: 'any', description: 'يتصل المحتال باسم شركة الاتصالات أو الدعم الفني ويطلب تثبيت برنامج تحكم عن بعد أو صلاحية الوصول لهاتفك. شركات الاتصالات لا تطلب ذلك، بل تقول لك: راجع أقرب مركز خدمة للعملاء.',
  phrases: ['anydesk', 'teamviewer', 'quicksupport', 'rustdesk', 'صلاحيه الدخول', 'صلاحيه الوصول', 'صلاحيه اكسس', 'عطني صلاحيه', 'اعطني صلاحيه', 'عطني اكسس', 'اعطني اكسس',
    'الوصول لهاتفك', 'الوصول لجهازك', 'الدخول لهاتفك', 'الدخول لجهازك', 'الدخول على جهازك', 'الدخول على هاتفك', 'التحكم بجهازك', 'التحكم في جهازك', 'التحكم بهاتفك', 'نتحكم بجهازك',
    'مشاركه الشاشه', 'شارك الشاشه', 'remote access', 'screen sharing', 'share your screen', 'access to your phone'],
  domains: [], official: 'tdra.gov.ae', severity: 'high', createdAt: Date.now() - 3600000 * 6,
}];
let patterns = [];
let partnerTokens = new Map(); // token -> orgId (ذاكرة فقط)
const hits = {};
function loadPatterns() {
  try { patterns = JSON.parse(fs.readFileSync(PAT_FILE, 'utf8')); } catch { patterns = SEED.slice(); }
  // الممارسات الأساسية تُضاف دائمًا إذا لم تكن موجودة (حتى مع ملف ممارسات قديم)، وتُحدَّث لآخر نسخة
  for (const sp of SEED) { const i = patterns.findIndex((x) => x.id === sp.id); if (i < 0) patterns.push(sp); else patterns[i] = { ...sp, createdAt: patterns[i].createdAt || sp.createdAt }; }
  applyPatterns();
}
function savePatterns() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(PAT_FILE, JSON.stringify(patterns, null, 2)); } catch (e) { log('[patterns] save failed', e.message); }
}
function withPred(p) { return { ...p, predicted: [...(p.official ? engine.predictDomains(p.official) : []), ...(p.watch ? p.predicted || [] : [])] }; }
function applyPatterns() { engine.setPatterns(patterns.map(withPred)); }
function broadcastAll(type, data) { for (const r of rooms.values()) send(r, 'user', type, data); }
loadPatterns();

/* ------------------------------ تسجيلات المكالمات (أصوات يرفعها المستخدم) ------------------------------ */
const CLIP_DIR = path.join(DATA_DIR, 'clips');
// التسجيلات الصوتية المرفقة مع المشروع (voices/) تُنسخ عند أول تشغيل — مهم للاستضافة على الإنترنت
try {
  const SEED = path.join(__dirname, 'voices');
  if (fs.existsSync(SEED)) {
    fs.mkdirSync(CLIP_DIR, { recursive: true });
    const have = new Set(fs.readdirSync(CLIP_DIR).map((f) => path.basename(f, path.extname(f))));
    for (const f of fs.readdirSync(SEED)) if (!have.has(path.basename(f, path.extname(f)))) fs.copyFileSync(path.join(SEED, f), path.join(CLIP_DIR, f));
  }
} catch (e) { console.error('[voices]', e.message); }
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
function attachConn(room, role, conn) {
  const old = room.sse[role]; if (old && old !== conn) try { old.end(); } catch {}
  room.sse[role] = conn;
  const other = role === 'user' ? 'caller' : 'user';
  send(room, role, 'hello', { role, lang: room.lang, peer: !!room.sse[other], state: analysisState(room), inCall: room.inCall });
  send(room, other, 'peer', { joined: true });
}
function detachConn(room, role, conn) {
  if (room.sse[role] !== conn) return;
  room.sse[role] = null; room.last = Date.now();
  send(room, role === 'user' ? 'caller' : 'user', 'peer', { joined: false });
}
// اتصال استطلاع يحاكي واجهة الكتابة في البث: يخزّن الأحداث في طابور حتى يسحبها الهاتف
function makePollConn(cid) {
  return {
    isPoll: true, cid, seq: 0, q: [], waiter: null, ended: false, last: Date.now(),
    write(str) {
      let type = 'message', data = '';
      for (const line of String(str).split('\n')) { if (line.startsWith('event: ')) type = line.slice(7); else if (line.startsWith('data: ')) data += line.slice(6); }
      if (!data && type === 'message') return true; // ping / retry
      this.q.push({ seq: ++this.seq, type, data }); if (this.q.length > 300) this.q.splice(0, this.q.length - 300);
      if (this.waiter) this.waiter();
      return true;
    },
    end() { this.ended = true; if (this.waiter) this.waiter(); },
  };
}
// هاتف توقف عن الاستطلاع (أُغلق/فقد الشبكة) ← نعتبره غير متصل
setInterval(() => { for (const r of rooms.values()) for (const role of ['user', 'caller']) { const c = r.sse[role]; if (c && c.isPoll && !c.waiter && Date.now() - c.last > 30000) detachConn(r, role, c); } }, 5000).unref();
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

/* ------------------------------ التعلّم الآلي المستمر ------------------------------ */
// شبكة عصبية خفيفة تتدرّب من: ممارسات الجهات + قرارات المحرك الواثقة + نتائج المكالمات. تُحفظ الأوزان فقط، لا النصوص.
const MODEL_FILE = path.join(DATA_DIR, 'model.json');
const reports = { total: 0, auto: 0, manual: 0, hosts: {} };
const scanQuota = new Map(), watchCache = new Map();
// نطاقات رصدها الكشف المبكر ← تُضاف كممارسة «متنبأ بها» حتى تُكشف في الرسائل قبل أن يبلّغ عنها أحد
function addWatchIntel(domains, kw) {
  let pt = patterns.find((x) => x.id === 'watch-ct');
  if (!pt) { pt = { id: 'watch-ct', orgId: 'hisn', org: { ar: 'الرصد المبكر في «حِصن»', en: 'HISN early detection' }, title: { ar: 'نطاقات جديدة تنتحل علامات محلية (رُصدت من سجلات الشهادات)', en: 'New domains impersonating local brands (from certificate logs)' }, channel: 'any', description: '', phrases: [], domains: [], predicted: [], official: '', severity: 'high', createdAt: Date.now(), watch: true }; patterns.push(pt); }
  const before = pt.predicted.length;
  for (const d of domains) if (!pt.predicted.includes(d)) pt.predicted.push(d);
  if (pt.predicted.length > 500) pt.predicted = pt.predicted.slice(-500);
  if (pt.predicted.length !== before) { applyPatterns(); try { savePatterns(); } catch {} log('[watch]', kw, '+', pt.predicted.length - before, 'domains'); }
}
const mlStats = { sources: { seed: 0, authority: 0, rules: 0, outcome: 0 }, holdout: null, startedAt: Date.now() };
let model = null;
function holdoutAcc() { let ok = 0; for (const [t, y] of LSEED.HOLDOUT) if ((learn.predict(model, t) >= 0.5) === !!y) ok++; return Math.round(ok / LSEED.HOLDOUT.length * 100); }
function initModel() {
  try { const o = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf8')); if (o.seedVersion === LSEED.VERSION) { model = learn.importModel(o); if (o.sources) Object.assign(mlStats.sources, o.sources); } } catch {}
  if (!model) {
    model = learn.createModel(42); model.seedVersion = LSEED.VERSION;
    const ex = [...LSEED.POS.map((t) => [t, 1]), ...LSEED.NEG.map((t) => [t, 0])];
    learn.fit(model, ex, 40, 0.1); mlStats.sources.seed = ex.length; saveModel(true);
  }
  mlStats.holdout = holdoutAcc();
  engine.setMl((t) => learn.predict(model, t));
  log('[ml] model ready — examples', model.seen, '| held-out accuracy', mlStats.holdout + '%');
}
let saveT = null;
function saveModel(now) {
  const w = () => { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(MODEL_FILE, JSON.stringify({ ...learn.exportModel(model, true), sources: mlStats.sources })); } catch (e) { log('[ml] save failed', e.message); } };
  if (now) return w(); clearTimeout(saveT); saveT = setTimeout(w, 3000);
}
function learnFrom(text, label, source) {
  if (!model || !text || String(text).trim().length < 6) return;
  learn.train(model, String(text).slice(0, 400), label, { steps: 3, lr: 0.06 });
  // إعادة تذكير بأمثلة الأساس حتى لا ينسى النموذج ما تعلّمه (replay)
  for (let k = 0; k < 4; k++) { const pos = Math.random() < 0.5, arr = pos ? LSEED.POS : LSEED.NEG; learn.train(model, arr[Math.floor(Math.random() * arr.length)], pos ? 1 : 0, { steps: 1, lr: 0.03 }); model.seen--; model.version--; pos ? model.pos-- : model.neg--; }
  mlStats.sources[source] = (mlStats.sources[source] || 0) + 1;
  if (model.version % 10 === 0) mlStats.holdout = holdoutAcc();
  saveModel();
}

/* ------------------------------ فحص العبارات ------------------------------ */
function handlePhrase(room, text, source) {
  if (!room.inCall || room.outage || !text.trim()) return;
  const t0 = Date.now();
  const { alerts, nlp } = engine.analyzeUtterance(text, room.ctx, room.lang);
  room.ctx.push(text); if (room.ctx.length > 6) room.ctx.shift();
  send(room, 'user', 'heard', { text, source, nlp, ms: Date.now() - t0 }); // يُعرض لحظيًا ولا يُحفظ
  // التعلّم من قرارات المحرك الواثقة (لا يتعلّم من تنبيهات النموذج وحده تجنبًا لتأكيد أخطائه)
  if (alerts.some((a) => a.type !== 'ml')) learnFrom(text, 1, 'rules'); else if (nlp.protective) learnFrom(text, 0, 'rules');
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
  // نتيجة المكالمة: تجاهلت الضحية التحذير ونجحت الخدعة ← آخر ما قاله المحتال مثال احتيال مؤكد
  if (scammed) for (const t of room.ctx.slice(-2)) if (learn.predict(model, t) >= 0.4 || engine.analyzeUtterance(t, [], room.lang).alerts.length) learnFrom(t, 1, 'outcome');
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
async function readJson(req, limit) { try { return JSON.parse((await readBody(req, limit || 65536)).toString() || '{}'); } catch { return {}; } }
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }

function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p === '/' || p === '/iphone') p = '/index.html';
  else if (p === '/demo') p = '/demo.html';
  else if (p === '/scammer') p = '/scammer.html';
  else if (p === '/partners') p = '/partners.html';
  else if (p === '/settings') p = '/settings.html';
  else if (p === '/phones') p = '/phones.html';
  else if (p === '/scan') p = '/scan.html';
  else if (p === '/evidence') p = '/evidence.html';
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
    if (PUBLIC_URL) return json(res, 200, { status: 'ready', url: PUBLIC_URL, hosted: true, error: null, port: PORT, rooms: [] });
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
  if (p === '/api/room' && req.method === 'GET') { const r = rooms.get(url.searchParams.get('code') || ''); return json(res, r ? 200 : 404, r ? { user: !!r.sse.user, caller: !!r.sse.caller } : {}); }
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
    attachConn(room, role, res);
    req.on('close', () => detachConn(room, role, res));
    return;
  }
  // بديل الاستطلاع الطويل (long polling): يعمل عبر أي وسيط/نفق يحجز البث المتدفق (مثل رابط Cloudflare السريع)
  if (p === '/api/poll' && req.method === 'GET') {
    const room = roomOf(url.searchParams.get('room'));
    const role = url.searchParams.get('role') === 'caller' ? 'caller' : 'user';
    if (!room) return json(res, 404, { error: 'room' });
    const cid = String(url.searchParams.get('cid') || '').slice(0, 40);
    const after = Number(url.searchParams.get('after')) || 0;
    let pc = room.sse[role];
    if (!pc || !pc.isPoll || pc.cid !== cid) { pc = makePollConn(cid); attachConn(room, role, pc); }
    if (pc.ended) return json(res, 200, { gone: true, events: [] });
    pc.last = Date.now();
    let done = false;
    const reply = () => {
      if (done) return; done = true; pc.waiter = null; clearTimeout(timer);
      pc.last = Date.now();
      json(res, 200, { gone: !!pc.ended, events: pc.q.filter((e) => e.seq > after) });
    };
    const timer = setTimeout(reply, 20000);
    if (pc.q.some((e) => e.seq > after)) return reply();
    pc.waiter = reply;
    req.on('close', () => { if (!done) { done = true; clearTimeout(timer); if (pc.waiter === reply) pc.waiter = null; pc.last = Date.now(); } });
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
  // صوت المحتال في الحوار المسجّل يُشغَّل أيضًا على هاتف الضحية (عرض بهاتفين منفصلين)
  if (p === '/api/voice' && req.method === 'POST') {
    const b = await readJson(req); const room = roomOf(b.room);
    if (!room || !room.inCall) return json(res, 409, { error: 'nocall' });
    send(room, 'user', 'voice', { text: String(b.text || '').slice(0, 400), clip: /^\/clips\/[\w.\-]+(\?v=\d+)?$/.test(b.clip || '') ? b.clip : null });
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
  // البلاغ الفوري عن رسالة مشبوهة: يدوي (يعلّم النموذج) أو تلقائي (نطاقات فقط). لا تُخزَّن نصوص ولا بيانات شخصية
  if (p === '/api/report' && req.method === 'POST') {
    const b = await readJson(req);
    reports.total++; if (b.auto) reports.auto++; else reports.manual++;
    for (const h of (Array.isArray(b.hosts) ? b.hosts : []).slice(0, 5)) { const k = String(h).toLowerCase().slice(0, 80); reports.hosts[k] = (reports.hosts[k] || 0) + 1; }
    if (!b.auto && b.text) learnFrom(String(b.text), 1, 'report');
    log('[report]', b.auto ? 'auto' : 'manual', b.channel || '');
    return json(res, 200, { ok: true, total: reports.total });
  }
  if (p === '/api/reports' && req.method === 'GET') return json(res, 200, { total: reports.total, auto: reports.auto, manual: reports.manual, topHosts: Object.entries(reports.hosts).sort((a, b) => b[1] - a[1]).slice(0, 10) });
  // ماسح الروابط: قائمة روابط ← درجة خطورة وحكم وأسباب لكل رابط (سريع)، أو فحص عميق بالأدلة
  if (p === '/api/scan' && req.method === 'POST') {
    const b = await readJson(req, 2000000);
    const urls = Array.isArray(b.urls) ? b.urls : String(b.text || '').split(/[\s,;]+/);
    const deep = !!b.deep, lang = b.lang === 'en' ? 'en' : 'ar';
    const ip = req.socket.remoteAddress || '';
    if (deep) { const q = scanQuota.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - q.t > 600000) { q.n = 0; q.t = Date.now(); } q.n += Math.min(60, urls.length); scanQuota.set(ip, q); if (q.n > 240 && !isLocalAdmin(req)) return json(res, 429, { error: 'rate' }); }
    const t0 = Date.now(); const results = await scanner.scanMany(urls, { deep, lang });
    const sum = results.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
    log('[scan]', deep ? 'deep' : 'quick', results.length, 'urls', Date.now() - t0 + 'ms');
    return json(res, 200, { deep, count: results.length, summary: sum, ms: Date.now() - t0, results });
  }
  // الرصد المبكر: نطاقات جديدة تحمل اسم علامة محلية (من سجلات شفافية الشهادات)، وتُضاف لاستخبارات الجهات
  if (p === '/api/watch' && req.method === 'GET') {
    const kw = url.searchParams.get('kw') || 'uaepass', days = Math.min(90, Number(url.searchParams.get('days')) || 30);
    const key = kw + ':' + days; const c = watchCache.get(key);
    const fresh = c && Date.now() - c.t < 1800000;
    const out = fresh ? c.v : await scanner.watchBrand(kw, days, url.searchParams.get('lang') === 'en' ? 'en' : 'ar');
    if (!fresh && !out.error) watchCache.set(key, { t: Date.now(), v: out });
    const flagged = (out.items || []).filter((x) => x.score >= 40).map((x) => x.domain);
    if (flagged.length) addWatchIntel(flagged, kw);
    return json(res, 200, out);
  }
  if (p === '/api/model' && req.method === 'GET') {
    const meta = { version: model.version, seen: model.seen, pos: model.pos, neg: model.neg, sources: mlStats.sources, holdout: mlStats.holdout, trainedAt: model.trainedAt, arch: 'char n-grams (3–5) + words → hashing 4096 → dense 16 (ReLU) → sigmoid' };
    if (url.searchParams.get('meta') === '1' || Number(url.searchParams.get('v')) === model.version) return json(res, 200, { ...meta, same: Number(url.searchParams.get('v')) === model.version });
    return json(res, 200, { ...learn.exportModel(model), ...meta });
  }
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
    for (const ph of pat.phrases || []) for (let k = 0; k < 2; k++) learnFrom(ph, 1, 'authority'); // الجهة تعلّم النموذج الأسلوب الجديد
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
    const msg = { id: crypto.randomUUID(), channel: ['wa', 'mail', 'social', 'qr'].includes(b.channel) ? b.channel : 'sms', from: String(b.from || 'SMS').slice(0, 40), fromLabel: String(b.fromLabel || '').slice(0, 60), text: String(b.text || '').slice(0, 1200), at: Date.now() };
    const delivered = send(room, 'user', 'sms', msg);
    try { const r = engine.analyzeMessage(msg.text, room.lang, msg.from); if (r.level === 'danger' && !(r.reasons.length === 1 && r.ml)) learnFrom(msg.text, 1, 'rules'); } catch {}
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
    } else if (act === 'end') endCall(room, b.role === 'caller' ? 'caller' : 'user', ['otp', 'transfer', 'approval', 'remote', 'boss'].includes(b.scammed) ? b.scammed : null);
    return json(res, 200, { ok: true });
  }
  // المساعد الذكي (اختياري): رأي ثانٍ من نموذج لغوي يشرح الخطر بلغة بسيطة. لا يُحفظ النص.
  if (p === '/api/assist' && req.method === 'POST') {
    const b = await readJson(req);
    if (!KEY) return json(res, 200, { available: false });
    return json(res, 200, await assist(String(b.text || '').slice(0, 1500), b.lang === 'en' ? 'en' : 'ar'));
  }
  // على الرابط الدائم: الصفحة الرئيسية بدون معاملات = صفحة تجربة الهاتفين برمزي QR
  if ((req.method === 'GET' || req.method === 'HEAD') && PUBLIC_URL && p === '/' && !url.search) return serveStatic(req, res, '/phones');
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, p);
  res.writeHead(405); res.end();
}

const onReq = (req, res) => handler(req, res).catch((e) => { log('[http] error', e.message); try { json(res, 500, { error: 'server' }); } catch {} });
let server;
if (process.env.SSL_KEY && process.env.SSL_CERT) server = https.createServer({ key: fs.readFileSync(process.env.SSL_KEY), cert: fs.readFileSync(process.env.SSL_CERT) }, onReq);
else server = http.createServer(onReq);
/* ------------------------------ رابط آمن للهواتف (Cloudflare Tunnel) ------------------------------ */
// عند التشغيل بـ TUNNEL=1 يفتح الخادم رابط https عامًا مؤقتًا حتى تتصل به الهواتف من أي شبكة (والميكروفون يحتاج https)
// على الاستضافة (Render أو غيرها) الرابط العام ثابت ولا نحتاج نفقًا
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
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

initModel();
server.listen(PORT, () => log(`الدرع الذكي يعمل على المنفذ ${PORT} — التفريغ اللحظي: ${KEY ? STT_MODEL + ' (' + STT_API + ')' : 'متوقف (وضع العرض بعبارات تمثيلية)'}`));
