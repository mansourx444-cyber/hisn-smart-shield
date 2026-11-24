# حِصن — الدرع الذكي | مساعدك الشخصي للوقاية من الاحتيال الإلكتروني

**HISN — Smart Shield:** an on-device Arabic AI assistant that stops phone scams at the moment of risk. *(English version at the end ↓)*

| | |
|---|---|
| **فريق حِصن** | **قائد الفريق:** منصور صالح المنصوري · **عضو:** عبدالله سليمان الظنحاني · **عضو:** فيصل جاسم حسن جاسم |
| **المسابقة** | SCAMSHIELD AI Hackathon — 42 أبوظبي × شرطة أبوظبي |
| **جرّبه الآن** | **https://hisn-smart-shield.onrender.com** — رمزا QR (هاتف الضحية + هاتف المحتال)، و`/demo` للعرض الكامل في صفحة واحدة |
| **العرض والوصف التقني** | العرض التقديمي (34 شريحة: 17 عربي + 17 إنجليزي): [PowerPoint](docs/submission/HISN-Presentation-AR-EN.pptx) · [PDF](docs/submission/HISN-Presentation-AR-EN.pdf) — [وصف المشروع (PDF)](docs/submission/HISN-Project-Description-AR-EN.pdf) · [الوصف الموجز (PDF)](docs/submission/HISN-Brief-AR-EN.pdf) |
| **التشغيل** | `node server.js` (Node.js 22، **بلا أي مكتبات**) ← `http://localhost:3000` |

> **الفكرة في سطر:** «حِصن» يواكب استشراف دولة الإمارات للحد من الجرائم الإلكترونية عبر **الربط الإلكتروني** بين المتعامل والجهات (الهوية الرقمية، بوابة الجهات، تقارير الأدلة للشرطة)، ويعمل وفق **القوانين الاتحادية** لمكافحة الجرائم الإلكترونية وحماية البيانات.

---

## 1. المشكلة والحل

**المشكلة:** المحتال لا يخترق الهاتف، بل يخدع صاحبه: رسالة برابط يشبه موقع البنك، أو مكالمة باسم البنك أو الشرطة أو شركة الاتصالات تطلب رمز التحقق أو تحويل المال أو صلاحية الدخول للهاتف، وأحيانًا صوت مقلَّد للمدير بالذكاء الاصطناعي. الحلول الحالية إما تحذّر بعد فوات الأوان، أو تحظر بلا شرح فيتجاهلها المستخدم، وأغلبها لا يفهم العربية ولا اللهجة المحلية.

**الحل:** «حِصن» مساعد ذكي يعمل **على الهاتف** ويتدخل **في لحظة الخطر نفسها**: قبل فتح الرابط، وأثناء المكالمة والمكالمة مستمرة. يقول للمستخدم **ما الخطر، ولماذا اشتبه، وما الخطوة الآمنة الآن**، والقرار يبقى له. وتنشر الجهات (الشرطة، البنوك، هيئة الاتصالات) أساليب الاحتيال الجديدة عبر بوابة خاصة فتصل لكل الأجهزة فورًا، ويرصد «حِصن» النطاقات المنتحلة **قبل** أن تصل لأي ضحية.

---

## 2. المواءمة مع توجهات الدولة والقوانين

### استشراف الإمارات للحد من الجرائم الإلكترونية عبر الربط الإلكتروني

| التوجه الوطني | كيف يواكبه «حِصن» |
|---|---|
| **الاستراتيجية الوطنية للأمن السيبراني 2025–2031** (مجلس الأمن السيبراني) — التوعية والكشف المبكر بالذكاء الاصطناعي | توعية في لحظة الخطر بلغة بسيطة، ورصد مبكر للنطاقات المنتحلة من سجلات الشهادات قبل وصولها للضحايا |
| **الاستراتيجية الوطنية لمكافحة الاحتيال الإلكتروني** (وزارة الداخلية — الإدارة العامة للشرطة الجنائية الاتحادية) | محرك كشف + خريطة هجمات حسب الإمارة + تقرير أدلة جاهز للشرطة + بلاغ بضغطة |
| **الهوية الرقمية UAE PASS** | الدخول للتطبيق وبوابة الجهات بالهوية الرقمية (OAuth 2.0، بيئة الاختبار الرسمية) — بلا كلمات مرور |
| **الذكاء الاصطناعي المساعد في الحكومة** والمساعد الحكومي الشخصي **«ميرة»** (أُعلن في 23 نوفمبر 2026، والإتاحة للجمهور من مارس 2027) | «ميرة» تنجز المعاملة، و«حِصن» يحمي المتعامل ممّن ينتحل صفتها: يكشف أي رسالة أو رابط باسم «ميرة» يطلب رمزًا أو دفعًا أو دخولًا، ويرصد النطاقات المنتحلة لاسمها |
| **الربط الإلكتروني بين الجهات** | بوابة الجهات: الجهة الموثقة تنشر الممارسة فتصل لكل الأجهزة لحظيًا؛ واستخبارات النطاقات المرصودة تُشارك تلقائيًا؛ وتقارير أدلة بصيغة موحدة (PDF/JSON) |

