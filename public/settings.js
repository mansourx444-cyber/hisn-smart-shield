/* إعدادات «حِصن»: رفع تسجيلات صوتية لكل جملة في مكالمات العرض (المحتال ومريم) */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const NAMES = { bank: 'موظف بنك مزيف يطلب الرمز', police: 'محقق مزيف و«حساب آمن»', approve: 'موافقة على إشعار الهوية الرقمية', remote: 'دعم فني مزيف وبرنامج تحكم', refuse: 'ردّ مريم عند إنهاء المكالمة' };
  const PART = { dialog: 'بداية المكالمة', cont: 'بعد «متابعة المكالمة» (التنبيه الأول)', comply: 'بعد تجاهل التحذير مرة ثانية (تنجح الخدعة)' };
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
    $('#scStat').textContent = `${rows.filter((r) => clips[r.key]).length} من ${rows.length} جمل مسجّلة — اسم الملفات للرفع الجماعي: ${cur}-1.mp3 ، ${cur}-2.mp3 …`;
    const ol = $('#lines'); ol.textContent = '';
    let lastPart = null;
    rows.forEach((r, n) => {
      if (r.part !== lastPart && cur !== 'refuse') { lastPart = r.part; const s = document.createElement('li'); s.className = 's-sep'; s.textContent = PART[r.part]; ol.appendChild(s); }
      const has = !!clips[r.key];
      const li = document.createElement('li'); li.className = `s-line ${r.who}${has ? ' has' : ''}`; li.dataset.key = r.key;
      li.innerHTML = `<span class="s-num">#${n + 1}</span>
        <div class="s-txt"><small>${r.who === 's' ? '👨 المحتال' : '👩 مريم'}${r.key ? ' — ⚠ الجملة الخطيرة' : ''}</small><div dir="auto"></div><span class="s-st">${has ? '✓ يوجد تسجيل (' + Math.round(clips[r.key].size / 1024) + ' ك.ب)' : 'لا يوجد تسجيل — سيُقرأ بالصوت المولَّد'}</span></div>
        <div class="s-ctl">
          <button type="button" class="play" ${has ? '' : 'disabled'}>▶</button>
          <label class="${canEdit ? '' : 'dis'}">⬆ رفع<input type="file" accept="audio/*" hidden></label>
          <button type="button" class="rec" ${canEdit ? '' : 'disabled'}>⏺ تسجيل</button>
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
    msg(`جارٍ رفع ${label}…`);
    const r = await fetch(`/api/clips?key=${encodeURIComponent(key)}&ext=${encodeURIComponent(ext)}`, { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob }).catch(() => null);
    if (!r || !r.ok) { const e = r ? (await r.json().catch(() => ({}))).error : 'net'; msg(`تعذّر رفع ${label}: ${e === 'type' ? 'نوع الملف غير مدعوم (استخدم mp3 أو wav أو m4a أو ogg)' : e === 'size' ? 'الملف كبير جدًا (الحد 20 م.ب)' : e === 'local-only' ? 'الرفع متاح فقط من جهاز النظام' : 'خطأ'}`, true); return false; }
    clips = (await r.json()).clips || clips; msg(`✓ تم حفظ تسجيل ${label}`); render(); return true;
  }
  async function del(key, label) {
    const r = await fetch(`/api/clips?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => null);
    if (r && r.ok) { clips = (await r.json()).clips || {}; msg(`حُذف تسجيل ${label}`); render(); }
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
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { msg('لم يُسمح باستخدام الميكروفون', true); return; }
    const chunks = [];
    const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); btn.classList.remove('on'); btn.textContent = '⏺ تسجيل'; rec = null;
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size > 1000) await upload(key, blob, label);
    };
    rec.start(); btn.classList.add('on'); btn.textContent = '⏹ إيقاف'; msg(`🔴 يسجّل ${label}… تكلّم ثم اضغط «إيقاف»`);
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
    msg(`✓ رُفع ${ok} ملف${skip.length ? ` — لم يُعرف رقم الجملة في: ${skip.join('، ')}` : ''}`, !!skip.length && !ok);
  });
  $('#playAll').addEventListener('click', async () => {
    const lis = [...document.querySelectorAll('.s-line')];
    for (const li of lis) { if (clips[li.dataset.key]) await play(li.dataset.key, li); }
  });

  fetch('/call-scripts-ar.txt', { cache: 'no-store' }).then((r) => r.text()).then((t) => { scripts = parseScripts(t); }).catch(() => {}).then(refresh);
})();
