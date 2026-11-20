/* نغمات المكالمة (تُولَّد في المتصفح بلا ملفات): رنين الهاتف للضحية، ونغمة الانتظار للمتصل */
(() => {
  'use strict';
  let ctx = null, ringT = null, backT = null;
  const stats = { ring: 0, back: 0 };
  function getCtx() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch {}
    return ctx;
  }
  // المتصفح لا يسمح بالصوت إلا بعد تفاعل المستخدم، فنجهّز الصوت مع أول ضغطة
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, getCtx, { capture: true, passive: true }));

  function bell(f, t, dur, vol) {
    const c = ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'triangle'; o2.frequency.value = f * 2;
    const g2 = c.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2).connect(g); g.connect(c.destination);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function ringOnce() {
    const c = getCtx(); if (!c) return;
    const t = c.currentTime + 0.03;
    const seq = [[1046.5, 0], [1318.5, 0.13], [1568, 0.26], [2093, 0.39], [1568, 0.52], [1318.5, 0.65]];
    for (const rep of [0, 0.9]) for (const [f, dt] of seq) bell(f, t + rep + dt, 0.32, 0.22);
    stats.ring++;
  }
  function backOnce() { // نغمة الانتظار بنمط الإمارات: 400+450 هرتز (0.4 ث، توقف 0.2، 0.4 ث)
    const c = getCtx(); if (!c) return;
    const t = c.currentTime + 0.03;
    for (const [st, du] of [[0, 0.4], [0.6, 0.4]]) for (const f of [400, 450]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + st); g.gain.exponentialRampToValueAtTime(0.07, t + st + 0.02);
      g.gain.setValueAtTime(0.07, t + st + du - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + st + du);
      o.connect(g).connect(c.destination); o.start(t + st); o.stop(t + st + du + 0.02);
    }
    stats.back++;
  }
  const ringStop = () => { clearInterval(ringT); ringT = null; };
  const ringStart = () => { ringStop(); ringOnce(); ringT = setInterval(ringOnce, 2600); };
  const backStop = () => { clearInterval(backT); backT = null; };
  const backStart = () => { backStop(); backOnce(); backT = setInterval(backOnce, 3000); };
  window.ShieldTones = { ringStart, ringStop, backStart, backStop, unlock: getCtx, state: () => (ctx ? ctx.state : 'none'), stats, ringing: () => !!ringT };
})();