### القوانين التي صُمّم «حِصن» ليعمل وفقها

| القانون | ما يعنيه في التصميم |
|---|---|
| **المرسوم بقانون اتحادي رقم (34) لسنة 2021 في شأن مكافحة الشائعات والجرائم الإلكترونية** وتعديلاته | «حِصن» أداة **وقاية وإبلاغ**: لا يخترق ولا يعترض اتصالات الآخرين، ولا يدخل الأنظمة إلا للصفحات العامة للروابط المشبوهة (http/https فقط، مع منع العناوين الداخلية). يحفظ الأدلة (سلسلة التحويل، بيانات التسجيل، بصمة SHA-256) لتسليمها للجهة المختصة |
| **المرسوم بقانون اتحادي رقم (45) لسنة 2021 بشأن حماية البيانات الشخصية** | تقليل البيانات إلى الحد الأدنى: الرسائل تُفحص على الهاتف ولا تُحفظ، والصوت والنص لا يُحفظان، والخريطة تحفظ **نوع الهجمة والإمارة فقط** (بلا أرقام ولا إحداثيات ولا عناوين IP)، ومشاركة الإمارة بموافقة المستخدم |
| **المرسوم بقانون اتحادي رقم (46) لسنة 2021 بشأن المعاملات الإلكترونية وخدمات الثقة** | الاعتماد على الهوية الرقمية الرسمية للدخول، وبصمة SHA-256 لكل تقرير أدلة لإثبات سلامته من التعديل |

> هذه مواءمة تصميمية من الفريق، وليست رأيًا قانونيًا. التشغيل الفعلي يحتاج اعتماد الجهات المختصة.

---

## 3. ماذا يقدّم «حِصن»

### تغطية حالات التحدي الست

كل حالة تُرسل من هاتف المحتال (القائمة تبدأ بـ «تحدي ١…٦»)، فيكشفها «حِصن» بتحذير، ثم تُعرض العاقبة إن تجاهلها المستخدم.

| # | الحالة | كيف تصل | كيف يكشفها «حِصن» | العاقبة المعروضة |
|---|---|---|---|---|
| 1 | بريد تصيّد وصفحة دخول مزيفة | تطبيق **البريد** | مرسل ونطاق ينتحلان البنك + طلب تسجيل الدخول عبر رابط | اختراق الحساب وتغيير كلمة المرور |
| 2 | لعبة تطلب أذونات زائدة | رابط تحميل | تحميل تطبيق من خارج المتجر الرسمي (apk) | تسريب الميكروفون والكاميرا وجهات الاتصال |
| 3 | تطبيق بنكي مزيف | رسالة «تحديث التطبيق» | نطاق يشبه البنك + تحميل من خارج المتجر + طلب تسجيل دخول | سرقة بيانات الدخول وسحب الرصيد |
| 4 | رمز QR تبرع مزيف | **الكاميرا** | رابط غير مشفّر + جهة خيرية غير رسمية + طلب دفع | صفحة تبرع مزيفة وسرقة البطاقة |
| 5 | صوت مقلَّد للمدير + رسالة متابعة بشعار رسمي | مكالمة + واتساب | طلب تحويل عاجل ثم رمز + تنبيه «قد يكون الصوت مقلَّدًا، تحقّق عبر رقمه المعروف» | تحويل المبلغ وإعطاء الرمز |
| 6 | حساب ينتحل علامة تجارية بمسابقة | تطبيق **التواصل** | انتحال العلامة + جائزة + طلب تسجيل الدخول عبر رابط | سرقة الحساب ونشر الخدعة |

وإضافةً لذلك: بطاقة «حماية حساباتك» (المصادقة متعددة العوامل، التحديثات، البلاغ الفوري)، وزر «🚩 بلّغ عن هذه الرسالة» في كل تحذير، وكشف طلب بيانات البطاقة والرقم السري وCVV.

### خمس مكالمات احتيال بأصوات إماراتية

مكالمات حية بين هاتفين (WebRTC) بحوار مسجَّل بلهجة إماراتية (50 مقطعًا في `voices/`)، ويظهر تنبيه «حِصن» **والمكالمة مستمرة**:

