/* صفحة العرض الحيّ: هاتف المحتال + هاتف الضحية + خط الاتصال المتحرك بينهما */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  let lang = 'ar';
  try { lang = JSON.parse(localStorage.getItem('ds.lang') || '"ar"'); } catch {}
  const T = {
    ar: { title: 'حِصن — الدرع الذكي | عرض حيّ', sub: 'مساعدك الشخصي للوقاية من الاحتيال الإلكتروني', other: 'English', scam: 'المحتال', portal: '🏛️ بوابة الجهات', connecting: 'جارٍ الاتصال…', idle: 'بانتظار المحتال', hacked: '⚠️ محاكاة: الضحية تجاهل التحذير — شاهد العواقب', restored: 'أُعيد هاتف الضحية لوضعه الطبيعي', published: (o, t) => `📢 ${o} نشرت ممارسة احتيال: «${t}» — وصلت لكل الأجهزة المحمية`, waSent: 'رسالة واتساب في الطريق إلى الضحية…', vic: 'هاتف الضحية + حِصن',
      off: 'غير متصل', on: 'متصل • Connected', call: 'مكالمة جارية • Live call',
      evOff: 'فعّل الحماية في هاتف الضحية، ثم اختر من هاتف المحتال رسالة أو مكالمة ليبدأ الاتصال', evOn: 'الهاتفان مرتبطان. اختر سيناريو احتيال من هاتف المحتال.',
      smsSent: 'رسالة نصية في الطريق إلى الضحية…', smsBad: '⛔ الدرع رصد رسالة احتيال ونبّه الضحية', smsOk: '✓ رسالة سليمة — الدرع فحصها بهدوء',
      ringing: '📞 المحتال يتصل بالضحية…', active: '🎙️ المكالمة جارية والدرع يحلّل الكلام لحظيًا', callBad: (t) => `⛔ الدرع نبّه الضحية أثناء المكالمة: «${t}»`, ended: 'انتهت المكالمة', phrase: 'المحتال يتكلم…' },
    en: { title: 'HISN — Smart Shield | live demo', sub: 'Your personal assistant against online fraud', other: 'العربية', scam: 'The Scammer', portal: '🏛️ Institutions portal', connecting: 'Connecting…', idle: 'Waiting for the scammer', hacked: '⚠️ Simulation: the victim ignored the warning — see the consequences', restored: 'Victim phone restored', published: (o, t) => `📢 ${o} published a scam practice: “${t}” — pushed to every protected phone`, waSent: 'WhatsApp message on its way to the victim…', vic: 'Victim phone + HISN',
      off: 'Not connected', on: 'Connected', call: 'Live call',
      evOff: 'Turn on protection on the victim phone, then pick a message or call on the scammer phone to start the connection', evOn: 'Phones linked. Pick a scam scenario on the scammer phone.',
      smsSent: 'Text message on its way to the victim…', smsBad: '⛔ The Shield caught a scam message and warned the victim', smsOk: '✓ Normal message — checked quietly',
      ringing: '📞 The scammer is calling the victim…', active: '🎙️ Call in progress — the Shield analyses speech live', callBad: (t) => `⛔ The Shield warned the victim mid-call: “${t}”`, ended: 'Call ended', phrase: 'The scammer is talking…' },
  };
  // نصوص خط معالجة الذكاء الاصطناعي
  const AI = {
    ar: {
      call: 'كيف حلّل «حِصن» جملة المتصل', sms: 'كيف حلّل «حِصن» الرسالة', partner: 'كيف استفاد «حِصن» من تحذير الجهة',
      tags: { req: 'طلب/فعل', obj: 'موضوع حساس', neg: 'نفي', urgent: 'استعجال' },
      c1: ['🎙️', 'التقاط صوت المتصل', 'صوت المكالمة يصل لحظيًا عبر WebRTC'],
      c2: ['📝', 'التعرف على الكلام (ASR)', 'تحويل الصوت إلى نص بنموذج تعرّف لحظي (Speech-to-Text)'], asrLive: '🎙️ تعرّف فعلي على صوتك من الميكروفون', asrDemo: 'نص الحوار المولَّد (وضع العرض)',
      c3: ['🧠', 'معالجة اللغة الطبيعية (NLP)', 'تطبيع العربية واللهجة، تقسيم العبارة، وتصنيف الكلمات:'],
      c4: ['🎯', 'فهم النية والسياق', ''],
      c5: ['⚖️', 'تقييم الخطر والقرار', ''],
      intent: { otp: 'النية: طلب رمز تحقق', transfer: 'النية: طلب تحويل مالي عاجل', approval: 'النية: طلب موافقة على إجراء', remote: 'النية: طلب تثبيت برنامج تحكم', reported: 'يطابق أسلوبًا نشرته جهة' },
      protective: 'نفي/نصيحة تحذيرية — ليست طلبًا (فهم السياق)', normal: 'كلام عادي — لا طلب حساس', claims: (e) => `الجهة التي يدّعيها: ${e}`, ctx: (n) => `يستخدم سياق ${n} جمل سابقة`,
      risk: (ms) => `خطر مرتفع ← تنبيه فوري للضحية (خلال ${ms} ملث)`, safe: 'لا خطر ← يستمر الفحص بصمت',
      s1: ['📩', 'استلام الرسالة', ''], s2: ['🔗', 'تحليل الروابط والنطاقات', 'مقارنة بالنطاق الرسمي، كشف التشابه الإملائي والأحرف المضللة'], s3: ['🧠', 'معالجة اللغة الطبيعية للنص', ''], s4: ['🏛️', 'استخبارات الجهات + التنبؤ', ''], s5: ['⚖️', 'القرار', ''],
      noLinks: 'لا توجد روابط', patHit: 'تطابق مع ممارسة نشرتها جهة موثقة', patNo: 'لا تطابق مع الممارسات المنشورة', chSms: 'رسالة نصية', chWa: 'واتساب',
      p1: ['🏛️', 'جهة موثقة بالهوية الرقمية', 'نشرت ممارسة احتيال'], p2: ['🧩', 'استخراج المؤشرات', 'عبارات مميزة ونطاقات مزيفة'], p3: ['🔮', 'التنبؤ بالانتحال', 'توليد نطاقات قد يستخدمها المحتالون ومراقبتها'], p4: ['📡', 'تحديث فوري', 'وصلت لكل الأجهزة المحمية ويستخدمها المحرك مباشرة'],
    },
    en: {
      call: 'How HISN analysed the caller’s sentence', sms: 'How HISN analysed the message', partner: 'How HISN used the institution’s warning',
      tags: { req: 'request/verb', obj: 'sensitive topic', neg: 'negation', urgent: 'urgency' },
      c1: ['🎙️', 'Capture caller audio', 'Call audio streams live over WebRTC'],
      c2: ['📝', 'Speech recognition (ASR)', 'Real-time speech-to-text model turns voice into text'], asrLive: '🎙️ Live recognition of your voice from the mic', asrDemo: 'Generated dialogue text (demo mode)',
      c3: ['🧠', 'Natural language processing (NLP)', 'Arabic/dialect normalisation, clause splitting and word tagging:'],
      c4: ['🎯', 'Intent & context', ''], c5: ['⚖️', 'Risk & decision', ''],
      intent: { otp: 'Intent: asking for a verification code', transfer: 'Intent: urgent money transfer', approval: 'Intent: approve an action', remote: 'Intent: install remote-control app', reported: 'Matches a practice published by an institution' },
      protective: 'Negation / safety advice — not a request (context understanding)', normal: 'Normal talk — no sensitive request', claims: (e) => `Claimed organisation: ${e}`, ctx: (n) => `Uses context from ${n} previous sentences`,
      risk: (ms) => `High risk → instant alert to the victim (${ms} ms)`, safe: 'No risk → silent monitoring continues',
      s1: ['📩', 'Message received', ''], s2: ['🔗', 'Link & domain analysis', 'Compared with the official domain; look-alike spelling & deceptive characters'], s3: ['🧠', 'NLP on the text', ''], s4: ['🏛️', 'Institution intelligence + prediction', ''], s5: ['⚖️', 'Decision', ''],
      noLinks: 'No links', patHit: 'Matches a practice published by a verified institution', patNo: 'No match with published practices', chSms: 'Text message', chWa: 'WhatsApp',
      p1: ['🏛️', 'Institution verified by digital ID', 'published a scam practice'], p2: ['🧩', 'Indicator extraction', 'Distinctive phrases and fake domains'], p3: ['🔮', 'Impersonation prediction', 'Generates domains scammers may use and watches them'], p4: ['📡', 'Instant update', 'Pushed to every protected device and used by the engine'],
    },
  };
  // تقنية الذكاء الاصطناعي ودورها في كل مرحلة
  const TECH = {
    ar: {
      c1: ['معالجة الإشارة الصوتية + كشف النشاط الصوتي (VAD)', 'يلتقط صوت المتصل ويقسّمه إلى جمل جاهزة للتحليل'],
      c2: ['تعرّف الكلام بالتعلّم العميق (Transformer ASR)', 'يحوّل كلام المتصل باللهجة الإماراتية إلى نص يُفحص لحظيًا'],
      c3: ['معالجة اللغة العربية: تطبيع، تجزئة، وسم الكلمات، كشف النفي', 'يميّز «لا تعطين الرمز أحد» (نصيحة) عن «عطيني الرمز» (احتيال)'],
      c4: ['تصنيف النية + استخراج الكيانات (NER) + ذاكرة سياق المحادثة', 'يحدد ماذا يريد المتصل، وأي جهة ينتحل'],
      c5: ['نموذج تقييم المخاطر + ذكاء اصطناعي قابل للتفسير (XAI)', 'يقرر التنبيه ويشرح للضحية السبب بلغة بسيطة'],
      s1: ['تحليل ملف المرسل (Sender profiling)', 'رقم غير محفوظ؟ يدّعي أنه جهة؟ مجموعة واتساب جديدة؟'],
      s2: ['تحليل الروابط: التشابه النصي (Levenshtein) + كشف الأحرف المضللة + السمعة', 'يكشف الموقع المزيف قبل أن تفتحه'],
      s3: ['تصنيف النص لأساليب الهندسة الاجتماعية (NLP)', 'يرصد الاستعجال والتهديد وطلب البيانات والجوائز الوهمية'],
      s4: ['استخبارات التهديدات + توليد النطاقات المنتحلة', 'يستفيد من تحذيرات الجهات ويتوقع روابط المحتالين القادمة'],
      s5: ['دمج المؤشرات وحساب درجة الخطر (Ensemble) + XAI', 'قرار واحد واضح مع الأسباب'],
      p1: ['التحقق بالهوية الرقمية', 'يضمن أن التحذير صادر من جهة حقيقية'],
      p2: ['استخراج العبارات المفتاحية (Keyphrase extraction)', 'يحوّل وصف الجهة إلى مؤشرات قابلة للكشف'],
      p3: ['توليد نطاقات الانتحال (Typosquatting generation)', 'يراقب النطاقات قبل أن يستخدمها المحتال'],
      p4: ['التعلّم المستمر', 'كل تحذير جديد يحسّن الكشف عند جميع المستخدمين'],
    },
    en: {
      c1: ['Audio signal processing + voice activity detection (VAD)', 'Captures the caller and splits speech into sentences'],
      c2: ['Deep-learning speech recognition (Transformer ASR)', 'Turns Emirati-dialect speech into text in real time'],
      c3: ['Arabic NLP: normalisation, tokenisation, tagging, negation', 'Tells advice (“never share the code”) from a request (“give me the code”)'],
      c4: ['Intent classification + named-entity recognition + context memory', 'What the caller wants and whom they impersonate'],
      c5: ['Risk model + explainable AI (XAI)', 'Decides to alert and explains why in plain words'],
      s1: ['Sender profiling', 'Unknown number? Claims to be an organisation? New group?'],
      s2: ['Link analysis: string similarity + homoglyph detection + reputation', 'Catches the fake site before it is opened'],
      s3: ['Text classification for social-engineering tactics (NLP)', 'Spots urgency, threats, data requests and fake prizes'],
      s4: ['Threat intelligence + impersonation-domain generation', 'Uses institutions’ warnings and predicts the next scam links'],
      s5: ['Signal fusion & risk scoring (ensemble) + XAI', 'One clear decision with reasons'],
      p1: ['Digital-identity verification', 'The warning comes from a real institution'],
      p2: ['Keyphrase extraction', 'Turns the description into detectable indicators'],
      p3: ['Typosquatting generation', 'Watches domains before scammers use them'],
      p4: ['Continuous learning', 'Every new warning improves detection for everyone'],
    },
  };
  const LCHK = {
    ar: { subdomain: 'اسم الجهة كنطاق فرعي مضلل', swap: 'استبدال حروف بأرقام (0←o ، 1←l)', kw: 'كلمات تصيّد في الرابط', official: 'قائمة النطاقات الرسمية', mismatch: 'الجهة المذكورة ≠ النطاق', lookalike: 'تشابه إملائي (Levenshtein)', puny: 'أحرف مضللة (Punycode)', ip: 'عنوان IP', at: 'رمز @ مخادع', short: 'رابط مختصر', tld: 'امتداد عالي الخطورة', http: 'بدون تشفير HTTPS', intel: 'بلاغات الجهات والنطاقات المتوقعة',
      offOk: (e) => `نطاق رسمي لـ${e}`, notOff: 'ليس نطاقًا رسميًا', brand: (e) => `يستخدم اسم ${e}`, lev: (k, d) => `يختلف بـ${k} حرف عن ${d}`, ment: (e) => `يذكر ${e}`, rep: (o) => `حذّرت منه ${o}`, pred: (o) => `توقّعه حِصن لانتحال ${o}`, hits: (n, m) => `${n} مؤشرات خطر من ${m} فحصًا` },
    en: { subdomain: 'Org name as misleading subdomain', swap: 'Letters swapped for numbers', kw: 'Phishing words in link', official: 'Official-domain list', mismatch: 'Claimed org ≠ domain', lookalike: 'Look-alike spelling', puny: 'Deceptive characters', ip: 'Raw IP', at: 'Hidden @', short: 'Shortened link', tld: 'High-risk ending', http: 'No HTTPS', intel: 'Institution reports & predicted domains',
      offOk: (e) => `official domain of ${e}`, notOff: 'not an official domain', brand: (e) => `uses the name ${e}`, lev: (k, d) => `${k} letters from ${d}`, ment: (e) => `mentions ${e}`, rep: (o) => `reported by ${o}`, pred: (o) => `predicted for ${o}`, hits: (n, m) => `${n} risk signs out of ${m} checks` },
  };
  const tech = (k) => { const t = TECH[lang][k]; return t ? `<i class="ai-tech">🤖 ${esc(t[0])}<em>${esc(t[1])}</em></i>` : ''; };
  function linkChecks(links) {
    const L = LCHK[lang];
    return (links || []).slice(0, 2).map((lk) => {
      const n = lk.checks.filter((c) => c.hit).length;
      const chips = lk.checks.map((c) => {
        let d = '';
        if (c.id === 'official') d = c.hit ? L.notOff : L.offOk(lk.official);
        else if (c.hit && c.id === 'lookalike') { const [t, a, b] = c.detail.split(':'); d = t === 'brand' ? L.brand(a) : L.lev(a, b); }
        else if (c.hit && c.id === 'mismatch') d = L.ment(c.detail);
        else if (c.hit && c.id === 'intel') { const [t, o] = c.detail.split(':'); d = t === 'reported' ? L.rep(o) : L.pred(o); }
        else if (c.hit && c.id === 'tld') d = '.' + c.detail;
        else if (c.hit && (c.id === 'subdomain' || c.id === 'swap')) d = '≈ ' + c.detail;
        else if (c.hit && c.id === 'kw') d = c.detail;
        return `<span class="${c.hit ? 'hit' : 'ok'}">${c.hit ? '✗' : '✓'} ${esc(L[c.id])}${d ? ' — ' + esc(d) : ''}</span>`;
      }).join('');
      return `<span class="ai-q" dir="ltr">${esc(lk.host)}</span><small class="${n ? 'bad' : ''}">${L.hits(n, lk.checks.length)}</small><div class="ai-lc">${chips}</div>`;
    }).join('');
  }
  const ax = () => AI[lang];
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let aiRun = 0;
  function pipeline(title, steps) { // steps: [icon, title, htmlBody, cls]
    const run = ++aiRun;
    $('#ai').hidden = false; $('#aiTitle').textContent = title;
    const ol = $('#aiSteps'); ol.innerHTML = '';
    steps.forEach((step) => { const [ic, tl, body, cls] = step;
      const li = document.createElement('li'); if (cls) li.dataset.cls = cls;
      li.innerHTML = `<span class="ai-ic">${ic}</span><div class="ai-b"><b>${esc(tl)}</b>${body || ''}${tech(step[4])}</div>`;
      ol.appendChild(li);
    });
    [...ol.children].forEach((li, i) => setTimeout(() => { if (run !== aiRun) return; li.classList.add('on'); if (li.dataset.cls) li.classList.add(li.dataset.cls); }, 220 * (i + 1)));
  }
  function aiCall(d) {
    const A = ax(), n = d.nlp || {};
    const chips = (n.cues || []).map((c) => `<span class="${c.tag}">${esc(c.w)} · ${A.tags[c.tag]}</span>`).join('');
    const intents = (n.intents || []);
    const intentTxt = intents.length ? intents.map((x) => A.intent[x] || x).join('، ') : (n.protective ? A.protective : A.normal);
    const extra = [n.entity ? A.claims(n.entity) : '', n.context ? A.ctx(n.context) : ''].filter(Boolean).map((x) => `<small>${esc(x)}</small>`).join('');
    pipeline(A.call, [
      [A.c1[0], A.c1[1], `<small>${A.c1[2]}</small>`, '', 'c1'],
      [A.c2[0], A.c2[1], `<small>${A.c2[2]}</small><small>${d.source === 'asr' || d.source === 'stt' ? A.asrLive : A.asrDemo}</small><span class="ai-q" dir="auto">«${esc(String(d.text).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, ''))}»</span>`, '', 'c2'],
      [A.c3[0], A.c3[1], `<small>${A.c3[2]}</small><div class="ai-chips">${chips || '—'}</div>`, '', 'c3'],
      [A.c4[0], A.c4[1], `<small>${esc(intentTxt)}</small>${extra}`, intents.length ? 'bad' : 'good', 'c4'],
      [A.c5[0], A.c5[1], `<small>${esc(intents.length ? A.risk(Math.max(1, d.ms || 1)) : A.safe)}</small>`, intents.length ? 'bad' : 'good', 'c5'],
    ]);
  }
  function aiSms(d) {
    const A = ax();
    pipeline(A.sms, [
      [A.s1[0], A.s1[1], `<small>${esc((d.channel === 'wa' ? A.chWa : A.chSms) + ' • ' + d.from + (d.label ? ' — ' + d.label : ''))}</small>`, '', 's1'],
      [A.s2[0], A.s2[1], (d.links && d.links.length) ? linkChecks(d.links) : `<small>${A.noLinks}</small>`, (d.hosts || []).length && d.danger ? 'bad' : '', 's2'],
      [A.s3[0], A.s3[1], (d.reasons || []).slice(0, 2).map((r) => `<small>• ${esc(r)}</small>`).join('') || `<small>${A.normal}</small>`, '', 's3'],
      [A.s4[0], A.s4[1], `<small>${d.pattern ? A.patHit : A.patNo}</small>`, d.pattern ? 'bad' : '', 's4'],
      [A.s5[0], A.s5[1], `<small>${esc(d.title || '')}</small>`, d.danger ? 'bad' : 'good', 's5'],
    ]);
  }
  function aiPartner(d) {
    const A = ax();
    pipeline(A.partner, [[A.p1[0], A.p1[1], `<small>${esc(d.org)} — ${A.p1[2]}</small>`, '', 'p1'], [A.p2[0], A.p2[1], `<small>${A.p2[2]}</small>`, '', 'p2'], [A.p3[0], A.p3[1], `<small>${A.p3[2]}</small>`, '', 'p3'], [A.p4[0], A.p4[1], `<small>${A.p4[2]}</small>`, 'good', 'p4']]);
  }
  const UI = {
    ar: { judge: '🧑‍⚖️ جرّبها بنفسك', voices: '🔊 الأصوات', vTitle: 'أصوات المكالمة', vScam: 'المحتال (رجل)', vVic: 'مريم (فتاة)',
      vNote: (n) => n > 1 ? `متاح ${n} أصوات عربية. اختر صوتًا رجاليًا للمحتال ونسائيًا لمريم.` : 'يتوفر صوت عربي واحد فقط؛ نميّز الطرفين بطبقة الصوت. للحصول على صوتين إماراتيين (حمدان وفاطمة) افتح الصفحة في متصفح Edge.',
      sampleS: 'السَّلَام عَلَيْكُم، مَعَاجْ خَالِد مِنْ بَنْك النَّخْلَة.', sampleV: 'وَعَلَيْكُم السَّلَام، هَلَا، آمِرْ؟',
      gTitle: '🧑‍⚖️ جرّب «حِصن» بنفسك — كل شيء هنا يعمل فعليًا',
      gSteps: ['في هاتف الضحية (اليسار): افتح «حِصن» ← «الدخول بالهوية الرقمية» ← «فعّل الحماية». بعدها لا تحتاج لفعل أي شيء.', 'في هاتف «المحتال» (اليمين) ← «رسائل احتيال» ← «✍️ اكتب رسالتك»: اكتب أي رسالة أو رابط من خيالك وأرسله، وشاهد «حِصن» يحلّلها تلقائيًا.', '«مكالمات احتيال» ← «🎙️ مكالمة حرة»: ردّ من هاتف الضحية، ثم اضغط زر الميكروفون في هاتف المحتال وتكلّم بنفسك (مثل: «عطيني رمز التحقق») أو اكتب الجملة. يتحول صوتك إلى نص فعليًا، ويحلّله «حِصن» وينبّه أثناء المكالمة.', 'جرّب الفرق: قل «لا تشارك الرمز مع أحد» (لن ينبّه)، ثم «قوليلي الرمز اللي وصلج» (سينبّه).', 'تابع لوحة «كيف حلّل حِصن» في المنتصف لترى كل مرحلة: التعرف على الكلام ← معالجة اللغة ← النية ← القرار.'],
      gNote: 'الميكروفون والتعرف على الكلام يعملان في متصفح Edge أو Chrome مع اتصال بالإنترنت، ويطلب المتصفح الإذن في أول مرة.' },
    en: { judge: '🧑‍⚖️ Try it yourself', voices: '🔊 Voices', vTitle: 'Call voices', vScam: 'Scammer (man)', vVic: 'Maryam (girl)',
      vNote: (n) => n > 1 ? `${n} voices available. Pick a male voice for the scammer and a female voice for Maryam.` : 'Only one voice is available; pitch is used to tell them apart. Open the page in Edge for natural voices.',
      sampleS: 'Hello, this is Khalid from Nakhla Bank.', sampleV: 'Hello, yes?',
      gTitle: '🧑‍⚖️ Try HISN yourself — everything here really works',
      gSteps: ['Victim phone (left): open HISN → sign in with digital identity → turn on protection. Nothing else needed.', 'Scammer phone (right) → Scam messages → “✍️ Write your own”: type any message or link and send it; watch HISN analyse it automatically.', 'Scam calls → “🎙️ Free call”: answer on the victim phone, then press the mic on the scammer phone and speak (e.g. “give me the verification code”) or type. Your voice is really transcribed, analysed and the alert appears mid-call.', 'Try the difference: “never share the code with anyone” (no alert) vs “tell me the code you received” (alert).', 'Watch the “How HISN analysed it” panel in the middle: speech recognition → NLP → intent → decision.'],
      gNote: 'Mic and speech recognition work in Edge or Chrome with internet; the browser asks for permission the first time.' },
  };
  const ux = () => UI[lang];
  function fillVoices() {
    const V = window.ShieldVoice; if (!V) return;
    const list = V.list(lang);
    for (const [sel, role] of [['#vScam', 'scammer'], ['#vVic', 'victim']]) {
      const el = $(sel), cur = V.current(role, lang);
      el.innerHTML = list.map((v) => `<option value="${esc(v.name)}">${v.gender === 'f' ? '👩' : v.gender === 'm' ? '👨' : '🔈'} ${esc(v.name.replace(/^Microsoft\s*/, '').replace(/\s*-\s*.*$/, ''))} (${v.lang})</option>`).join('') || '<option value="">—</option>';
      el.value = cur;
    }
    $('#vNote').textContent = ux().vNote(list.length);
  }
  function initVoicesUI() {
    $('#dVoices').addEventListener('click', async () => { const p = $('#voicePop'); p.hidden = !p.hidden; $('#judgePop').hidden = true; if (!p.hidden) { await window.ShieldVoice.ready(); fillVoices(); } });
    $('#vScam').addEventListener('change', (e) => window.ShieldVoice.set('scammer', e.target.value));
    $('#vVic').addEventListener('change', (e) => window.ShieldVoice.set('victim', e.target.value));
    $('#vScamT').addEventListener('click', () => { window.ShieldVoice.cancel(); window.ShieldVoice.say(ux().sampleS, { lang, role: 'scammer' }); });
    $('#vVicT').addEventListener('click', () => { window.ShieldVoice.cancel(); window.ShieldVoice.say(ux().sampleV, { lang, role: 'victim' }); });
    $('#dJudge').addEventListener('click', () => { const p = $('#judgePop'); p.hidden = !p.hidden; $('#voicePop').hidden = true; });
    $('#judgeClose').addEventListener('click', () => { $('#judgePop').hidden = true; });
  }
  function renderUX() {
    $('#dJudge').textContent = ux().judge; $('#dVoices').textContent = ux().voices; $('#dSettings').textContent = lang === 'ar' ? '⚙️ الإعدادات' : '⚙️ Settings'; $('#dAiTech').textContent = lang === 'ar' ? '🤖 تقنيات الذكاء الاصطناعي' : '🤖 AI technologies'; $('#dScan').textContent = lang === 'ar' ? '🔎 ماسح الروابط' : '🔎 Link scanner';
    $('#vTitle').textContent = ux().vTitle; $('#vScamL').textContent = ux().vScam; $('#vVicL').textContent = ux().vVic;
    $('#gTitle').textContent = ux().gTitle; $('#gNote').textContent = ux().gNote;
    $('#gSteps').innerHTML = ux().gSteps.map((x) => `<li>${esc(x)}</li>`).join('');
    if (!$('#voicePop').hidden) fillVoices();
  }
  const tt = (k, ...a) => { const v = T[lang][k]; return typeof v === 'function' ? v(...a) : v; };

  const fScam = $('#fScam'), fVic = $('#fVictim'), bridge = $('#bridge');
  let victim = { code: null, active: false }, linked = false, inCall = false, sentCode = null, started = false, connecting = false, dropTimer = null;

  function applyLang() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $('#dTitle').textContent = tt('title'); $('#dSub').textContent = tt('sub'); $('#dLang').innerHTML = `<span class="${lang === 'ar' ? 'on' : ''}">عربي</span><span class="${lang === 'en' ? 'on' : ''}">English</span>`; $('#dLang').setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    $('#capScam').textContent = tt('scam'); $('#capVic').textContent = tt('vic'); $('#dPortal').textContent = tt('portal');
    renderUX();
    renderState();
  }
  function renderState() {
    const st = !started || !linked ? 'off' : connecting ? 'off' : inCall ? 'call' : 'on';
    bridge.dataset.state = st;
    $('#pillTxt').textContent = connecting ? tt('connecting') : !started ? tt('idle') : tt(st);
    bridge.classList.toggle('connecting', connecting);
    if (!evtLock) $('#evt').textContent = st === 'off' ? tt('evOff') : st === 'call' ? tt('active') : tt('evOn');
  }
  let evtLock = null;
  function event(text, cls, ms = 4500) {
    $('#evt').textContent = text;
    clearTimeout(evtLock); evtLock = setTimeout(() => { evtLock = null; bridge.classList.remove('alarm', 'ok'); renderState(); }, ms);
    log(text, cls);
  }
  function log(text, cls) {
    const li = document.createElement('li'); li.textContent = text; if (cls) li.className = cls;
    const ol = $('#log'); ol.prepend(li); while (ol.children.length > 5) ol.lastChild.remove();
  }
  function packet(icon, ring) {
    const p = document.createElement('div'); p.className = 'd-packet' + (ring ? ' ring' : ''); p.textContent = icon;
    $('#packets').appendChild(p);
    if (!ring) setTimeout(() => p.remove(), 1200);
    return p;
  }
  let ringPacket = null;
  const stopRing = () => { if (ringPacket) { ringPacket.remove(); ringPacket = null; } };
  function startConn() {
    if (started) return;
    started = true; connecting = true; renderState();
    setTimeout(() => { connecting = false; renderState(); log(tt('on'), 'good'); }, 900);
  }
  function alarm() { bridge.classList.remove('ok'); void bridge.offsetWidth; bridge.classList.add('alarm'); }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !e.data.src) return;
    const d = e.data;
    if (d.src === 'voice' && d.type === 'missing') showVoiceWarn();
    if (d.src === 'partner' && d.type === 'published') {
      const p = document.createElement('div'); p.className = 'd-broadcast'; p.textContent = '📢'; $('#packets').appendChild(p); setTimeout(() => p.remove(), 1600);
      bridge.classList.add('update'); setTimeout(() => bridge.classList.remove('update'), 1800);
      event(tt('published', d.org, d.title), 'info', 7000);
      aiPartner(d);
    }
    if (d.src === 'victim') {
      if (d.type === 'state') {
        victim = d;
        if (d.active && d.code && d.code !== sentCode) { sentCode = d.code; fScam.contentWindow.postMessage({ type: 'pair', code: d.code }, location.origin); }
      }
      if (d.type === 'nlp') aiCall(d);
      if (d.type === 'sms-received') {
        aiSms(d);
        if (!d.danger) { bridge.classList.add('ok'); event(tt('smsOk'), 'good'); }
      }
      if (d.type === 'danger') {
        alarm();
        event(d.kind === 'call' ? tt('callBad', d.title || '') : tt('smsBad'), 'bad', 6000);
      }
      if (d.type === 'hacked') { alarm(); event(tt('hacked'), 'bad', 9000); }
      if (d.type === 'restored') { log(tt('restored'), 'good'); }
      if (d.type === 'call') {
        if (window.ShieldTones && d.state !== 'ringing') window.ShieldTones.ringStop();
        if (d.state === 'active') { stopRing(); inCall = true; renderState(); log(tt('active')); }
        if (d.state === 'ended') { stopRing(); inCall = false; renderState(); log(tt('ended')); }
      }
    }
    if (d.src === 'scammer') {
      if (d.type === 'ready' && victim.code && victim.active) { sentCode = victim.code; fScam.contentWindow.postMessage({ type: 'pair', code: victim.code }, location.origin); }
      if (d.type === 'link') {
        clearTimeout(dropTimer);
        if (d.linked) { if (!linked) { linked = true; renderState(); } }
        else if (linked) dropTimer = setTimeout(() => { linked = false; renderState(); }, 4000); // لا نُظهر الانقطاع إلا إذا استمر
      }
      if (d.type === 'sms-sent') { startConn(); packet(d.channel === 'wa' ? '💬' : '✉️'); $('#evt').textContent = d.channel === 'wa' ? tt('waSent') : tt('smsSent'); }
      if (d.type === 'call') {
        if (d.state === 'ringing') { if (window.ShieldTones) window.ShieldTones.ringStart(); startConn(); stopRing(); ringPacket = packet('📞', true); event(tt('ringing'), null, 8000); }
        if (d.state === 'active') { if (window.ShieldTones) window.ShieldTones.ringStop(); stopRing(); inCall = true; renderState(); }
        if (d.state === 'ended') { if (window.ShieldTones) window.ShieldTones.ringStop(); stopRing(); inCall = false; renderState(); }
      }
      if (d.type === 'phrase') { packet('💬'); }
    }
  });

  function fit() {
    const s = Math.min(0.92, (window.innerHeight - 80 - 120) / 880, (window.innerWidth - 40) / (2 * 420 + 440));
    $('#dStage').style.setProperty('--s', Math.max(0.45, s).toFixed(3));
  }
  window.addEventListener('resize', fit);
  $('#dLang').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('ds.lang', JSON.stringify(lang)); } catch {}
    applyLang();
    fVic.contentWindow.location.reload(); fScam.contentWindow.location.reload(); sentCode = null; linked = false;
    // اللغة نفسها في كل الأجزاء: بوابة الجهات وصفحة التقنيات والإعدادات
    if ($('#fPartner').src) $('#fPartner').contentWindow.location.reload();
    if (!$('#drawerAi').hidden) $('#fAiTech').src = (lang === 'en' ? '/ai-en.html' : '/ai.html') + '?t=' + Date.now();
    if (!$('#drawerSet').hidden) $('#fSettings').src = '/settings.html?frame=0&t=' + Date.now();
  });

  $('#dPortal').addEventListener('click', () => {
    const dr = $('#drawer'); const open = dr.hidden;
    dr.hidden = !open;
    if (open && !$('#fPartner').src) $('#fPartner').src = '/partners.html?frame=0';
  });
  $('#drawerClose').addEventListener('click', () => { $('#drawer').hidden = true; });
  $('#dSettings').addEventListener('click', () => {
    const dr = $('#drawerSet'); const open = dr.hidden; dr.hidden = !open; $('#drawer').hidden = true;
    if (open) $('#fSettings').src = '/settings.html?frame=0&t=' + Date.now();
  });
  $('#setClose').addEventListener('click', () => { $('#drawerSet').hidden = true; });
  $('#dAiTech').addEventListener('click', () => {
    const dr = $('#drawerAi'); const open = dr.hidden; dr.hidden = !open; $('#drawer').hidden = true; $('#drawerSet').hidden = true;
    if (open) $('#fAiTech').src = (lang === 'en' ? '/ai-en.html' : '/ai.html') + '?t=' + Date.now();
  });
  $('#aiClose').addEventListener('click', () => { $('#drawerAi').hidden = true; });
  fScam.src = '/scammer.html?frame=0';
  fVic.src = '/?iphone&frame=0';
  async function showVoiceWarn() {
    // إذا رُفعت تسجيلات للمكالمات فلا حاجة للتنبيه (الأصوات تُشغَّل من التسجيلات)
    try { const j = await fetch('/api/clips', { cache: 'no-store' }).then((r) => r.json()); if (Object.keys(j.clips || {}).length >= 10) return; } catch {}
    const w = $('#voiceWarn'); w.hidden = false;
    $('#vwTxt').textContent = lang === 'ar' ? '🔇 لا يوجد صوت عربي مولَّد في هذا المتصفح. ارفع تسجيلاتك من «⚙️ الإعدادات» لتُسمع المكالمة، أو افتح العرض في Microsoft Edge.' : '🔇 No Arabic voice in this browser, so the call dialogue is silent (text and alerts still work). Open the demo in Microsoft Edge for natural voices.';
    const a = $('#vwEdge');
    if (!(window.ShieldVoice && window.ShieldVoice.isEdge)) { a.hidden = false; a.href = 'microsoft-edge:' + location.href; a.textContent = lang === 'ar' ? 'افتح في Edge' : 'Open in Edge'; }
  }
  if (window.ShieldVoice) window.ShieldVoice.ready('ar').then(() => { if (!window.ShieldVoice.available('ar')) showVoiceWarn(); });
  initVoicesUI();
  fit(); applyLang();
})();
