/* أصوات الحوار في العرض: صوت رجالي للمحتال وصوت نسائي للضحية (مريم)
 * - يمكن اختيار الصوتين يدويًا من صفحة العرض (🔊 الأصوات)، ويُحفظ الاختيار في المتصفح
 * - Edge يوفّر أصواتًا عربية طبيعية (منها الإماراتية: Hamdan للرجل وFatima للمرأة)
 */
(() => {
  'use strict';
  const MALE = /(hamdan|hamed|naayf|shakir|taim|omar|ali\b|jamal|moaz|rami|bassel|hedi|ismael|kareem|laith|saleh|majed|faisal|abdullah|fahed|maged|hamza|faris|male|guy|david|mark|james|ryan|andrew|brian|christopher|eric|george)/i;
  const FEMALE = /(fatima|zariyah|salma|hoda|amina|mouna|amany|iman|reem|noura|laila|layla|sana|rana|aisha|mariam|female|aria|jenny|zira|susan|sonia|libby|emma|ava|michelle|hazel)/i;
  let voices = [];
  const load = () => { try { voices = speechSynthesis.getVoices(); } catch { voices = []; } };
  if ('speechSynthesis' in window) { load(); try { speechSynthesis.addEventListener('voiceschanged', load); } catch {} }
  const stored = (role) => { try { return JSON.parse(localStorage.getItem('ds.voice.' + role) || 'null'); } catch { return null; } };
  function candidates(lang) {
    if (!voices.length) load();
    const pref = lang === 'ar' ? ['ar-ae', 'ar-sa', 'ar-eg', 'ar'] : ['en-us', 'en-gb', 'en'];
    const rank = (v) => { const l = (v.lang || '').toLowerCase(); const i = pref.findIndex((p) => l.startsWith(p)); return i < 0 ? 99 : i; };
    return voices.filter((v) => rank(v) < 99)
      .sort((a, b) => (rank(a) - rank(b)) || ((/natural|online/i.test(b.name) ? 1 : 0) - (/natural|online/i.test(a.name) ? 1 : 0)));
  }
  function pick(lang, role) {
    const want = stored(role);
    if (want) { const v = voices.find((x) => x.name === want); if (v) return v; }
    const cands = candidates(lang);
    const re = role === 'victim' ? FEMALE : MALE, other = role === 'victim' ? MALE : FEMALE;
    return cands.find((v) => re.test(v.name)) || cands.find((v) => !other.test(v.name)) || cands[0] || null;
  }
  // ننتظر حتى يتوفر صوت باللغة المطلوبة (Edge يحمّل الأصوات العربية عبر الإنترنت بعد ثوانٍ)
  const waits = {}; // نبحث عن الصوت مرة واحدة فقط لكل لغة (لا ننتظر قبل كل جملة)
  function ready(lang) {
    lang = lang || 'ar';
    if (!('speechSynthesis' in window) || candidates(lang).length) return Promise.resolve();
    if (!waits[lang]) waits[lang] = new Promise((r) => { const t0 = Date.now(); const iv = setInterval(() => { load(); if (candidates(lang).length || Date.now() - t0 > 4000) { clearInterval(iv); r(); } }, 150); });
    return waits[lang];
  }
  ready('ar'); // نبدأ البحث مبكرًا عند فتح الصفحة
  const available = (lang) => !!('speechSynthesis' in window) && candidates(lang || 'ar').length > 0;
  let warned = false;
  function sayNow(text, opts) {
    const lang = (opts && opts.lang) || 'ar', role = (opts && opts.role) || 'scammer';
    return new Promise((resolve) => {
      let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
      const v = available(lang) ? pick(lang, role) : null;
      if (!v) { // لا يوجد صوت بهذه اللغة: لا نجعل صوتًا إنجليزيًا يقرأ العربية (يخرج صامتًا)، ونستمر بالنص
        if (!warned) { warned = true; try { window.dispatchEvent(new CustomEvent('shieldvoice-missing', { detail: { lang } })); window.parent && window.parent !== window && window.parent.postMessage({ src: 'voice', type: 'missing' }, location.origin); } catch {} }
        setTimeout(fin, 700 + text.length * 38); return; // مدة قراءة تقريبية للنص
      }
      const u = new SpeechSynthesisUtterance(text);
      const o = pick(lang, role === 'victim' ? 'scammer' : 'victim');
      u.voice = v; u.lang = v.lang;
      const same = !v || !o || v.name === o.name;
      const fits = v && (role === 'victim' ? FEMALE : MALE).test(v.name);
      // إذا لم يتوفر صوتان مختلفان نميّز بالطبقة: أعلى للفتاة وأخفض للرجل
      u.pitch = same || !fits ? (role === 'victim' ? 1.6 : 0.6) : 1;
      u.rate = role === 'victim' ? 1.02 : 0.97;
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 3000 + text.length * 130);
      speechSynthesis.speak(u);
    });
  }
  // تشغيل تسجيل صوتي مرفوع (يُفضَّل على الصوت المولَّد إن وُجد)
  let cur = null;
  function play(url) {
    return new Promise((resolve) => {
      let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
      try {
        const a = new Audio(url); cur = a;
        a.onended = fin; a.onerror = fin;
        a.onloadedmetadata = () => { if (isFinite(a.duration)) setTimeout(fin, a.duration * 1000 + 1500); };
        setTimeout(fin, 60000);
        const pr = a.play(); if (pr && pr.catch) pr.catch(fin);
      } catch { fin(); }
    });
  }
  async function say(text, opts) {
    if (opts && opts.clip) return play(opts.clip); await ready((opts && opts.lang) || 'ar'); return sayNow(text, opts); }
  window.ShieldVoice = {
    say, play, ready, available, isEdge: /Edg\//.test(navigator.userAgent), cancel: () => { try { speechSynthesis.cancel(); } catch {} try { if (cur) { cur.pause(); cur = null; } } catch {} },
    list: (lang) => candidates(lang || 'ar').map((v) => ({ name: v.name, lang: v.lang, gender: FEMALE.test(v.name) ? 'f' : MALE.test(v.name) ? 'm' : '?' })),
    current: (role, lang) => { const v = pick(lang || 'ar', role); return v ? v.name : ''; },
    set: (role, name) => { try { localStorage.setItem('ds.voice.' + role, JSON.stringify(name || null)); } catch {} },
  };
})();