| المكالمة | الحيلة | التنبيه |
|---|---|---|
| موظف بنك مزيف | يطلب رمز التحقق | «لا تشارك الرمز» |
| شرطة مزيفة | «حسابج مرتبط بقضية» ثم تحويل لـ«حساب آمن» | «لا تحوّل أي مبلغ» |
| موافقة على إشعار الهوية الرقمية | يطلب الضغط على «موافق» في UAE PASS | «لا توافق على الطلب» |
| دعم فني مزيف | يطلب تثبيت تطبيق تحكم عن بعد | «لا تعطِ أحدًا صلاحية الدخول لهاتفك» |
| صوت المدير المقلَّد | تحويل عاجل وسري ثم الرمز | «تحقّق عبر رقمه المعروف» |

بعد التنبيه تختار الضحية «إنهاء المكالمة» أو «متابعة» (فيستمر الضغط ويعيد «حِصن» التنبيه). النصوص كاملة في [`public/call-scripts-ar.txt`](public/call-scripts-ar.txt).

### الحماية من انتحال «ميرة» (جديد)

- **في الرسائل:** أي رسالة تستخدم اسم «ميرة» بصيغة حكومية (المساعد ميرة، تطبيق ميرة، Meera…) مع رابط غير رسمي أو طلب رمز أو دفع أو دخول ← تحذير مع سبب واضح. قبل مارس 2027: «ميرة لم تُتح للجمهور بعد، فأي رسالة باسمها الآن انتحال».
- **بلا إنذار كاذب:** «ميرة» اسم شائع، فرسالة مثل «ميرة بنتي بتجي بكرة» لا تُعدّ مشبوهة.
- **في الرصد المبكر:** «ميرة / Meera» أول علامة في قائمة الرصد، لكشف النطاقات الجديدة التي تحمل اسمها.

### ماسح الروابط والأدلة والرصد المبكر (`/scan`)

| الميزة | ماذا تفعل |
|---|---|
| **ماسح دفعات** | قائمة روابط (أو ملف txt/csv) ← لكل رابط درجة 0–100 وحكم (احتيالي/مشبوه/سليم) وأسباب، وتصدير CSV وJSON. ومن سطر الأوامر: `npm run scan -- urls.txt > results.csv` |
| **قائمة رسمية** | 56 جهة محلية وعالمية بنطاقاتها الرسمية (البنوك الإماراتية، تم، الهوية الرقمية، الشرطة، سالك، الهيئات، «ميرة»…)، وكل نطاق `gov.ae` موثوق، حتى لا تُصنَّف المواقع الحقيقية احتيالًا |
| **فحص عميق** | يتتبع إعادة التوجيه والروابط المختصرة (حتى 8 خطوات)، ويكشف الإخفاء (Cloaking) بمقارنة ما يراه الهاتف بما يراه روبوت الفحص، ويقرأ محتوى الصفحة (اسم العلامة، حقول كلمة المرور والبطاقة) |
| **تقرير أدلة للشرطة** (`/evidence`) | رقم بلاغ، وطابع زمني، والدرجة والأسباب، وسلسلة التحويل، وبيانات تسجيل النطاق (المسجّل وتاريخ التسجيل وبريد البلاغات)، والاستضافة (IP والمزوّد والدولة)، وبصمة الصفحة، ولقطة شاشة، وبصمة SHA-256 للتقرير، وطلب إزالة جاهز بالعربية والإنجليزية. يُطبع PDF أو يُنزَّل JSON |
| **الرصد المبكر** | مصدران: سجلات شفافية الشهادات، ومولّد نحو 280 نطاقًا شبيهًا باسم العلامة يتحقق أيها مسجّل فعلًا ومتى سُجّل. النطاقات عالية الخطورة تُضاف لاستخبارات الجهات فيكشفها «حِصن» في الرسائل فورًا. النطاقات القديمة (أكثر من سنتين) تظهر «تحقّق من الملكية» بدل «احتيالي» |

**الدقة المقاسة** (`npm run eval`، عتبة 40/100، فحص سريع بلا إنترنت):

| المجموعة | الروابط | الدقة | الاستدعاء | الإنذار الكاذب |
|---|---|---|---|---|
| مجموعة التطوير (`tools/eval-links.csv`) | 106 | 100٪ | 98٪ | 0٪ |
| مجموعة عمياء لم تُضبط عليها القواعد (`tools/eval-blind.csv`) | 30 | 100٪ | 86.7٪ | 0٪ |

للصراحة: المجموعتان من إعدادنا (روابط رسمية حقيقية + روابط احتيال بأنماط شائعة)، والرقم الأدق هو نتيجة المجموعة العمياء. الفحص العميق يرفع الاستدعاء أكثر.

