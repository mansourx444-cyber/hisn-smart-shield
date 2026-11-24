/* إعدادات «حِصن»: رفع تسجيلات صوتية لكل جملة في مكالمات العرض (المحتال ومريم) */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  let lang = 'ar'; try { lang = JSON.parse(localStorage.getItem('ds.lang') || '"ar"'); } catch {}
  const EN = lang === 'en';
  const L = EN ? {
    names: { bank: 'Fake bank employee asks for the code', police: 'Fake investigator and “safe account”', approve: 'Digital-ID notification approval', remote: 'Fake tech support and remote app', boss: 'Cloned voice of the manager', refuse: 'Maryam’s reply when ending the call' },
    part: { dialog: 'Start of the call', cont: 'After “Continue call” (first warning)', comply: 'After ignoring the warning again (the scam succeeds)' },
    stat: (h, n, id) => `${h} of ${n} lines recorded — bulk-upload file names: ${id}-1.mp3, ${id}-2.mp3 …`,
    scam: '👨 Scammer', vic: '👩 Maryam', key: ' — ⚠ the risky line', has: (k) => `✓ Recording available (${k} KB)`, none: 'No recording — the synthetic voice will read it',
    up: '⬆ Upload', rec: '⏺ Record', stop: '⏹ Stop', uploading: (l) => `Uploading ${l}…`, saved: (l) => `✓ Saved recording ${l}`, deleted: (l) => `Recording ${l} deleted`,
    fail: (l, e) => `Could not upload ${l}: ${e === 'type' ? 'unsupported file type (use mp3, wav, m4a or ogg)' : e === 'size' ? 'file too large (20 MB max)' : e === 'local-only' ? 'uploading works only on the system’s computer' : 'error'}`,
    mic: 'Microphone access was not allowed', recording: (l) => `🔴 Recording ${l}… speak, then press “Stop”`, bulk: (ok, skip) => `✓ Uploaded ${ok} file(s)${skip.length ? ` — line number not recognised in: ${skip.join(', ')}` : ''}`,
  } : {
    names: { bank: 'موظف بنك مزيف يطلب الرمز', police: 'محقق مزيف و«حساب آمن»', approve: 'موافقة على إشعار الهوية الرقمية', remote: 'دعم فني مزيف وبرنامج تحكم', boss: 'صوت مقلَّد للمدير', refuse: 'ردّ مريم عند إنهاء المكالمة' },
    part: { dialog: 'بداية المكالمة', cont: 'بعد «متابعة المكالمة» (التنبيه الأول)', comply: 'بعد تجاهل التحذير مرة ثانية (تنجح الخدعة)' },
    stat: (h, n, id) => `${h} من ${n} جمل مسجّلة — اسم الملفات للرفع الجماعي: ${id}-1.mp3 ، ${id}-2.mp3 …`,
    scam: '👨 المحتال', vic: '👩 مريم', key: ' — ⚠ الجملة الخطيرة', has: (k) => `✓ يوجد تسجيل (${k} ك.ب)`, none: 'لا يوجد تسجيل — سيُقرأ بالصوت المولَّد',
    up: '⬆ رفع', rec: '⏺ تسجيل', stop: '⏹ إيقاف', uploading: (l) => `جارٍ رفع ${l}…`, saved: (l) => `✓ تم حفظ تسجيل ${l}`, deleted: (l) => `حُذف تسجيل ${l}`,
    fail: (l, e) => `تعذّر رفع ${l}: ${e === 'type' ? 'نوع الملف غير مدعوم (استخدم mp3 أو wav أو m4a أو ogg)' : e === 'size' ? 'الملف كبير جدًا (الحد 20 م.ب)' : e === 'local-only' ? 'الرفع متاح فقط من جهاز النظام' : 'خطأ'}`,
    mic: 'لم يُسمح باستخدام الميكروفون', recording: (l) => `🔴 يسجّل ${l}… تكلّم ثم اضغط «إيقاف»`, bulk: (ok, skip) => `✓ رُفع ${ok} ملف${skip.length ? ` — لم يُعرف رقم الجملة في: ${skip.join('، ')}` : ''}`,
  };
  const NAMES = L.names, PART = L.part;
  if (EN) {
    document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; document.title = 'HISN settings — call recordings';
    const T = { stTitle: '⚙️ Settings — call recordings', stSub: 'Upload a voice for every line: the scammer (man) and Maryam (girl). Recordings play in the Arabic calls.', lockNote: '🔒 Uploading and deleting recordings works only on the computer running the system.', helpSum: '📘 How do I upload voices?', bulkLbl: 'Upload several files', playAll: '▶ Play the full call',
      helpList: '<li>Pick the call above. Every line has a number (#1, #2, …).</li><li>Press <b>⬆ Upload</b> next to a line and choose an audio file (mp3, wav, m4a or ogg), or press <b>⏺ Record</b> to record your voice directly.</li><li>Or upload several files at once with <b>Upload several files</b>: name them by line number, e.g. <code>bank-1.mp3</code>, <code>bank-2.mp3</code>, and they are assigned automatically.</li><li>A line with a recording plays your voice in the call; a line without one is read by the synthetic voice.</li><li>If you edit the call text in <code>call-scripts-ar.txt</code> and the line order changes, review the recordings here.</li>' };
    for (const [id, v] of Object.entries(T)) { const el = document.getElementById(id); if (!el) continue; if (id === 'helpList') el.innerHTML = v; else if (id === 'bulkLbl') el.firstChild.textContent = v; else el.textContent = v; }
  }
  const REFUSE = 'لا مشكور، ما بعطي أي معلومات. بتواصل مع الجهة بنفسي على رقمها الرسمي.';
  let scripts = {}, clips = {}, canEdit = false, cur = 'bank', playing = null, rec = null;

  function parseScripts(txt) {
    const out = {}; let c = null, part = 'dialog';
    const bare = (x) => x.replace(/[ً-ٰٟـ]/g, '');
    for (let line of txt.replace(/^﻿/, '').split(/\r?\n/)) {
      line = line.trim(); if (!line || line.startsWith('#')) continue;
      const b = bare(line);
      let m = b.match(/^\[\s*مكالمة\s*:\s*([a-z]+)\s*\]$/i);
      if (m) { c = out[m[1].toLowerCase()] = { dialog: [], cont: [], comply: [] }; part = 'dialog'; continue; }
      if (!c) continue;
      if (/^-{2,}\s*متابعة/.test(b)) { part = 'cont'; continue; }
      if (/^-{2,}\s*استجابة/.test(b)) { part = 'comply'; continue; }
      m = b.match(/^(المحتال|الضحية)\s*(\*)?\s*[:：]/); if (!m) continue;
      c[part].push({ who: m[1] === 'المحتال' ? 's' : 'v', text: line.slice(line.search(/[:：]/) + 1).trim(), key: !!m[2] });
    }
    out.refuse = { dialog: [], cont: [], comply: [], line: [{ who: 'v', text: REFUSE }] };
    return out;
  }
  // كل جمل المكالمة بترتيب واحد مرقّم #1 … #N
  function rowsOf(id) {
    const sc = scripts[id]; if (!sc) return [];
    const rows = [];
    for (const part of id === 'refuse' ? ['line'] : ['dialog', 'cont', 'comply']) (sc[part] || []).forEach((l, i) => rows.push({ ...l, part, idx: i, key: `${id}:${part}:${i}` }));
    return rows;
  }
  const msg = (t, bad) => { const m = $('#msg'); m.textContent = t || ''; m.style.color = bad ? '#ff8c82' : '#8ee3c8'; };

  async function refresh() {
    const j = await fetch('/api/clips', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ clips: {} }));
    clips = j.clips || {}; canEdit = !!j.canEdit;
    $('#lockNote').hidden = canEdit;
    render();
  }
  function render() {
    const tabs = $('#tabs'); tabs.textContent = '';
    for (const id of Object.keys(NAMES)) {
      if (!scripts[id]) continue;
      const rows = rowsOf(id), have = rows.filter((r) => clips[r.key]).length;
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-selected', String(id === cur));
      b.innerHTML = `${NAMES[id]}<small>${have}/${rows.length}</small>`;
      b.addEventListener('click', () => { cur = id; render(); });
      tabs.appendChild(b);
    }
    const rows = rowsOf(cur);
    $('#scTitle').textContent = NAMES[cur];
    $('#scStat').textContent = L.stat(rows.filter((r) => clips[r.key]).length, rows.length, cur);
    const ol = $('#lines'); ol.textContent = '';
    let lastPart = null;
    rows.forEach((r, n) => {
      if (r.part !== lastPart && cur !== 'refuse') { lastPart = r.part; const s = document.createElement('li'); s.className = 's-sep'; s.textContent = PART[r.part]; ol.appendChild(s); }
      const has = !!clips[r.key];
      const li = document.createElement('li'); li.className = `s-line ${r.who}${has ? ' has' : ''}`; li.dataset.key = r.key;
      li.innerHTML = `<span class="s-num">#${n + 1}</span>
        <div class="s-txt"><small>${r.who === 's' ? L.scam : L.vic}${r.key ? L.key : ''}</small><div dir="auto"></div><span class="s-st">${has ? L.has(Math.round(clips[r.key].size / 1024)) : L.none}</span></div>
        <div class="s-ctl">
          <button type="button" class="play" ${has ? '' : 'disabled'}>▶</button>
          <label class="${canEdit ? '' : 'dis'}">${L.up}<input type="file" accept="audio/*" hidden></label>
          <button type="button" class="rec" ${canEdit ? '' : 'disabled'}>${L.rec}</button>
          <button type="button" class="del" ${has && canEdit ? '' : 'disabled'}>🗑</button>
        </div>`;
      li.querySelector('.s-txt div').textContent = r.text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
      li.querySelector('.play').addEventListener('click', () => play(r.key, li));
      li.querySelector('input').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) upload(r.key, f, `#${n + 1}`); e.target.value = ''; });
      li.querySelector('.rec').addEventListener('click', (e) => record(r.key, e.currentTarget, `#${n + 1}`));
      li.querySelector('.del').addEventListener('click', () => del(r.key, `#${n + 1}`));
      ol.appendChild(li);
    });
  }
  async function upload(key, blob, label) {
    const ext = ((blob.name || '').match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
    msg(L.uploading(label));
    const r = await fetch(`/api/clips?key=${encodeURIComponent(key)}&ext=${encodeURIComponent(ext)}`, { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob }).catch(() => null);
    if (!r || !r.ok) { const e = r ? (await r.json().catch(() => ({}))).error : 'net'; msg(L.fail(label, e), true); return false; }
    clips = (await r.json()).clips || clips; msg(L.saved(label)); render(); return true;
  }
  async function del(key, label) {
    const r = await fetch(`/api/clips?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => null);
    if (r && r.ok) { clips = (await r.json()).clips || {}; msg(L.deleted(label)); render(); }
  }
  function stopPlaying() { if (playing) { playing.a.pause(); playing.li && playing.li.classList.remove('playing'); playing = null; } }
  function play(key, li) {
    stopPlaying(); if (!clips[key]) return Promise.resolve();
    return new Promise((res) => {
      const a = new Audio(clips[key].url); playing = { a, li }; if (li) li.classList.add('playing');
      const fin = () => { if (li) li.classList.remove('playing'); res(); };
      a.onended = fin; a.onerror = fin; a.play().catch(fin);
    });
  }
  async function record(key, btn, label) {
    if (rec) { rec.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { msg(L.mic, true); return; }
    const chunks = [];
    const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); btn.classList.remove('on'); btn.textContent = L.rec; rec = null;
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size > 1000) await upload(key, blob, label);
    };
    rec.start(); btn.classList.add('on'); btn.textContent = L.stop; msg(L.recording(label));
  }
  $('#bulk').addEventListener('change', async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const rows = rowsOf(cur); let ok = 0, skip = [];
    for (const f of files) {
      const m = f.name.replace(/\.[^.]+$/, '').match(/(\d+)(?!.*\d)/);
      const n = m ? +m[1] : NaN;
      if (!(n >= 1 && n <= rows.length)) { skip.push(f.name); continue; }
      if (await upload(rows[n - 1].key, f, `#${n}`)) ok++;
    }
    msg(L.bulk(ok, skip), !!skip.length && !ok);
  });
  $('#playAll').addEventListener('click', async () => {
    const lis = [...document.querySelectorAll('.s-line')];
    for (const li of lis) { if (clips[li.dataset.key]) await play(li.dataset.key, li); }
  });

  fetch('/call-scripts-ar.txt', { cache: 'no-store' }).then((r) => r.text()).then((t) => { scripts = parseScripts(t); }).catch(() => {}).then(refresh);
})();
