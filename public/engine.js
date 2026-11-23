/* الدرع الذكي — محرك الفحص (يعمل في المتصفح وعلى الخادم)
 * - analyzeMessage(text, lang): فحص رسالة نصية/بريد/رابط
 * - analyzeUtterance(text, context, lang): فحص عبارة من مكالمة مع سياقها القريب
 * لا يزور أي رابط ولا يحفظ أي نص.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShieldEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1) الجهات المستخدمة في العرض ونطاقاتها الرسمية
   *    ⚠️ راجع هذه القائمة وتأكد من كل نطاق قبل العرض أمام اللجنة.
   * ------------------------------------------------------------------ */
  const ENTITIES = [
    { id: 'emiratespost', ar: 'بريد الإمارات', en: 'Emirates Post', kind: 'org',
      names: ['بريد الامارات', 'emirates post', 'emiratespost'],
      domains: ['emiratespost.ae'], brand: ['emiratespost', 'emiratepost'] },
    { id: 'aramex', ar: 'أرامكس', en: 'Aramex', kind: 'org',
      names: ['ارامكس', 'aramex'], domains: ['aramex.com'], brand: ['aramex'] },
    // جهات وهمية للعرض
    { id: 'nakhla', ar: 'بنك النخلة الوطني', en: 'Nakhla National Bank', kind: 'bank',
      names: ['بنك النخله الوطني', 'بنك النخله', 'nakhla bank', 'nakhla national bank'], domains: ['nakhlabank.ae'], brand: ['nakhlabank', 'nakhla'] },
    { id: 'bluegulf', ar: 'مصرف الخليج الأزرق', en: 'Blue Gulf Bank', kind: 'bank',
      names: ['مصرف الخليج الازرق', 'blue gulf bank', 'bluegulf'], domains: ['bluegulfbank.ae'], brand: ['bluegulf'] },
    { id: 'adcb', ar: 'بنك أبوظبي التجاري', en: 'ADCB', kind: 'bank',
      names: ['بنك ابوظبي التجاري', 'adcb'], domains: ['adcb.com'], brand: ['adcb'] },
    { id: 'fab', ar: 'بنك أبوظبي الأول', en: 'First Abu Dhabi Bank', kind: 'bank',
      names: ['بنك ابوظبي الاول', 'first abu dhabi bank', 'fab bank'], domains: ['bankfab.com'], brand: ['bankfab', 'fabbank'] },
    { id: 'enbd', ar: 'بنك الإمارات دبي الوطني', en: 'Emirates NBD', kind: 'bank',
      names: ['الامارات دبي الوطني', 'emirates nbd', 'enbd'], domains: ['emiratesnbd.com'], brand: ['emiratesnbd', 'enbd'] },
    { id: 'adib', ar: 'مصرف أبوظبي الإسلامي', en: 'ADIB', kind: 'bank',
      names: ['مصرف ابوظبي الاسلامي', 'adib'], domains: ['adib.ae'], brand: ['adib'] },
    { id: 'etisalat', ar: 'اتصالات e&', en: 'e& (Etisalat)', kind: 'org',
      names: ['اتصالات', 'etisalat'], domains: ['etisalat.ae', 'eand.com'], brand: ['etisalat'] },
    { id: 'du', ar: 'دو', en: 'du', kind: 'org', names: ['شركه دو'], domains: ['du.ae'], brand: [] },
    { id: 'adpolice', ar: 'شرطة أبوظبي', en: 'Abu Dhabi Police', kind: 'police',
      names: ['شرطه ابوظبي', 'abu dhabi police', 'adpolice'], domains: ['adpolice.gov.ae'], brand: ['adpolice'] },
    { id: 'moi', ar: 'وزارة الداخلية', en: 'Ministry of Interior', kind: 'police',
      names: ['وزاره الداخليه', 'ministry of interior'], domains: ['moi.gov.ae'], brand: ['moiuae'] },
    { id: 'uaepass', ar: 'الهوية الرقمية UAE PASS', en: 'UAE PASS', kind: 'org',
      names: ['uae pass', 'uaepass', 'الهويه الرقميه'], domains: ['uaepass.ae'], brand: ['uaepass'] },
    { id: 'whatsapp', ar: 'واتساب', en: 'WhatsApp', kind: 'org', names: ['واتساب', 'واتس اب', 'whatsapp'], domains: ['whatsapp.com', 'wa.me', 'whatsapp.net'], brand: ['whatsapp', 'whatsap', 'watsapp'] },
    { id: 'tamm', ar: 'تم', en: 'TAMM', kind: 'org', names: ['tamm', 'منصه تم'], domains: ['tamm.abudhabi'], brand: [] },
  ];

  // جهات عامة تُذكر في المكالمات (لصياغة الخطوة فقط)
  const GENERIC = [
    { re: /(^|\s)(ال)?شرطه|police|(^|\s)(ال)?داخليه/, ar: 'الشرطة', en: 'the police', kind: 'police' },
    { re: /(^|\s)(ال)?(بنك|مصرف)|bank/, ar: 'البنك', en: 'the bank', kind: 'bank' },
    { re: /(^|\s)(ال)?بريد|post office|courier|(^|\s)(ال)?شحن/, ar: 'شركة الشحن', en: 'the courier', kind: 'org' },
    { re: /(^|\s)(ال)?اتصالات|telecom/, ar: 'شركة الاتصالات', en: 'the telecom company', kind: 'org' },
  ];

  /* ------------------------------------------------------------------ *
   * 2) أدوات النص
   * ------------------------------------------------------------------ */
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[’‘'`]/g, '');
  }
  // تقسيم العبارة إلى مقاطع: علامات الترقيم وأدوات الاستدراك (بس/لكن/but)
  function segments(n) {
    return n.split(/[.!?؟،,;؛:\n\r()«»"]+|\s(?=(?:بس|لكن|ولكن|but|however)\s)/)
      .map((s) => s.trim()).filter(Boolean);
  }
  function tokens(seg) { return seg.split(/\s+/).filter(Boolean); }
  function variants(t) {
    const v = [t];
    if (t.length > 3 && (t[0] === 'و' || t[0] === 'ف')) v.push(t.slice(1));
    for (const x of v.slice()) if (x.startsWith('ال') && x.length > 3) v.push(x.slice(2));
    return v;
  }
  const S = (arr) => new Set(arr.map(norm));
  const inSet = (set, t) => variants(t).some((x) => set.has(x));

  /* ------------------------------------------------------------------ *
   * 3) معاجم الكشف (خليجي + فصحى + إنجليزي)
   * ------------------------------------------------------------------ */
  const NEG = S(['لا', 'ما', 'مب', 'مو', 'لن', 'ابدا', 'ابد', 'اياك', 'dont', 'never', 'not', 'no', 'doesnt', 'wont', 'shouldnt', 'لاتشارك', 'لاتعطي']);
  // أفعال الطلب: أعطني / أرسل / قل / اقرأ / شارك ...
  const REQ = S([
    'عطني', 'عطنا', 'عطيني', 'عطينا', 'عطه', 'عطيه', 'عطوني', 'اعطني', 'اعطنا', 'اعطيني', 'اعطينا', 'اعطه', 'اعطيه',
    'تعطيني', 'تعطينا', 'تعطيه', 'تعطي', 'ارسل', 'ارسله', 'ارسلها', 'ارسلي', 'ارسلنا', 'ترسل', 'ترسله', 'ترسلي', 'ترسلنا',
    'ابعث', 'ابعثه', 'ابعثلي', 'ابعثلنا', 'تبعث', 'تبعثلي', 'دز', 'دزه', 'دزلي', 'دزيه', 'دزلنا', 'تدز', 'تدزلي',
    'قول', 'قوله', 'قولها', 'قولي', 'قولنا', 'قوللي', 'قل', 'قله', 'قلي', 'تقول', 'تقوله', 'تقولي', 'تقولنا', 'تقوللي',
    'اقرا', 'اقراه', 'اقرالي', 'اقرالنا', 'اقريلي', 'اقراها', 'تقرا', 'تقراه', 'تقرالي', 'تقرالنا', 'اقري',
    'خبرني', 'خبرنا', 'تخبرني', 'زودني', 'زودنا', 'تزودني', 'تزودنا', 'شاركني', 'شاركنا', 'شارك', 'تشارك', 'تشاركني', 'تشاركنا',
    'ابي', 'ابغي', 'ابا', 'ابغا', 'نبي', 'نبغي', 'نبا', 'نبغا', 'ابيه', 'نبيه', 'ابغاه', 'نبغاه', 'نحتاج', 'نحتاجه', 'احتاج', 'محتاجين', 'محتاج',
    'قوليلي', 'قوليلنا', 'تقوليلي', 'تقولين', 'عطيني', 'عطينا', 'تعطين', 'تعطيني', 'ارسليلي', 'ارسلي', 'دزي', 'دزيلي', 'خبريني', 'زوديني', 'شاركيني', 'اقريلي', 'اقريه', 'ابيه', 'نبيه', 'ممكن', 'املي', 'املينا', 'تملي', 'اكتب', 'اكتبه', 'اكتبلي', 'ادخل', 'ادخله', 'تدخل', 'تدخله', 'اذكر', 'اذكره',
    'give', 'send', 'tell', 'read', 'share', 'need', 'provide', 'forward', 'enter', 'type', 'reply', 'want', 'confirm',
  ]);
  const QWORD = S(['شو', 'ايش', 'وش', 'شنو', 'شنهو', 'كم', 'what', 'whats']);
  const PRONOUN = S(['اياه', 'اياها', 'ياه', 'it', 'them', 'هو']);
  const OTP_OBJ = S(['رمز', 'رمزك', 'رموز', 'كود', 'كودك', 'اكواد', 'otp', 'pin', 'باسورد', 'password', 'passcode', 'code', 'رمزالتحقق']);
  const OTP_MULTI = [
    /(رقم|كلمه|كلمت)\s*(ال)?(سري|سر|مرور)/,
    /verification code|security code|one[\s-]?time|confirmation code/,
    /(ال)?(رساله|ارقام|رقم|مسج)\s+(اللي|الي|التي|الذي)?\s*(وصل|جا|جات|جتك|جاك)/,
    /(code|message|sms|numbers?)\s+(you\s+)?(just\s+)?(got|received)/,
    /(وصلك|وصلتك|جاك|جتك|جاتك)\s+(ال)?(رساله|مسج|ارقام|رقم)/,
    /(رساله|مسج)\s+فيها\s+(ارقام|رقم)/,
  ];
  const REPORTED = /(قال لك|قالك|يقول لك|يقولك|يقولون لك|طلب منك|يطلب منك|طلب منكم|(^|\s)احد(\s|$)|(^|\s)اي احد|someone|anyone|anybody|asks you|says)/;

  // التحويل المالي
  const PAY_STRONG = S(['ادفع', 'ادفعي', 'تدفع', 'تدفعي', 'سدد', 'سددي', 'تسدد', 'pay', 'transfer', 'wire']);
  const PAY_WEAK = S(['حول', 'حولي', 'حولنا', 'حوله', 'حولها', 'حوليه', 'حوليها', 'تحول', 'تحولي', 'تحولين', 'تحولنا', 'ارسل', 'ترسل', 'ابعث', 'دز', 'send', 'move', 'deposit']);
  const PAY_NOUN = S(['تحويل', 'دفعه', 'سداد', 'payment']);
  const DO_VERB = S(['سوي', 'سو', 'تسوي', 'اعمل', 'نفذ', 'تنفذ', 'لازم', 'نحتاج', 'make', 'do', 'need', 'must']);
  const MONEY = S(['مبلغ', 'فلوس', 'درهم', 'دراهم', 'الف', 'الاف', 'رسوم', 'غرامه', 'مخالفه', 'حساب', 'حسابك', 'حسابج', 'رصيد', 'رصيدك', 'رصيدج', 'aed', 'dirham', 'dirhams', 'money', 'fee', 'fees', 'fine', 'amount', 'account', 'cash']);
  const URGENT = /(الحين|الحينه|فورا|فوري|بسرعه|سريع|عاجل|ضروري|اليوم|ساعه|دقايق|دقيقه|دقائق|والا|بيتوقف|يتوقف|ايقاف|توقيف|تجميد|يتجمد|بيتجمد|ينقفل|بينقفل|يتسكر|بيتسكر|خلال|urgent|now|immediately|asap|today|quick|hurry|minutes|hour|otherwise|suspend|frozen|freeze|block)/;
  const SAFE_ACCOUNT = /(حساب\s*(امن|آمن|مؤقت|حمايه)|safe account|secure account|holding account)/;

  // الموافقة على إجراء لم يبدأه المستخدم
  const APPROVE = S(['وافق', 'وافقي', 'توافق', 'توافقي', 'توافقين', 'تضغطين', 'اضغط', 'اضغطي', 'تضغط', 'تضغطي', 'دوس', 'اقبل', 'اقبلي', 'تقبل', 'اكد', 'اكدي', 'تاكيد', 'confirm', 'approve', 'accept', 'press', 'tap', 'click', 'allow', 'authorize', 'authorise']);
  const APPROVE_OBJ = /(موافق|موافقه|(^|\s)(ال)?طلب|(ال)?عمليه|(ال)?اشعار|(ال)?رابط|(ال)?زر|(^|\s)نعم|uae ?pass|يو اي باس|(ال)?هويه الرقميه|request|notification|prompt|link|button|(^|\s)yes(\s|$)|(^|\s)ok(\s|$)|login)/;
  const REMOTE_APP = /(anydesk|any desk|انيديسك|اني ديسك|teamviewer|team viewer|تيم ?فيور|تيم ?فيوور|quicksupport|quick support|rustdesk|airdroid)/;
  const INSTALL = /(نزل|حمل|ثبت|تنزل|تحمل|تثبت|install|download)/;

  /* ------------------------------------------------------------------ *
   * 4) منطق السياق: هل الطلب منفي؟ هل المقطع تحذيري؟
   * ------------------------------------------------------------------ */
  function negatedAt(tk, i) {
    for (let k = Math.max(0, i - 3); k < i; k++) if (inSet(NEG, tk[k])) return true;
    return false;
  }
  function hasOtpObj(seg, tk) {
    return tk.some((t) => inSet(OTP_OBJ, t) || /^(ال)?(رمز|كود)/.test(t)) || OTP_MULTI.some((re) => re.test(seg));
  }
  // مقطع تحذيري: نفي يسبق فعل مشاركة/إعطاء، مثل «لا تشارك الرمز» أو «البنك ما يطلب منك الرمز»
  function isProtective(seg, tk) {
    if (/(ما|لا|لن|مب|مو)\s+(ي|ن|ت)?طلب/.test(seg) || /(never|wont|will not|do not|dont)\s+(ever\s+)?(ask|share|give|send|tell)/.test(seg)) return true;
    for (let i = 0; i < tk.length; i++) if ((inSet(REQ, tk[i]) || inSet(APPROVE, tk[i]) || inSet(PAY_STRONG, tk[i]) || inSet(PAY_WEAK, tk[i])) && negatedAt(tk, i)) return true;
    return false;
  }
  function endsWithPronoun(t) { return /(ه|ها|يه|ياه)$/.test(t) && t.length > 3; }

  function detectOtp(seg, tk, ctxHasObj, uttProtective) {
    if (isProtective(seg, tk)) return false;
    if (REPORTED.test(seg) && uttProtective) return false; // «حتى لو أحد قال لك عطني الرمز…» ضمن تحذير
    const obj = hasOtpObj(seg, tk);
    for (let i = 0; i < tk.length; i++) {
      const t = tk[i];
      if (inSet(REQ, t) && !negatedAt(tk, i)) {
        if (obj) return true;
        const pron = endsWithPronoun(t) || tk.slice(i + 1, i + 4).some((x) => inSet(PRONOUN, x));
        if (pron && ctxHasObj) return true;
      }
      if (inSet(QWORD, t) && obj) return true; // «شو الرمز اللي وصلك؟»
    }
    return false;
  }
  /* طلب «إعادة إرسال» الرمز أو الرسالة التي ستصل للضحية — يُفهم من المعنى لا من عبارة محددة:
     (ما سيصل: رمز/كود/OTP/الأرقام/المسج…) + (طلب إرسال/تحويل/كتابة) + (وجهة: بريدي/واتسابي/رقمي/حقي/الرابط…)
     البنك والجهات لا تطلب أبدًا إعادة إرسال الرمز؛ الرمز تحقق خاص بالعميل. */
  const RELAY_CODE = /(رمز|كود|otp|(^|\s)او ?تي ?بي|اوتيبي|(^|\s)pin(\s|$)|(^|\s)code|(^|\s)(ال)?ارقام)/;
  const RELAY_SOFT = /((ال)?رساله|(ال)?مسج|sms|message|text)/;
  const RELAY_ARRIVE = /(وصلك|وصلتك|وصلتج|يوصلك|بيوصلك|بتوصلك|توصلك|راح يوصلك|يجيك|بيجيك|بتجيك|تجيك|جاك|جتك|جاتك|ينرسل لك|بينرسل لك|you('ll| will)? (get|receive)|you (got|received)|we (will )?send you|(رساله|مسج)\s+فيها\s+(ارقام|رقم|رمز|كود))/;
  const RELAY_ACT = /(^|\s)(ارسل\S*|ترسل\S*|ارسلي\S*|طرش\S*|تطرش\S*|حول(ه|ها|يه|يها|لي|يلي)|تحول(ه|ها|يه)|فورورد\S*|فوروود\S*|ابعت\S*|تبعت\S*|ابعث\S*|تبعث\S*|دز\S*|تدز\S*|اكتب\S*|تكتب\S*|حط(ه|ها|يه|يها)?|تحط(ه|ها)?|دخل(ه|ها)|عطني|اعطني|عطنا|عطيني|تعطيني|انسخ\S*|الصق\S*|اعاده ارسال|forward\S*|send|share|type|enter|paste|text)(?=\s|$)/g;
  const RELAY_DEST = /(بريد|ايميل|email|(^|\s)mail|واتس|whatsapp|(^|\s)رقمي|رقم\s*(هاتفي|تلفوني|تليفوني|جوالي)|تليفوني|تلفوني|هاتفي|جوالي|موبايلي|(^|\s)حقي|(^|\s)لي(\s|$)|(^|\s)لنا(\s|$)|الخاص|(^|\s)هنا|الرابط|اللينك|(^|\s)link|my (number|phone|email|whatsapp|inbox)|(^|\s)me(\s|$)|this (number|email|link))/;
  const RELAY_NEG = /(^|\s)(لا|لن|ما|مو|مب|ابدا|ليس|لم|never|not|dont|don't|do not)(\s|$)/;
  function detectRelay(n) {
    const code = RELAY_CODE.test(n), arrive = RELAY_ARRIVE.test(n);
    if (!(code || (RELAY_SOFT.test(n) && arrive))) return false;
    if (!(RELAY_DEST.test(n) || arrive)) return false;
    RELAY_ACT.lastIndex = 0; let m;
    while ((m = RELAY_ACT.exec(n))) {
      const before = n.slice(0, m.index).trim().split(/\s+/).slice(-3).join(' ');
      if (!RELAY_NEG.test(' ' + before + ' ')) return true;
    }
    return false;
  }
  function detectTransfer(seg, tk, uttText, ctxText) {
    if (isProtective(seg, tk)) return false;
    const all = uttText + ' ' + ctxText;
    const hasMoney = tk.some((t) => inSet(MONEY, t)) || /\d/.test(seg);
    const hasMoneyAny = hasMoney || all.split(/\s+/).some((t) => inSet(MONEY, t));
    let req = false;
    for (let i = 0; i < tk.length; i++) {
      if (negatedAt(tk, i)) continue;
      if (inSet(PAY_STRONG, tk[i])) req = true;
      else if (inSet(PAY_WEAK, tk[i]) && hasMoneyAny) req = true;
      else if (inSet(PAY_NOUN, tk[i]) && tk.slice(Math.max(0, i - 2), i).some((x) => inSet(DO_VERB, x))) req = true;
    }
    if (!req) return false;
    return URGENT.test(all) || SAFE_ACCOUNT.test(all);
  }
  function detectApproval(seg, tk, uttText, ctxText) {
    if (isProtective(seg, tk)) return null;
    if (REMOTE_APP.test(seg) && INSTALL.test(seg)) return 'remote';
    const all = uttText + ' ' + ctxText;
    for (let i = 0; i < tk.length; i++) {
      if (inSet(APPROVE, tk[i]) && !negatedAt(tk, i)) {
        if (APPROVE_OBJ.test(seg) || /(اشعار|رساله|notification|message)/.test(all)) return 'approval';
      }
    }
    return null;
  }

  function findEntity(n) {
    for (const e of ENTITIES) if (e.names.some((x) => n.includes(norm(x)))) return { ar: e.ar, en: e.en, kind: e.kind, id: e.id };
    for (const g of GENERIC) if (g.re.test(n)) return { ar: g.ar, en: g.en, kind: g.kind };
    return null;
  }

  /* ------------------------------------------------------------------ *
   * 5) نصوص البطاقات
   * ------------------------------------------------------------------ */
  function callStep(entity, lang) {
    if (lang === 'en') {
      if (!entity) return 'End the call and contact the organisation through its official channel.';
      if (entity.kind === 'bank') return `End the call and contact ${entity.en} through its official app.`;
      return `End the call and contact ${entity.en} through its official number or app.`;
    }
    if (!entity) return 'أنهِ المكالمة وتواصل مع الجهة عبر قناتها الرسمية.';
    if (entity.kind === 'bank') return `أنهِ المكالمة وتواصل مع ${entity.ar} عبر تطبيقه الرسمي.`;
    return `أنهِ المكالمة وتواصل مع ${entity.ar} عبر رقمها أو تطبيقها الرسمي.`;
  }
  const CALL_TEXT = {
    otp: { ar: ['لا تشارك الرمز', 'المتصل طلب منك رمز تحقق.'], en: ['Do not share the code', 'The caller asked you for a verification code.'] },
    transfer: { ar: ['لا تحوّل أي مبلغ', 'المتصل يطلب منك تحويلًا ماليًا عاجلًا.'], en: ['Do not transfer any money', 'The caller is asking for an urgent money transfer.'] },
    approval: { ar: ['لا توافق على الطلب', 'المتصل يطلب موافقتك على إجراء لم تبدأه.'], en: ['Do not approve the request', 'The caller wants you to approve something you did not start.'] },
    remote: { ar: ['لا تثبّت أي تطبيق', 'المتصل يطلب تثبيت برنامج للتحكم بجهازك.'], en: ['Do not install any app', 'The caller wants you to install a remote-control app.'] },
  };

  /**
   * فحص عبارة مكتملة من المتصل مع سياقها القريب.
   * @param {string} text العبارة الحالية
   * @param {string[]} context آخر عبارتين أو ثلاث (تُحذف بعد إنهاء المكالمة)
   * @returns {{alerts: Array<{type,title,reason,step}>}}
   */
  function analyzeUtterance(text, context, lang) {
    lang = lang === 'en' ? 'en' : 'ar';
    const n = norm(text);
    const ctxText = norm((context || []).join(' . '));
    const segs = segments(n);
    const ctxHasObj = segments(ctxText).some((s) => hasOtpObj(s, tokens(s))) || segs.some((s) => hasOtpObj(s, tokens(s)));
    const uttProtective = segs.some((s) => isProtective(s, tokens(s)));
    const found = new Set();
    if (detectRelay(n) || (ctxHasObj && detectRelay(ctxText + ' . ' + n) && RELAY_ACT.test(n))) found.add('otp'); // «بيوصلك OTP، طرشه حقي على الواتساب»
    for (const seg of segs) {
      const tk = tokens(seg);
      if (detectOtp(seg, tk, ctxHasObj, uttProtective)) found.add('otp');
      if (detectTransfer(seg, tk, n, ctxText)) found.add('transfer');
      const ap = detectApproval(seg, tk, n, ctxText);
      if (ap) found.add(ap);
    }
    for (const pt of PATTERNS) {
      if (pt.channel && !['call', 'any'].includes(pt.channel)) continue;
      if (pt.phrases.some((ph) => phraseHit(n, ph))) { found.add('reported'); found.reportedBy = pt; }
    }
    let mlP = null;
    if (ML) { try { mlP = ML(text); } catch { mlP = null; } }
    if (mlP !== null && mlP >= ML_TH && found.size === 0 && !uttProtective && ML_SENSITIVE.test(n) && mlHasRequest(n)) found.add('ml');
    const entity = findEntity(n) || findEntity(ctxText);
    const rep_ = found.has('reported') && found.size > 1 ? found.reportedBy : null;
    if (rep_) found.delete('reported'); // دمج تحذير الجهة مع التنبيه الأساسي في بطاقة واحدة
    const alerts = [...found].map((type) => {
      if (type === 'reported') {
        const pt = found.reportedBy, org = pt.org[lang] || pt.org.ar, tl = pt.title[lang] || pt.title.ar;
        return { type, title: lang === 'en' ? 'Known scam pattern' : 'أسلوب احتيال معروف', reason: lang === 'en' ? `${org} warned about this: “${tl}”.` : `حذّرت ${org} من هذا الأسلوب: «${tl}».`, step: callStep(entity, lang), pattern: pt.id };
      }
      if (type === 'ml') {
        const pc = Math.round(mlP * 100);
        return { type, kind: mlKind(n), title: lang === 'en' ? 'This sounds like a scam' : 'كلام يشبه أساليب الاحتيال', reason: lang === 'en' ? `HISN's learning model found it ${pc}% similar to scam tactics it has learned.` : `وجد نموذج التعلّم في «حِصن» تشابهًا بنسبة ${pc}٪ مع أساليب احتيال تعلّمها.`, step: callStep(entity, lang), ml: mlP };
      }
      const [title, reason] = CALL_TEXT[type][lang];
      const extra = rep_ ? (lang === 'en' ? ` ${rep_.org.en || rep_.org.ar} has warned about this method.` : ` وقد حذّرت ${rep_.org.ar} من هذا الأسلوب.`) : '';
      return { type, title, reason: reason + extra, step: callStep(entity, lang), pattern: rep_ ? rep_.id : undefined };
    });
    // شرح خطوات معالجة اللغة الطبيعية (للعرض)
    const cues = [];
    for (const seg of segs) for (const tk of tokens(seg)) {
      let tag = null;
      if (inSet(NEG, tk)) tag = 'neg';
      else if (inSet(OTP_OBJ, tk) || /^(ال)?(رمز|كود)/.test(tk)) tag = 'obj';
      else if (inSet(REQ, tk) || inSet(PAY_STRONG, tk) || inSet(PAY_WEAK, tk) || inSet(APPROVE, tk) || INSTALL.test(tk)) tag = 'req';
      else if (inSet(MONEY, tk) || REMOTE_APP.test(tk)) tag = 'obj';
      else if (URGENT.test(tk)) tag = 'urgent';
      else if (inSet(QWORD, tk)) tag = 'req';
      if (tag && cues.length < 8 && !cues.some((c) => c.w === tk)) cues.push({ w: tk, tag });
    }
    const nlp = { ml: mlP === null ? null : Math.round(mlP * 100), tokens: tokens(n).length, segments: segs.length, cues, intents: alerts.map((x) => x.type), protective: uttProtective, entity: entity ? entity[lang] : null, context: (context || []).length };
    return { alerts, nlp };
  }

  /* ------------------------------------------------------------------ *
   * 6) فحص الرسائل والروابط (من دون زيارة أي موقع)
   * ------------------------------------------------------------------ */
  const KNOWN_TLD = new Set(('com net org ae gov edu info biz io co me app xyz top click shop live icu buzz online site store link ly gd at cc tk ml ga cf gq ru cn uk sa qa kw om bh eg jo us in pro vip win support services help club cfd sbs rest bond lat today world net.ae abudhabi dubai page dev cloud tech').split(' '));
  const RISKY_TLD = new Set(('xyz top click shop live icu buzz online site store tk ml ga cf gq cfd sbs rest bond lat vip win support help club today').split(' '));
  const SHORTENERS = new Set(('bit.ly tinyurl.com t.co cutt.ly is.gd rb.gy shorturl.at ow.ly t.ly s.id tiny.cc rebrand.ly goo.gl bitly.com lnkd.in').split(' '));
  const URL_RE = /((?:https?:\/\/)?(?:[^\s/@:]+(?::[^\s/@]*)?@)?(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,24}|xn--[a-z0-9-]+)|\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:[/?#][^\s<>"'،]*)?)/gi;

  function extractUrls(raw) {
    const out = [];
    const text = String(raw || '');
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) {
      let s = m[1].replace(/[.,;:!?)\]}>،؛]+$/, '');
      const hasScheme = /^https?:\/\//i.test(s);
      let u;
      try { u = new URL(hasScheme ? s : 'http://' + s); } catch (e) { continue; }
      const host = u.hostname.toLowerCase().replace(/\.$/, '');
      const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
      const tld = host.split('.').pop();
      if (!hasScheme && !isIp && !/^www\./i.test(s) && !KNOWN_TLD.has(tld) && !tld.startsWith('xn--')) continue;
      if (/^[^@]*@[^.]+$/.test(s)) continue; // بريد إلكتروني ناقص
      out.push({ raw: s, host, scheme: hasScheme ? u.protocol.replace(':', '') : null, isIp, tld, hasAt: /^(https?:\/\/)?[^/]*@/.test(s), port: u.port });
    }
    // استبعد عناوين البريد الإلكتروني (name@domain.com) من الروابط
    return out.filter((x) => !new RegExp('[\\w.+-]+@' + x.host.replace(/\./g, '\\.') + '(\\s|$)', 'i').test(text) || x.scheme);
  }
  function registrable(host) {
    const p = host.split('.');
    if (p.length <= 2) return host;
    const sld = p[p.length - 2];
    if (p[p.length - 1].length === 2 && ['gov', 'co', 'com', 'ac', 'net', 'org', 'sch', 'mil'].includes(sld)) return p.slice(-3).join('.');
    return p.slice(-2).join('.');
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function officialEntityOf(host) {
    return ENTITIES.find((e) => e.domains.some((d) => host === d || host.endsWith('.' + d))) || null;
  }
  function lookalikeEntityOf(host) {
    const flat = host.replace(/[-.]/g, '');
    for (const e of ENTITIES) {
      if (e.brand.some((b) => flat.includes(b))) return e;
      const label = registrable(host).split('.')[0];
      for (const d of e.domains) {
        const ol = d.split('.')[0];
        if (ol.length >= 5 && label !== ol && lev(label, ol) <= 2) return e;
      }
    }
    return null;
  }
  // انتحال عبر النطاق الفرعي: nakhlabank.ae.verify-login.top
  function subdomainEntityOf(host) {
    const reg = registrable(host);
    for (const e of ENTITIES) for (const d of e.domains) {
      if (host !== d && !host.endsWith('.' + d) && (host.startsWith(d + '.') || host.includes('.' + d + '.')) && reg !== d) return { e, d };
      const lbl = d.split('.')[0];
      if (lbl.length >= 5 && reg.split('.')[0] !== lbl && host.split('.').slice(0, -2).includes(lbl)) return { e, d };
    }
    return null;
  }
  // استبدال الحروف بأرقام أو حروف شبيهة: nakh1abank ، adp0lice ، rn بدل m
  const SWAP = [[/0/g, 'o'], [/1/g, 'l'], [/3/g, 'e'], [/4/g, 'a'], [/5/g, 's'], [/rn/g, 'm'], [/vv/g, 'w'], [/[!|]/g, 'l']];
  function swapEntityOf(host) {
    const label = registrable(host).split('.')[0];
    if (!/[0-9!|]|rn|vv/.test(label)) return null;
    let n = label; for (const [re, r] of SWAP) n = n.replace(re, r);
    const alt = n.replace(/l/g, 'i');
    for (const e of ENTITIES) for (const d of e.domains) {
      const ol = d.split('.')[0];
      if (n !== label && (n === ol || alt === ol.replace(/l/g, 'i'))) return { e, d, label };
    }
    return null;
  }
  const PHISH_KW = /(login|log-in|signin|verify|verification|update|secure|account|unlock|confirm|otp|wallet|payment|pay|refund|support|reactivat)/i;
  // المرسل: رقم هاتف شخصي يدّعي أنه جهة رسمية
  function senderClaim(from, n) {
    const f = String(from || '').replace(/[\s-]/g, '');
    if (!/^\+?\d{8,}$/.test(f)) return null;
    const mobile = /^(\+?971|00971|0)?5\d{8}$/.test(f) || /^\+(?!971)\d{9,}$/.test(f);
    const ent = mentionedEntities(n)[0];
    return mobile && ent ? ent : null;
  }
  function mentionedEntities(n) {
    return ENTITIES.filter((e) => e.names.some((x) => n.includes(norm(x))));
  }

  const iso = (h) => '\u2068' + h + '\u2069'; // عزل اتجاه أسماء النطاقات داخل النص العربي
  const R = {
    mismatch: { ar: (e, h) => `الرسالة تذكر ${e} لكن الرابط يقود إلى نطاق مختلف (${iso(h)}).`, en: (e, h) => `The message mentions ${e} but the link goes to a different domain (${iso(h)}).` },
    lookalike: { ar: (e, h) => `اسم الموقع يشبه ${e} لكنه ليس نطاقها الرسمي (${iso(h)}).`, en: (e, h) => `The site name imitates ${e} but is not its official domain (${iso(h)}).` },
    ip: { ar: () => 'الرابط رقم عنوان (IP) بدل اسم موقع معروف.', en: () => 'The link uses a raw IP address instead of a known site name.' },
    puny: { ar: () => 'اسم الموقع يستخدم أحرفًا مشابهة لخداع العين.', en: () => 'The site name uses look-alike characters.' },
    at: { ar: () => 'الرابط يحتوي رمز @ يخفي وجهته الحقيقية.', en: () => 'The link contains an @ that hides its real destination.' },
    short: { ar: () => 'الرابط مختصر ويخفي وجهته الحقيقية.', en: () => 'The link is shortened and hides its real destination.' },
    tld: { ar: (t) => `امتداد الموقع (.${t}) شائع في روابط الاحتيال.`, en: (t) => `The domain ending (.${t}) is common in scam links.` },
    http: { ar: () => 'الرابط غير مشفّر (http).', en: () => 'The link is not encrypted (http).' },
    otp: { ar: () => 'الرسالة تطلب مشاركة رمز تحقق.', en: () => 'The message asks you to share a verification code.' },
    ml: { ar: (pc) => `نموذج التعلّم في «حِصن» وجد تشابهًا بنسبة ${pc}٪ مع رسائل احتيال تعلّمها.`, en: (pc) => `HISN's learning model found it ${pc}% similar to scam messages it has learned.` },
    cred: { ar: () => 'الرسالة تطلب إدخال بيانات بطاقتك أو حسابك.', en: () => 'The message asks for your card or account details.' },
    fee: { ar: (u) => u ? 'الرسالة تطلب دفع رسوم بشكل عاجل.' : 'الرسالة تطلب دفع رسوم أو مبلغ.', en: (u) => u ? 'The message demands an urgent payment.' : 'The message asks you to pay a fee or amount.' },
    urgent: { ar: () => 'الرسالة تضغط عليك بمهلة قصيرة أو بتهديد بإيقاف الخدمة.', en: () => 'The message pressures you with a deadline or a suspension threat.' },
    prize: { ar: () => 'الرسالة تعدك بجائزة أو مبلغ لم تطلبه.', en: () => 'The message promises a prize or money you did not ask for.' },
    lure: { ar: () => 'عرض مغرٍ جدًا (وظيفة أو أرباح) يدعوك للانضمام عبر رابط.', en: () => 'A too-good-to-be-true offer (job or profits) inviting you to join through a link.' },
    reported: { ar: (o, tl) => `حذّرت ${o} من هذه الممارسة: «${tl}».`, en: (o, tl) => `${o} has warned about this practice: “${tl}”.` },
    predicted: { ar: (o, h) => `الرابط يطابق نطاقًا توقّع الدرع أن يستخدمه المحتالون لانتحال ${o} (${iso(h)}).`, en: (o, h) => `The link matches a domain the Shield predicted scammers would use to imitate ${o} (${iso(h)}).` },
    subdomain: { ar: (e, h) => `اسم ${e} موضوع في بداية الرابط للتمويه، لكن الموقع الحقيقي مختلف (${iso(h)}).`, en: (e, h) => `${e}'s name is placed at the start of the link as a disguise, but the real site is different (${iso(h)}).` },
    swap: { ar: (e, h) => `اسم الموقع يستبدل حروفًا بأرقام أو حروف شبيهة ليبدو مثل ${e} (${iso(h)}).`, en: (e, h) => `The site name swaps letters for look-alike numbers or letters to resemble ${e} (${iso(h)}).` },
    kw: { ar: () => 'الرابط يحتوي كلمات تصيّد شائعة مثل login أو verify أو update.', en: () => 'The link contains common phishing words such as login, verify or update.' },
    sender: { ar: (e) => `الرسالة تدّعي أنها من ${e} لكنها مرسلة من رقم هاتف شخصي، والجهات الرسمية ترسل باسمها المعتمد.`, en: (e) => `The message claims to be from ${e} but comes from a personal phone number; official senders use their registered name.` },
    official: { ar: (e) => `الرابط يعود إلى النطاق الرسمي لـ${e}.`, en: (e) => `The link belongs to the official domain of ${e}.` },
    none: { ar: () => 'لم تظهر مؤشرات كافية للحكم على الرسالة.', en: () => 'There are not enough signs to judge this message.' },
  };

  const FEE = /(رسوم|ادفع|دفع|سداد|سدد|غرامه|مخالفه|\bfee|\bpay|payment|fine\b)/;
  const URGENT_MSG = /(خلال|فورا|عاجل|الان|اليوم|24|48|ساعه|سيتم|ايقاف|تعليق|توقيف|اغلاق|اخر فرصه|تنتهي|urgent|immediately|within|suspend|expire|last chance|today|blocked|locked)/;
  const CRED = /(بيانات\s*(ال)?بطاق|رقم\s*(ال)?بطاق|cvv|cvc|كلمه\s*(ال)?(مرور|سر)|الرقم السري|تحديث\s*(ال)?بيانات|حدث بياناتك|card (number|details)|update your (details|info|account)|verify your (account|identity)|login details|password)/;
  const PRIZE = /(ربحت|فزت|جايزه|جائزه|مبروك|سحب|won\b|winner|prize|congratulations|reward|gift card)/;
  const LURE = /(وظيف|وظائف|رواتب|راتب|دخل يومي|ربح يومي|ارباح|استثمار|مضمون|عمل من المنزل|job|salary|salaries|investment|profit|earn|work from home)/;
  const GROUP = /(مجموعه|قروب|جروب|group|join|انضم|انضمام)/;
  const DELIVERY = /(شحن|شحنه|شحنتك|طرد|طردك|توصيل|البريد|parcel|package|delivery|shipment|courier)/;
  const MSG_OTP_REQ =/(شارك|ارسل|ادخل|رد|اعد ارسال|ابعث|share|send|reply|enter|forward)/;

  function analyzeMessage(text, lang, from) {
    lang = lang === 'en' ? 'en' : 'ar';
    const n = norm(text);
    const reasons = []; // {key, sev, txt}
    const add = (key, sev, ...args) => { if (!reasons.some((r) => r.key === key)) reasons.push({ key, sev, txt: R[key][lang](...args) }); };
    const urls = extractUrls(text);
    const mentioned = mentionedEntities(n);
    let officialOf = null;

    for (const u of urls) {
      const off = officialEntityOf(u.host);
      if (off) {
        officialOf = off;
        const other = mentioned.find((e) => e.id !== off.id);
        if (other && !mentioned.some((e) => e.id === off.id)) add('mismatch', 3, other[lang], u.host);
        if (u.hasAt) add('at', 3);
        continue;
      }
      if (u.isIp) add('ip', 3);
      if (u.host.split('.').some((l) => l.startsWith('xn--'))) add('puny', 3);
      if (u.hasAt) add('at', 3);
      if (SHORTENERS.has(u.host) || SHORTENERS.has(registrable(u.host))) add('short', 2);
      const sub = subdomainEntityOf(u.host); if (sub) add('subdomain', 3, sub.e[lang], u.host);
      const sw = swapEntityOf(u.host); if (sw) add('swap', 3, sw.e[lang], u.host);
      if (PHISH_KW.test(u.raw.replace(/^https?:\/\//, ''))) add('kw', 1);
      const look = lookalikeEntityOf(u.host);
      const ment = mentioned[0];
      if (ment) add('mismatch', 3, ment[lang], u.host);
      else if (look) add('lookalike', 3, look[lang], u.host);
      if (RISKY_TLD.has(u.tld)) add('tld', 1, u.tld);
      if (u.scheme === 'http') add('http', 1);
    }

    const snd = senderClaim(from, n); if (snd) add('sender', 2, snd[lang]);
    // محتوى الرسالة
    const segs = segments(n);
    const otpReq = segs.some((s) => {
      const tk = tokens(s);
      if (!hasOtpObj(s, tk) || isProtective(s, tk)) return false;
      return tk.some((t, i) => (inSet(REQ, t) || MSG_OTP_REQ.test(t)) && !negatedAt(tk, i));
    });
    if (otpReq || detectRelay(n)) add('otp', 3);
    const urgent = URGENT_MSG.test(n);
    if (CRED.test(n) && !segs.every((s) => isProtective(s, tokens(s)))) add('cred', 3);
    const fee = FEE.test(n) && !segs.every((s) => isProtective(s, tokens(s)));
    if (fee) add('fee', urls.length && !officialOf ? 3 : 2, urgent);
    if (urgent && (fee || otpReq || reasons.length)) add('urgent', 2);
    if (PRIZE.test(n)) add('prize', 2);
    if (LURE.test(n) && urls.length && (GROUP.test(n) || urls.some((u) => /whatsapp|wa\.me|t\.me|telegram/.test(u.host)))) add('lure', urls.some((u) => !officialEntityOf(u.host) || officialEntityOf(u.host).id === 'whatsapp') ? 3 : 2);
    // ممارسات نشرتها الجهات (طرف ثالث موثوق)
    let reportedBy = null;
    for (const pt of PATTERNS) {
      const org = pt.org[lang] || pt.org.ar;
      const hitDomain = urls.find((u) => pt.domains.some((d) => u.host === d || u.host.endsWith('.' + d)));
      const hitPred = !hitDomain && urls.find((u) => (pt.predicted || []).some((d) => u.host === d || u.host.endsWith('.' + d)));
      const hitPhrase = pt.phrases.some((ph) => ph && phraseHit(n, ph));
      if (hitDomain || hitPhrase) { add('reported', 3, org, pt.title[lang] || pt.title.ar); reportedBy = pt; }
      else if (hitPred) { add('predicted', 3, org, hitPred.host); reportedBy = pt; }
    }

    let mlP = null;
    if (ML) { try { mlP = ML(text); } catch { mlP = null; } }
    if (mlP !== null && mlP >= ML_TH && ML_SENSITIVE.test(n) && mlHasRequest(n) && !reasons.some((r) => r.sev >= 3)) add('ml', 3, Math.round(mlP * 100));
    const risky = reasons.filter((r) => r.key !== 'official');
    const score = risky.reduce((a, r) => a + r.sev, 0);
    const danger = risky.some((r) => r.sev >= 3) || score >= 4;
    const ent = officialOf || mentioned[0] || lookalikeEntityOf((urls[0] || {}).host || '') || null;

    let title, level;
    if (danger) {
      level = 'danger';
      const has = (k) => risky.some((r) => r.key === k);
      if (has('lure') && urls.length) title = lang === 'en' ? 'Do not join this group' : 'لا تنضم لهذه المجموعة';
      else if (has('otp')) title = lang === 'en' ? 'Do not share the code' : 'لا تشارك الرمز';
      else if (has('cred')) title = lang === 'en' ? 'Do not enter your details' : 'لا تُدخل بياناتك';
      else if (has('fee') && urls.length) title = lang === 'en' ? 'Do not pay through this link' : 'لا تدفع عبر هذا الرابط';
      else if (urls.length) title = lang === 'en' ? 'Do not open the link' : 'لا تفتح الرابط';
      else if (reportedBy && /transfer|safe-account/.test(reportedBy.id || '')) title = lang === 'en' ? 'Do not transfer any money' : 'لا تحوّل أي مبلغ';
      else if (reportedBy && /remote/.test(reportedBy.id || '')) title = lang === 'en' ? 'Do not give anyone access to your phone' : 'لا تعطِ أحدًا صلاحية الدخول لهاتفك';
      else if (reportedBy && /otp-share/.test(reportedBy.id || '')) title = lang === 'en' ? 'Do not share the code or the message' : 'لا تشارك الرمز ولا الرسالة';
      else if (has('ml')) { const k = mlKind(n); title = k === 'otp' ? (lang === 'en' ? 'Do not share the code' : 'لا تشارك الرمز') : k === 'remote' ? (lang === 'en' ? 'Do not give anyone access to your phone' : 'لا تعطِ أحدًا صلاحية الدخول لهاتفك') : k === 'approval' ? (lang === 'en' ? 'Do not approve the request' : 'لا توافق على الطلب') : (lang === 'en' ? 'Do not transfer any money' : 'لا تحوّل أي مبلغ'); }
      else title = lang === 'en' ? 'Do not respond to this message' : 'لا تتجاوب مع الرسالة';
    } else {
      level = 'verify';
      title = lang === 'en' ? 'Verify the request through the official channel' : 'تحقّق من الطلب عبر القناة الرسمية';
      if (!risky.length) {
        if (officialOf) reasons.push({ key: 'official', sev: 0, txt: R.official[lang](officialOf[lang]) });
        else reasons.push({ key: 'none', sev: 0, txt: R.none[lang]() });
      }
    }
    const delivery = DELIVERY.test(n) || (ent && ['emiratespost', 'aramex'].includes(ent.id));
    let step;
    if (delivery) step = ent
      ? (lang === 'en' ? `Check the shipment in the official ${ent.en} app (${iso(ent.domains[0])}).` : `تحقّق من الشحنة عبر تطبيق ${ent.ar} الرسمي (${iso(ent.domains[0])}).`)
      : (lang === 'en' ? 'Check the shipment in the delivery company\'s official app.' : 'تحقّق من الشحنة عبر تطبيق شركة التوصيل الرسمي.');
    else step = ent
      ? (lang === 'en' ? `Check the request in the official ${ent.en} app or website (${iso(ent.domains[0])}) — not through the link in the message.`
                       : `تحقّق من الطلب عبر تطبيق ${ent.ar} أو موقعها الرسمي (${iso(ent.domains[0])}) وليس عبر الرابط في الرسالة.`)
      : (lang === 'en' ? 'Check the request directly with the organisation through its official app or number.'
                       : 'تحقّق من الطلب مباشرة مع الجهة عبر تطبيقها أو رقمها الرسمي.');
    reasons.sort((a, b) => b.sev - a.sev);

    // ربط الجهة + الطلب + القناة في جملة واحدة يفهمها المستخدم بسرعة
    const has = (k) => risky.some((r) => r.key === k);
    const domainIssue = has('mismatch') || has('lookalike');
    const hiddenIssue = has('ip') || has('puny') || has('at') || has('short');
    const ask = has('otp') ? 'otp' : has('cred') ? 'cred' : has('fee') ? 'fee' : null;
    const entName = ent ? ent[lang] : null;
    let askTxt = '', linkTxt = '';
    if (lang === 'en') {
      if (ask === 'fee') askTxt = delivery ? 'The message asks you to pay a delivery fee' : 'The message asks you to pay money';
      if (ask === 'otp') askTxt = 'The message asks you to share a verification code';
      if (ask === 'cred') askTxt = 'The message asks for your card or account details';
      if (askTxt && urgent) askTxt += ' urgently';
      if (domainIssue) linkTxt = `the link leads to a domain that differs from the official domain of ${entName || 'the company'}`;
      else if (hiddenIssue) linkTxt = 'the link hides its real destination';
    } else {
      if (ask === 'fee') askTxt = delivery ? 'الرسالة تطلب دفع رسوم توصيل' : 'الرسالة تطلب دفع مبلغ';
      if (ask === 'otp') askTxt = 'الرسالة تطلب مشاركة رمز تحقق';
      if (ask === 'cred') askTxt = 'الرسالة تطلب بيانات بطاقتك أو حسابك';
      if (askTxt && urgent) askTxt += ' بشكل عاجل';
      if (domainIssue) linkTxt = `الرابط يقود إلى نطاق يختلف عن النطاق الرسمي ${entName ? 'لـ' + entName : 'للشركة'}`;
      else if (hiddenIssue) linkTxt = 'الرابط يخفي وجهته الحقيقية';
    }
    let summary;
    if (has('lure')) askTxt = lang === 'en' ? 'The message lures you with a too-good offer to join a group' : 'الرسالة تغريك بعرض مغرٍ للانضمام إلى مجموعة';
    if (askTxt && linkTxt) summary = lang === 'en' ? `${askTxt}, and ${linkTxt}.` : `${askTxt}، و${linkTxt}.`;
    else if (askTxt) summary = askTxt + '.';
    else if (linkTxt) summary = (lang === 'en' ? linkTxt[0].toUpperCase() + linkTxt.slice(1) : linkTxt) + '.';
    else if (has('lure')) summary = R.lure[lang]();
    else summary = reasons[0].txt;

    const rep_ = risky.find((r) => r.key === 'reported' || r.key === 'predicted');
    if (rep_ && !summary.includes(rep_.txt)) summary = rep_.txt + ' ' + summary;
    const sev3 = risky.filter((r) => r.sev >= 3).length;
    const risk = !danger ? 'low' : ((ask && (domainIssue || hiddenIssue)) || sev3 >= 2 ? 'high' : 'medium');
    const kind = has('lure') || urls.some((u) => /whatsapp|wa\.me/.test(u.host)) ? 'whatsapp' : ask === 'otp' ? 'otp' : 'payment';
    const consequence = kind === 'whatsapp' ? (lang === 'en' ? 'Joining may let scammers take over your WhatsApp account.' : 'الانضمام قد يمكّن المحتالين من سرقة حسابك في واتساب.') : lang === 'en'
      ? (ask === 'otp' ? 'A scammer could use the code to get into your account.' : (ask === 'cred' || ask === 'fee') ? 'This site may ask for your card details.' : 'This site may try to steal your details.')
      : (ask === 'otp' ? 'قد يستخدم المحتال الرمز للدخول إلى حسابك.' : (ask === 'cred' || ask === 'fee') ? 'قد يطلب هذا الموقع بيانات بطاقتك.' : 'قد يحاول هذا الموقع سرقة بياناتك.');

    const matchedPattern = reportedBy ? reportedBy.id : null;
    return { ml: mlP === null ? null : Math.round(mlP * 100), kind, matchedPattern, level, risk, title, summary, consequence, reasons: reasons.map((r) => r.txt), step, urls: urls.map((u) => u.host), links: urls.map((u) => u.raw) };
  }

  /* ------------------------------------------------------------------ *
   * 7) ممارسات تنشرها الجهات + التنبؤ بالنطاقات المنتحلة
   * ------------------------------------------------------------------ */
  let PATTERNS = [];
  // طبقة التعلّم الآلي (شبكة عصبية من learn.js): تُعطي احتمال أن النص احتيالي، وتلتقط صياغات جديدة
  let ML = null; const ML_TH = 0.9;
  function setMl(fn) { ML = typeof fn === 'function' ? fn : null; }
  // بوابة أمان: لا ينبّه النموذج وحده إلا إذا ذكر النص شيئًا حساسًا (رمز، مال، حساب، بيانات، رابط، تطبيق، صلاحية…)
  const ML_SENSITIVE = /(رمز|كود|otp|او ?تي ?بي|(^|\s)(ال)?ارقام|رقم\s*(ال)?سري|كلمه\s*(ال)?(مرور|سر)|باسورد|بطاق|مبلغ|فلوس|درهم|حساب|رصيد|تحويل|(^|\s)حول|ادفع|سدد|رسوم|غرام|كفال|تطبيق|برنامج|صلاحي|اكسس|تحكم|الشاشه|anydesk|وافق|موافق|اشعار|uae ?pass|الهويه|بيانات|رابط|لينك|(^|\s)(code|otp|pin|password|card|money|transfer|pay|fee|access|install|app|approve|link|details|account)(\s|$))/;
  // النموذج لا ينبّه وحده إلا على «طلب» (أرسل، حوّل، ثبّت، وافق، ادفع…) وليس على وصف أو ادعاء
  function mlHasRequest(n) {
    const tk = tokens(n); RELAY_ACT.lastIndex = 0;
    return tk.some((t) => inSet(REQ, t) || inSet(PAY_STRONG, t) || inSet(PAY_WEAK, t) || inSet(APPROVE, t) || INSTALL.test(t) || inSet(DO_VERB, t)) || RELAY_ACT.test(n)
      || /(^|\s)(ابيك|ابغاك|نبيك|نبغاك|ابيج|ممكن|لو سمحت|بليز|فعل|تفعل|فعله|شغل|تشغل|اكد|تاكد|اكدلي|تاكدلي|قيد|تقيد|خلص|تخلص|تراها لنا|please|can you|could you|you need to|you must|activate|verify|confirm)(\s|$)/.test(n);
  }
  function mlKind(n) { return /(رمز|كود|otp|او ?تي ?بي|ارقام|سري|code|pin|password)/.test(n) ? 'otp' : /(تطبيق|برنامج|صلاحي|اكسس|تحكم|شاشه|anydesk|install|access)/.test(n) ? 'remote' : /(وافق|موافق|اشعار|uae ?pass|approve)/.test(n) ? 'approval' : 'transfer'; }
  // عبارة من ممارسات الجهات: تُحتسب فقط إذا لم يسبقها نفي قريب («لا ترسل الرمز…» تحذير وليس طلبًا)
  const NEG_BEFORE = /(^|\s)(لا|لن|ما|مو|ليس|لم|ابدا|never|not|dont|don't|do not)(\s+\S+){0,2}\s*$/;
  function phraseHit(n, ph) {
    const p = norm(ph); if (!p) return false;
    for (let i = n.indexOf(p); i >= 0; i = n.indexOf(p, i + 1)) if (!NEG_BEFORE.test(n.slice(Math.max(0, i - 30), i))) return true;
    return false;
  }
  function setPatterns(list) {
    PATTERNS = (list || []).map((p) => ({
      ...p,
      domains: (p.domains || []).map((d) => String(d).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()).filter(Boolean),
      phrases: (p.phrases || []).map((x) => String(x).trim()).filter((x) => x.length >= 4),
      org: typeof p.org === 'string' ? { ar: p.org, en: p.org } : p.org,
      title: typeof p.title === 'string' ? { ar: p.title, en: p.title } : p.title,
    }));
  }
  // يولّد نطاقات محتملة قد يستخدمها المحتالون لانتحال نطاق رسمي (أخطاء إملائية، إضافات، امتدادات)
  function predictDomains(official) {
    const d = String(official || '').toLowerCase().replace(/^www\./, '');
    const base = d.split('.')[0]; if (!base || base.length < 3) return [];
    const out = new Set();
    const tlds = ['com', 'net', 'info', 'top', 'xyz', 'online', 'site', 'ae-pay.com', 'click', 'live'];
    const words = ['pay', 'secure', 'update', 'verify', 'login', 'support', 'track', 'ae', 'uae', 'online'];
    for (const w of words) { out.add(`${base}-${w}.com`); out.add(`${w}-${base}.com`); out.add(`${base}${w}.com`); }
    for (const t of tlds) if (`${base}.${t}` !== d) out.add(`${base}.${t}`);
    for (let i = 0; i < base.length; i++) { // حذف حرف / تكرار حرف
      out.add(base.slice(0, i) + base.slice(i + 1) + '.com');
      out.add(base.slice(0, i) + base[i] + base.slice(i) + '.com');
    }
    const swaps = { o: '0', i: '1', l: '1', e: '3', a: '4', s: '5' };
    for (const [a, b] of Object.entries(swaps)) if (base.includes(a)) out.add(base.replace(a, b) + '.com');
    out.delete(d);
    return [...out].slice(0, 60);
  }

  // تقرير مفصّل لفحص كل رابط (لعرض «كيف كُشف الرابط» للمحكّمين)
  function linkReport(text, lang) {
    lang = lang === 'en' ? 'en' : 'ar';
    const n = norm(text), mentioned = mentionedEntities(n);
    return extractUrls(text).map((u) => {
      const off = officialEntityOf(u.host), look = off ? null : lookalikeEntityOf(u.host);
      const label = registrable(u.host).split('.')[0];
      let dist = null, near = null;
      if (look) for (const d of look.domains) { const ol = d.split('.')[0]; const k = lev(label, ol); if (dist === null || k < dist) { dist = k; near = d; } }
      const brandIn = look && look.brand.some((b) => u.host.replace(/[-.]/g, '').includes(b));
      const ment = mentioned.find((e) => !off || e.id !== off.id);
      let reported = null, predicted = null;
      for (const pt of PATTERNS) {
        if (pt.domains.some((d) => u.host === d || u.host.endsWith('.' + d))) reported = pt.org[lang] || pt.org.ar;
        else if ((pt.predicted || []).some((d) => u.host === d || u.host.endsWith('.' + d))) predicted = pt.org[lang] || pt.org.ar;
      }
      const c = (id, hit, detail) => ({ id, hit: !!hit, detail: detail || '' });
      return { host: u.host, official: off ? off[lang] : null, checks: [
        c('official', !off, off ? off[lang] : ''),
        c('mismatch', ment && !off, ment ? ment[lang] : ''),
        c('subdomain', !!subdomainEntityOf(u.host), (subdomainEntityOf(u.host) || {}).d || ''),
        c('swap', !!swapEntityOf(u.host), swapEntityOf(u.host) ? swapEntityOf(u.host).d : ''),
        c('lookalike', !!look, look ? (brandIn ? `brand:${look[lang]}` : `lev:${dist}:${near}`) : ''),
        c('puny', u.host.split('.').some((l) => l.startsWith('xn--'))),
        c('ip', u.isIp), c('at', u.hasAt),
        c('short', SHORTENERS.has(u.host) || SHORTENERS.has(registrable(u.host))),
        c('tld', !off && RISKY_TLD.has(u.tld), u.tld),
        c('http', u.scheme === 'http'),
        c('kw', PHISH_KW.test(u.raw.replace(/^https?:\/\//, '')), ((u.raw.match(PHISH_KW) || [])[0] || '').toLowerCase()),
        c('intel', reported || predicted, reported ? `reported:${reported}` : predicted ? `predicted:${predicted}` : ''),
      ] };
    });
  }

  return { setMl, analyzeMessage, analyzeUtterance, extractUrls, linkReport, senderClaim: (f, t) => { const e = senderClaim(f, norm(t || '')); return e ? e : null; }, norm, ENTITIES, setPatterns, predictDomains, getPatterns: () => PATTERNS };
});