### 🗺️ خريطة الهجمات في الإمارات (`/map`)

- خريطة تفاعلية للإمارات السبع تتلوّن حسب عدد الهجمات، وتنبض كل هجمة جديدة لحظة وصولها، مع مرشّحات للفترة والنوع، وتقريب الإمارة بالضغط عليها.
- **داخلي وخارجي:** لكل هجمة مصدر (إمارة أو دولة) وهدف (إمارة الضحية)، وأقواس من المصدر للهدف، والهجمات الخارجية تأتي من حافة الخريطة مع علم دولتها.
- **المكالمة الحية:** عند اتصال المحتال في العرض يظهر موقعه فورًا بخط متقطع إلى إمارة الضحية. في التشغيل الفعلي يأتي موقع المتصل من شركات الاتصالات عبر هيئة تنظيم الاتصالات، لأن تطبيق الضحية لا يعرفه.
- **مصدر الروابط الاحتيالية:** الدول التي تُستضاف فيها، من عنوان IP لخادم الرابط.
- **محاكاة للعرض:** زر يولّد هجمات **مُعلَّمة «محاكاة»**، وزر لمسحها.

### 🏛️ بوابة الجهات (`/partners`)

يدخل مفوَّض الجهة بالهوية الرقمية وينشر ممارسة احتيال (عبارات ونطاقات)، فتصل فورًا لكل الأجهزة ويستخدمها المحرك في الرسائل والمكالمات. «حِصن» يتنبأ أيضًا بالنطاقات التي قد تُستخدم لانتحال الجهة ويراقبها، وتعرض البوابة عدد مرات الصد بفضل تحذيرات الجهة، بلا أي بيانات شخصية.

---

## 4. الاختيارات التقنية وأسبابها

| الاختيار | السبب |
|---|---|
| **محرك عربي قائم على القواعد ومعالجة اللغة** (`public/engine.js`) | لا توجد بيانات عربية موسومة كافية لاحتيال الإمارات؛ القواعد قابلة للتفسير (يشرح **لماذا** اشتبه)، وتعمل **على الجهاز** دون إرسال الرسائل لأي خادم، وفورية، و57 اختبارًا تضمن سلوكها |
| **تعلّم آلي مستمر: شبكة عصبية خفيفة** (`public/learn.js`) فوق المحرك | تلتقط صياغات جديدة لم تُكتب لها قاعدة (94٪ على صياغات لم ترها). مقاطع حروف 3–5 + كلمات ← 4096 ← 16 ← احتمال، مضغوطة int8 (~86 KB). تتدرّب من ممارسات الجهات وقرارات المحرك الواثقة ونتائج المكالمات، وتحفظ الأوزان فقط بلا نصوص، ولا تنبّه وحدها إلا على **طلب** يتعلق **بشيء حساس** |
| **فهم النفي والسياق** | «لا تشارك الرمز» تحذير و«عطني الرمز» احتيال، ويكشف حيلة «لا تشارك الرمز مع أحد… بس عطني إياه» |
| **فهم «إعادة إرسال الرمز»** | يجمع ما سيصل للضحية (رمز/OTP/الأرقام) + طلب الإرسال (طرش/حوّل/فورورد) + الوجهة (واتسابي/رقمي/الرابط) |
| **مسافة التحرير (Levenshtein) + فحوص النطاق** | كشف الروابط المنتحلة (أخطاء إملائية، نطاق فرعي، أرقام بدل حروف، Punycode) دون قوائم سوداء تتأخر دائمًا |
| **بوابة الجهات** | الجهة تضيف الأسلوب الجديد فيعمل فورًا بلا تحديث للتطبيق |
| **WebRTC** للمكالمة | صوت مباشر بين الهاتفين؛ الخادم يمرّر الإشارات فقط |
| **التعرّف على الكلام** (Web Speech API، واختياريًا `gpt-4o-transcribe`) | يعمل بلا مفاتيح في العرض، ويمكن تفعيل تفريغ أدق بمفتاح |
| **نموذج لغوي اختياري** (`gpt-4o-mini`) | «رأي ثانٍ» وشرح مبسط فقط؛ القرار للمحرك القابل للتفسير |
| **Node.js 22 بلا مكتبات خارجية** | تشغيل بأمر واحد، ولا ثغرات من اعتماديات، ويسهل على المحكّمين تشغيله |
| **تطبيق ويب يُفتح من QR** | يجربه أي شخص فورًا بلا تثبيت |

### الذكاء الاصطناعي في كل مرحلة

