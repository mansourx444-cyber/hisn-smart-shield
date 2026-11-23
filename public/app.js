/* الدرع الذكي — واجهة الجوال
 * الأدوار: هاتف المستخدم (المحمي) — والهاتف الثاني (مرسل/متصل تجريبي)
 * لا يُحفظ أي نص رسالة أو مكالمة: الرسائل الواردة في الذاكرة فقط وتختفي بإغلاق الصفحة.
 */
(() => {
  'use strict';
  const E = window.ShieldEngine;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ds.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ds.' + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem('ds.' + k); } catch {} },
  };
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const platform = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'other';

  /* ------------------------------ النصوص ------------------------------ */
  const T = {
    ar: {
      appName: 'حِصن', tagline: 'الدرع الذكي ضد الاحتيال — مساعدك الشخصي للوقاية من الاحتيال الإلكتروني', langBtn: 'English',
      activate: 'فعّل الحماية', optLinks: 'فحص الروابط عند فتحها', optLinksDesc: 'قبل أن يفتح أي رابط عبر متصفح الدرع، يفحصه ويشرح سبب الاشتباه.',
      msgsAndroid: 'في الديمو: الرسائل التجريبية من الهاتف الثاني. في تطبيق أندرويد: نص الإشعارات بعد منح صلاحية الوصول إليها.',
      msgsIos: 'في الديمو: الرسائل التجريبية من الهاتف الثاني. في تطبيق آيفون: فلتر رسائل SMS وMMS من المرسلين المجهولين (لا يشمل iMessage).',
      msgsOther: 'الرسائل التجريبية الواردة من الهاتف الثاني.',
      optMsgs: 'فحص الرسائل المدعومة عند وصولها', optCalls: 'التنبيه أثناء المكالمات داخل التطبيق', optCallsDesc: 'يحلّل كلام المتصل لحظيًا وينبّهك والمكالمة مستمرة.',
      optAssist: 'رأي المساعد الذكي', optAssistDesc: 'يرسل نص الرسالة لنموذج ذكاء اصطناعي ليشرح الخطر بلغة بسيطة، من دون حفظه.',
      decideNote: 'الدرع ينبّه، وأنت تقرر. تقدر توقف أي خيار من الإعدادات.',
      useAsSender: 'استخدم هذا الهاتف كمرسل ومتصل تجريبي (للعرض)',
      idTitle: 'الدخول بالهوية الرقمية', idDesc: 'تحقّق من هويتك مرة واحدة لتفعيل الحماية. لا نطلب كلمة مرور ولا نحتفظ بوثائقك.', idLogin: 'الدخول بالهوية الرقمية (محاكاة)',
      idWaiting: 'تم إرسال طلب إلى تطبيق الهوية الرقمية في هاتفك… وافق عليه', idOk: '✓ تم التحقق من هويتك — مستخدم تجريبي',
      privacy: '🔒 الدرع الذكي لا يطّلع على ملفاتك الخاصة، وليس برنامج تجسس أو تتبع. دوره التصدي لمحاولات الاحتيال وحمايتك وحماية بياناتك، سواء وصلت عبر الروابط أو المكالمات أو الرسائل النصية أو البريد الإلكتروني أو وسائل التواصل الاجتماعي ومجموعات واتساب.',
      techTitle: '🧠 كيف يعمل حِصن؟ التقنيات في كل مرحلة', tech: [["🪪", "الدخول والتفعيل", "الهوية الرقمية (محاكاة): تحقق من الهوية مرة واحدة بلا كلمات مرور."], ["🔗", "الرسائل والروابط", "تحليل الروابط والنطاقات، ومقارنتها بالنطاق الرسمي للجهة، وكشف التشابه الإملائي بخوارزمية مسافة التحرير (Levenshtein)، والأحرف المضللة (Punycode)، والروابط المختصرة وعناوين IP."], ["🧠", "معالجة اللغة الطبيعية (NLP)", "تطبيع النص العربي واللهجة المحلية، وتقسيم العبارات، وتحليل النية (طلب رمز، دفع، موافقة، تثبيت برنامج)، وفهم النفي والسياق («عطني الرمز» ≠ «لا تشارك الرمز»)، واستخراج الجهة المنتحلة."], ["🎙️", "المكالمات", "نقل الصوت لحظيًا (WebRTC)، ثم التعرف على الكلام وتحويله إلى نص (ASR / Speech-to-Text) بنموذج لحظي، ثم تحليل كل جملة مكتملة مع سياقها بالـNLP، وتنبيه خلال ثوانٍ والمكالمة مستمرة."], ["🤖", "المساعد الذكي (LLM)", "نموذج لغوي كبير يعطي رأيًا ثانيًا ويشرح الخطر بلغة بسيطة."], ["🏛️", "استخبارات الجهات والتنبؤ", "الجهات الموثقة تنشر ممارسات الاحتيال، وحِصن يولّد النطاقات التي قد تُستخدم لانتحالها ويراقبها، ويحدّث كل الأجهزة لحظيًا."], ["🔊", "نطق النتيجة", "تحويل النص إلى كلام (TTS) لمن يفضّل الاستماع."], ["🔒", "الخصوصية", "التحليل لحظي، ولا يُحفظ الصوت ولا نص الرسائل والمكالمات."]],
      guardOn: '✓ تم تفعيل حِصن للحماية من الاحتيال', guardSub: 'حِصن يعمل تلقائيًا في الخلفية ويفحص الرسائل والروابط والمكالمات وواتساب، ولا تحتاج لفعل أي شيء. سينبّهك فقط عند الخطر.', guardOff: 'الحماية موقوفة', guardOffSub: 'شغّل خيارًا واحدًا على الأقل من الإعدادات.',
      stMsgs: 'رسائل وروابط فُحصت', stThreats: 'تهديدات صدّها حِصن', stCalls: 'مكالمات محمية', recent: 'آخر ما فحصه حِصن', offBtn: '⏻ تعطيل حِصن', offConfirm: 'اضغط مرة أخرى لتأكيد التعطيل', activated: 'تم تفعيل حِصن للحماية من الاحتيال',
      whatIf: '⚠️ ماذا لو تجاهلت التحذير؟ (محاكاة توعوية)', patternTitle: (o) => `تحديث الحماية من ${o}`,
      protOn: 'الحماية مفعّلة', protOff: 'الحماية موقوفة — شغّل خيارًا من الإعدادات', chipLinks: 'الروابط', chipMsgs: 'الرسائل', chipCalls: 'المكالمات', chipAssist: 'المساعد الذكي',
      check: 'تحقّق', pairCode: 'رمز ربط الهاتف التجريبي', inbox: 'الرسائل الواردة', inboxEmpty: 'لا رسائل بعد. أرسل رسالة تجريبية من الهاتف الثاني.',
      settings: 'الإعدادات', deactivate: 'إيقاف الحماية بالكامل', sysNotif: 'السماح بإشعارات الهاتف', notifOn: 'إشعارات الهاتف مفعّلة', notifBlocked: 'الإشعارات محجوبة من إعدادات المتصفح',
      back: 'رجوع', pasteTitle: 'تحقّق من رسالة أو رابط', pasteLabel: 'الصق الرسالة أو الرابط', scan: 'افحص', trySample: 'جرّب رسالة تجريبية',
      openViaShield: 'افتح الرابط عبر متصفح الدرع', listen: 'اسمع النتيجة', newCheck: 'فحص جديد', warning: 'تحذير', guidance: 'إرشاد',
      badgeDanger: '⛔ مشبوهة', badgeOk: '✓ فُحصت — لا مؤشرات واضحة', badgeOff: 'لم تُفحص (الفحص موقوف)', suspiciousLink: 'رابط مشبوه', suspiciousMsg: 'رسالة مشبوهة',
      details: 'التفاصيل', assistSays: 'رأي المساعد: ', goBack: 'رجوع', proceed: 'متابعة', finalConfirm: 'تأكيد أخير', openAnyway: 'فتح الرابط رغم التحذير',
      linkOk: 'فحص الدرع الرابط ولم يرصد مؤشرات خطر واضحة.', shieldBrowser: 'متصفح الدرع',
      incoming: 'مكالمة واردة', analyzedNotice: 'المكالمات التجريبية داخل التطبيق تُحلَّل لحظيًا.', accept: 'ردّ', decline: 'رفض',
      callerNotice: 'هذه مكالمة تجريبية يحلّلها «حِصن» لحظيًا.', endCall: 'إنهاء المكالمة', tapAudio: 'اضغط لتشغيل الصوت', continue: 'متابعة المكالمة',
      peerUser: 'المستخدم', peerCaller: 'متصل', connecting: 'جارٍ الاتصال…', ringing: 'يرن…',
      stActive: '🛡️ المكالمة تُحلَّل لحظيًا', stDemo: '🛡️ تُحلَّل لحظيًا — وضع العرض (عبارات تمثيلية)', stConnecting: '⏳ جارٍ تشغيل الفحص…', stPaused: '⚠️ الفحص متوقف', stOffSetting: 'الفحص أثناء المكالمات موقوف من الإعدادات',
      heard: 'آخر ما سمعه الدرع: ', caller: 'المتصل', you: 'أنت (مريم)', aiLine: '🎙️ الصوت ← 📝 تحويل الكلام إلى نص (ASR) ← 🧠 معالجة اللغة الطبيعية (NLP) ← 🛡️ تنبيه', refuse: 'لا مشكور، ما بعطي أي معلومات. بتواصل مع الجهة بنفسي على رقمها الرسمي.', demoTools: 'أدوات العرض', demoHint: 'أرسل عبارة تمثيلية كأن المتصل قالها (مفيد بدون مفتاح خدمة التفريغ).', simOutage: 'محاكاة انقطاع خدمة التحليل',
      latencyLog: 'سجل زمن التنبيه', latSpeech: (ms) => `من نهاية العبارة إلى ظهور البطاقة: ${(ms / 1000).toFixed(1)} ث`, latEngine: (ms) => `زمن المعالجة في الخادم: ${ms} ملث`,
      callEnded: 'انتهت المكالمة', declined: 'رفض المستخدم المكالمة', offline: 'هاتف المستخدم غير متصل — افتح التطبيق عليه', busy: 'المستخدم في مكالمة',
      iceFail: 'تعذّر وصل الصوت بين الهاتفين. جرّب شبكة Wi‑Fi واحدة أو أضف خادم TURN.', micDenied: 'لا يمكن بدء المكالمة بدون إذن الميكروفون.',
      senderTitle: 'الهاتف التجريبي الثاني', enterPair: 'رمز ربط هاتف المستخدم', paired: '✓ مرتبط بهاتف المستخدم', pairedOff: 'الرمز صحيح لكن هاتف المستخدم غير مفتوح الآن', badCode: 'الرمز غير صحيح',
      sendSms: 'إرسال رسالة تجريبية', senderName: 'اسم المرسل', smsText: 'نص الرسالة', send: 'أرسل', sent: '✓ وصلت إلى هاتف المستخدم', notDelivered: 'لم تصل — هاتف المستخدم غير متصل',
      callUser: 'مكالمة داخل التطبيق', callNow: 'اتصل بالمستخدم', needPair: 'أدخل رمز الربط أولًا',
      sample: 'بريد الإمارات: شحنتك معلّقة لعدم دفع رسوم التوصيل 7.50 درهم. ادفع خلال 24 ساعة حتى لا تُعاد الشحنة: https://emiratespost-ae.example/pay',
    },
    en: {
      appName: 'HISN', tagline: 'The smart anti-fraud shield — your personal assistant against online fraud', langBtn: 'العربية',
      activate: 'Turn on protection', optLinks: 'Check links when opened', optLinksDesc: 'Before a link opens in the Shield browser, it is checked and the reason for suspicion explained.',
      msgsAndroid: 'In the demo: test messages from the second phone. In the Android app: notification text after you grant notification access.',
      msgsIos: 'In the demo: test messages from the second phone. In the iPhone app: an SMS/MMS filter for unknown senders (iMessage is not covered).',
      msgsOther: 'Test messages from the second phone.',
      optMsgs: 'Check supported messages on arrival', optCalls: 'Alert during in-app calls', optCallsDesc: 'Analyses what the caller says in real time and alerts you while the call continues.',
      optAssist: 'AI assistant opinion', optAssistDesc: 'Sends the message text to an AI model to explain the risk in plain words, without storing it.',
      decideNote: 'The Shield warns — you decide. You can turn off any option in Settings.',
      useAsSender: 'Use this phone as the test sender / caller (demo)',
      idTitle: 'Sign in with digital identity', idDesc: 'Verify your identity once to turn on protection. No password, no documents stored.', idLogin: 'Sign in with digital identity (simulation)',
      idWaiting: 'A request was sent to the digital identity app on your phone… approve it', idOk: '✓ Identity verified — demo user',
      privacy: '🔒 Smart Shield cannot see your private files and is not spyware or a tracker. It stands between you and fraud attempts and protects your data — whether they come by link, phone call, text message, email, social media or WhatsApp groups.',
      techTitle: '🧠 How HISN works — technology at each stage', tech: [["🪪", "Sign-in & activation", "Digital identity (simulation): verify once, no passwords."], ["🔗", "Messages & links", "URL and domain analysis against the official domain, look-alike detection with edit distance (Levenshtein), deceptive characters (Punycode), shorteners and raw IPs."], ["🧠", "Natural language processing (NLP)", "Arabic & dialect normalisation, clause splitting, intent analysis (code, payment, approval, app install), negation and context understanding (“give me the code” ≠ “don’t share the code”), and impersonated-entity extraction."], ["🎙️", "Calls", "Live audio over WebRTC → speech recognition (ASR / speech-to-text) with a real-time model → NLP on every complete sentence with its context → alert within seconds while the call continues."], ["🤖", "AI assistant (LLM)", "A large language model gives a second opinion and explains the risk in plain words."], ["🏛️", "Institution intelligence & prediction", "Verified institutions publish scam practices; HISN generates and watches likely impersonation domains and updates every device instantly."], ["🔊", "Read-aloud", "Text-to-speech (TTS) for those who prefer to listen."], ["🔒", "Privacy", "Analysis is real-time; no audio or message/call text is stored."]],
      guardOn: '✓ HISN anti-fraud protection is on', guardSub: 'HISN works automatically in the background, checking messages, links, calls and WhatsApp. You don’t need to do anything — it only alerts you when there is danger.', guardOff: 'Protection is paused', guardOffSub: 'Turn on at least one option in Settings.',
      stMsgs: 'Messages & links checked', stThreats: 'Threats stopped', stCalls: 'Calls protected', recent: 'Recently checked by HISN', offBtn: '⏻ Turn off HISN', offConfirm: 'Tap again to confirm', activated: 'HISN anti-fraud protection is on',
      whatIf: '⚠️ What if you ignore the warning? (awareness simulation)', patternTitle: (o) => `Protection update from ${o}`,
      protOn: 'Protection is on', protOff: 'Protection is off — enable an option in Settings', chipLinks: 'Links', chipMsgs: 'Messages', chipCalls: 'Calls', chipAssist: 'AI assistant',
      check: 'Check', pairCode: 'Test-phone pairing code', inbox: 'Incoming messages', inboxEmpty: 'No messages yet. Send a test message from the second phone.',
      settings: 'Settings', deactivate: 'Turn off protection completely', sysNotif: 'Allow phone notifications', notifOn: 'Phone notifications are on', notifBlocked: 'Notifications are blocked in browser settings',
      back: 'Back', pasteTitle: 'Check a message or link', pasteLabel: 'Paste the message or link', scan: 'Check', trySample: 'Try a sample message',
      openViaShield: 'Open the link in the Shield browser', listen: 'Hear the result', newCheck: 'New check', warning: 'Warning', guidance: 'Guidance',
      badgeDanger: '⛔ Suspicious', badgeOk: '✓ Checked — no clear signs', badgeOff: 'Not checked (scanning off)', suspiciousLink: 'Suspicious link', suspiciousMsg: 'Suspicious message',
      details: 'Details', assistSays: 'Assistant: ', goBack: 'Go back', proceed: 'Continue', finalConfirm: 'Final confirmation', openAnyway: 'Open the link despite the warning',
      linkOk: 'The Shield checked the link and found no clear signs of risk.', shieldBrowser: 'Shield browser',
      incoming: 'Incoming call', analyzedNotice: 'Test calls inside the app are analysed in real time.', accept: 'Answer', decline: 'Decline',
      callerNotice: 'This is a test call analysed in real time by Smart Shield.', endCall: 'End call', tapAudio: 'Tap to enable sound', continue: 'Continue call',
      peerUser: 'User', peerCaller: 'Caller', connecting: 'Connecting…', ringing: 'Ringing…',
      stActive: '🛡️ This call is analysed in real time', stDemo: '🛡️ Analysed in real time — demo mode (sample phrases)', stConnecting: '⏳ Starting analysis…', stPaused: '⚠️ Analysis stopped', stOffSetting: 'Call analysis is off in Settings',
      heard: 'Last heard: ', caller: 'Caller', you: 'You', aiLine: '🎙️ Voice → 📝 Speech-to-text (ASR) → 🧠 Natural language processing (NLP) → 🛡️ Alert', refuse: 'No thank you, I will not share anything. I will contact them myself on the official number.', demoTools: 'Demo tools', demoHint: 'Send a sample phrase as if the caller said it (useful without a transcription key).', simOutage: 'Simulate analysis outage',
      latencyLog: 'Alert latency log', latSpeech: (ms) => `End of phrase to card: ${(ms / 1000).toFixed(1)} s`, latEngine: (ms) => `Server processing: ${ms} ms`,
      callEnded: 'Call ended', declined: 'The user declined the call', offline: 'The user phone is offline — open the app on it', busy: 'The user is in a call',
      iceFail: 'Audio could not connect between the phones. Try one Wi‑Fi network or add a TURN server.', micDenied: 'The call cannot start without microphone permission.',
      senderTitle: 'Second test phone', enterPair: 'User phone pairing code', paired: '✓ Paired with the user phone', pairedOff: 'Code is valid but the user phone is not open now', badCode: 'Wrong code',
      sendSms: 'Send a test message', senderName: 'Sender name', smsText: 'Message text', send: 'Send', sent: '✓ Delivered to the user phone', notDelivered: 'Not delivered — the user phone is offline',
      callUser: 'In-app call', callNow: 'Call the user', needPair: 'Enter the pairing code first',
      sample: 'Emirates Post: your parcel is on hold because the 7.50 AED delivery fee is unpaid. Pay within 24 hours: https://emiratespost-ae.example/pay',
    },
  };
  const PRESETS = {
    ar: [
      ['رسالة توصيل مشبوهة', 'EmiratesPost', 'بريد الإمارات: شحنتك معلّقة لعدم دفع رسوم التوصيل 7.50 درهم. ادفع خلال 24 ساعة حتى لا تُعاد الشحنة: https://emiratespost-ae.example/pay'],
      ['رسالة سليمة', 'أحمد', 'هلا، وصلت البيت. نتقابل بكرة الساعة 5 في المقهى؟'],
      ['رمز بنكي حقيقي (تحذيري)', 'ADCB', 'رمز التحقق لعملية الدخول هو 482913. لا تشاركه مع أي أحد، البنك لن يطلبه منك أبدًا.'],
      ['طلب رمز مع جائزة', '+971500000000', 'مبروك! ربحت جائزة 10,000 درهم. أرسل لنا رمز التحقق الذي وصلك لتأكيد الاستلام.'],
    ],
    en: [
      ['Suspicious delivery message', 'EmiratesPost', 'Emirates Post: your parcel is on hold because the 7.50 AED delivery fee is unpaid. Pay within 24 hours: https://emiratespost-ae.example/pay'],
      ['Normal message', 'Ahmed', 'Hi, I got home. Shall we meet tomorrow at 5 at the café?'],
      ['Real bank code (warning)', 'ADCB', 'Your login verification code is 482913. Do not share it with anyone; the bank will never ask for it.'],
      ['Prize + code request', '+971500000000', 'Congratulations! You won 10,000 AED. Send us the verification code you received to confirm.'],
    ],
  };
  const PHRASES = {
    ar: ['السلام عليكم، معك فهد من خدمة العملاء، شلونك اليوم؟', 'للأمان، لا تشارك رمز التحقق مع أي أحد.', 'أنا من البنك، عطنا رمز التحقق عشان نوقف العملية.', 'لازم تحوّل المبلغ لحساب آمن الحين وإلا بيتجمد حسابك.', 'بيوصلك إشعار على الجوال، اضغط موافق بسرعة.'],
    en: ['Hello, this is Fahad from customer service, how are you today?', 'For your safety, never share your verification code with anyone.', 'I am calling from the bank, give me the verification code so we can stop the transaction.', 'You need to transfer the money to a safe account now or your account will be frozen.', 'You will get a notification on your phone, just tap approve quickly.'],
  };

  /* ------------------------------ الحالة ------------------------------ */
  let lang = store.get('lang', 'ar'); // العربية افتراضيًا في كل الأجهزة
  let settings = store.get('settings', null); // {links,msgs,calls,assist} — null = غير مفعّل
  let cfg = { stt: false, assist: false, ice: [{ urls: 'stun:stun.l.google.com:19302' }] };
  let mode = 'user'; // user | sender
  let code = store.get('pair', null); // رمز غرفة هاتف المستخدم
  let senderCode = store.get('senderPair', '');
  let es = null; // EventSource
  const inbox = []; // في الذاكرة فقط
  const hooks = {}; // يربط وضع «آيفون» بالتطبيق
  const t = (k, ...a) => { const v = T[lang][k]; return typeof v === 'function' ? v(...a) : v; };

  /* ------------------------------ التنقل والترجمة ------------------------------ */
  function show(name) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
    window.scrollTo(0, 0);
    if (hooks.show) hooks.show(name);
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('appName');
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    const tl = $('#techList'); if (tl) { tl.textContent = ''; for (const [ic, h, d] of t('tech')) { const r = document.createElement('div'); r.className = 'tech-row'; r.innerHTML = '<span class="tech-ic"></span><div><b></b><small></small></div>'; r.querySelector('.tech-ic').textContent = ic; r.querySelector('b').textContent = h; r.querySelector('small').textContent = d; tl.appendChild(r); } }
    $('#langBtn').textContent = t('langBtn');
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#msgsDesc').textContent = t(platform === 'android' ? 'msgsAndroid' : platform === 'ios' ? 'msgsIos' : 'msgsOther');
    renderPresets(); renderPhrases(); renderHome(); renderSettings(); renderIdentity();
    if (currentResult) renderResult();
    if (callState.active) renderPill();
    if (hooks.lang) hooks.lang(lang);
  }
  function setLang(l) {
    lang = l; store.set('lang', l); applyLang();
    if (mode === 'user' && code) post('/api/lang', { room: code, lang });
  }

  /* ------------------------------ التفعيل والإعدادات ------------------------------ */
  const OPTS = ['links', 'msgs', 'calls', 'assist'];
  function readOpts(root) { const o = {}; OPTS.forEach((k) => { const el = root.querySelector(`[data-opt="${k}"]`); o[k] = !!(el && el.checked && !el.closest('[hidden]')); }); return o; }
  function renderIdentity() {
    const id = store.get('identity', null);
    $('#idCard').classList.toggle('ok', !!id);
    $('#idState').textContent = id ? t('idOk') : '';
    $('#btnIdLogin').hidden = !!id;
    $('#btnActivate').disabled = !id;
  }
  function idLogin() {
    $('#btnIdLogin').disabled = true;
    $('#idState').innerHTML = '<span class="spin"></span>';
    $('#idState').append(t('idWaiting'));
    setTimeout(() => { store.set('identity', { verifiedAt: Date.now(), name: 'demo' }); $('#btnIdLogin').disabled = false; renderIdentity(); }, 2200);
  }
  async function activate() {
    if (!store.get('identity', null)) return;
    settings = readOpts($('#optList'));
    store.set('settings', settings);
    if ('Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch {} }
    registerSW();
    mode = 'user';
    await connectUser();
    renderHome(); renderSettings(); show('home');
    toast(t('appName'), t('activated'), null, null, true);
  }
  function renderHome() {
    if (!settings) return;
    const on = OPTS.filter((k) => settings[k] && (k !== 'assist' || cfg.assist));
    $('#guard').classList.toggle('off', !on.length);
    $('#guardTitle').textContent = on.length ? t('guardOn') : t('guardOff');
    $('#guardSub').textContent = on.length ? t('guardSub') : t('guardOffSub');
    const st = store.get('stats', { msgs: 0, threats: 0, calls: 0 });
    $('#stMsgs').textContent = st.msgs; $('#stThreats').textContent = st.threats; $('#stCalls').textContent = st.calls;
    $('#btnDeactivate').textContent = t('offBtn'); $('#btnDeactivate').classList.remove('confirm');
    const chips = $('#statusChips'); chips.textContent = '';
    on.forEach((k) => { const s = document.createElement('span'); s.textContent = t('chip' + k[0].toUpperCase() + k.slice(1)); chips.appendChild(s); });
    $('#pairCode').textContent = code || '----';
    renderInbox();
  }
  function renderSettings() {
    const host = $('#setList'); if (!host || !settings) return;
    host.textContent = '';
    const rows = [['links', 'optLinks'], ['msgs', 'optMsgs'], ['calls', 'optCalls']];
    if (cfg.assist) rows.push(['assist', 'optAssist']);
    for (const [k, label] of rows) {
      const l = document.createElement('label'); l.className = 'opt';
      const i = document.createElement('input'); i.type = 'checkbox'; i.checked = !!settings[k];
      i.addEventListener('change', () => { settings[k] = i.checked; store.set('settings', settings); renderHome(); });
      const s = document.createElement('span'); const b = document.createElement('b'); b.textContent = t(label); s.appendChild(b);
      l.append(i, s); host.appendChild(l);
    }
    if ('Notification' in window) {
      const p = Notification.permission;
      const b = document.createElement('button'); b.type = 'button'; b.className = p === 'default' ? 'btn-secondary' : 'btn-ghost';
      b.textContent = p === 'granted' ? t('notifOn') : p === 'denied' ? t('notifBlocked') : t('sysNotif');
      b.disabled = p !== 'default';
      b.addEventListener('click', async () => { await Notification.requestPermission(); renderSettings(); });
      host.appendChild(b);
    }
  }

  function bump(k) { const st = store.get('stats', { msgs: 0, threats: 0, calls: 0 }); st[k] = (st[k] || 0) + 1; store.set('stats', st); if (settings) renderHome(); }

  /* ------------------------------ اتصال هاتف المستخدم ------------------------------ */
  async function ensureRoom(force) {
    if (code && !force) return code;
    const r = await post('/api/room', { lang }).then((x) => x.json());
    code = r.code; store.set('pair', code); renderHome();
    return code;
  }
  async function connectUser() {
    await ensureRoom();
    openStream('user', code, {
      hello: () => { callState.serverOk = true; renderPill(); post('/api/lang', { room: code, lang }); }, // مزامنة لغة التحليل مع لغة الهاتف
      sms: onSms, ring: onRing, say: onSay,
      pattern: (d) => { const list = E.getPatterns().filter((x) => x.id !== d.pattern.id); E.setPatterns([d.pattern, ...list]); patternsChanged(d.pattern); },
      patterns: (d) => { E.setPatterns(d.patterns); patternsChanged(null); }, signal: onSignal, analysis: onAnalysis, alert: onAlert, heard: onHeard,
      callEnded: (d) => { endCallLocal(false, !!(d && d.scammed)); if (d && d.scammed && hooks.simulate) setTimeout(() => hooks.simulate(d.scammed, null), 600); },
      dead: async () => { await ensureRoom(true); connectUser(); },
    });
  }
  function openStream(role, room, handlers) {
    if (es) es.close();
    const src = new EventSource(`/api/events?room=${encodeURIComponent(room)}&role=${role}`);
    es = src;
    for (const [type, fn] of Object.entries(handlers)) if (type !== 'dead' && type !== 'error') src.addEventListener(type, (e) => { try { fn(JSON.parse(e.data || '{}')); } catch (err) { console.error(err); } });
    src.onerror = () => {
      if (callState.active) { callState.serverOk = false; renderPill(); }
      if (src.readyState === EventSource.CLOSED) {
        // الغرفة غير موجودة (أُعيد تشغيل الخادم مثلًا)
        fetch(`/api/room?code=${encodeURIComponent(room)}`).then((r) => {
          if (r.status === 404) { if (handlers.error) handlers.error(); else if (handlers.dead) handlers.dead(); }
          else { setTimeout(() => openStream(role, room, handlers), 2000); }
        }).catch(() => setTimeout(() => openStream(role, room, handlers), 3000));
      }
    };
    src.onopen = () => { if (callState.active) { callState.serverOk = true; renderPill(); } };
    return src;
  }

  function patternsChanged(p) {
    inbox.forEach((it) => { it.v = null; });
    renderInbox(); if (currentResult) renderResult();
    if (p && settings) {
      const org = p.org[lang] || p.org.ar, title = p.title[lang] || p.title.ar;
      if (hooks.pattern) hooks.pattern(p, t('patternTitle', org), title);
      else toast(t('patternTitle', org), title, null, null, true);
    }
  }
  async function loadPatterns() {
    try { const r = await fetch('/api/patterns').then((x) => x.json()); E.setPatterns(r.patterns || []); } catch {}
  }

  /* ------------------------------ الرسائل الواردة ------------------------------ */
  function verdictOf(item) {
    item.v = item.v || {};
    if (!item.v[lang]) item.v[lang] = E.analyzeMessage(item.text, lang, item.from);
    return item.v[lang];
  }
  function onSms(m) {
    const item = { ...m, scanned: !!(settings && settings.msgs) };
    inbox.unshift(item); if (inbox.length > 30) inbox.pop();
    renderInbox();
    if (hooks.sms) hooks.sms(item);
    if (!item.scanned) return;
    bump('msgs');
    const v = verdictOf(item);
    if (v.matchedPattern) post('/api/hit', { id: v.matchedPattern });
    if (v.level === 'danger') { bump('threats'); notifyDanger(item); }
    if (settings.assist && cfg.assist) askAssist(item.text).then((a) => {
      if (!a) return;
      item.assist = a;
      if (a.risk === 'high' && v.level !== 'danger') { item.assistUpgrade = true; notifyDanger(item); }
      renderInbox(); if (currentResult && currentResult.item === item) renderResult();
    });
  }
  function isDanger(item) { return item.scanned && (verdictOf(item).level === 'danger' || item.assistUpgrade); }
  function headline(item) { const v = verdictOf(item); return v.links.length ? t('suspiciousLink') : (v.level === 'danger' ? v.title : t('suspiciousMsg')); }
  function whyOf(item) { const v = verdictOf(item); return v.level === 'danger' ? v.summary : (item.assist && item.assist.why) || v.summary; }

  function linkify(container, text, ctx) {
    const v = E.extractUrls(text);
    let rest = text;
    for (const u of v) {
      const i = rest.indexOf(u.raw); if (i < 0) continue;
      container.appendChild(document.createTextNode(rest.slice(0, i)));
      const a = document.createElement('a'); a.href = '#'; a.textContent = u.raw;
      a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openLink(u.raw, ctx); });
      container.appendChild(a);
      rest = rest.slice(i + u.raw.length);
    }
    container.appendChild(document.createTextNode(rest));
  }
  function renderInbox() {
    const ul = $('#inbox'); if (!ul) return;
    ul.textContent = '';
    $('#inboxEmpty').hidden = inbox.length > 0;
    for (const item of inbox) {
      const li = document.createElement('li'); li.className = 'msg' + (isDanger(item) ? ' danger' : '');
      li.tabIndex = 0; li.setAttribute('role', 'button');
      const meta = document.createElement('div'); meta.className = 'meta';
      const f = document.createElement('b'); f.textContent = item.from; f.dir = 'auto';
      const tm = document.createElement('span'); tm.textContent = new Date(item.at).toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
      meta.append(f, tm);
      const body = document.createElement('div'); body.className = 'body'; body.dir = 'auto'; linkify(body, item.text, item.text);
      const badge = document.createElement('span');
      if (!item.scanned) { badge.className = 'badge off'; badge.textContent = t('badgeOff'); }
      else if (isDanger(item)) { badge.className = 'badge danger'; badge.textContent = '⛔ ' + headline(item); }
      else { badge.className = 'badge ok'; badge.textContent = t('badgeOk'); }
      li.append(meta, body, badge);
      const open = () => { if (item.scanned) showResult(verdictOf(item), { item, text: item.text }); };
      li.addEventListener('click', open);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      ul.appendChild(li);
    }
  }

  /* ------------------------------ التنبيه التلقائي ------------------------------ */
  function notifyDanger(item) {
    const title = t('appName') + ': ' + headline(item);
    const body = whyOf(item);
    vibrate([180, 80, 180]);
    if (hooks.notify) { hooks.notify(item, headline(item), body); return; }
    toast(title, body, t('details'), () => showResult(verdictOf(item), { item, text: item.text }));
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker && navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, { body, tag: item.id, data: { id: item.id }, icon: 'icon.svg', badge: 'icon.svg', requireInteraction: true, lang, dir: lang === 'ar' ? 'rtl' : 'ltr' })).catch(() => {});
    }
  }
  let toastTimer = null;
  function toast(title, body, action, onAction, ok) {
    const host = $('#toastHost'); host.textContent = '';
    const d = document.createElement('div'); d.className = 'toast' + (ok ? ' ok' : ''); d.setAttribute('role', ok ? 'status' : 'alert');
    const img = document.createElement('img'); img.src = 'icon.svg'; img.width = 32; img.height = 32; img.alt = '';
    const txt = document.createElement('div');
    const a = document.createElement('div'); a.className = 't-title'; a.textContent = title;
    const b = document.createElement('div'); b.className = 't-body'; b.textContent = body || '';
    txt.append(a, b); d.append(img, txt);
    if (action) { const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-secondary'; btn.style.minHeight = '40px'; btn.textContent = action; btn.addEventListener('click', () => { host.textContent = ''; onAction(); }); d.appendChild(btn); }
    host.appendChild(d);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (host.contains(d)) host.textContent = ''; }, ok ? 3500 : 12000);
  }
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  /* ------------------------------ الفحص اليدوي والنتيجة ------------------------------ */
  let currentResult = null;
  function showResult(v, ctx) { currentResult = { v, ...ctx }; renderResult(); show('result'); if (ctx && !ctx.item && settings && settings.assist && cfg.assist) { const cr = currentResult; askAssist(ctx.text).then((a) => { if (a && currentResult === cr) { cr.assist = a; renderResult(); } }); } }
  function renderResult() {
    const cr = currentResult; if (!cr) return;
    const v = cr.item ? verdictOf(cr.item) : (cr.v = E.analyzeMessage(cr.text, lang));
    const assist = cr.item ? cr.item.assist : cr.assist;
    const upgraded = v.level !== 'danger' && assist && assist.risk === 'high';
    const danger = v.level === 'danger' || upgraded;
    const card = $('#resCard');
    card.className = 'result ' + (danger ? 'danger' : 'verify');
    card.querySelector('.tag-ico').textContent = danger ? '⛔' : 'ℹ️';
    card.querySelector('.tag-txt').textContent = danger ? t('warning') : t('guidance');
    card.querySelector('.res-title').textContent = upgraded ? t('suspiciousMsg') : v.title;
    card.querySelector('.res-reason').textContent = upgraded ? assist.why : (danger ? v.summary : v.reasons[0]);
    const more = card.querySelector('.res-more'); more.textContent = '';
    (danger ? v.reasons.slice(0, 3) : v.reasons.slice(1, 3)).forEach((r) => { const li = document.createElement('li'); li.textContent = r; more.appendChild(li); });
    const as = card.querySelector('.assist');
    as.hidden = !(assist && assist.why && !upgraded);
    if (!as.hidden) as.textContent = '🤖 ' + t('assistSays') + assist.why;
    card.querySelector('.res-step').textContent = v.step;
    $('#btnOpenLink').hidden = !v.links.length;
    $('#btnWhatIf').hidden = !(danger && hooks.simulate);
    cr.speech = [card.querySelector('.res-title').textContent, card.querySelector('.res-reason').textContent, v.step].join('. ');
  }
  async function askAssist(text) {
    try { const r = await post('/api/assist', { text, lang }).then((x) => x.json()); return r && r.available ? r : null; } catch { return null; }
  }

  /* ------------------------------ متصفح الدرع: تحذير على مرحلتين ------------------------------ */
  function openLink(raw, ctx) {
    const url = /^https?:\/\//i.test(raw) ? raw : 'http://' + raw;
    if (!settings || !settings.links) return realOpen(url);
    const text = ctx && ctx.includes(raw) ? ctx : ((ctx || '') + ' ' + raw).trim();
    const v = E.analyzeMessage(text, lang);
    if (v.level !== 'danger') { toast(t('shieldBrowser'), t('linkOk'), null, null, true); return realOpen(url); }
    let host = raw; try { host = new URL(url).hostname; } catch {}
    const ov = $('#linkWarn'), sheet = ov.querySelector('.sheet');
    const stage = (n) => {
      sheet.classList.toggle('high', n === 2);
      $('#lwAddr').textContent = host;
      $('#lwTag').textContent = n === 1 ? t('warning') : t('finalConfirm');
      $('#lwTitle').textContent = n === 1 ? t('suspiciousLink') : v.consequence;
      $('#lwWhy').textContent = n === 1 ? v.summary : '';
      $('#lwWhy').hidden = n === 2;
      const more = $('#lwMore'); more.textContent = '';
      if (n === 1) v.reasons.slice(0, 3).forEach((r) => { const li = document.createElement('li'); li.textContent = r; more.appendChild(li); });
      $('#lwSafe').textContent = v.step;
      const go = $('#lwGo');
      go.textContent = n === 1 ? t('proceed') : t('openAnyway');
      go.className = n === 1 ? 'btn-ghost' : 'btn-risky';
      go.onclick = () => {
        if (n === 1 && v.risk === 'high') return stage(2); // التأكيد الثاني للحالات عالية الخطورة فقط
        ov.hidden = true;
        if (hooks.openUrl) hooks.openUrl(url, { ...v, text }); else realOpen(url);
      };
      ov.hidden = false; $('#lwBack').focus();
    };
    $('#lwBack').onclick = () => { ov.hidden = true; };
    vibrate(120);
    stage(1);
  }
  function realOpen(url) { window.open(url, '_blank', 'noopener,noreferrer'); }

  /* ------------------------------ نطق النتيجة ------------------------------ */
  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ar' ? 'ar-SA' : 'en-US'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  /* ------------------------------ المكالمة (WebRTC) ------------------------------ */
  const callState = { active: false, role: null, pc: null, local: null, pending: [], timer: null, t0: 0, analysis: 'waiting', serverOk: true, audioFail: 0, room: null, cap: null, lastVoice: 0, latencies: [] };
  async function getMic() {
    callState.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  }
  function newPC() {
    const pc = new RTCPeerConnection({ iceServers: cfg.ice });
    callState.pc = pc; callState.pending = [];
    if (callState.local) callState.local.getTracks().forEach((tr) => pc.addTrack(tr, callState.local));
    else pc.addTransceiver('audio', { direction: 'recvonly' }); // استقبال فقط (وضع العرض بلا ميكروفون)
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal({ cand: e.candidate }); };
    pc.ontrack = (e) => onRemote(e.streams[0] || new MediaStream([e.track]));
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') { $('#callMsg').textContent = ''; startTimer(); }
      if (s === 'failed') $('#callMsg').textContent = t('iceFail');
    };
    return pc;
  }
  const sendSignal = (data) => post('/api/signal', { room: callState.room, role: callState.role === 'caller' ? 'caller' : 'user', data });
  async function onSignal(d) {
    const pc = callState.pc; if (!pc) return;
    try {
      if (d.sdp) {
        await pc.setRemoteDescription(d.sdp);
        if (d.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); sendSignal({ sdp: pc.localDescription }); }
        for (const c of callState.pending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
      } else if (d.cand) {
        if (pc.remoteDescription) await pc.addIceCandidate(d.cand).catch(() => {}); else callState.pending.push(d.cand);
      }
    } catch (e) { console.error('signal', e); }
  }
  function onRemote(stream) {
    const a = $('#remoteAudio'); a.srcObject = stream;
    a.play().then(() => { $('#btnTapAudio').hidden = true; }).catch(() => { $('#btnTapAudio').hidden = false; });
    if (callState.role === 'user' && cfg.stt && settings && settings.calls) startCapture(stream);
  }
  function startTimer() {
    if (callState.timer) return;
    callState.t0 = Date.now();
    callState.timer = setInterval(() => { const s = Math.floor((Date.now() - callState.t0) / 1000); $('#callTimer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 500);
  }
  function enterCallUI(role) {
    callState.active = true; callState.role = role; callState.analysis = 'waiting'; callState.serverOk = true; callState.audioFail = 0;
    if (window.ShieldTones) window.ShieldTones.ringStop();
    $('#ringBox').hidden = true; $('#callLive').hidden = false;
    $('#callerNotice').hidden = role !== 'caller';
    $('#demoTools').hidden = role !== 'caller';
    $('#latencyBox').hidden = role !== 'user' || !callState.latencies.length;
    $('#outageToggle').checked = false;
    $('#callMsg').textContent = t('connecting'); $('#callTimer').textContent = '00:00';
    const pr = callState.peer || {};
    $('#callPeer').textContent = role === 'caller' ? t('peerUser') : (pr.from || t('peerCaller'));
    $('#callPeerLabel').textContent = role === 'caller' ? '' : (pr.label || '');
    $('#transcript').textContent = ''; lastCallerLine = null;
    $('#aiLine').textContent = t('aiLine'); $('#aiLine').hidden = role !== 'user';
    renderPill(); show('call');
    if (role === 'user') bump('calls');
    if (hooks.call) hooks.call('active');
  }
  function onAnalysis(d) { callState.analysis = d.state; renderPill(); }
  function renderPill() {
    const p = $('#analysisPill'); if (!p) return;
    let st = callState.analysis;
    if (callState.active && (!callState.serverOk || callState.audioFail >= 3)) st = 'paused';
    if (callState.role === 'user' && settings && !settings.calls) { p.className = 'pill waiting'; p.textContent = t('stOffSetting'); return; }
    const map = { active: ['active', 'stActive'], demo: ['active', 'stDemo'], connecting: ['waiting', 'stConnecting'], idle: ['waiting', 'stConnecting'], waiting: ['waiting', 'stConnecting'], paused: ['paused', 'stPaused'] };
    const [cls, key] = map[st] || map.waiting;
    p.className = 'pill ' + cls; p.textContent = t(key);
  }
  function addTranscript(who, text, flag) {
    const box = $('#transcript');
    const d = document.createElement('div'); d.className = 'tl ' + who + (flag ? ' flag' : ''); d.dir = 'auto';
    d.innerHTML = '<small></small><span></span>';
    d.querySelector('small').textContent = who === 'v' ? t('you') : t('caller');
    d.querySelector('span').textContent = ((x) => String(x).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, ''))(text); // النص المعروض بلا تشكيل
    box.appendChild(d); box.scrollTop = box.scrollHeight;
    return d;
  }
  // التقنية المستخدمة في كل سطر من الحوار
  const TL = {
    ar: { asr: '🎙️ صوت حي ← تعرف على الكلام (ASR) ← معالجة اللغة (NLP)', typed: '⌨️ نص مكتوب ← معالجة اللغة (NLP)', clip: '🔊 صوت المتصل ← تحويل الكلام إلى نص (ASR) ← معالجة اللغة (NLP)', demo: '🔊 صوت المتصل ← تحويل الكلام إلى نص (ASR) ← معالجة اللغة (NLP)',
      intent: { otp: 'طلب رمز تحقق', transfer: 'طلب تحويل أموال', approval: 'طلب موافقة على إشعار', remote: 'طلب تثبيت برنامج تحكم', reported: 'أسلوب نشرته جهة' },
      int: (x) => `🎯 تصنيف النية: ${x} ← ⚠️ تنبيه`, prot: '🛡️ فهم السياق: نصيحة/نفي — ليست طلبا', none: '✓ لا يوجد طلب حساس — استمرار الفحص بصمت', ent: (e) => `🏷️ استخراج الكيانات (NER): يدعي ${e}`, ms: (m) => `⏱ ${m} ملث`,
      victim: '🔒 كلامك لا يرسل لـ«حصن» ولا يحلل — يحلل كلام المتصل فقط (خصوصية)' },
    en: { asr: '🎙️ Live voice → speech recognition (ASR) → NLP', typed: '⌨️ Typed text → NLP', clip: '🔊 Caller voice → speech-to-text (ASR) → NLP', demo: '🔊 Caller voice → speech-to-text (ASR) → NLP',
      intent: { otp: 'asks for a code', transfer: 'asks for a transfer', approval: 'asks to approve', remote: 'asks to install remote app', reported: 'reported practice' },
      int: (x) => `🎯 Intent: ${x} → ⚠️ alert`, prot: '🛡️ Context: advice/negation — not a request', none: '✓ No sensitive request — silent monitoring', ent: (e) => `🏷️ NER: claims to be ${e}`, ms: (m) => `⏱ ${m} ms`,
      victim: '🔒 Your words are not sent to HISN or analysed — only the caller is analysed (privacy)' },
  };
  function techLine(d) {
    const L = TL[lang] || TL.ar, n = d.nlp || {}, ints = n.intents || [];
    const res = ints.length ? L.int(ints.map((x) => L.intent[x] || x).join('، ')) : n.protective ? L.prot : L.none;
    return [L[d.source] || L.demo, n.entity ? L.ent(n.entity) : '', res + (d.ms != null ? '  ' + L.ms(Math.max(1, d.ms)) : '')].filter(Boolean);
  }
  function addTech(lineEl, parts, bad) {
    const w = document.createElement('div'); w.className = 'tl-tech' + (bad ? ' bad' : '');
    parts.forEach((p) => { const i = document.createElement('i'); i.textContent = p; w.appendChild(i); });
    lineEl.appendChild(w);
  }
  let lastCallerLine = null;
  function onHeard(d) {
    if (!settings || !settings.calls) return;
    lastCallerLine = addTranscript('c', d.text);
    addTech(lastCallerLine, techLine(d), ((d.nlp || {}).intents || []).length);
    $('#transcript').scrollTop = 1e6;
    if (hooks.nlp) hooks.nlp(d);
  }
  async function onSay(d) { // ردّ الضحية في الحوار الصوتي (للعرض)
    if (!callState.active) return;
    addTech(addTranscript('v', d.text), [(TL[lang] || TL.ar).victim]); $('#transcript').scrollTop = 1e6;
    await window.ShieldVoice.say(d.text, { lang, role: 'victim', clip: d.clip || null });
    post('/api/said', { room: callState.room, id: d.id });
  }
  async function refuseAndEnd() {
    $('#alertCard').hidden = true;
    if (callState.active && callState.role === 'user') {
      addTranscript('v', t('refuse'));
      let clip = null; try { const j = await fetch('/api/clips', { cache: 'no-store' }).then((r) => r.json()); clip = lang === 'ar' && j.clips['refuse:line:0'] ? j.clips['refuse:line:0'].url : null; } catch {}
      await window.ShieldVoice.say(t('refuse'), { lang, role: 'victim', clip });
    }
    endCallLocal(true);
  }
  function onAlert(a) {
    if (!callState.active || !settings || !settings.calls) return;
    if (lastCallerLine) lastCallerLine.classList.add('flag');
    bump('threats');
    $('#alTitle').textContent = a.title; $('#alReason').textContent = a.reason; $('#alStep').textContent = a.step;
    let lat = '';
    if (a.source === 'stt' && callState.lastVoice) { const ms = Math.round(performance.now() - callState.lastVoice); lat = t('latSpeech', ms); callState.latencies.push(ms); }
    else lat = t('latEngine', a.engineMs);
    $('#alLatency').textContent = lat;
    renderLatency();
    $('#alertCard').hidden = false; $('#alEnd').focus();
    $('#alertCard').dataset.speech = [a.title, a.reason, a.step].join('. ');
    $('#alertCard').dataset.kind = { otp: 'otp', transfer: 'transfer', approval: 'approval', remote: 'remote', reported: 'transfer' }[a.type] || 'otp';
    $('#alWhatIf').hidden = !hooks.simulate;
    vibrate([250, 100, 250, 100, 250]);
    if (hooks.alert) hooks.alert(a);
  }
  function renderLatency() {
    const ol = $('#latencyList'); ol.textContent = '';
    callState.latencies.forEach((ms) => { const li = document.createElement('li'); li.textContent = (ms / 1000).toFixed(2) + ' s'; ol.appendChild(li); });
    $('#latencyBox').hidden = callState.role !== 'user' || !callState.latencies.length;
  }

  // المستخدم: مكالمة واردة
  function onRing(d) {
    if (callState.active) return;
    callState.room = code; callState.role = 'user';
    $('#ringFrom').textContent = d.from || ''; $('#ringLabel').textContent = d.label || '';
    callState.peer = d;
    $('#callLive').hidden = true; $('#ringBox').hidden = false;
    $('#callerNotice').hidden = true; $('#demoTools').hidden = true; $('#latencyBox').hidden = true;
    show('call'); vibrate([400, 200, 400, 200, 400]);
    if (hooks.ring) hooks.ring(d); else if (window.ShieldTones) window.ShieldTones.ringStart();
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(t('incoming'), { body: t('appName'), tag: 'ring', icon: 'icon.svg' })).catch(() => {});
    }
  }
  async function acceptCall() {
    callState.local = null;
    if (!hooks.noMic) { try { await getMic(); } catch { callState.local = null; } } // المستخدم لا يحتاج الميكروفون ليُحمى
    unlockAudioCtx();
    enterCallUI('user');
    const pc = newPC();
    await post('/api/call', { room: code, action: 'accept' });
    await pc.setLocalDescription(await pc.createOffer({ offerToReceiveAudio: true }));
    sendSignal({ sdp: pc.localDescription });
  }
  function declineCall() { post('/api/call', { room: code, action: 'decline' }); if (hooks.call) hooks.call('declined'); show('home'); }

  // المتصل التجريبي
  async function ringUser() {
    if (!/^\d{4}$/.test(senderCode)) { $('#sCallState').textContent = t('needPair'); return; }
    try { await getMic(); } catch { $('#sCallState').textContent = t('micDenied'); return; }
    callState.room = senderCode; callState.role = 'caller';
    newPC();
    const r = await post('/api/call', { room: senderCode, action: 'ring', from: store.get('senderFrom', '') || '+971 50 123 4567' });
    if (r.status !== 200) { const j = await r.json().catch(() => ({})); $('#sCallState').textContent = t(j.error === 'busy' ? 'busy' : j.error === 'offline' ? 'offline' : 'badCode'); cleanupMedia(); return; }
    $('#sCallState').textContent = t('ringing');
  }
  function onAccepted() { enterCallUI('caller'); $('#sCallState').textContent = ''; }
  function onDeclined() { cleanupMedia(); $('#sCallState').textContent = t('declined'); }

  function cleanupMedia() {
    const cs = callState;
    if (cs.pc) { try { cs.pc.close(); } catch {} cs.pc = null; }
    if (cs.local) { cs.local.getTracks().forEach((tr) => tr.stop()); cs.local = null; }
    stopCapture();
    clearInterval(cs.timer); cs.timer = null;
    $('#remoteAudio').srcObject = null;
  }
  function endCallLocal(notify, quiet) {
    const wasActive = callState.active || !$('#ringBox').hidden;
    if (notify && callState.room) post('/api/call', { room: callState.room, action: 'end', role: callState.role });
    cleanupMedia();
    if (hooks.call && wasActive) hooks.call('ended');
    callState.active = false;
    $('#alertCard').hidden = true; $('#ringBox').hidden = true;
    if (!wasActive) return;
    if (mode === 'sender') { show('sender'); $('#sCallState').textContent = t('callEnded'); }
    else { show('home'); if (!quiet) toast(t('appName'), t('callEnded'), null, null, true); }
  }

  /* ------------------------------ التقاط صوت المتصل وإرساله للتفريغ ------------------------------ */
  let audioCtx = null;
  function unlockAudioCtx() {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {}
  }
  const WORKLET = `class Tap extends AudioWorkletProcessor{constructor(){super();this.b=new Float32Array(2048);this.n=0}
process(i){const c=i[0]&&i[0][0];if(c){for(let k=0;k<c.length;k++){this.b[this.n++]=c[k];if(this.n===this.b.length){this.port.postMessage(this.b.slice(0));this.n=0}}}return true}}
registerProcessor('pcm-tap',Tap);`;
  async function startCapture(stream) {
    if (!audioCtx || callState.cap) return;
    const ctx = audioCtx;
    const src = ctx.createMediaStreamSource(stream);
    const mute = ctx.createGain(); mute.gain.value = 0; mute.connect(ctx.destination);
    const rs = { ratio: ctx.sampleRate / 24000, pos: 0, prev: 0, out: [], outLen: 0 };
    const onFrames = (f32) => {
      let sum = 0; for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
      if (Math.sqrt(sum / f32.length) > 0.015) callState.lastVoice = performance.now();
      // إعادة التشكيل إلى 24 كيلوهرتز PCM16
      const n = Math.floor((f32.length - rs.pos) / rs.ratio);
      const out = new Int16Array(Math.max(0, n));
      for (let k = 0; k < n; k++) {
        const x = rs.pos + k * rs.ratio, i = Math.floor(x), fr = x - i;
        const s0 = f32[Math.min(i, f32.length - 1)], s1 = f32[Math.min(i + 1, f32.length - 1)];
        const v = Math.max(-1, Math.min(1, s0 + (s1 - s0) * fr));
        out[k] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      rs.pos = Math.max(0, rs.pos + n * rs.ratio - f32.length);
      rs.out.push(out); rs.outLen += out.length;
      if (rs.outLen >= 4800) { // ~200 ملث
        const buf = new Int16Array(rs.outLen); let o = 0; for (const c of rs.out) { buf.set(c, o); o += c.length; }
        rs.out = []; rs.outLen = 0;
        sendAudio(buf.buffer);
      }
    };
    let node;
    try {
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }));
      await ctx.audioWorklet.addModule(url);
      node = new AudioWorkletNode(ctx, 'pcm-tap');
      node.port.onmessage = (e) => onFrames(e.data);
    } catch {
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (e) => onFrames(new Float32Array(e.inputBuffer.getChannelData(0)));
    }
    src.connect(node); node.connect(mute);
    callState.cap = { src, node, mute };
  }
  function stopCapture() {
    const c = callState.cap; if (!c) return;
    try { c.src.disconnect(); c.node.disconnect(); c.mute.disconnect(); } catch {}
    callState.cap = null;
  }
  let audioInFlight = 0;
  function sendAudio(ab) {
    if (!callState.active || audioInFlight > 6) return;
    audioInFlight++;
    fetch('/api/audio?room=' + encodeURIComponent(callState.room), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: ab })
      .then((r) => { callState.audioFail = r.status === 503 ? callState.audioFail + 1 : 0; })
      .catch(() => { callState.audioFail++; })
      .finally(() => { audioInFlight--; renderPill(); });
  }

  /* ------------------------------ الهاتف الثاني (مرسل/متصل) ------------------------------ */
  function renderPresets() {
    const host = $('#presetBtns'); if (!host) return; host.textContent = '';
    for (const [label, from, text] of PRESETS[lang]) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { $('#sFrom').value = from; $('#sText').value = text; });
      host.appendChild(b);
    }
  }
  function renderPhrases() {
    const host = $('#phraseBtns'); if (!host) return; host.textContent = '';
    for (const p of PHRASES[lang]) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = '«' + p + '»';
      b.addEventListener('click', () => post('/api/phrase', { room: callState.room, text: p }));
      host.appendChild(b);
    }
  }
  function enterSender() {
    mode = 'sender';
    if (es) { es.close(); es = null; }
    $('#sPair').value = senderCode || '';
    $('#sFrom').value = store.get('senderFrom', '');
    show('sender');
    if (/^\d{4}$/.test(senderCode)) pairSender();
  }
  function pairSender() {
    senderCode = $('#sPair').value.replace(/\D/g, '').slice(0, 4);
    store.set('senderPair', senderCode);
    if (senderCode.length !== 4) { $('#sPairState').textContent = ''; return; }
    openStream('caller', senderCode, {
      hello: (d) => { $('#sPairState').textContent = d.peer ? t('paired') : t('pairedOff'); },
      peer: (d) => { $('#sPairState').textContent = d.joined ? t('paired') : t('pairedOff'); },
      accepted: onAccepted, declined: onDeclined, signal: onSignal, analysis: onAnalysis,
      callEnded: () => endCallLocal(false),
      error: () => { $('#sPairState').textContent = t('badCode'); if (es) es.close(); },
    });
  }
  async function sendSms() {
    if (!/^\d{4}$/.test(senderCode)) { $('#sSmsState').textContent = t('needPair'); return; }
    const from = $('#sFrom').value.trim() || 'SMS'; store.set('senderFrom', from);
    const text = $('#sText').value.trim(); if (!text) return;
    const r = await post('/api/sms', { room: senderCode, from, text }).catch(() => null);
    const j = r && r.ok ? await r.json() : null;
    $('#sSmsState').textContent = j && j.delivered ? t('sent') : r && r.status === 404 ? t('badCode') : t('notDelivered');
  }

  /* ------------------------------ عامل الخدمة (للإشعارات) ------------------------------ */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => {
      const id = e.data && e.data.open; const item = inbox.find((x) => x.id === id);
      if (item) showResult(verdictOf(item), { item, text: item.text });
    });
  }

  // واجهة صغيرة لوضع «آيفون» التجريبي
  window.Shield = {
    hooks, t, get lang() { return lang; }, get settings() { return settings; }, get code() { return code; },
    verdict: (item) => (item.scanned ? verdictOf(item) : null), isDanger, headline, whyOf,
    openLink, openItem: (item) => showResult(verdictOf(item), { item, text: item.text }), show, extractUrls: E.extractUrls,
  };

  /* ------------------------------ ربط الأحداث ------------------------------ */
  function bind() {
    $('#langBtn').addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
    $$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const g = b.dataset.go;
      if (g === 'sender') return enterSender();
      if (g === 'start') { mode = 'user'; if (settings) { connectUser(); renderHome(); show('home'); } else show('activate'); return; }
      show(g);
    }));
    $('#btnActivate').addEventListener('click', activate);
    $('#btnIdLogin').addEventListener('click', idLogin);
    $('#btnDeactivate').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (!b.classList.contains('confirm')) { b.classList.add('confirm'); b.textContent = t('offConfirm'); setTimeout(() => { b.classList.remove('confirm'); b.textContent = t('offBtn'); }, 4000); return; }
      settings = null; store.del('settings'); if (es) es.close(); show('activate');
    });
    if ($('#btnCheck')) $('#btnCheck').addEventListener('click', () => { $('#msgInput').value = ''; show('check'); $('#msgInput').focus(); });
    $('#btnSample').addEventListener('click', () => { $('#msgInput').value = t('sample'); });
    $('#btnScan').addEventListener('click', () => { const s = $('#msgInput').value.trim(); if (!s) return $('#msgInput').focus(); showResult(E.analyzeMessage(s, lang), { text: s }); });
    $('#btnWhatIf').addEventListener('click', () => { const cr = currentResult; const v = cr.item ? verdictOf(cr.item) : cr.v; if (hooks.simulate) hooks.simulate(v.kind, { ...v, text: cr.text }); });
    $('#alWhatIf').addEventListener('click', () => { const k = $('#alertCard').dataset.kind; endCallLocal(true); if (hooks.simulate) hooks.simulate(k, null); });
    $('#btnOpenLink').addEventListener('click', () => { const cr = currentResult; const v = cr.item ? verdictOf(cr.item) : cr.v; if (v.links[0]) openLink(v.links[0], cr.text); });
    $('#btnListen').addEventListener('click', () => speak(currentResult && currentResult.speech));
    $('#btnNew').addEventListener('click', () => { $('#msgInput').value = ''; show('check'); });
    // المكالمة
    $('#btnAccept').addEventListener('click', acceptCall);
    $('#btnDecline').addEventListener('click', declineCall);
    $('#btnEnd').addEventListener('click', () => endCallLocal(true));
    $('#alEnd').addEventListener('click', refuseAndEnd);
    $('#alDismiss').addEventListener('click', () => { $('#alertCard').hidden = true; post('/api/said', { room: callState.room, id: 'choice', choice: 'continue' }); });
    $('#alListen').addEventListener('click', () => speak($('#alertCard').dataset.speech));
    $('#btnTapAudio').addEventListener('click', () => { $('#remoteAudio').play().then(() => { $('#btnTapAudio').hidden = true; }).catch(() => {}); unlockAudioCtx(); });
    $('#outageToggle').addEventListener('change', (e) => post('/api/outage', { room: callState.room, on: e.target.checked }));
    // الهاتف الثاني
    $('#sPair').addEventListener('input', () => { if ($('#sPair').value.replace(/\D/g, '').length === 4) pairSender(); });
    $('#btnSendSms').addEventListener('click', sendSms);
    $('#btnRing').addEventListener('click', ringUser);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#linkWarn').hidden = true; } });
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  }

  async function init() {
    bind();
    try { cfg = await fetch('/api/config').then((r) => r.json()); } catch {}
    await loadPatterns();
    $('#optAssistRow').hidden = !cfg.assist;
    applyLang();
    const q = new URLSearchParams(location.search);
    const rq = q.get('room'); // فُتح من رمز QR مربوط بغرفة جاهزة
    if (/^\d{4}$/.test(rq || '')) { code = rq; store.set('pair', code); }
    if (q.has('sender')) { if (q.get('sender')) { senderCode = q.get('sender'); store.set('senderPair', senderCode); } return enterSender(); }
    if (settings) { registerSW(); await connectUser(); renderHome(); show('home'); }
    else show('activate');
  }
  init();
})();
