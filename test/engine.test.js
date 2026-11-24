// تشغيل: node test/engine.test.js
const E = require('../public/engine.js');
let pass = 0, fail = 0;
function t(name, cond, info) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, info !== undefined ? JSON.stringify(info) : ''); }
}
const call = (s, ctx = [], lang = 'ar') => E.analyzeUtterance(s, ctx, lang).alerts.map((a) => a.type);

console.log('\n— المكالمات: رمز التحقق —');
const alertOtp = [
  'عطني رمز التحقق',
  'أنا من البنك، عطنا رمز التحقق عشان نوقف العملية',
  'لو سمحت اقرالي الكود اللي وصلك',
  'شو الرمز اللي وصلك على جوالك؟',
  'ممكن ترسلي الرقم السري؟',
  'وصلتك رسالة فيها أرقام؟ قولها لي',
  'لا تشارك الرمز مع أي أحد، بس عطني إياه أنا عشان أوقف العملية',
  'نحتاج الكود عشان نكمل التحقق',
  'Please read me the code you just received',
  'Can you give me the OTP?',
];
for (const s of alertOtp) t('تنبيه: ' + s, call(s).includes('otp'), call(s));
t('تنبيه بالسياق: «قوله لي» بعد ذكر الرمز', call('طيب قوله لي', ['وصلك الرمز؟']).includes('otp'));

const noOtp = [
  'لا تشارك رمز التحقق',
  'لا تشارك الرمز مع أي أحد',
  'تذكّر أن البنك ما يطلب منك الرمز أبدًا',
  'راح يوصلك رمز تحقق، لا تعطيه لأي أحد',
  'لا تشارك الرمز مع أحد حتى لو قال لك عطني إياه',
  'عطني دقيقة أشوف الموضوع',
  'أمس جاني رمز من البنك وما عطيته أحد',
  'Never share your code with anyone',
  'We will never ask for your OTP',
  'السلام عليكم، شلونك؟ إن شاء الله بخير',
];
for (const s of noOtp) t('بلا إنذار: ' + s, call(s).length === 0, call(s));
t('بلا إنذار: «عطني دقيقة» بعد ذكر الرمز', call('عطني دقيقة', ['لا تشارك الرمز']).length === 0);

console.log('\n— المكالمات: تحويل مالي عاجل —');
const alertTr = [
  'لازم تحول المبلغ الحين وإلا بيتجمد حسابك',
  'حوّل خمسة آلاف درهم فورًا لحساب آمن',
  'ادفع الغرامة اليوم عشان ما يتوقف حسابك',
  'You need to transfer the money now or your account will be frozen',
];
for (const s of alertTr) t('تنبيه: ' + s, call(s).includes('transfer'), call(s));
const noTr = ['لا تحوّل أي مبلغ لأي أحد', 'تكلمنا حول الموضوع أمس', 'ما تحتاج تدفع شي الحين', 'دفعت الفاتورة أمس'];
for (const s of noTr) t('بلا إنذار: ' + s, !call(s).includes('transfer'), call(s));

console.log('\n— المكالمات: موافقة على إجراء —');
const alertAp = [
  'بيوصلك إشعار على الجوال، اضغط موافق بسرعة',
  'وافق على الطلب اللي في UAE PASS',
  'نزّل تطبيق AnyDesk عشان نساعدك',
  'Just tap approve on the notification',
];
for (const s of alertAp) t('تنبيه: ' + s, call(s).some((x) => x === 'approval' || x === 'remote'), call(s));
t('بلا إنذار: لا توافق على أي طلب ما بدأته', call('لا توافق على أي طلب ما بدأته').length === 0, call('لا توافق على أي طلب ما بدأته'));

console.log('\n— نص البطاقة —');
const card = E.analyzeUtterance('أنا من البنك، عطنا رمز التحقق عشان نوقف العملية', [], 'ar').alerts[0];
t('العنوان', card.title === 'لا تشارك الرمز', card);
t('السبب', card.reason === 'المتصل طلب منك رمز تحقق.', card);
t('الخطوة', card.step === 'أنهِ المكالمة وتواصل مع البنك عبر تطبيقه الرسمي.', card);