| المرحلة | التقنية | دورها |
|---|---|---|
| الرسائل وواتساب | معالجة اللغة العربية (NLP) + تصنيف الهندسة الاجتماعية | رصد الاستعجال والتهديد وطلب البيانات |
| الروابط | تشابه نصي + أحرف مضللة + استخبارات التهديد | كشف الموقع المزيف قبل فتحه |
| المكالمات | تعرّف الكلام (ASR) + NLP + النية + الكيانات (NER) | ما يطلبه المتصل والجهة التي ينتحلها |
| القرار | دمج المؤشرات + ذكاء قابل للتفسير (XAI) | تحذير واحد واضح مع السبب |
| بوابة الجهات | استخراج العبارات + توليد نطاقات الانتحال | بلاغ الجهة يصبح كشفًا فوريًا |
| السياق | نموذج لغوي كبير (اختياري) | تأكيد الحالات الملتبسة |

### إرشادات الخبراء… يطبّقها «حِصن» تلقائيًا نيابة عن المستخدم

| الإرشاد | ما يفعله «حِصن» تلقائيًا | المصدر |
|---|---|---|
| احذر اللغة العاجلة والتهديد بعواقب فورية | كشف الاستعجال والتهديد بمعالجة اللغة | CISA |
| احذر طلب معلوماتك الشخصية والمالية | كشف طلب البطاقة أو الرمز أو كلمة المرور | CISA |
| احذر الروابط المختصرة والأسماء الخاطئة مثل amazan.com | فحص الاختصار + التشابه + استبدال الحروف | CISA |
| تأكد أن العنوان يبدأ بـ https وبلا أخطاء إملائية | فحص التشفير والتشابه الإملائي | صحيفة الخليج |
| لا تشارك بياناتك المصرفية قبل التأكد من هوية المتصل | فحص المرسل + كشف طلب الرمز في المكالمة | صحيفة الخليج |
| عند الشك أغلق الخط وتواصل مع الجهة مباشرة | زر «إنهاء المكالمة» داخل التحذير | NCSC |

### المقايضات

- القواعد أضعف أمام صياغة جديدة تمامًا؛ عوّضناها بالشبكة العصبية وبوابة الجهات والتحليل المركّب (الجهة + الطلب + القناة).
- تطبيق الويب لا يصل للمكالمات والرسائل العادية (قيود iOS وAndroid)، فالعرض يستخدم مكالمة ورسائل داخل التطبيق.
- الخادم يحفظ الحد الأدنى فقط في `data/`: ممارسات الجهات (`patterns.json`)، وأوزان الشبكة (`model.json`)، وسجل الخريطة (`attacks.json`: النوع والإمارة فقط). الاستضافة المجانية تنام بعد 15 دقيقة وقد تُمسح `data/` عند إعادة النشر.
- الهوية الرقمية مربوطة فعليًا ببيئة الاختبار الرسمية لـ UAE PASS (البيانات العامة `sandbox_stage`)، وتحتاج حسابًا تجريبيًا، لذلك يوجد بجانبها «دخول تجريبي للعرض». التشغيل الفعلي يحتاج انضمام الجهة لـ UAE PASS.

---

## 5. الأدوات والـ APIs والبيانات

| المصدر | الاستخدام | ملاحظات |
|---|---|---|
| **UAE PASS** (`stg-id.uaepass.ae`) | الدخول بالهوية الرقمية للتطبيق وبوابة الجهات (OAuth 2.0) | بيئة الاختبار الرسمية؛ نأخذ الاسم ونوع الحساب فقط |
| **RDAP** عبر سجل IANA (`data.iana.org/rdap/dns.json`)، وبديله rdap.org، وARIN/RIPE للعناوين | تاريخ تسجيل النطاق والمسجّل وبريد البلاغات والاستضافة | بديل WHOIS الرسمي |
| **crt.sh** (سجلات شفافية الشهادات) | الرصد المبكر للنطاقات الجديدة | |
| **DNS** | التحقق أي النطاقات الشبيهة مسجّلة فعلًا | من الخادم مباشرة |
| **ipwho.is** | تقدير الإمارة أو الدولة من عنوان IP للخريطة | يُحذف العنوان بعد التقدير |
| **thum.io** | لقطة شاشة للصفحة في تقرير الأدلة | |
| **geoBoundaries** | حدود الإمارات السبع في الخريطة | رخصة CC BY 4.0 |
| **OpenAI** (اختياري) | `gpt-4o-transcribe` للتفريغ اللحظي، و`gpt-4o-mini` للرأي الثاني | يعمل العرض كاملًا بدونه |
| **Web Speech API** | التعرف على الكلام ونطق النتيجة في المتصفح | بلا مفاتيح |

