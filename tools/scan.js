#!/usr/bin/env node
// فحص قائمة روابط من سطر الأوامر (بدون إنترنت): node tools/scan.js urls.txt > results.csv
'use strict';
const fs = require('fs');
const engine = require('../public/engine.js');
const src = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : fs.readFileSync(0, 'utf8');
const urls = src.split(/\r?\n/).map((l) => l.split(',')[0].trim()).filter((l) => l && !/^url$/i.test(l));
const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
console.log('url,verdict,is_phishing,score,reasons');
for (const u of urls) { const r = engine.scanUrl(u, { lang: 'en' }); console.log([q(u), r.verdict, r.verdict === 'phishing' ? 1 : 0, r.score, q(r.reasons.map((x) => x.text).join(' | '))].join(',')); }
