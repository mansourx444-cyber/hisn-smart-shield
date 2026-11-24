#!/usr/bin/env node
// تقييم دقة كشف الروابط على مجموعة موسومة: node tools/eval.js [file.csv] [threshold]
// الملف: url,label (1 = احتيالي، 0 = سليم). الحكم «احتيالي» عندما تبلغ الدرجة العتبة (الافتراضي 40).
'use strict';
const fs = require('fs'); const path = require('path');
const engine = require('../public/engine.js');
const file = process.argv[2] || path.join(__dirname, 'eval-links.csv');
const th = Number(process.argv[3]) || 40;
const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => { const i = l.lastIndexOf(','); return [l.slice(0, i).replace(/^"|"$/g, ''), Number(l.slice(i + 1))]; });
let tp = 0, fp = 0, tn = 0, fn = 0; const errors = [];
for (const [url, y] of rows) {
  const r = engine.scanUrl(url, { lang: 'en' }); const yhat = r.score >= th ? 1 : 0;
  if (y && yhat) tp++; else if (!y && yhat) { fp++; errors.push(['FALSE ALARM', url, r.score, r.reasons.map((x) => x.key).join(',')]); }
  else if (!y && !yhat) tn++; else { fn++; errors.push(['MISSED', url, r.score, r.reasons.map((x) => x.key).join(',')]); }
}
const p = tp / Math.max(1, tp + fp), rc = tp / Math.max(1, tp + fn), f1 = 2 * p * rc / Math.max(1e-9, p + rc), fpr = fp / Math.max(1, fp + tn);
console.log(`links: ${rows.length} (phishing ${tp + fn}, legitimate ${tn + fp}) | threshold ${th}`);
console.log(`precision ${(p * 100).toFixed(1)}% | recall ${(rc * 100).toFixed(1)}% | F1 ${(f1 * 100).toFixed(1)}% | false-positive rate ${(fpr * 100).toFixed(1)}%`);
console.log(`TP ${tp}  FP ${fp}  TN ${tn}  FN ${fn}`);
for (const e of errors) console.log(' ', e.join('  '));