**البيانات:**
- `public/engine.js` (`ENTITIES`): 56 جهة ونطاقاتها الرسمية.
- `learn-seed.js`: أمثلة التدريب الأولية للشبكة العصبية.
- `tools/eval-links.csv` (106 روابط) و`tools/eval-blind.csv` (30 رابطًا): مجموعتا القياس.
- `voices/`: 50 مقطعًا صوتيًا لحوارات المكالمات الخمس.
- الجهات الوهمية في العرض: «بنك النخلة الوطني» و«مصرف الخليج الأزرق».

**كود طرف ثالث:** `public/qrcode.js` (Kazuhiko Arase، MIT). الخطوط: Noto Kufi Arabic وInter (SIL OFL).

---

## 6. البناء والتشغيل

```bash
git clone https://github.com/mansourx444-cyber/hisn-smart-shield.git
cd hisn-smart-shield
node server.js              # Node.js 22، بلا npm install ← http://localhost:3000
npm test                    # 57 اختبارًا للمحرك
npm run eval                # دقة كشف الروابط على مجموعتي القياس
npm run scan -- urls.txt    # فحص دفعة روابط ← CSV
```

| الصفحة | الغرض |
|---|---|
| `/` | التطبيق، ومنه رمزا QR للهاتفين |
| `/demo` | العرض الحي: هاتف الضحية + هاتف المحتال + خط المعالجة |
| `/scan` · `/evidence` | ماسح الروابط والرصد المبكر · تقرير الأدلة |
| `/map` | خريطة الهجمات |
| `/partners` | بوابة الجهات |
| `/iphone` · `/scammer` · `/settings` | هاتف بتصميم آيفون · هاتف المحتال · الإعدادات ورفع الأصوات |

| المتغير | الافتراضي | الغرض |
|---|---|---|
| `PORT` | `3000` | منفذ الخادم |
| `OPENAI_API_KEY` | — | يفعّل التفريغ اللحظي والمساعد (يبقى على الخادم) |
| `STT_MODEL` / `ASSIST_MODEL` | `gpt-4o-transcribe` / `gpt-4o-mini` | نموذجا التفريغ والمساعد |
| `UAEPASS_ENV` / `UAEPASS_CLIENT_ID` / `UAEPASS_CLIENT_SECRET` | `stg` / `sandbox_stage` | الهوية الرقمية (`prod` للتشغيل الفعلي) |
| `TURN_URL` / `TURN_USER` / `TURN_PASS` | — | إذا كان الهاتفان على شبكتين وتعذّر وصل الصوت |
| `SSL_KEY` / `SSL_CERT` | — | HTTPS محلي (الميكروفون يتطلب HTTPS) |

**النشر:** `render.yaml` جاهز لـ Render (أمر التشغيل `node server.js`)، والتفاصيل في [docs/03-deploy.md](docs/03-deploy.md). وللعرض المحلي على الجوال: `cloudflared tunnel --url http://localhost:3000`.

---

## 7. دليل العرض أمام اللجنة

1. افتح `/demo` (أو امسح رمزي QR بهاتفين). على هاتف الضحية: «فعّل الحماية» بالهوية الرقمية أو الدخول التجريبي.
2. من هاتف المحتال أرسل «رسالة توصيل مشبوهة» ← تنبيه تلقائي ← اضغط الرابط ← تحذير أول ثم تأكيد ثانٍ ← «رجوع».
3. أرسل «رسالة سليمة» و«رمز بنكي حقيقي» ← تُفحص بهدوء بلا إنذار.
4. اختر إحدى المكالمات الخمس ← ردّ ← يظهر التنبيه والمكالمة مستمرة، وموقع المحتال على الخريطة.
5. «ماذا لو تجاهلت التحذير؟» ← محاكاة العاقبة ثم «ما الذي كان سيحميك».
6. افتح `/scan` ← «مثال» ← فحص عميق ← تقرير أدلة؛ ثم «الرصد المبكر» واختر «ميرة / Meera».
7. افتح `/partners` وانشر ممارسة جديدة ← تصل فورًا للهاتف.

| الحالة | المطلوب |
|---|---|
| رسالة رسوم توصيل عبر رابط | تنبيه + سبب + خطوة التحقق |
| رسالة سليمة / «لا تشارك الرمز» في مكالمة | بلا إنذار |
| «عطني رمز التحقق» في مكالمة | «لا تشارك الرمز» والمكالمة مستمرة |
| رسالة باسم «ميرة» برابط | تحذير انتحال «ميرة» |
| انقطاع خدمة التحليل | «⚠️ الفحص متوقف» |

---

## 8. الخصوصية

