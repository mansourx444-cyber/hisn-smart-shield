/* «حِصن» — طبقة التعلّم الآلي المستمر (شبكة عصبية خفيفة)
 *
 * الفكرة: المحرك القائم على القواعد يفهم ما نعرفه، والشبكة العصبية تتعلم «التشابه» فتلتقط
 * صياغات جديدة لم تُكتب لها قاعدة. تتدرّب باستمرار من:
 *   ١) ممارسات الجهات المنشورة في البوابة،
 *   ٢) قرارات المحرك الواثقة (تعلّم من المعلّم: distillation) — طلبات احتيال وعبارات تحذيرية،
 *   ٣) نتائج المكالمات (تجاهل التحذير ← نجحت الخدعة).
 * الخصوصية: تُحفظ أوزان الشبكة فقط، ولا تُحفظ أي نصوص.
 *
 * البنية: نص ← تطبيع عربي ← سمات (مقاطع حروف ٣–٥ + كلمات ومتتاليات كلمتين) ← تجزئة إلى 4096 بُعدًا
 *        ← طبقة مخفية 16 (ReLU) ← مخرج احتمالي (Sigmoid). تدريب بالانحدار التدرّجي العشوائي (SGD).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.ShieldLearn = factory(root.ShieldEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  const D = 4096, H = 16;

  function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
  function clean(text) {
    return E.norm(text).replace(/[0-9]+/g, '0').replace(/https?:\/\/\S+/g, ' url ').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  // سمات نصية مجزّأة (hashing trick) — تتحمّل اختلاف الإملاء واللهجة لأن مقاطع الحروف تتشابه
  function features(text) {
    const n = clean(text); const m = new Map();
    const add = (k, w) => { const i = hash(k) % D; m.set(i, (m.get(i) || 0) + w); };
    const words = n.split(' ').filter(Boolean);
    for (const w of words) {
      const s = '<' + w + '>';
      for (let g = 3; g <= 5; g++) for (let i = 0; i + g <= s.length; i++) add('c' + s.substr(i, g), 1);
      add('w' + w, 2);
    }
    for (let i = 0; i + 1 < words.length; i++) add('b' + words[i] + '_' + words[i + 1], 2);
    let z = 0; for (const v of m.values()) z += v * v; z = Math.sqrt(z) || 1;
    return [...m.entries()].map(([i, v]) => [i, v / z]);
  }

  function rng(seed) { let s = seed >>> 0; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) - 0.5; }; }
  function createModel(seed) {
    const r = rng(seed || 42);
    const W1 = new Float32Array(D * H); for (let i = 0; i < W1.length; i++) W1[i] = r() * 0.2;
    const W2 = new Float32Array(H); for (let j = 0; j < H; j++) W2[j] = r() * 0.5;
    return { W1, b1: new Float32Array(H), W2, b2: 0, seen: 0, pos: 0, neg: 0, version: 0, trainedAt: 0 };
  }
  function forward(M, x) {
    const h = new Float32Array(H);
    for (let j = 0; j < H; j++) h[j] = M.b1[j];
    for (const [i, v] of x) { const o = i * H; for (let j = 0; j < H; j++) h[j] += M.W1[o + j] * v; }
    let z = M.b2; for (let j = 0; j < H; j++) { if (h[j] < 0) h[j] = 0; z += M.W2[j] * h[j]; }
    return { h, p: 1 / (1 + Math.exp(-z)) };
  }
  function predict(M, text) { const x = features(text); return x.length ? forward(M, x).p : 0; }
  // خطوة تدريب واحدة (انتشار عكسي) — label: 1 احتيال، 0 سليم
  function step(M, x, label, lr, weight) {
    const { h, p } = forward(M, x);
    const g = (p - label) * (weight || 1);
    for (let j = 0; j < H; j++) {
      const gh = h[j] > 0 ? g * M.W2[j] : 0;
      M.W2[j] -= lr * (g * h[j] + 1e-4 * M.W2[j]);
      if (gh !== 0) { M.b1[j] -= lr * gh; for (const [i, v] of x) M.W1[i * H + j] -= lr * gh * v; }
    }
    M.b2 -= lr * g;
    return p;
  }
  function train(M, text, label, opts) {
    const x = features(text); if (!x.length) return null;
    const o = opts || {}; const lr = o.lr || 0.08; let p = 0;
    for (let k = 0; k < (o.steps || 3); k++) p = step(M, x, label ? 1 : 0, lr, o.weight);
    M.seen++; if (label) M.pos++; else M.neg++; M.version++; M.trainedAt = Date.now();
    return p;
  }
  // تدريب أولي على مجموعة أمثلة (عدة دورات، أمثلة مخلوطة، وموازنة الفئتين)
  function fit(M, examples, epochs, lr) {
    const r = rng(7); const ex = examples.map(([t, y]) => [features(t), y ? 1 : 0]).filter((e) => e[0].length);
    const P = ex.filter((e) => e[1]).length, N = ex.length - P;
    const wPos = ex.length / (2 * Math.max(1, P)), wNeg = ex.length / (2 * Math.max(1, N));
    for (let ep = 0; ep < (epochs || 40); ep++) {
      for (let i = ex.length - 1; i > 0; i--) { const j = Math.floor((r() + 0.5) * (i + 1)); [ex[i], ex[j]] = [ex[j], ex[i]]; }
      const a = (lr || 0.1) * (1 - ep / ((epochs || 40) * 1.2));
      for (const [x, y] of ex) step(M, x, y, a, y ? wPos : wNeg);
    }
    M.seen += ex.length; M.pos += P; M.neg += N; M.version++; M.trainedAt = Date.now();
    return M;
  }

  // نقل الأوزان: تكميم 8 بت (int8) لتصغير الحجم ~4 مرات عند الإرسال للهواتف
  function b64(u8) { if (typeof Buffer !== 'undefined') return Buffer.from(u8).toString('base64'); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(str) { if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(str, 'base64')); const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function quant(f) { let mx = 1e-8; for (const v of f) mx = Math.max(mx, Math.abs(v)); const q = new Int8Array(f.length); for (let i = 0; i < f.length; i++) q[i] = Math.round(f[i] / mx * 127); return { s: mx, d: b64(new Uint8Array(q.buffer)) }; }
  function dequant(o) { const q = new Int8Array(unb64(o.d).buffer); const f = new Float32Array(q.length); for (let i = 0; i < q.length; i++) f[i] = q[i] / 127 * o.s; return f; }
  function exportModel(M, full) {
    const meta = { D, H, seen: M.seen, pos: M.pos, neg: M.neg, version: M.version, trainedAt: M.trainedAt, seedVersion: M.seedVersion || 0 };
    if (full) return { ...meta, W1: b64(new Uint8Array(M.W1.buffer.slice(0))), b1: Array.from(M.b1), W2: Array.from(M.W2), b2: M.b2, f32: true };
    return { ...meta, W1q: quant(M.W1), b1: Array.from(M.b1), W2: Array.from(M.W2), b2: M.b2 };
  }
  function importModel(o) {
    if (!o || o.D !== D || o.H !== H) return null;
    const W1 = o.f32 ? new Float32Array(unb64(o.W1).buffer) : dequant(o.W1q);
    return { W1, b1: Float32Array.from(o.b1), W2: Float32Array.from(o.W2), b2: o.b2, seen: o.seen || 0, pos: o.pos || 0, neg: o.neg || 0, version: o.version || 0, trainedAt: o.trainedAt || 0, seedVersion: o.seedVersion || 0 };
  }

  return { createModel, predict, train, fit, features, exportModel, importModel, D, H };
});