console.log('\n— الرسائل والروابط —');
const m = (s, lang = 'ar') => E.analyzeMessage(s, lang);
let r = m('بريد الإمارات: شحنتك معلّقة لعدم دفع رسوم التوصيل 7.50 درهم. ادفع خلال 24 ساعة: https://emiratespost-ae.example/pay');
t('رسوم توصيل عبر رابط تجريبي ← تحذير', r.level === 'danger' && r.title === 'لا تدفع عبر هذا الرابط', r);
t('سبب اختلاف النطاق مذكور', r.reasons.some((x) => x.includes('نطاق مختلف')), r.reasons);
t('خطوة التحقق تذكر النطاق الرسمي', r.step.includes('emiratespost.ae'), r.step);

r = m('Your parcel is on hold. Pay the 5 AED fee now: http://bit.ly/3xYz', 'en');
t('EN shortener + fee → danger', r.level === 'danger', r);

r = m('رمز التحقق الخاص بك هو 482913. لا تشاركه مع أي أحد.');
t('رسالة رمز حقيقية بلا رابط ← تحقّق (ليست تحذيرًا)', r.level === 'verify', r);

r = m('أرسل لنا رمز التحقق الذي وصلك لتأكيد استلام الجائزة');
t('طلب مشاركة رمز ← لا تشارك الرمز', r.level === 'danger' && r.title === 'لا تشارك الرمز', r);

r = m('https://www.adcb.com/en/personal');
t('رابط رسمي وحده ← تحقّق + سبب رسمي', r.level === 'verify' && r.reasons[0].includes('الرسمي'), r);

r = m('بنك أبوظبي التجاري: تم إيقاف بطاقتك، حدّث بياناتك هنا https://adcb-secure-update.top/login');
t('انتحال بنك + بيانات ← لا تُدخل بياناتك', r.level === 'danger' && r.title === 'لا تُدخل بياناتك', r);

r = m('http://192.168.10.5/verify');
t('رابط IP ← تحذير', r.level === 'danger', r);

r = m('مرحبا، موعدنا بكرة الساعة 5');
t('رسالة عادية ← تحقّق', r.level === 'verify', r);

r = m('https://emiratesposts.com/track');
t('تشابه بالاسم (typo) ← تحذير', r.level === 'danger', r);

r = m('بريد الإمارات: شحنتك معلّقة لعدم دفع رسوم التوصيل 7.50 درهم. ادفع خلال 24 ساعة: https://emiratespost-ae.example/pay');
t('ملخص يربط الطلب بالنطاق', r.summary === 'الرسالة تطلب دفع رسوم توصيل بشكل عاجل، والرابط يقود إلى نطاق يختلف عن النطاق الرسمي لـبريد الإمارات.', r.summary);
t('خطورة مرتفعة ← تأكيد ثانٍ', r.risk === 'high', r.risk);
t('العاقبة', r.consequence === 'قد يطلب هذا الموقع بيانات بطاقتك.', r.consequence);
t('خطوة الشحنة', r.step.startsWith('تحقّق من الشحنة عبر تطبيق بريد الإمارات'), r.step);
r = m('https://emiratesposts.com/track');
t('رابط مشابه وحده ← خطورة متوسطة (تحذير واحد)', r.risk === 'medium', r);
r = m('ميرة: جواز سفرك ينتهي قريبًا، جدّد الآن عبر المساعد ميرة https://meera-uae.top/renew');
t('انتحال «ميرة» برابط ← تحذير + سبب ميرة', r.level === 'danger' && r.summary.includes('«ميرة»'), r);
r = m('مرحبا، أنا من مساعد ميرة الحكومي. أرسل لنا رمز التحقق لتفعيل حسابك');
t('انتحال «ميرة» بطلب رمز ← لا تشارك الرمز', r.level === 'danger' && r.title === 'لا تشارك الرمز' && r.summary.includes('«ميرة»'), r);
r = m('ميرة بنتي بتجي بكرة الساعة 5');
t('اسم «ميرة» العادي ← بلا تحذير', r.level === 'verify', r);
console.log(`\n${pass} نجح، ${fail} فشل\n`);
process.exit(fail ? 1 : 0);