- الرسائل تُفحص على هاتف المستخدم ولا تُحفظ؛ الخادم يمرّرها فقط.
- الصوت يُرسل للتفريغ أثناء المكالمة فقط ولا يُحفظ هو ولا النص؛ السجلات أحداث بلا محتوى.
- الخريطة: نوع الهجمة والإمارة فقط. الإمارة من الهاتف إذا فعّل المستخدم «شارك إمارتك فقط»، وإلا تُقدَّر من عنوان IP ثم يُحذف العنوان. عنوان MAC لا يُستخدم.
- 🔒 «حِصن» لا يطّلع على ملفاتك الخاصة، وليس برنامج تجسس أو تتبع.

---

## 9. حدود الديمو والمرحلة التالية

- **لم يُنفَّذ بعد (صراحة):** مسح نتائج البحث والخرائط بحثًا عن أرقام خدمة عملاء مزيفة (يحتاج مفاتيح مثل Google Places)، والمقارنة البصرية للصفحات.
- **ما تُرك عمدًا:** تطبيق أصلي، وربط فعلي مع البنوك وشركات الاتصالات، وقاعدة بيانات وصلاحيات حقيقية لبوابة الجهات، وخادم TURN.
- **المرحلة التالية:** تطبيق أندرويد (`NotificationListenerService`) ثم iOS (Message Filter Extension)؛ فحص المكالمات مع شركات الاتصالات؛ نموذج عربي أعمق (مثل AraBERT) بتعلّم موحّد يبقي البيانات على الجهاز؛ كشف الأصوات المولّدة؛ والتكامل مع «ميرة» والقنوات الحكومية الرسمية للتحقق من هوية المتصل.

---

## 10. الملفات

```
server.js            خادم بلا مكتبات: الملفات + إشارات WebRTC + تمرير الرسائل + الواجهات البرمجية
scanner.js           الفحص العميق للروابط، والأدلة (RDAP)، والرصد المبكر (crt.sh + DNS)
uaepass.js           الدخول بالهوية الرقمية UAE PASS (OAuth 2.0)
attacks.js           سجل الهجمات لخريطة الإمارات (النوع والإمارة فقط)
learn-seed.js        أمثلة التدريب الأولية للشبكة العصبية
public/engine.js     محرك الكشف (الرسائل والروابط والمكالمات) — يعمل في المتصفح والخادم
public/learn.js      الشبكة العصبية الخفيفة (تعلّم مستمر)
public/app.js        التطبيق: التفعيل، الرسائل، متصفح الدرع، المكالمة
public/demo.*        صفحة العرض الحي          public/iphone.*    هاتف بتصميم آيفون
public/scan.html     الماسح والرصد المبكر      public/evidence.html  تقرير الأدلة
public/map.html      خريطة الهجمات             public/uae-map.js  حدود الإمارات (CC BY 4.0)
public/partners.*    بوابة الجهات              public/scammer.*   هاتف المحتال
public/settings.*    الإعدادات ورفع الأصوات    public/call-scripts-ar.txt  نصوص المكالمات
test/engine.test.js  اختبارات المحرك
tools/               القياس (eval.js + مجموعتا الروابط) والفحص من سطر الأوامر (scan.js)
voices/              مقاطع المكالمات الصوتية
docs/                التوثيق والعرض والوصف التقني (docs/submission)
render.yaml          النشر على Render
```

📚 التوثيق: [العمليات](docs/01-processes.md) · [منهجية 4D](docs/02-4D.md) · [النشر](docs/03-deploy.md)

---

## English version

**Team HISN:** Mansour Saleh Al Mansoori (team lead) · Abdulla Sulaiman Aldhanhani (member) · Faisal Jasim Hasan Jasim (member) — SCAMSHIELD AI Hackathon (42 Abu Dhabi × Abu Dhabi Police).
**Live:** https://hisn-smart-shield.onrender.com · **Presentation:** [PPTX](docs/submission/HISN-Presentation-AR-EN.pptx) · [PDF](docs/submission/HISN-Presentation-AR-EN.pdf) · **Run:** `node server.js` (Node.js 22, zero dependencies) → `http://localhost:3000`

**Problem.** Scammers don't hack phones, they trick people: SMS with look-alike bank links, or calls "from the bank / police / telecom" asking for the OTP, a money transfer, remote access, or a UAE PASS approval — sometimes with an AI-cloned voice of the victim's manager. Existing tools warn too late or block without explanation, and rarely understand Arabic or the Emirati dialect.

**Solution.** HISN is an on-device AI assistant that steps in *at the moment of risk* — before a link opens and during a live call (the call keeps going). It explains what the risk is, why it is suspicious and the safe next step; the user decides. Authorities publish new scam patterns through a portal and every device gets them instantly, and HISN detects impersonating domains before they reach any victim.

