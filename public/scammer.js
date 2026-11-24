/* هاتف المحتال (محاكاة للتوعية والتدريب) — يرسل رسائل احتيال تجريبية ويجري مكالمات بسيناريوهات معروفة
 * الروابط كلها بنطاقات .example الوهمية ولا تعمل.
 */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const embed = q.get('frame') === '0';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ds.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ds.' + k, JSON.stringify(v)); } catch {} },
  };
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const toParent = (msg) => { if (embed && window.parent !== window) window.parent.postMessage({ src: 'scammer', ...msg }, location.origin); };
  let lang = store.get('lang', 'ar');

  /* ------------------------------ السيناريوهات ------------------------------ */
  const T = {
    ar: {
      origin: '📍 موقع المحتال', oAuto: 'تلقائي (موقع هذا الجهاز)', oEm: 'داخل الدولة', oOut: 'خارج الدولة', title: 'المحتال', freeSms: '✍️ اكتب رسالتك بنفسك', freeSmsD: 'اكتب أي رسالة أو رابط احتيال من خيالك وشاهد «حِصن» يحلّلها.', senderPh: 'اسم أو رقم المرسل', textPh: 'نص الرسالة…', chSms: 'رسالة نصية', chWa: 'واتساب', freeCall: '🎙️ مكالمة حرة — تكلّم أنت بدور المحتال', freeCallD: 'بعد رد الضحية اضغط الميكروفون وتكلّم بنفسك، أو اكتب الجملة. يتحول صوتك إلى نص فعليًا ويحلّله «حِصن».', numPh: 'رقم المتصل', labelPh: 'يظهر للضحية باسم', micOn: '🔴 أستمع… تكلّم الآن', micOff: 'اضغط الميكروفون وتكلّم', micNA: 'التعرف على الكلام غير مدعوم في هذا المتصفح — استخدم Edge أو Chrome، أو اكتب الجملة', micDenied: 'لم يُسمح بالميكروفون', typePh: 'أو اكتب جملة المحتال…', freeTitle: 'مكالمة حرة', warn: '⚠ محاكاة لأغراض التوعية والتدريب فقط. الروابط وهمية ولا تعمل.', lang: 'English',
      linked: 'متصل بهاتف الضحية', waiting: 'بانتظار هاتف الضحية…', enterCode: 'أدخل رمز الربط من هاتف الضحية', offline: 'الرمز صحيح لكن هاتف الضحية غير مفتوح', bad: 'رمز غير صحيح',
      tabSms: 'رسائل احتيال', tabCalls: 'مكالمات احتيال', from: 'من', sms: 'رسالة نصية', wa: 'واتساب', mail: 'بريد إلكتروني', social: 'تواصل اجتماعي', qr: 'رمز QR في مكان عام', send: 'أرسل إلى الضحية', sent: '✓ وصلت إلى هاتف الضحية', notDelivered: 'لم تصل — هاتف الضحية غير متصل',
      call: 'اتصل بالضحية', victim: 'الضحية — مريم', ringing: 'يرن…', connecting: 'جارٍ الاتصال…', declined: 'رُفضت المكالمة', ended: 'انتهت المكالمة', busy: 'الضحية في مكالمة',
      say: 'المكالمة', spS: '🎙️ المحتال يتكلم…', spV: '🗣️ الضحية تتكلم…', spWait: '⏸ الدرع نبّه الضحية — بانتظار قرارها…', spDone: 'انتهى الحوار', you: 'المحتال', victimL: 'مريم (الضحية)', declinedByShield: '🛡️ الضحية أنهت المكالمة بعد تنبيه الدرع', mic: 'ميكروفون حقيقي', outage: 'محاكاة انقطاع التحليل', phrasesN: (n) => `${n} عبارات`,
      pillActive: '🛡️ «حِصن» يحلّل المكالمة لحظيًا', pillDemo: '🛡️ تُحلَّل لحظيًا (عبارات تمثيلية)', pillPaused: '⚠️ الفحص متوقف', pillWait: 'بانتظار الرد',
    },
    en: {
      origin: '📍 Scammer location', oAuto: 'Automatic (this device)', oEm: 'Inside the UAE', oOut: 'Outside the UAE', title: 'The Scammer', freeSms: '✍️ Write your own message', freeSmsD: 'Type any scam message or link and watch HISN analyse it.', senderPh: 'Sender name or number', textPh: 'Message text…', chSms: 'Text message', chWa: 'WhatsApp', freeCall: '🎙️ Free call — you play the scammer', freeCallD: 'After the victim answers, press the mic and speak, or type. Your voice is really transcribed and analysed by HISN.', numPh: 'Caller number', labelPh: 'Shown to victim as', micOn: '🔴 Listening… speak now', micOff: 'Press the mic and speak', micNA: 'Speech recognition is not supported here — use Edge or Chrome, or type', micDenied: 'Microphone not allowed', typePh: 'Or type the scammer’s sentence…', freeTitle: 'Free call', warn: '⚠ Simulation for awareness and training only. Links are fake and do not work.', lang: 'العربية',
      linked: 'Connected to the victim phone', waiting: 'Waiting for the victim phone…', enterCode: 'Enter the pairing code from the victim phone', offline: 'Code is valid but the victim phone is not open', bad: 'Wrong code',
      tabSms: 'Scam messages', tabCalls: 'Scam calls', from: 'From', sms: 'Text message', wa: 'WhatsApp', mail: 'Email', social: 'Social media', qr: 'QR code in a public place', send: 'Send to victim', sent: '✓ Delivered to the victim phone', notDelivered: 'Not delivered — victim phone offline',
      call: 'Call the victim', victim: 'Victim', ringing: 'Ringing…', connecting: 'Connecting…', declined: 'Call declined', ended: 'Call ended', busy: 'Victim is in a call',
      say: 'Call', spS: '🎙️ The scammer is speaking…', spV: '🗣️ The victim is speaking…', spWait: '⏸ The Shield warned the victim — waiting for her decision…', spDone: 'Dialogue finished', you: 'Scammer', victimL: 'Victim', declinedByShield: '🛡️ The victim hung up after the Shield warning', mic: 'Real microphone', outage: 'Simulate analysis outage', phrasesN: (n) => `${n} phrases`,
      pillActive: '🛡️ This call is analysed in real time', pillDemo: '🛡️ Analysed in real time (sample phrases)', pillPaused: '⚠️ Analysis stopped', pillWait: 'Waiting for answer',
    },
  };
  const SMS = {
    ar: [
      { id: 'phish', ch: 1, ico: '📧', bg: '#0a84ff', channel: 'mail', title: 'تحدي ١: بريد تصيّد وصفحة دخول مزيفة', from: 'security@nakhlabank-verify.com', fromLabel: 'بنك النخلة الوطني — قسم الأمن', text: 'تنبيه أمني: رصدنا محاولة دخول غير معتادة إلى حسابك. لحماية حسابك يرجى تسجيل الدخول للتحقق من هويتك خلال 24 ساعة وإلا سيتم إيقاف الحساب: https://nakhlabank-verify.com/login' },
      { id: 'game', ch: 2, ico: '🎮', bg: '#ff375f', title: 'تحدي ٢: لعبة تطلب أذونات زائدة', from: 'GameZone', text: 'لعبة «سباق الصحراء» الجديدة مجانًا لفترة محدودة! حمّلها الحين من الرابط المباشر بدون متجر: https://desert-race-free.top/download/game.apk' },
      { id: 'bankapp', ch: 3, ico: '🏦', bg: '#5e5ce6', title: 'تحدي ٣: تطبيق بنكي مزيف', from: 'NakhlaBank', text: 'بنك النخلة: الإصدار الحالي من تطبيقنا متوقف. حمّل التطبيق الجديد وسجّل دخولك لتفعيله: https://nakhla-bank-app.com/download/NakhlaBank.apk' },
      { id: 'qrdonate', ch: 4, ico: '🔳', bg: '#30d158', channel: 'qr', title: 'تحدي ٤: رمز QR تبرع مزيف (ملصق في مكان عام)', from: 'ملصق في مركز تجاري', text: 'تبرّع الآن لإغاثة الأسر المحتاجة — جمعية الخير — امسح الرمز وادفع بالبطاقة: http://alkhair-charity-donate.org/pay' },
      { id: 'bossmsg', ch: 5, ico: '👔', bg: '#8e8e93', channel: 'wa', title: 'تحدي ٥: رسالة متابعة «من المدير» بشعار رسمي', from: '0507788123', fromLabel: 'أبو خالد — المدير', text: '🏢 الإدارة المالية — طلب دفعة عاجلة: حوّل 9,500 درهم اليوم لحساب المورد AE07 0331 2345 6789 0123 456 وأرسل لي رمز التأكيد اللي يوصلك. الموضوع سري وعاجل.' },
      { id: 'brand', ch: 6, ico: '📣', bg: '#bf5af2', channel: 'social', title: 'تحدي ٦: حساب ينتحل علامة تجارية بمسابقة', from: 'nakhla.rewards.official', fromLabel: 'بنك النخلة Rewards ✔︎', text: '🎉 مسابقة الذكرى العاشرة لبنك النخلة! أنت من الفائزين بجهاز iPhone. لاستلام الجائزة سجّل دخولك بحساب التواصل وأدخل بياناتك هنا: https://nakhla-rewards-contest.com/claim' },
      { id: 'cvv', ico: '🔢', bg: '#ff9f0a', title: 'طلب الرقم السري للصراف و CVV', from: '024144257', fromLabel: 'بنك النخلة الوطني', text: 'عزيزي العميل، لتفعيل الحماية الجديدة لبطاقتك أرسل لنا رقم البطاقة والرقم السري للصراف ورقم الأمان CVV.' },
      { id: 'delivery', ico: '📦', bg: '#ff9f0a', title: 'رسوم توصيل مزيفة', from: 'EmiratesPost', text: 'بريد الإمارات: شحنتك معلّقة لعدم دفع رسوم التوصيل 7.50 درهم. ادفع خلال 24 ساعة حتى لا تُعاد الشحنة: https://emiratespost-ae.example/pay' },
      { id: 'fine', ico: '🚓', bg: '#0a84ff', title: 'مخالفة مرورية مزيفة', from: 'MOI-UAE', text: 'وزارة الداخلية: لديك مخالفة مرورية غير مدفوعة بقيمة 400 درهم. ادفعها خلال 24 ساعة لتجنب حجز المركبة: https://moi-fines-uae.example/pay' },
      { id: 'card', ico: '💳', bg: '#5e5ce6', title: 'تحديث بيانات البطاقة', from: 'BlueGulf', text: 'مصرف الخليج الأزرق: تم إيقاف بطاقتك، حدّث بياناتك خلال ساعة لتجنب إغلاق الحساب: https://bluegulf-secure-update.top/login' },
      { id: 'otp', ico: '🔑', bg: '#ff375f', title: 'طلب رمز التحقق', from: '024144257', fromLabel: 'بنك النخلة الوطني', text: 'بنك النخلة الوطني: تم إيقاف بطاقتك مؤقتًا. لإعادة تفعيلها أرسل رمز التحقق الذي سيصلك الآن ردًا على هذه الرسالة.' },
      { id: 'prize', ico: '🎁', bg: '#bf5af2', title: 'جائزة وهمية', from: '043218877', fromLabel: 'مسابقات بنك النخلة', text: 'مبروك! ربحت جائزة 10,000 درهم في السحب الشهري. أرسل لنا رمز التحقق الذي وصلك لتأكيد الاستلام.' },
      { id: 'wagroup', ico: '💬', bg: '#25d366', channel: 'wa', title: 'مجموعة واتساب لسرقة الحساب', from: '0561234567', text: '🔥 وظائف حكومية برواتب تبدأ من 25,000 درهم والعمل من المنزل! انضم للمجموعة قبل اكتمال العدد: https://chat.whatsapp-groups.example/JoinGov2026' },
      { id: 'subdom', ico: '🪤', bg: '#ff453a', title: 'خدعة النطاق الفرعي', from: 'NakhlaBank', text: 'بنك النخلة: تم رصد دخول غير معتاد إلى حسابك. أكّد هويتك خلال 30 دقيقة: https://nakhlabank.ae.account-verify.top/login' },
      { id: 'swapc', ico: '🔤', bg: '#64d2ff', title: 'رقم بدل حرف + رقم جوال', from: '0558812640', text: 'بنك النخلة: بطاقتك موقوفة مؤقتًا. لإعادة التفعيل ادخل: https://nakh1abank.ae/unlock' },
      { id: 'safe', ico: '✅', bg: '#30d158', title: 'رسالة سليمة (للمقارنة)', from: 'أحمد', text: 'هلا، وصلت البيت. نتقابل بكرة الساعة 5 في المقهى؟' },
    ],
    en: [
      { id: 'phish', ch: 1, ico: '📧', bg: '#0a84ff', channel: 'mail', title: 'Challenge 1: phishing email + fake login page', from: 'security@nakhlabank-verify.com', fromLabel: 'Nakhla National Bank — Security', text: 'Security alert: we detected an unusual sign-in attempt on your account. To protect it, please sign in to verify your identity within 24 hours or the account will be suspended: https://nakhlabank-verify.com/login' },
      { id: 'game', ch: 2, ico: '🎮', bg: '#ff375f', title: 'Challenge 2: a game asking for excessive permissions', from: 'GameZone', text: 'The new “Desert Race” game is free for a limited time! Download it now from the direct link, no store needed: https://desert-race-free.top/download/game.apk' },
      { id: 'bankapp', ch: 3, ico: '🏦', bg: '#5e5ce6', title: 'Challenge 3: fake banking app', from: 'NakhlaBank', text: 'Nakhla Bank: the current version of our app has stopped working. Download the new app and sign in to activate it: https://nakhla-bank-app.com/download/NakhlaBank.apk' },
      { id: 'qrdonate', ch: 4, ico: '🔳', bg: '#30d158', channel: 'qr', title: 'Challenge 4: fake donation QR code (public poster)', from: 'Poster in a mall', text: 'Donate now to help families in need — Al Khair Charity — scan and pay by card: http://alkhair-charity-donate.org/pay' },
      { id: 'bossmsg', ch: 5, ico: '👔', bg: '#8e8e93', channel: 'wa', title: 'Challenge 5: follow-up message “from your manager” with an official logo', from: '0507788123', fromLabel: 'Abu Khalid — Manager', text: '🏢 Finance Department — urgent payment request: transfer AED 9,500 today to the supplier account AE07 0331 2345 6789 0123 456 and send me the confirmation code you receive. Confidential and urgent.' },
      { id: 'brand', ch: 6, ico: '📣', bg: '#bf5af2', channel: 'social', title: 'Challenge 6: account impersonating a brand with a contest', from: 'nakhla.rewards.official', fromLabel: 'Nakhla Bank Rewards ✔︎', text: '🎉 Nakhla Bank 10th anniversary contest! You are one of the iPhone winners. To claim your prize, sign in with your social account and enter your details here: https://nakhla-rewards-contest.com/claim' },
      { id: 'cvv', ico: '🔢', bg: '#ff9f0a', title: 'Asking for the ATM PIN and CVV', from: '024144257', fromLabel: 'Nakhla National Bank', text: 'Dear customer, to activate the new protection on your card, send us your card number, ATM PIN and the CVV security number.' },
      { id: 'delivery', ico: '📦', bg: '#ff9f0a', title: 'Fake delivery fee', from: 'EmiratesPost', text: 'Emirates Post: your parcel is on hold because the 7.50 AED delivery fee is unpaid. Pay within 24 hours: https://emiratespost-ae.example/pay' },
      { id: 'fine', ico: '🚓', bg: '#0a84ff', title: 'Fake traffic fine', from: 'MOI-UAE', text: 'Ministry of Interior: you have an unpaid traffic fine of 400 AED. Pay within 24 hours to avoid vehicle impound: https://moi-fines-uae.example/pay' },
      { id: 'card', ico: '💳', bg: '#5e5ce6', title: 'Card details update', from: 'BlueGulf', text: 'Blue Gulf Bank: your card has been suspended. Update your details within one hour to avoid closure: https://bluegulf-secure-update.top/login' },
      { id: 'otp', ico: '🔑', bg: '#ff375f', title: 'Verification code request', from: '024144257', fromLabel: 'Nakhla National Bank', text: 'Nakhla National Bank: your card is temporarily blocked. To reactivate it, reply with the verification code you will receive now.' },
      { id: 'prize', ico: '🎁', bg: '#bf5af2', title: 'Fake prize', from: '043218877', fromLabel: 'Nakhla Bank competitions', text: 'Congratulations! You won 10,000 AED in the monthly draw. Send us the verification code you received to confirm.' },
      { id: 'wagroup', ico: '💬', bg: '#25d366', channel: 'wa', title: 'WhatsApp group that steals accounts', from: '0561234567', text: '🔥 Government jobs with salaries from 25,000 AED, work from home! Join the group before it fills up: https://chat.whatsapp-groups.example/JoinGov2026' },
      { id: 'subdom', ico: '🪤', bg: '#ff453a', title: 'Subdomain trick', from: 'NakhlaBank', text: 'Nakhla Bank: unusual sign-in detected on your account. Confirm your identity within 30 minutes: https://nakhlabank.ae.account-verify.top/login' },
      { id: 'swapc', ico: '🔤', bg: '#64d2ff', title: 'Number for a letter + mobile sender', from: '0558812640', text: 'Nakhla Bank: your card is temporarily blocked. To reactivate go to: https://nakh1abank.ae/unlock' },
      { id: 'safe', ico: '✅', bg: '#30d158', title: 'Normal message (control)', from: 'Ahmed', text: 'Hi, I got home. Shall we meet tomorrow at 5 at the café?' },
    ],
  };
  // حوار صوتي: s = المحتال، v = الضحية، key = العبارة التي يجب أن ينبّه عليها الدرع، cont = إن اختارت الضحية متابعة المكالمة
  const CALLS = {
    ar: [
      { id: 'bank', ico: '🏦', bg: '#5e5ce6', num: '024144257', label: 'بنك النخلة الوطني', title: 'موظف بنك مزيف يطلب الرمز', desc: 'ينتحل قسم مكافحة الاحتيال في البنك ويطلب رمز التحقق «لإيقاف عملية».',
        dialog: [['s', 'السلام عليكم، معك خالد من قسم مكافحة الاحتيال في بنك النخلة الوطني.'], ['v', 'وعليكم السلام، هلا.'], ['s', 'لاحظنا عملية شراء مشبوهة على بطاقتك بقيمة ثلاثة آلاف ومية درهم، هل أنت سويتها؟'], ['v', 'لا والله، ما سويت أي عملية!'], ['s', 'لا تخاف، بنوقفها لك الحين. للأمان، لا تشارك رمز التحقق مع أي أحد.'], ['v', 'إن شاء الله.'], ['s', 'الحين بيوصلك رمز على جوالك، عطني رمز التحقق عشان نوقف العملية.', 1]],
        cont: [['v', 'لحظة... إيه وصلني رمز.'], ['s', 'بسرعة الله يخليك، قول لي الرمز قبل لا تنخصم الفلوس.', 1]],
        kind: 'otp', comply: [['v', 'طيب... الرمز هو سبعة، ثلاثة، تسعة، اثنين، صفر، واحد.'], ['s', 'تمام، شكرًا لك. تم إيقاف العملية، لا تشيل هم.']], win: '✅ حصل المحتال على رمز التحقق' },
      { id: 'police', ico: '🚔', bg: '#0a84ff', num: '025559012', label: 'مركز الشرطة — قسم التحقيقات', title: 'محقق مزيف وتحويل «لحساب آمن»', desc: 'ينتحل الشرطة ويخوّف الضحية ثم يطلب تحويل الرصيد فورًا.',
        dialog: [['s', 'مساء الخير، معك المحقق سالم من مركز الشرطة.'], ['v', 'مساء النور، خير إن شاء الله؟'], ['s', 'عندنا بلاغ إن حسابك البنكي مستخدم في عملية غسيل أموال.'], ['v', 'شو؟! مستحيل، أنا ما سويت شي!'], ['s', 'نصدقك، بس لازم نحمي فلوسك. هالموضوع سري ولا تقول لأحد.'], ['v', 'طيب، شو المطلوب مني؟'], ['s', 'لازم تحوّل رصيدك لحساب آمن الحين وإلا بيتجمد حسابك.', 1]],
        cont: [['v', 'كم المبلغ اللي لازم أحوّله؟'], ['s', 'كل الرصيد، حوّله لحساب آمن الحين وبنرجعه لك بعد التحقيق.', 1]],
        kind: 'transfer', comply: [['v', 'خلاص، بحوّل الحين كل الرصيد للحساب اللي عطيتني إياه.'], ['s', 'ممتاز، أول ما يوصل التحويل بنسكر البلاغ. مع السلامة.']], win: '✅ حوّلت الضحية كامل الرصيد' },
      { id: 'approve', ico: '🪪', bg: '#30b0c7', num: '026339900', label: 'مركز دعم الهوية الرقمية', title: 'موافقة على إشعار الهوية الرقمية', desc: 'يطلب الضغط على «موافق» في إشعار لم تبدأه الضحية.',
        dialog: [['s', 'هلا، معك فريق دعم الهوية الرقمية.'], ['v', 'هلا، تفضل.'], ['s', 'نحدّث بيانات حسابك في النظام، وإذا ما تحدّثت بيتوقف حسابك.'], ['v', 'طيب شو المطلوب مني؟'], ['s', 'بيوصلك إشعار على الجوال، اضغط موافق بسرعة.', 1]],
        cont: [['v', 'وصلني إشعار تسجيل دخول…'], ['s', 'إيه هذا هو، اضغط موافق الحين.', 1]],
        kind: 'approval', comply: [['v', 'تمام، ضغطت موافق.'], ['s', 'شكرًا، تم تحديث بياناتك. مع السلامة.']], win: '✅ دخل المحتال بالهوية الرقمية للضحية' },
      { id: 'remote', ico: '🖥️', bg: '#ff9f0a', num: '026667788', label: 'الدعم الفني — شركة الاتصالات', title: 'دعم فني مزيف وبرنامج تحكم', desc: 'يدّعي وجود فيروس ويطلب برنامج تحكم عن بعد، ثم يسرق صور الضحية الخاصة ليبتزها.',
        dialog: [['s', 'مرحبا، معك الدعم الفني لشركة الاتصالات.'], ['v', 'هلا، آمر.'], ['s', 'رصدنا فيروس في جهازك وممكن يسرق بياناتك البنكية.'], ['v', 'صدق؟ شو أسوي؟'], ['s', 'نزّل تطبيق AnyDesk عشان نساعدك ونصلح الجهاز.', 1]],
        cont: [['v', 'نزلته، شو بعد؟'], ['s', 'زين، نزّل تطبيق AnyDesk إذا ما نزل، وعطني الرقم اللي يطلع لك.', 1]],
        kind: 'remote', comply: [['v', 'هذا الرقم اللي طلع لي: أربعة، خمسة، واحد، تسعة، ووافقت على الطلب.'], ['s', 'ممتاز، لا تلمس الجهاز الحين، نحن نصلحه.']], win: '✅ نسخ المحتال صور الضحية الخاصة وبدأ ابتزازها' },
      { id: 'boss', ico: '👔', bg: '#8e8e93', num: '0507788123', label: 'أبو خالد — المدير', title: 'تحدي ٥: صوت مقلَّد للمدير يطلب تحويلًا ورمزًا', desc: 'صوت يشبه صوت مديرك (مولَّد بالذكاء الاصطناعي) يطلب بشكل عاجل تحويل مبلغ ثم رمز التحقق.',
        dialog: [['s', 'هلا، أنا أبو خالد، مديرك. أنا في اجتماع مع العميل وما أقدر أطوّل.'], ['v', 'هلا أستاذ، آمر.'], ['s', 'عندنا دفعة متأخرة لمورد مهم، ولازم تنحل اليوم قبل لا نخسر العقد.'], ['v', 'إن شاء الله، شو المطلوب؟'], ['s', 'حوّل تسعة آلاف وخمسمية درهم الحين لحساب المورد، وبرجعها لك بكرة.', 1]],
        cont: [['v', 'طيب، بس عادةً ما أحوّل من حسابي…'], ['s', 'ما عندي وقت أشرح، بيوصلك رمز من البنك، عطني إياه عشان أأكد التحويل. والموضوع سري.', 1]],
        kind: 'boss', comply: [['v', 'خلاص حوّلت، والرمز هو أربعة، ثمانية، واحد، ستة.'], ['s', 'ممتاز، الله يعطيك العافية.']], win: '✅ حوّلت الضحية المبلغ وأعطت الرمز' },
    ],
    en: [
      { id: 'bank', ico: '🏦', bg: '#5e5ce6', num: '024144257', label: 'Nakhla National Bank', title: 'Fake bank officer asks for the code', desc: 'Pretends to be the bank fraud team and asks for the code “to stop a transaction”.',
        dialog: [['s', 'Hello, this is Khalid from the fraud department at Nakhla National Bank.'], ['v', 'Hello, yes?'], ['s', 'We noticed a suspicious purchase of 3,100 dirhams on your card. Did you make it?'], ['v', 'No, I did not make any purchase!'], ['s', 'Don’t worry, we will stop it now. For your safety, never share your verification code with anyone.'], ['v', 'Okay.'], ['s', 'You will get a code now, give me the verification code so we can stop the transaction.', 1]],
        cont: [['v', 'Wait... yes, I got a code.'], ['s', 'Quickly please, tell me the code before the money is taken.', 1]],
        kind: 'otp', comply: [['v', 'Okay... the code is seven, three, nine, two, zero, one.'], ['s', 'Great, thank you. The transaction is stopped, don’t worry.']], win: '✅ The scammer got the verification code' },
      { id: 'police', ico: '🚔', bg: '#0a84ff', num: '025559012', label: 'Police station — Investigations', title: 'Fake investigator + “safe account”', desc: 'Pretends to be police, scares the victim, then demands an urgent transfer.',
        dialog: [['s', 'Good evening, this is investigator Salem from the police station.'], ['v', 'Good evening, is everything okay?'], ['s', 'We have a report that your bank account was used for money laundering.'], ['v', 'What? Impossible, I did nothing!'], ['s', 'We believe you, but we must protect your money. Keep this confidential.'], ['v', 'Okay, what do I need to do?'], ['s', 'You need to transfer your balance to a safe account now or your account will be frozen.', 1]],
        cont: [['v', 'How much should I transfer?'], ['s', 'The whole balance. Transfer it to the safe account now and we will return it after the investigation.', 1]],
        kind: 'transfer', comply: [['v', 'Okay, I am transferring the whole balance to the account you gave me now.'], ['s', 'Excellent, once it arrives we will close the report. Goodbye.']], win: '✅ The victim transferred the whole balance' },
      { id: 'approve', ico: '🪪', bg: '#30b0c7', num: '026339900', label: 'Digital identity support centre', title: 'Approve a digital-ID prompt', desc: 'Asks the victim to tap “approve” on a prompt they did not start.',
        dialog: [['s', 'Hi, this is the digital identity support team.'], ['v', 'Hi, go ahead.'], ['s', 'We are updating your account; if it is not updated it will be suspended.'], ['v', 'Okay, what do you need from me?'], ['s', 'You will get a notification on your phone, just tap approve quickly.', 1]],
        cont: [['v', 'I got a sign-in notification…'], ['s', 'Yes that is it, tap approve now.', 1]],
        kind: 'approval', comply: [['v', 'Okay, I tapped approve.'], ['s', 'Thanks, your details are updated. Goodbye.']], win: '✅ The scammer signed in with the victim’s digital ID' },
      { id: 'remote', ico: '🖥️', bg: '#ff9f0a', num: '026667788', label: 'Technical support — Telecom', title: 'Fake tech support + remote app', desc: 'Claims a virus, gets a remote-control app installed, then steals private photos for blackmail.',
        dialog: [['s', 'Hello, this is technical support from the telecom company.'], ['v', 'Hi, yes?'], ['s', 'We detected a virus on your phone that can steal your banking details.'], ['v', 'Really? What should I do?'], ['s', 'Install AnyDesk so we can help you and fix the phone.', 1]],
        cont: [['v', 'I installed it, what next?'], ['s', 'Good, install AnyDesk if it is not done and give me the number it shows.', 1]],
        kind: 'remote', comply: [['v', 'The number is four, five, one, nine, and I accepted the request.'], ['s', 'Great, don’t touch the phone now, we are fixing it.']], win: '✅ The scammer copied the victim’s private photos and started blackmail' },
      { id: 'boss', ico: '👔', bg: '#8e8e93', num: '0507788123', label: 'Abu Khalid — Manager', title: 'Challenge 5: cloned voice of your manager asks for a transfer and a code', desc: 'A voice that sounds like your manager (AI-generated) urgently asks for a transfer, then the verification code.',
        dialog: [['s', 'Hi, it is Abu Khalid, your manager. I am in a meeting with the client and cannot talk long.'], ['v', 'Hello sir, go ahead.'], ['s', 'We have an overdue payment to an important supplier and it must be settled today or we lose the contract.'], ['v', 'Sure, what do you need?'], ['s', 'Transfer nine thousand five hundred dirhams to the supplier account now, and I will pay you back tomorrow.', 1]],
        cont: [['v', 'Okay, but I do not usually transfer from my own account…'], ['s', 'No time to explain. You will get a code from the bank, give it to me to confirm the transfer. Keep this confidential.', 1]],
        kind: 'boss', comply: [['v', 'Done, I transferred it. The code is four, eight, one, six.'], ['s', 'Excellent, thank you.']], win: '✅ The victim transferred the money and gave the code' },
    ],
  };
  // نصوص المكالمات القابلة للتعديل (call-scripts-ar.txt) — تُقرأ عند فتح الصفحة
  function parseScripts(txt) { // يقرأ الملف حتى لو كانت الكلمات المفتاحية مُشكَّلة، ويُبقي التشكيل في الجمل للنطق
    const out = {}; let cur = null, part = 'dialog';
    const bare = (x) => x.replace(/[ً-ٰٟـ]/g, '');
    for (let line of txt.replace(/^﻿/, '').split(/\r?\n/)) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const b = bare(line);
      let m = b.match(/^\[\s*مكالمة\s*:\s*([a-z]+)\s*\]$/i);
      if (m) { cur = out[m[1].toLowerCase()] = { dialog: [], cont: [], comply: [] }; part = 'dialog'; continue; }
      if (!cur) continue;
      if (/^-{2,}\s*متابعة/.test(b)) { part = 'cont'; continue; }
      if (/^-{2,}\s*استجابة/.test(b)) { part = 'comply'; continue; }
      m = b.match(/^(المحتال|الضحية)\s*(\*)?\s*[:：]/);
      if (!m) continue;
      const text = line.slice(line.search(/[:：]/) + 1).trim();
      const row = [m[1] === 'المحتال' ? 's' : 'v', text];
      if (m[2] && row[0] === 's') row.push(1);
      cur[part].push(row);
    }
    return out;
  }
  async function loadScripts() {
    try {
      const txt = await fetch('/call-scripts-ar.txt', { cache: 'no-store' }).then((r) => (r.ok ? r.text() : ''));
      const sc = parseScripts(txt);
      for (const c of CALLS.ar) {
        const x = sc[c.id]; if (!x || !x.dialog.length) continue;
        if (!x.dialog.some((r) => r[2])) x.dialog[x.dialog.length - 1][2] = 1; // لا بد من جملة حاسمة
        c.dialog = x.dialog; if (x.cont.length) c.cont = x.cont; if (x.comply.length) c.comply = x.comply;
      }
    } catch {}
  }
  const tt = (k, ...a) => { const v = T[lang][k]; return typeof v === 'function' ? v(...a) : v; };

  /* ------------------------------ الحالة ------------------------------ */
  let code = q.get('code') || store.get('scamPair', '');
  let es = null, linked = false, peer = false;
  let cfg = { ice: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const call = { on: false, sc: null, pc: null, local: null, pending: [], t0: 0, timer: null, said: new Set(), state: 'idle' };
  const sentAt = {};

  /* ------------------------------ موقع المحتال (لخريطة الهجمات) ------------------------------ */
  // تلقائي: الجهاز يحدد إمارته (إن سمح) وإلا يقدّرها الخادم من عنوان IP. أو يختار المقدّم إمارة/دولة للعرض.
  const EXT = ['GB', 'US', 'DE', 'FR', 'IN', 'PK', 'NG', 'PH', 'EG', 'RU', 'CN', 'TR', 'BR', 'ZA'];
  let autoEm = null;
  function locateSelf() {
    if (!navigator.geolocation || !window.UAE_MAP) return;
    navigator.geolocation.getCurrentPosition((p) => { const { longitude: lon, latitude: lat } = p.coords; autoEm = lon > 51 && lon < 56.6 && lat > 22.4 && lat < 26.4 ? window.UAE_MAP.emirateOf(lon, lat) : null; }, () => {}, { timeout: 8000, maximumAge: 3600000 });
  }
  function originPick() {
    const v = store.get('scamOrigin', 'auto');
    if (v === 'auto') return autoEm ? { emirate: autoEm } : 'auto';
    return /^AE-/.test(v) ? { emirate: v } : { country: v };
  }
  function renderOrigin() {
    const sel = $('#originSel'); if (!sel) return;
    $('#originLbl').textContent = tt('origin');
    const dn = (c) => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(c); } catch { return c; } };
    const ems = window.UAE_MAP ? window.UAE_MAP.shapes.map((x) => [x.iso, lang === 'ar' ? x.ar : x.en]) : [];
    sel.innerHTML = `<option value="auto">${tt('oAuto')}</option><optgroup label="${tt('oEm')}">${ems.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</optgroup><optgroup label="${tt('oOut')}">${EXT.map((c) => `<option value="${c}">${dn(c)}</option>`).join('')}</optgroup>`;
    sel.value = store.get('scamOrigin', 'auto');
    sel.onchange = () => { store.set('scamOrigin', sel.value); if (sel.value === 'auto') locateSelf(); };
  }
  if (store.get('scamOrigin', 'auto') === 'auto') locateSelf();

  /* ------------------------------ الواجهة ------------------------------ */
  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $('#tTitle').textContent = tt('title'); $('#tWarn').textContent = tt('warn'); $('#langBtn').textContent = tt('lang');
    $('#tabSms').textContent = tt('tabSms'); $('#tabCalls').textContent = tt('tabCalls');
    $('#sayTitle').textContent = tt('say'); $('#micLbl').textContent = tt('mic'); $('#outLbl').textContent = tt('outage');
    renderLink(); renderOrigin(); renderSms(); renderCalls(); if (call.on) renderCall();
  }
  function renderLink() {
    $('#linkCard').classList.toggle('on', linked && peer);
    $('#linkState').textContent = linked && peer ? tt('linked') : tt('waiting');
    $('#linkSub').textContent = !code ? tt('enterCode') : linked && !peer ? tt('offline') : linked ? '' : tt('enterCode');
    if (document.activeElement !== $('#codeInput')) $('#codeInput').value = code || '';
    document.querySelectorAll('.sc-btn').forEach((b) => { b.disabled = !(linked && peer) || call.on; });
    toParent({ type: 'link', linked: linked && peer });
  }
  function bubbleHTML(text) {
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return esc(text).replace(/(https?:\/\/[^\s]+)/g, '<span class="lnk">$1</span>');
  }
  function renderSms() {
    const pane = $('#paneSms'); pane.textContent = '';
    const fc = document.createElement('div'); fc.className = 'sc-card free';
    fc.innerHTML = `<div class="sc-card-h"><span class="sc-ico" style="background:#ffd60a">✍️</span><div class="sc-card-t"><b>${tt('freeSms')}</b><small>${tt('freeSmsD')}</small></div></div>
      <div class="row2"><input id="fFrom" dir="auto" placeholder="${tt('senderPh')}"><select id="fCh"><option value="sms">${tt('chSms')}</option><option value="wa">${tt('chWa')}</option><option value="mail">${tt('mail')}</option><option value="social">${tt('social')}</option><option value="qr">${tt('qr')}</option></select></div>
      <textarea id="fText" rows="3" dir="auto" placeholder="${tt('textPh')}"></textarea><button type="button" class="sc-btn" id="fSend">${tt('send')}</button><div class="sc-sent" id="fSent" hidden></div>`;
    pane.appendChild(fc);
    fc.querySelector('#fSend').addEventListener('click', async () => {
      const text = fc.querySelector('#fText').value.trim(); if (!text) return;
      const from = fc.querySelector('#fFrom').value.trim() || '0500000000', channel = fc.querySelector('#fCh').value;
      toParent({ type: 'sms-sent', id: 'free', channel });
      const r = await post('/api/sms', { room: code, from, text, channel, origin: originPick() }).catch(() => null);
      const j = r && r.ok ? await r.json() : null;
      const st = fc.querySelector('#fSent'); st.hidden = false; st.textContent = j && j.delivered ? tt('sent') : tt('notDelivered');
    });
    for (const s of SMS[lang]) {
      const card = document.createElement('div'); card.className = 'sc-card';
      card.innerHTML = `<div class="sc-card-h"><span class="sc-ico" style="background:${s.bg}">${s.ico}</span><div class="sc-card-t"><b></b><small>${tt(s.channel || 'sms')} • ${tt('from')}: <bdi></bdi></small></div></div><div class="sc-bubble" dir="auto">${bubbleHTML(s.text)}</div><button type="button" class="sc-btn">${tt('send')}</button><div class="sc-sent" hidden></div>`;
      card.querySelector('b').textContent = s.title; card.querySelector('bdi').textContent = s.from + (s.fromLabel ? ' — ' + s.fromLabel : '');
      const st = card.querySelector('.sc-sent');
      if (sentAt[s.id]) { st.hidden = false; st.textContent = sentAt[s.id]; }
      card.querySelector('.sc-btn').addEventListener('click', async () => {
        toParent({ type: 'sms-sent', id: s.id, channel: s.channel || 'sms' });
        const r = await post('/api/sms', { room: code, from: s.from, fromLabel: s.fromLabel || '', text: s.text, channel: s.channel || 'sms', origin: originPick() }).catch(() => null);
        const j = r && r.ok ? await r.json() : null;
        sentAt[s.id] = j && j.delivered ? tt('sent') : tt('notDelivered');
        st.hidden = false; st.textContent = sentAt[s.id];
      });
      pane.appendChild(card);
    }
    renderLinkButtons();
  }
  function renderCalls() {
    const pane = $('#paneCalls'); pane.textContent = '';
    const fc = document.createElement('div'); fc.className = 'sc-card free';
    fc.innerHTML = `<div class="sc-card-h"><span class="sc-ico" style="background:#ffd60a">🎙️</span><div class="sc-card-t"><b>${tt('freeCall')}</b><small>${tt('freeCallD')}</small></div></div>
      <div class="row2"><input id="cNum" dir="ltr" value="024144257" placeholder="${tt('numPh')}"><input id="cLabel" dir="auto" value="${lang === 'ar' ? 'بنك النخلة الوطني' : 'Nakhla National Bank'}" placeholder="${tt('labelPh')}"></div>
      <button type="button" class="sc-btn call">📞 ${tt('call')}</button>`;
    fc.querySelector('.sc-btn').addEventListener('click', () => { freeCaller = { num: fc.querySelector('#cNum').value.trim() || '024144257', label: fc.querySelector('#cLabel').value.trim() }; startCall('free'); });
    pane.appendChild(fc);
    for (const c of CALLS[lang]) {
      const card = document.createElement('div'); card.className = 'sc-card';
      card.innerHTML = `<div class="sc-card-h"><span class="sc-ico" style="background:${c.bg}">${c.ico}</span><div class="sc-card-t"><b></b><small dir="ltr">${c.num} • ${c.label}</small></div></div><div class="sc-desc"></div><button type="button" class="sc-btn call">📞 ${tt('call')}</button>`;
      card.querySelector('b').textContent = c.title; card.querySelector('.sc-desc').textContent = c.desc;
      card.querySelector('.sc-btn').addEventListener('click', () => startCall(c.id));
      pane.appendChild(card);
    }
    renderLinkButtons();
  }
  const renderLinkButtons = () => document.querySelectorAll('.sc-btn').forEach((b) => { b.disabled = !(linked && peer) || call.on; });
  document.querySelectorAll('.sc-seg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.sc-seg button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('#paneSms').hidden = b.dataset.tab !== 'sms'; $('#paneCalls').hidden = b.dataset.tab !== 'calls';
  }));
  $('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; store.set('lang', lang); render(); });
  $('#codeInput').addEventListener('input', (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v; if (v.length === 4) pair(v); });

  /* ------------------------------ الربط ------------------------------ */
  function pair(c) {
    if (!/^\d{4}$/.test(c)) return;
    if (c === code && es && es.readyState !== 2) return;
    code = c; store.set('scamPair', c); linked = false; peer = false;
    if (es) es.close();
    es = new EventSource(`/api/events?room=${c}&role=caller`);
    const on = (type, fn) => es.addEventListener(type, (e) => { try { fn(JSON.parse(e.data || '{}')); } catch (err) { console.error(err); } });
    on('hello', (d) => { linked = true; peer = !!d.peer; renderLink(); });
    on('peer', (d) => { peer = !!d.joined; renderLink(); });
    on('accepted', onAccepted); on('said', onSaid); on('declined', () => endCall(false, tt('declined'))); on('signal', onSignal);
    on('analysis', (d) => { call.analysis = d.state; renderCall(); });
    on('callEnded', (d) => {
      if (d && d.scammed && call.on) { const w = (CALLS[lang].find((c) => c.kind === d.scammed) || {}).win || tt('ended'); setSpeaking(w); toParent({ type: 'scammed', kind: d.scammed }); return endCall(false, w); } // تجاهلت الضحية التحذيرين في المكالمة الحية
      endCall(false, call.state === 'active' && $('#sayTitle').textContent === tt('spWait') ? tt('declinedByShield') : tt('ended'));
    });
    es.onerror = () => {
      if (es.readyState === 2) fetch('/api/room?code=' + c).then((r) => { if (r.status === 404) { linked = false; $('#linkSub').textContent = tt('bad'); renderLink(); } else setTimeout(() => pair(c), 1500); }).catch(() => setTimeout(() => pair(c), 2000));
      else { peer = false; renderLink(); }
    };
    renderLink();
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'pair' && e.data.code && e.data.code !== code) pair(e.data.code);
    if (e.data.type === 'pair' && e.data.code === code && !(es && es.readyState !== 2)) pair(e.data.code);
  });

  /* ------------------------------ المكالمة الحرة: تعرّف فعلي على الكلام ------------------------------ */
  let freeCaller = null, rec = null, listening = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function sayFree(text, typed) {
    if (!call.on || call.state !== 'active' || !text) return;
    addLine('s', text);
    post('/api/phrase', { room: code, text, source: typed ? 'typed' : 'asr' });
    toParent({ type: 'phrase' });
  }
  function setMic(on) {
    listening = on; $('#btnMic').classList.toggle('on', on);
    $('#interim').textContent = on ? tt('micOn') : tt('micOff');
  }
  function startListen() {
    if (!SR) { $('#interim').textContent = tt('micNA'); return; }
    try {
      rec = new SR(); rec.lang = lang === 'ar' ? 'ar-AE' : 'en-US'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) { const tx = r[0].transcript.trim(); if (tx) sayFree(tx); } else interim += r[0].transcript;
        }
        $('#interim').textContent = interim || tt('micOn');
      };
      rec.onerror = (ev) => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { setMic(false); $('#interim').textContent = tt('micDenied'); } };
      rec.onend = () => { if (listening && call.on) { try { rec.start(); } catch {} } };
      rec.start(); setMic(true);
    } catch { $('#interim').textContent = tt('micNA'); }
  }
  function stopListen() { listening = false; if (rec) { try { rec.stop(); } catch {} rec = null; } setMic(false); }
  $('#btnMic').addEventListener('click', () => (listening ? stopListen() : startListen()));
  const sendTyped = () => { const i = $('#freeText'); const v = i.value.trim(); if (v) { sayFree(v, true); i.value = ''; } };
  $('#btnFreeSend').addEventListener('click', sendTyped);
  $('#freeText').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendTyped(); });

  /* ------------------------------ المكالمة ------------------------------ */
  async function startCall(id) {
    if (!(linked && peer) || call.on) return;
    if (window.ShieldTones) window.ShieldTones.unlock();
    loadClips();
    call.sc = id; call.on = true; call.said = new Set(); call.state = 'ringing'; call.analysis = null;
    $('#phrases').textContent = ''; $('#sayTitle').textContent = tt('ringing');
    $('#micToggle').checked = !embed && store.get('scamMic', true);
    $('#outToggle').checked = false;
    $('#scCall').hidden = false; renderCall(); renderLinkButtons();
    await setupPC();
    const scx = id === 'free' ? freeCaller : CALLS[lang].find((c) => c.id === id);
    $('#freeBox').hidden = id !== 'free'; $('#freeText').placeholder = tt('typePh'); setMic(false);
    const r = await post('/api/call', { room: code, action: 'ring', from: scx.num, label: scx.label, origin: originPick() }).catch(() => null);
    if (!r || r.status !== 200) { const j = r ? await r.json().catch(() => ({})) : {}; endCall(false, j.error === 'busy' ? tt('busy') : tt('notDelivered')); return; }
    toParent({ type: 'call', state: 'ringing' });
    if (!embed && window.ShieldTones) window.ShieldTones.backStart(); // نغمة الانتظار للمتصل (في صفحة العرض يرن هاتف الضحية بدلًا منها)
  }
  async function setupPC() {
    call.local = null;
    if ($('#micToggle').checked) { try { call.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { call.local = null; $('#micToggle').checked = false; } }
    const pc = new RTCPeerConnection({ iceServers: cfg.ice });
    call.pc = pc; call.pending = [];
    if (call.local) call.local.getTracks().forEach((tr) => pc.addTrack(tr, call.local));
    pc.onicecandidate = (e) => { if (e.candidate) post('/api/signal', { room: code, role: 'caller', data: { cand: e.candidate } }); };
    pc.ontrack = (e) => { const a = $('#remoteAudio'); a.srcObject = e.streams[0] || new MediaStream([e.track]); a.muted = embed; a.play().catch(() => {}); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected' && !call.t0) { call.t0 = Date.now(); tick(); } };
  }
  async function onSignal(d) {
    const pc = call.pc; if (!pc) return;
    try {
      if (d.sdp) {
        await pc.setRemoteDescription(d.sdp);
        if (d.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); post('/api/signal', { room: code, role: 'caller', data: { sdp: pc.localDescription } }); }
        for (const c of call.pending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
      } else if (d.cand) { if (pc.remoteDescription) await pc.addIceCandidate(d.cand).catch(() => {}); else call.pending.push(d.cand); }
    } catch (e) { console.error(e); }
  }
  function onAccepted() {
    if (window.ShieldTones) window.ShieldTones.backStop();
    call.state = 'active'; call.t0 = Date.now(); tick(); renderCall();
    toParent({ type: 'call', state: 'active' });
    if (call.sc === 'free') { setSpeaking(tt('freeTitle')); return; }
    const sc = CALLS[lang].find((c) => c.id === call.sc);
    setTimeout(() => runDialog(sc.dialog, sc), 900);
  }
  // ينتظر ردّ هاتف الضحية (انتهاء نطق الجملة أو اختيارها بعد التنبيه)
  const waiters = {};
  function waitSaid(id, ms) {
    return new Promise((resolve) => { waiters[id] = resolve; if (ms) setTimeout(() => { if (waiters[id]) { delete waiters[id]; resolve({ timeout: true }); } }, ms); });
  }
  function onSaid(d) { const w = waiters[d.id]; if (w) { delete waiters[d.id]; w(d); } }
  function resolveAll() { for (const k of Object.keys(waiters)) { const w = waiters[k]; delete waiters[k]; w({ ended: true }); } }
  function addLine(who, text) {
    const box = $('#phrases');
    const d = document.createElement('div'); d.className = 'sc-line ' + who; d.dir = 'auto';
    d.innerHTML = `<small></small><div></div>`;
    d.querySelector('small').textContent = who === 's' ? tt('you') : tt('victimL');
    d.querySelector('div').textContent = ((x) => String(x).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, ''))(text); // النص المعروض بلا تشكيل
    box.appendChild(d); box.parentElement.scrollTop = box.parentElement.scrollHeight;
  }
  const setSpeaking = (txt) => { $('#sayTitle').textContent = txt; };
  let CLIPS = {};
  const loadClips = () => fetch('/api/clips', { cache: 'no-store' }).then((r) => r.json()).then((j) => { CLIPS = j.clips || {}; }).catch(() => {});
  async function runDialog(lines, sc) {
    const part = lines === sc.dialog ? 'dialog' : lines === sc.cont ? 'cont' : 'comply';
    let idx = -1;
    for (const [who, text, key] of lines) {
      idx++;
      const clip = lang === 'ar' && CLIPS[`${sc.id}:${part}:${idx}`] ? CLIPS[`${sc.id}:${part}:${idx}`].url : null;
      if (!call.on || call.state !== 'active') return;
      if (who === 's') {
        setSpeaking(tt('spS')); addLine('s', text);
        if (!embed) post('/api/voice', { room: code, text, clip }); // هاتف الضحية يسمع صوت المحتال أيضًا
        await window.ShieldVoice.say(text, { lang, role: 'scammer', clip });
        if (!call.on || call.state !== 'active') return;
        post('/api/phrase', { room: code, text, source: clip ? 'clip' : 'demo' }); // في العرض: النص يمثّل ناتج التعرف على الكلام
        toParent({ type: 'phrase', key: !!key });
        if (key) {
          setSpeaking(tt('spWait'));
          const d = await waitSaid('choice', 0);
          if (d.ended || !call.on) return;
          if (d.choice === 'continue' && lines === sc.dialog) return runDialog(sc.cont, sc);
          if (d.choice === 'continue' && lines === sc.cont) return runDialog(sc.comply, sc); // تجاهلت الضحية التحذير مرتين ← نجحت الخدعة
          setSpeaking(tt('spDone')); return;
        }
      } else {
        const id = Math.random().toString(36).slice(2);
        setSpeaking(tt('spV')); addLine('v', text);
        post('/api/say', { room: code, text, id, clip });
        if (!embed) window.ShieldVoice.say(text, { lang, role: 'victim', clip }); // هاتف المحتال يسمع ردّ الضحية أيضًا
        await waitSaid(id, clip ? 65000 : 4000 + text.length * 130);
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    if (lines === sc.comply && call.on) { // اكتملت الخدعة: إنهاء المكالمة وإطلاق العواقب على هاتف الضحية
      setSpeaking(sc.win);
      post('/api/call', { room: code, action: 'end', role: 'caller', scammed: sc.kind });
      toParent({ type: 'scammed', kind: sc.kind });
      endCall(false, sc.win);
      return;
    }
    setSpeaking(tt('spDone'));
  }
  function tick() {
    clearInterval(call.timer);
    call.timer = setInterval(() => { if (call.state === 'active') renderCallState(); }, 500);
  }
  function renderCallState() {
    const el = $('#callState');
    if (call.state === 'ringing') el.textContent = tt('ringing');
    else if (call.state === 'active') { const s = Math.floor((Date.now() - call.t0) / 1000); el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    else el.textContent = call.note || '';
  }
  function renderCall() {
    if (!call.on) return;
    const sc = CALLS[lang].find((c) => c.id === call.sc) || CALLS[lang][0];
    $('#callee').textContent = tt('victim');
    const sc0 = CALLS[lang].find((c) => c.id === call.sc);
    if (sc0) $('#callee').title = sc0.num;
    renderCallState();
    const pill = $('#callPill');
    const st = call.state !== 'active' ? 'wait' : call.analysis === 'paused' ? 'paused' : call.analysis === 'demo' ? 'demo' : call.analysis ? 'active' : 'active';
    pill.className = 'sc-pill' + (st === 'wait' ? ' idle' : st === 'paused' ? ' paused' : '');
    pill.textContent = st === 'wait' ? tt('pillWait') : st === 'paused' ? tt('pillPaused') : st === 'demo' ? tt('pillDemo') : tt('pillActive');
  }
  function endCall(notify, note) {
    if (!call.on || call.state === 'ended') return;
    resolveAll(); window.ShieldVoice.cancel(); stopListen(); if (window.ShieldTones) window.ShieldTones.backStop();
    if (notify) post('/api/call', { room: code, action: 'end', role: 'caller' });
    if (call.pc) { try { call.pc.close(); } catch {} call.pc = null; }
    if (call.local) { call.local.getTracks().forEach((t) => t.stop()); call.local = null; }
    clearInterval(call.timer); call.t0 = 0;
    call.state = 'ended'; call.note = note || tt('ended'); renderCallState();
    toParent({ type: 'call', state: 'ended' });
    setTimeout(() => { call.on = false; $('#scCall').hidden = true; renderLinkButtons(); }, 1100);
  }
  $('#btnHang').addEventListener('click', () => endCall(true));
  $('#outToggle').addEventListener('change', (e) => post('/api/outage', { room: code, on: e.target.checked }));
  $('#micToggle').addEventListener('change', (e) => store.set('scamMic', e.target.checked));

  /* ------------------------------ البدء ------------------------------ */
  const clock = () => { const d = new Date(); $('#scTime').textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`; };
  clock(); setInterval(clock, 10000);
  fetch('/api/config').then((r) => r.json()).then((c) => { cfg = c; }).catch(() => {});
  render();
  loadScripts(); loadClips();
  if (/^\d{4}$/.test(code)) pair(code);
  toParent({ type: 'ready' });
})();