**Alignment with UAE direction and law.** HISN follows the UAE's foresight on reducing cybercrime through **electronic linkage** between people and authorities: UAE PASS sign-in, an authority portal that pushes patterns to all devices, shared domain intel and standard police evidence reports. It supports the National Cybersecurity Strategy 2025–2031 (awareness and AI-driven early detection) and the Ministry of Interior's national strategy to combat cyber fraud. It also protects users against impersonation of **Meera**, the UAE Government's new personal AI assistant (announced 23 Nov 2026, public from March 2027). It is designed around Federal Decree-Law No. 34 of 2021 on Combatting Rumours and Cybercrimes (prevention and reporting only, no interception, public pages only, preserved evidence), No. 45 of 2021 on Personal Data Protection (data minimisation: messages analysed on the device, no audio or transcripts stored, the map keeps attack type and emirate only), and No. 46 of 2021 on Electronic Transactions and Trust Services (official digital identity, SHA-256 report integrity). This is the team's design alignment, not legal advice.

**Features.** The six challenge cases; five live scam calls with Emirati voices (fake bank, fake police and "safe account", UAE PASS approval, fake tech support with remote access, cloned boss voice); Meera-impersonation detection without flagging the everyday name; `/scan` batch link scanner (0–100 score, verdict, reasons, CSV/JSON), deep scan (redirects, cloaking, page content), police evidence report (`/evidence`: RDAP registrar, creation date, abuse contact, hosting, screenshot, SHA-256, bilingual takedown request), and early detection from Certificate Transparency plus ~280 DNS-checked look-alikes per brand; a live interactive UAE attack map (`/map`, domestic vs. external origins, live call origin); and an authority portal (`/partners`).

**Technical choices.** A rule-based Arabic NLP engine (normalisation, dialect, intent, negation and context; explainable, on-device, 57 tests) plus a continuously-learning lightweight neural network (`public/learn.js`: char 3–5-grams + words → hashing 4096 → dense 16 → sigmoid, int8 ~86 KB; 94% on unseen phrasings) that alerts on its own only for a *request* involving a *sensitive item*. Link analysis: official-domain match, entity/domain mismatch, entity-as-subdomain, digit-for-letter, Levenshtein look-alikes, Punycode, IP, @, shorteners, risky TLDs, HTTP, phishing paths and authority intel. WebRTC for call audio; Web Speech API or optional `gpt-4o-transcribe`; optional `gpt-4o-mini` as a second opinion only.

**AI at every stage.** Messages: Arabic NLP + social-engineering classification · Links: string similarity + deceptive characters + threat intel · Calls: speech recognition (ASR) + NLP + intent + entities (NER) · Decision: signal fusion + explainable AI (XAI) · Authority portal: keyphrase extraction + impersonation-domain generation · Context: optional LLM for ambiguous cases.

**Expert advice applied automatically.** Urgent/threatening language, requests for personal or financial data, and shortened or misspelled links (CISA); https and spelling checks, and never sharing bank details before verifying the caller (Al Khaleej); "if in doubt, hang up and contact the organisation directly" as an *End call* button inside the warning (NCSC).

**Tools, APIs and data.** UAE PASS staging (OAuth 2.0), RDAP via the IANA bootstrap (fallback rdap.org; ARIN/RIPE for IPs), crt.sh, DNS, ipwho.is, thum.io, geoBoundaries (CC BY 4.0), optional OpenAI. Data: 56 official entities, the neural-network seed set, two labelled link sets (106 dev / 30 blind), 50 voice clips.

**Measured.** `npm run eval`: 100% precision / 98% recall on the dev set and 100% precision / 86.7% recall on the blind set, 0% false positives on official sites. Both sets were prepared by the team; the blind set is the honest number.

**Trade-offs and next.** Rules miss brand-new phrasings (mitigated by the neural network and the authority portal). A web app cannot read real calls or SMS, so the demo uses in-app ones. The server keeps only patterns, model weights and map entries in `data/`. UAE PASS is wired to the official staging environment, with a demo sign-in beside it. Next: native Android and iOS, telecom-level call screening, a deeper Arabic model with federated learning, synthetic-voice detection, and integration with Meera and other official government channels.

**Build and run.** `node server.js` · `npm test` · `npm run eval` · `npm run scan -- urls.txt`. Pages: `/demo`, `/scan`, `/evidence`, `/map`, `/partners`, `/iphone`.

**Third-party code.** `public/qrcode.js` (Kazuhiko Arase, MIT). Fonts: Noto Kufi Arabic, Inter (SIL OFL).
