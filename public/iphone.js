/* الدرع الذكي — وضع العرض داخل هاتف بتصميم آيفون (/iphone)
 * شاشة رئيسية بتطبيقات وهمية + تطبيق رسائل بمحادثات وهمية + إشعارات منسدلة
 * و«الدرع الذكي» يعمل داخله تطبيقًا حقيقيًا متصلًا بالخادم.
 */
(() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  if (!(location.pathname.replace(/\/$/, '') === '/iphone' || q.has('iphone'))) return;
  const S = window.Shield;
  if (!S) return;
  const embed = q.get('frame') === '0'; // داخل صفحة العرض بهاتفين
  const toParent = (msg) => { if (embed && window.parent !== window) window.parent.postMessage({ src: 'victim', ...msg }, location.origin); };
  if (embed) S.hooks.noMic = true;

  /* ------------------------------ النصوص ------------------------------ */
  const L = {
    ar: {
      apps: { messages: 'الرسائل', phone: 'الهاتف', browser: 'المتصفح', camera: 'الكاميرا', photos: 'الصور', weather: 'الطقس', clock: 'الساعة', calendar: 'التقويم', maps: 'الخرائط', notes: 'الملاحظات', settings: 'الإعدادات', store: 'المتجر', bank: 'بنك النخلة', delivery: 'التوصيل', mail: 'البريد', social: 'تواصل', whatsapp: 'واتساب', shield: 'حِصن' },
      chats: 'الدردشات', simTag: 'محاكاة توعوية — ماذا لو تجاهلت التحذير',
      now: 'الآن', textMsgStamp: 'رسالة نصية', today: 'اليوم', yesterday: 'أمس', notContact: 'المرسل ليس في قائمة جهات الاتصال.', reportJunk: 'الإبلاغ عن رسالة غير مرغوب فيها', edit: 'تعديل', search: 'بحث', back: 'الرسائل', textMsg: 'رسالة نصية', shieldTag: 'حِصن', details: 'التفاصيل', checked: 'فحصها الدرع',
      weatherCity: 'أبوظبي', weatherDesc: 'مشمس', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      side: { title: 'حِصن', sub: 'عرض تجريبي داخل هاتف', code: 'رمز ربط الهاتف الثاني', open: 'افتح الهاتف الثاني (مرسل ومتصل) في نافذة جديدة', steps: ['اضغط تطبيق «الدرع الذكي» وفعّل الحماية', 'من الهاتف الثاني أرسل «رسالة توصيل مشبوهة»', 'لاحظ الإشعار التلقائي، ثم افتح الرابط من «الرسائل»', 'اتصل من الهاتف الثاني واطلب رمز التحقق'], inactive: 'فعّل الحماية أولًا من تطبيق الدرع' },
      threads: [
        { name: 'أمي', color: '#f59e0b', msgs: [['in', 'لا تنسى تمر علينا بعد الدوام 🌙', 95], ['out', 'إن شاء الله، بمر الساعة 8', 90]] },
        { name: 'أحمد', color: '#3b82f6', msgs: [['out', 'وصلت؟', 40], ['in', 'هلا، وصلت البيت. نتقابل بكرة؟', 35]] },
        { name: 'مجموعة الدفعة', color: '#10b981', msgs: [['in', 'المحاضرة بكرة في القاعة 3 الساعة 9 الصبح', 300]] },
        { name: 'بنك النخلة', color: '#6366f1', msgs: [['in', 'تم خصم 45.00 درهم من بطاقتك لدى سوبرماركت. إذا لم تقم بهذه العملية تواصل معنا عبر التطبيق.', 1440]] },
        { app: 'wa', name: 'العائلة 👨‍👩‍👧', color: '#25d366', msgs: [['in', 'جمعة مباركة 🌸', 600], ['out', 'وعليكم 🤍', 590]] },
        { app: 'wa', name: 'سالم', color: '#f97316', msgs: [['in', 'شفت الصور اللي أرسلتها؟', 120]] },
      ],
    },
    en: {
      apps: { messages: 'Messages', phone: 'Phone', browser: 'Browser', camera: 'Camera', photos: 'Photos', weather: 'Weather', clock: 'Clock', calendar: 'Calendar', maps: 'Maps', notes: 'Notes', settings: 'Settings', store: 'Store', bank: 'Nakhla Bank', delivery: 'Delivery', mail: 'Mail', social: 'Social', whatsapp: 'WhatsApp', shield: 'HISN' },
      chats: 'Chats', simTag: 'Awareness simulation — what if you ignored the warning',
      now: 'now', textMsgStamp: 'Text Message', today: 'Today', yesterday: 'Yesterday', notContact: 'The sender is not in your contact list.', reportJunk: 'Report Junk', edit: 'Edit', search: 'Search', back: 'Messages', textMsg: 'Text Message', shieldTag: 'HISN', details: 'Details', checked: 'Checked by Shield',
      weatherCity: 'Abu Dhabi', weatherDesc: 'Sunny', days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      side: { title: 'HISN', sub: 'Demo inside a phone', code: 'Second-phone pairing code', open: 'Open the second phone (sender / caller) in a new window', steps: ['Tap the Smart Shield app and turn on protection', 'From the second phone send the “suspicious delivery message”', 'See the automatic alert, then open the link from Messages', 'Call from the second phone and ask for the code'], inactive: 'Turn on protection in the Shield app first' },
      threads: [
        { name: 'Mom', color: '#f59e0b', msgs: [['in', 'Don’t forget to pass by after work 🌙', 95], ['out', 'Sure, I’ll come at 8', 90]] },
        { name: 'Ahmed', color: '#3b82f6', msgs: [['out', 'Did you get home?', 40], ['in', 'Yes, home now. Meet tomorrow?', 35]] },
        { name: 'Class group', color: '#10b981', msgs: [['in', 'Lecture tomorrow in room 3 at 9 AM', 300]] },
        { name: 'Nakhla Bank', color: '#6366f1', msgs: [['in', 'AED 45.00 was charged to your card at a supermarket. If this wasn’t you, contact us through the app.', 1440]] },
        { app: 'wa', name: 'Family 👨‍👩‍👧', color: '#25d366', msgs: [['in', 'Happy Friday 🌸', 600], ['out', 'Same to you 🤍', 590]] },
        { app: 'wa', name: 'Salem', color: '#f97316', msgs: [['in', 'Did you see the photos I sent?', 120]] },
      ],
    },
  };
  let lang = S.lang;
  const tx = () => L[lang];

  /* ------------------------------ أيقونات ------------------------------ */
  const W = 'fill="#fff"';
  const ICONS = {
    messages: ['linear-gradient(#65f37a,#0bc43a)', `<svg viewBox="0 0 60 60"><path ${W} d="M30 13c-11.6 0-21 7.6-21 17 0 5.4 3.1 10.2 8 13.3-.4 2.9-1.8 5.6-3.9 7.5 4.3-.2 8.2-1.7 11.1-4.3 1.9.4 3.8.6 5.8.6 11.6 0 21-7.6 21-17S41.6 13 30 13z"/></svg>`],
    phone: ['linear-gradient(#65f37a,#0bc43a)', `<svg viewBox="0 0 60 60"><path ${W} d="M22.6 15.4c-1-1.3-2.9-1.5-4.1-.4l-3.4 3c-1.6 1.4-2.2 3.6-1.5 5.6 3.8 10.7 11.8 19.2 22.3 23.4 2 .8 4.3.3 5.8-1.2l3.1-3.2c1.2-1.2 1.1-3.2-.2-4.2l-5.6-4.3c-1.1-.8-2.6-.8-3.6.1l-2.4 2.1c-4.4-2.3-7.8-5.9-9.9-10.4l2.2-2.3c.9-1 1-2.5.2-3.6z"/></svg>`],
    browser: ['linear-gradient(#fff,#e8eef8)', `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="none" stroke="#1a8cff" stroke-width="3"/><path fill="#ff3b30" d="M30 30l11-11-7 15z"/><path fill="#c7cdd6" d="M30 30L19 41l7-15z"/></svg>`],
    camera: ['linear-gradient(#d9dce1,#a7acb4)', `<svg viewBox="0 0 60 60"><rect x="11" y="19" width="38" height="26" rx="6" fill="#2c2c2e"/><rect x="23" y="15" width="14" height="6" rx="2" fill="#2c2c2e"/><circle cx="30" cy="32" r="8" fill="#5a5a5e" stroke="#9aa0a8" stroke-width="2"/></svg>`],
    photos: ['#fff', `<svg viewBox="0 0 60 60">${['#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#5856d6', '#af52de', '#ff2d55'].map((c, i) => `<ellipse cx="30" cy="19" rx="6" ry="10" fill="${c}" opacity=".85" transform="rotate(${i * 45} 30 30)"/>`).join('')}</svg>`],
    weather: ['linear-gradient(#4aa7ff,#1d6fe0)', `<svg viewBox="0 0 60 60"><circle cx="24" cy="25" r="9" fill="#ffd60a"/><path ${W} d="M22 43h20a7 7 0 0 0 0-14 9 9 0 0 0-17 3 6 6 0 0 0-3 11z"/></svg>`],
    clock: ['#000', `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="#fff"/><path d="M30 30V17M30 30l9 5" stroke="#000" stroke-width="2.5" stroke-linecap="round"/><path d="M30 30l-8-9" stroke="#ff9500" stroke-width="1.5"/></svg>`],
    calendar: ['#fff', ''],
    maps: ['linear-gradient(#d7f0c8,#a5dc8b)', `<svg viewBox="0 0 60 60"><path d="M8 40L52 22" stroke="#fff" stroke-width="6"/><path d="M28 8v44" stroke="#ffd60a" stroke-width="5"/><circle cx="40" cy="20" r="6" fill="#007aff" stroke="#fff" stroke-width="2"/></svg>`],
    notes: ['linear-gradient(#fff 0 30%,#fffdf4 30%)', `<svg viewBox="0 0 60 60"><rect x="0" y="0" width="60" height="16" fill="#ffd60a"/>${[26, 34, 42].map((y) => `<path d="M12 ${y}h36" stroke="#d6d1bf" stroke-width="2"/>`).join('')}</svg>`],
    settings: ['linear-gradient(#a0a5ad,#6e737b)', `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="15" fill="none" stroke="#3a3d42" stroke-width="7" stroke-dasharray="4.7 3"/><circle cx="30" cy="30" r="12" fill="#d0d3d8"/><circle cx="30" cy="30" r="5" fill="#6e737b"/></svg>`],
    store: ['linear-gradient(#ff7aa2,#e8326a)', `<svg viewBox="0 0 60 60"><path ${W} d="M17 23h26l-2 22H19z"/><path d="M24 25v-4a6 6 0 0 1 12 0v4" stroke="#fff" stroke-width="3" fill="none"/></svg>`],
    bank: ['linear-gradient(#7c7ff5,#4c4fd6)', `<svg viewBox="0 0 60 60"><path ${W} d="M30 12L12 22h36z"/><path d="M16 25h4v15h-4zM25 25h4v15h-4zM31 25h4v15h-4zM40 25h4v15h-4z" fill="#fff"/><rect x="12" y="42" width="36" height="4" fill="#fff"/></svg>`],
    delivery: ['linear-gradient(#ffb347,#f07d00)', `<svg viewBox="0 0 60 60"><path ${W} d="M30 12l17 8v20l-17 8-17-8V20z"/><path d="M13 20l17 8 17-8M30 28v20" stroke="#f07d00" stroke-width="2.5" fill="none"/></svg>`],
    social: ['linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 85%,#4f5bd5)', `<svg viewBox="0 0 60 60"><rect x="14" y="14" width="32" height="32" rx="10" fill="none" stroke="#fff" stroke-width="4"/><circle cx="30" cy="30" r="7.5" fill="none" stroke="#fff" stroke-width="4"/><circle cx="39.5" cy="20.5" r="2.4" fill="#fff"/></svg>`],
    mail: ['linear-gradient(#5ac8fa,#1a7cf5)', `<svg viewBox="0 0 60 60"><rect x="11" y="18" width="38" height="25" rx="4" ${W}/><path d="M12 20l18 13 18-13" stroke="#1a7cf5" stroke-width="2.5" fill="none"/></svg>`],
    whatsapp: ['linear-gradient(#5cf28a,#1ebe5a)', `<svg viewBox="0 0 60 60"><path ${W} d="M30 11a19 19 0 0 0-16.4 28.6L11 49l9.7-2.5A19 19 0 1 0 30 11z"/><path fill="#1ebe5a" d="M23.5 21.5c.6-.6 1.6-.6 2 .1l2 3.2c.3.5.2 1.2-.2 1.6l-1.2 1.2c1.3 2.6 3.4 4.7 6 6l1.2-1.2c.4-.4 1.1-.5 1.6-.2l3.2 2c.7.4.8 1.4.1 2l-1.6 1.6c-1 1-2.5 1.3-3.8.8-5-2-9-6-11-11-.5-1.3-.2-2.8.8-3.8z"/></svg>`],
    shield: ['linear-gradient(#13284d,#0b1730)', `<img src="icon.svg" alt="" style="width:84%;height:84%">`],
  };
  function iconHTML(id) {
    const [bg, svg] = ICONS[id];
    if (id === 'calendar') {
      const d = new Date();
      return `<div class="ip-icon cal" style="background:${bg}"><span class="cal-day">${tx().days[d.getDay()]}</span><span class="cal-num">${d.getDate()}</span></div>`;
    }
    return `<div class="ip-icon" style="background:${bg}">${svg}</div>`;
  }

  /* ------------------------------ البناء ------------------------------ */
  const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  document.body.classList.add('iphone');
  const SCREEN = `<div class="ip-screen" id="ipScreen">
          <div class="ip-status" id="ipStatus">
            <span class="ip-time" id="ipTime"></span>
            <div class="ip-island"></div>
            <span class="ip-icons">
              <svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="6" width="3" height="6" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
              <svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5l2.4-2.6a3.4 3.4 0 0 0-4.8 0zM3.5 6.8a6.4 6.4 0 0 1 9 0l1.6-1.7a8.7 8.7 0 0 0-12.2 0zM.4 3.5a11 11 0 0 1 15.2 0L16 3.1 14.7 1.7a12.9 12.9 0 0 0-13.4 0L0 3.1z"/></svg>
              <svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" opacity=".4"/></svg>
            </span>
          </div>

          <div class="ip-view ip-home active" id="ipHome">
            <div class="ip-widgets">
              <div class="ip-widget w-weather" id="wWeather"></div>
              <div class="ip-widget w-cal" id="wCal"></div>
            </div>
            <div class="ip-grid" id="ipGrid"></div>
            <div class="ip-dots"><i class="on"></i><i></i></div>
            <div class="ip-dock" id="ipDock"></div>
          </div>

          <div class="ip-view ip-msgs" id="ipMsgs">
            <div class="m-list" id="mList"></div>
            <div class="m-thread" id="mThread" hidden></div>
          </div>

          <div class="ip-view ip-app" id="ipApp"></div>

          <div class="ip-banners" id="ipBanners"></div>
          <button class="ip-homebar" id="ipHomebar" type="button" aria-label="Home"></button>
        </div>`;
  const stage = embed ? el(SCREEN) : el(`<div class="ip-stage"><div class="ip-device" id="ipDevice"><div class="ip-btn ip-btn-l1"></div><div class="ip-btn ip-btn-l2"></div><div class="ip-btn ip-btn-l3"></div><div class="ip-btn ip-btn-r"></div>${SCREEN}</div><aside class="ip-side" id="ipSide"></aside></div>`);
  if (embed) document.body.classList.add('embed');
  document.body.prepend(stage);

  // انقل «الدرع الذكي» إلى داخل الهاتف
  const app = document.getElementById('ipApp');
  const screen = document.getElementById('ipScreen');
  app.append(document.querySelector('header.top'), document.querySelector('main'));
  ['linkWarn', 'alertCard', 'toastHost'].forEach((id) => screen.appendChild(document.getElementById(id)));

  /* ------------------------------ التنقل ------------------------------ */
  let view = 'home';
  const MSGV = { messages: 'sms', wa: 'wa', mail: 'mail', social: 'social' }; // تطبيقات الرسائل: نصية، واتساب، بريد، تواصل اجتماعي
  function openView(name) {
    if (view === name) return;
    document.querySelectorAll('.ip-view').forEach((v) => v.classList.remove('active', 'opening'));
    if (MSGV[name]) { curApp = MSGV[name]; ['wa', 'mail', 'social'].forEach((c) => document.getElementById('ipMsgs').classList.toggle(c, curApp === c)); openThread = null; document.getElementById('mThread').hidden = true; }
    const v = document.getElementById({ home: 'ipHome', messages: 'ipMsgs', wa: 'ipMsgs', mail: 'ipMsgs', social: 'ipMsgs', app: 'ipApp' }[name]);
    v.classList.add('active'); if (name !== 'home') v.classList.add('opening');
    view = name;
    document.getElementById('ipBanners').textContent = '';
    screen.classList.toggle('dark-status', name !== 'messages');
    if (MSGV[name]) renderMsgs();
  }
  let curApp = 'sms';
  document.getElementById('ipHomebar').addEventListener('click', () => { openView('home'); closeThread(); });

  /* ------------------------------ الشاشة الرئيسية ------------------------------ */
  const GRID = ['whatsapp', 'social', 'mail', 'camera', 'photos', 'calendar', 'clock', 'maps', 'weather', 'store', 'bank', 'delivery'];
  const DOCK = ['phone', 'messages', 'browser', 'shield'];
  let unread = 0;
  function appTile(id, label) {
    const b = el(`<button type="button" class="ip-app-tile" data-app="${id}">${iconHTML(id)}${label ? `<span class="ip-label">${tx().apps[id]}</span>` : ''}${['messages', 'whatsapp', 'mail', 'social'].includes(id) ? '<span class="ip-badge" hidden></span>' : ''}</button>`);
    b.addEventListener('click', () => launch(id, b));
    return b;
  }
  function renderHome() {
    const grid = document.getElementById('ipGrid'); grid.textContent = '';
    GRID.forEach((id) => grid.appendChild(appTile(id, true)));
    grid.appendChild(appTile('shield', true));
    const dock = document.getElementById('ipDock'); dock.textContent = '';
    DOCK.forEach((id) => dock.appendChild(appTile(id, false)));
    const d = new Date();
    document.getElementById('wWeather').innerHTML = `<div class="w-city">${tx().weatherCity} ➤</div><div class="w-temp">26°</div><div class="w-desc">☀️ ${tx().weatherDesc}</div><div class="w-hl">H:29° L:22°</div>`;
    document.getElementById('wCal').innerHTML = `<div class="c-day">${tx().days[d.getDay()]}</div><div class="c-num">${d.getDate()}</div><div class="c-ev"><b></b>${lang === 'ar' ? 'عرض المشروع للجنة' : 'Project demo'}</div>`;
    updateBadge();
  }
  function launch(id, btn) {
    if (id === 'messages') return openView('messages');
    if (id === 'whatsapp') return openView('wa');
    if (id === 'mail' || id === 'social') return openView(id);
    if (id === 'shield') return openView('app');
    btn.classList.remove('bounce'); void btn.offsetWidth; btn.classList.add('bounce'); // تطبيقات وهمية
  }
  function updateBadge() {
    document.querySelectorAll('.ip-app-tile').forEach((tile) => {
      const app = { messages: 'sms', whatsapp: 'wa', mail: 'mail', social: 'social' }[tile.dataset.app] || null;
      const b = tile.querySelector('.ip-badge'); if (!b || !app) return;
      const n = threads.filter((t) => (t.app || 'sms') === app).reduce((a, t) => a + t.unread, 0);
      b.hidden = !n; b.textContent = n;
    });
  }

  /* ------------------------------ تطبيق الرسائل ------------------------------ */
  let threads = [];
  function seedThreads() {
    const now = Date.now();
    threads = tx().threads.map((th) => ({ app: th.app || 'sms', name: th.name, color: th.color, unread: 0, msgs: th.msgs.map(([dir, text, minsAgo]) => ({ dir, text, at: now - minsAgo * 60000 })) }));
  }
  let openThread = null;
  function fmtStamp(ts) {
    const d = new Date(ts), now = new Date();
    const time = d.toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-GB', { hour: 'numeric', minute: '2-digit' });
    return (d.toDateString() === now.toDateString() ? tx().today : tx().yesterday) + ' ' + time;
  }
  function fmtTime(ts) {
    const d = new Date(ts), now = new Date();
    const loc = lang === 'ar' ? 'ar-AE' : 'en-GB';
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    return lang === 'ar' ? 'أمس' : 'Yesterday';
  }
  const initials = (n) => n.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 1) || '#';
  const PERSON = '<svg viewBox="0 0 40 40" width="70%" height="70%"><circle cx="20" cy="15" r="7" fill="#fff"/><path d="M6 36c1.5-7.5 7-11 14-11s12.5 3.5 14 11" fill="#fff"/></svg>';
  const avatar = (th, cls) => `<span class="m-av${cls || ''}" style="background:${th.unknown ? 'linear-gradient(#a5a9b2,#858a94)' : th.color}">${th.unknown ? PERSON : initials(th.name)}</span>`;
  function renderMsgs() {
    const T = tx();
    const list = document.getElementById('mList');
    const sorted = threads.filter((t) => (t.app || 'sms') === curApp).sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at);
    list.innerHTML = `<div class="m-top"><span class="m-edit">${T.edit}</span><span class="m-compose">✎</span></div><h1 class="m-title">${curApp === 'wa' ? T.chats : curApp === 'mail' ? T.apps.mail : curApp === 'social' ? T.apps.social : T.apps.messages}</h1><div class="m-search">⌕ ${T.search}</div><ul class="m-rows"></ul>`;
    const ul = list.querySelector('.m-rows');
    for (const th of sorted) {
      const last = th.msgs[th.msgs.length - 1];
      const danger = last.item && S.isDanger(last.item);
      const li = el(`<li class="m-row"><span class="m-dot" ${th.unread ? '' : 'style="visibility:hidden"'}></span>${avatar(th)}<div class="m-mid"><div class="m-line1"><b dir="auto"></b><span class="m-time">${fmtTime(last.at)} ›</span></div><div class="m-prev" dir="auto"></div>${danger ? `<div class="m-flag">⛔ ${T.shieldTag}: ${S.headline(last.item)}</div>` : ''}</div></li>`);
      li.querySelector('b').textContent = th.name;
      if (th.label) { const lb = document.createElement('div'); lb.className = 'm-label'; lb.textContent = th.label; li.querySelector('.m-line1').after(lb); }
      li.querySelector('.m-prev').textContent = last.text;
      li.addEventListener('click', () => showThread(th));
      ul.appendChild(li);
    }
    if (openThread) showThread(openThread, true);
  }
  function showThread(th, keepScroll) {
    const T = tx();
    openThread = th; unread -= th.unread; th.unread = 0; updateBadge();
    const box = document.getElementById('mThread');
    const prevScroll = keepScroll ? box.querySelector('.t-body') && box.querySelector('.t-body').scrollTop : null;
    box.hidden = false;
    box.innerHTML = `<div class="t-head"><button type="button" class="t-back">‹ ${T.back}</button><div class="t-who">${avatar(th, ' sm')}<span class="t-name" dir="auto"></span></div></div><div class="t-body"></div><div class="t-input"><span class="t-plus">+</span><span class="t-field">${T.textMsg}</span><span class="t-mic">🎙</span></div>`;
    box.querySelector('.t-name').textContent = th.name;
    if (th.label) { const lb = document.createElement('span'); lb.className = 't-label'; lb.textContent = th.label; box.querySelector('.t-name').after(lb); }
    box.querySelector('.t-back').addEventListener('click', closeThread);
    const body = box.querySelector('.t-body');
    let lastDay = '';
    for (const m of th.msgs) {
      const day = new Date(m.at).toDateString();
      if (day !== lastDay) { lastDay = day; body.appendChild(el(curApp === 'wa' ? `<div class="t-stamp wa-day">${fmtStamp(m.at).split(' ')[0]}</div>` : `<div class="t-stamp"><b>${T.textMsgStamp}</b><br>${fmtStamp(m.at)}</div>`)); }
      const b = el(`<div class="bub ${m.dir}"><div class="bub-txt" dir="auto"></div></div>`);
      linkify(b.querySelector('.bub-txt'), m.text);
      body.appendChild(b);
      if (m.item && m.item.scanned) {
        const danger = S.isDanger(m.item);
        const chip = el(`<button type="button" class="shield-chip ${danger ? 'danger' : 'ok'}"><img src="icon.svg" alt=""><span></span>${danger ? `<u>${T.details}</u>` : ''}</button>`);
        chip.querySelector('span').textContent = danger ? `${T.shieldTag}: ${S.headline(m.item)}` : `✓ ${T.checked}`;
        if (danger) chip.addEventListener('click', () => S.openItem(m.item));
        body.appendChild(chip);
      }
    }
    if (th.unknown && curApp === 'sms') body.appendChild(el(`<div class="t-junk">${T.notContact}<br><a href="#">${T.reportJunk}</a></div>`));
    body.scrollTop = prevScroll != null ? prevScroll : body.scrollHeight;
    if (!keepScroll) box.classList.add('slide'); else box.classList.remove('slide');
  }
  function closeThread() { openThread = null; const b = document.getElementById('mThread'); b.hidden = true; if (view === 'messages') renderMsgs(); }
  function linkify(node, text) {
    let rest = text;
    for (const u of S.extractUrls(text)) {
      const i = rest.indexOf(u.raw); if (i < 0) continue;
      node.appendChild(document.createTextNode(rest.slice(0, i)));
      const a = document.createElement('a'); a.href = '#'; a.textContent = u.raw;
      a.addEventListener('click', (e) => { e.preventDefault(); S.openLink(u.raw, text); });
      node.appendChild(a); rest = rest.slice(i + u.raw.length);
    }
    node.appendChild(document.createTextNode(rest));
  }

  /* ------------------------------ الإشعارات المنسدلة ------------------------------ */
  function banner({ icon, app: appName, title, body, danger, onTap, ttl = 7000 }) {
    const host = document.getElementById('ipBanners');
    const b = el(`<button type="button" class="ip-banner${danger ? ' danger' : ''}"><div class="bn-ico">${iconHTML(icon)}</div><div class="bn-main"><div class="bn-top"><span class="bn-app"></span><span class="bn-now">${tx().now}</span></div><div class="bn-title" dir="auto"></div><div class="bn-body" dir="auto"></div></div></button>`);
    b.querySelector('.bn-app').textContent = appName;
    b.querySelector('.bn-title').textContent = title;
    b.querySelector('.bn-body').textContent = body;
    b.addEventListener('click', () => { b.remove(); onTap && onTap(); });
    host.appendChild(b);
    while (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 350); }, ttl);
  }

  /* ------------------------------ الربط بالتطبيق ------------------------------ */
  S.hooks.sms = (item) => {
    if (item.channel === 'qr') return qrScan(item);
    const app = { wa: 'wa', mail: 'mail', social: 'social' }[item.channel] || 'sms';
    let th = threads.find((x) => x.name === item.from && (x.app || 'sms') === app);
    if (!th) { th = { app, name: item.from, color: '#8e8e93', unknown: true, unread: 0, msgs: [] }; threads.push(th); }
    if (item.fromLabel) th.label = item.fromLabel;
    chime();
    const vv = S.verdict(item);
    toParent({ type: 'sms-received', from: item.from, label: item.fromLabel || '', channel: app, danger: S.isDanger(item), hosts: vv ? vv.urls : [], reasons: vv ? vv.reasons.slice(0, 3) : [], title: vv ? vv.title : '', pattern: vv ? vv.matchedPattern : null, level: vv ? vv.level : 'off', links: window.ShieldEngine && window.ShieldEngine.linkReport ? window.ShieldEngine.linkReport(item.text || '', lang) : [] });
    th.msgs.push({ dir: 'in', text: item.text, at: item.at || Date.now(), item });
    const vname = app === 'sms' ? 'messages' : app;
    const reading = view === vname && curApp === app && openThread === th;
    if (!reading) { th.unread++; unread++; updateBadge(); }
    if (view === vname && curApp === app) renderMsgs();
    const bIcon = { sms: 'messages', wa: 'whatsapp', mail: 'mail', social: 'social' }[app];
    if (!reading) banner({ icon: bIcon, app: tx().apps[bIcon], title: item.from, body: item.text, onTap: () => { openView(vname); showThread(th); } });
  };
  // مسح رمز QR من ملصق في مكان عام (الكاميرا) ← «حِصن» يفحص الرابط قبل فتحه
  function qrSvg(u) { try { const q = window.qrcode(0, 'M'); q.addData(u); q.make(); return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }); } catch { return ''; } }
  function qrScan(item) {
    openView('home'); chime();
    const url = (window.ShieldEngine.extractUrls(item.text)[0] || {}).raw || '';
    let host = url; try { host = new URL(/^https?:/.test(url) ? url : 'http://' + url).hostname; } catch {}
    const cells = Array.from({ length: 121 }, (_, i) => { const r = Math.floor(i / 11), c = i % 11; const finder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3); return `<i class="${finder || ((i * 7 + r * 3) % 5 < 2) ? 'on' : ''}"></i>`; }).join('');
    const cam = el(`<div class="qrcam"><div class="qr-top">${tx().apps.camera}</div><div class="qr-poster"><b></b><div class="qr-code">${qrSvg(url) || cells}</div><small>${lang === 'ar' ? 'امسح للتبرع' : 'Scan to donate'}</small></div><div class="qr-frame"></div><button type="button" class="qr-chip" hidden>🔗 <span></span></button><button type="button" class="qr-x">✕</button></div>`);
    cam.querySelector('.qr-poster b').textContent = item.text.replace(/https?:\/\/\S+/g, '').replace(/[—:]\s*$/, '').trim();
    cam.querySelector('.qr-chip span').textContent = (lang === 'ar' ? 'افتح ' : 'Open ') + host;
    screen.appendChild(cam);
    setTimeout(() => { const c = cam.querySelector('.qr-chip'); c.hidden = false; }, 1600);
    cam.querySelector('.qr-chip').addEventListener('click', () => { cam.remove(); S.openLink(url, item.text); });
    cam.querySelector('.qr-x').addEventListener('click', () => cam.remove());
    toParent({ type: 'sms-received', from: item.from, channel: 'qr', danger: S.isDanger(item) });
  }
  S.hooks.notify = (item, title, body) => {
    toParent({ type: 'danger', kind: 'sms' });
    setTimeout(() => {
      banner({ icon: 'shield', app: tx().apps.shield, title: '⛔ ' + title, body, danger: true, ttl: 14000, onTap: () => S.openItem(item) });
      if (MSGV[view]) renderMsgs();
    }, 700);
  };
  S.hooks.nlp = (d) => toParent({ type: 'nlp', text: d.text, nlp: d.nlp, ms: d.ms, source: d.source });
  S.hooks.ring = () => { openView('app'); toParent({ type: 'call', state: 'ringing' }); if (!embed && window.ShieldTones) window.ShieldTones.ringStart(); };
  S.hooks.call = (state) => { if (window.ShieldTones) window.ShieldTones.ringStop(); toParent({ type: 'call', state }); };
  S.hooks.alert = (a) => toParent({ type: 'danger', kind: 'call', title: a.title });
  setInterval(() => toParent({ type: 'state', code: S.code, active: !!S.settings }), 1000);

  // نغمة رسالة واردة (تشبه نغمة الرسائل في الهواتف)
  let actx = null;
  document.addEventListener('pointerdown', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {} }, { once: false });
  function chime() {
    if (!actx) return;
    const t0 = actx.currentTime;
    [[1318.5, 0], [1046.5, 0.13], [1568, 0.26]].forEach(([f, dt]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.18, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.25);
      o.connect(g).connect(actx.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.3);
    });
  }
  S.hooks.show = (name) => { if (name === 'result' || name === 'call') openView('app'); const a = document.getElementById('ipApp'); a.scrollTop = 0; };
  S.hooks.lang = (l) => {
    const changed = l !== lang; lang = l;
    screen.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (changed) { const extra = threads.filter((t) => !t.seed); seedThreads(); threads.forEach((t) => { t.seed = true; }); threads.push(...extra); }
    renderHome(); renderSide(); if (view === 'messages' || view === 'wa') renderMsgs();
  };

  /* ------------------------------ محاكاة: ماذا لو تجاهلت التحذير؟ ------------------------------ */
  const SIM = {
    ar: {
      title: '⚠️ هذا ما كان سيحدث لو تجاهلت التحذير', protect: '🛡️ ما الذي كان سيحميك', reset: 'إعادة الهاتف إلى وضعه الطبيعي', lossLbl: 'النتيجة',
      fine: { title: 'بوابة سداد المخالفات المرورية', sub: 'خدمة إلكترونية — استعلام وسداد', q: 'استعلام عن المخالفات', plateSrc: 'مصدر اللوحة', plateSrcV: 'أبوظبي', plate: 'رقم اللوحة', plateV: '5 • 48213', search: 'استعلام', found: 'مخالفات غير مسددة: 1', vio: 'تجاوز السرعة المقررة بأكثر من 20 كم/س', when: '17/11/2026 — 21:42 • طريق الشيخ زايد', amt: '400.00 درهم', fee: 'رسوم خدمة: 7.50 درهم', total: 'الإجمالي: 407.50 درهم', deadline: '⚠ آخر موعد للسداد قبل حجز المركبة:', pay: 'ادفع الآن 407.50 درهم', ok: '✓ تم سداد المخالفة بنجاح — رقم الإيصال TF-208741', icon: '🚦' },
      cardUpd: { bank: 'مصرف الخليج الأزرق', title: 'تحديث بيانات البطاقة', alert: '⚠ بطاقتك موقوفة مؤقتًا. حدّث بياناتك خلال ساعة لتجنب إغلاق الحساب.', login: 'تسجيل الدخول', user: 'اسم المستخدم', pass: 'كلمة المرور', next: 'متابعة', upd: 'بيانات البطاقة', holder: 'الاسم على البطاقة', submit: 'تحديث وإعادة التفعيل', ok: '✓ تم تحديث بياناتك وإعادة تفعيل بطاقتك', icon: '💳' },
      deliv: { title: 'تتبّع الشحنة', track: 'رقم الشحنة', trackV: 'EP 7741 0293 AE', status: '⚠ الشحنة معلّقة — رسوم توصيل غير مدفوعة: 7.50 درهم', resched: 'إعادة جدولة التوصيل', pay: 'ادفع 7.50 درهم', ok: '✓ تم الدفع — سيتم توصيل شحنتك غدًا', icon: '📦' },
      stepsBy: { fine: ['دخلت موقع مخالفات مزيفًا من رابط في رسالة', 'أدخلت رقم لوحتك وبيانات بطاقتك ورمز التحقق، وأظهر لك الموقع «تم السداد بنجاح»', 'في الخلفية سُحب كامل رصيدك بعمليات متتالية'], card: ['دخلت صفحة مصرف مزيفة وأدخلت اسم المستخدم وكلمة المرور', 'أدخلت بيانات بطاقتك ورمز التحقق، وأظهرت لك الصفحة «تم التحديث بنجاح»', 'استُخدمت بطاقتك فورًا في مشتريات وتحويلات خارجية'] },
      protectBy: { fine: 'المخالفات تُدفع فقط من التطبيق أو الموقع الرسمي للجهة المرورية. لا تدفع أي مخالفة عبر رابط وصلك في رسالة.', card: 'البنك لا يطلب تحديث بيانات البطاقة عبر رابط. ادخل تطبيق البنك بنفسك أو اتصل برقمه الرسمي.' },
      payTitle: 'إعادة جدولة التوصيل', payNote: 'أدخل بيانات البطاقة لدفع الرسوم', card: 'رقم البطاقة', exp: 'تاريخ الانتهاء', cvv: 'رمز الأمان', payBtn: 'ادفع الآن', verifying: 'جارٍ التحقق…', otpField: 'رمز التحقق المرسل إلى هاتفك',
      bankName: 'بنك النخلة', acct: 'الحساب الجاري •••• 4417', avail: 'الرصيد المتاح', txTitle: 'أحدث العمليات', aed: 'درهم',
      tx: { shop: 'شراء إلكتروني — متجر خارجي', intl: 'تحويل دولي', gift: 'بطاقات هدايا رقمية', bene: 'تحويل إلى مستفيد جديد', safe: 'تحويل إلى «حساب آمن»', loanIn: 'إيداع تمويل شخصي', loanOut: 'تحويل إلى حساب خارجي', blackmail: 'تحويل إلى مستفيد جديد — طلب المبتز' },
      gal: { title: 'الصور', count: '1,284 صورة • 36 مستندًا', select: 'تحديد الكل', selected: 'تم تحديد 1,284 عنصرًا', copying: '⬆️ جارٍ النقل إلى جهاز المحتال…', copied: '✓ نُسخت 1,284 صورة و36 مستندًا', ended: 'انتهت مشاركة الشاشة', labels: ['صور شخصية', 'العائلة', 'الهوية', 'جواز السفر', 'التخرج', 'مستندات'] },
      bm: { who: '+44 7700 900 418', unknown: 'رقم غير محفوظ', m1: 'مريم، صورج الشخصية وصور عائلتج وصورة هويتج وجوازج كلها صارت عندي.', m2: 'حوّلي 15,000 درهم خلال 24 ساعة على هالحساب AE41 •••• 7730، وإلا بنشرها لأهلج ومعارفج وفي السوشال ميديا.', m3: 'وإذا بلّغتي الشرطة بنشرها فورًا. الوقت يمشي ⏳', you: 'أرجوك لا تنشرها… بحوّل الحين', m4: 'وصل. أبي 10,000 بعد، وإلا الاتفاق ملغي 😈' },
      debited: (a) => `تم خصم ${a} درهم من حسابك`, otpSms: 'رمز التحقق 739201 لعملية شراء بقيمة 4,850.00 درهم. لا تشاركه مع أحد.',
      newDevice: 'تم تسجيل الدخول إلى حسابك من جهاز جديد', phoneChanged: 'تم تغيير رقم الهاتف المسجّل في حسابك', beneAdded: 'تمت إضافة مستفيد جديد: AE07 •••• 4421',
      numberGone: 'الرقم الذي تحاول الاتصال به غير موجود في الخدمة', idApproved: 'الهوية الرقمية: تمت الموافقة على تسجيل الدخول إلى منصة تمويل', loanApplied: 'تم تقديم طلب تمويل شخصي بقيمة 50,000 درهم باسمك', simIssued: 'تم إصدار شريحة اتصال جديدة باسمك',
      sharing: '🔴 تتم مشاركة شاشتك — AnyDesk',
      bankLogin: 'تسجيل الدخول — جهاز جديد', user: 'اسم المستخدم', otpIn: 'رمز التحقق', loginOk: '✓ تم الدخول إلى حساب مريم من جهاز المحتال', newDev: 'جهاز غير معروف • متصفح ويب',
      portal: 'بوابة التمويل الإلكتروني', idLogin: 'الدخول بالهوية الرقمية', idOk: '✓ تمت الموافقة من هاتف مريم', loanForm: 'طلب تمويل شخصي', applicant: 'مقدّم الطلب: مريم', amount: 'المبلغ: 50,000 درهم', toAcct: 'الإيداع في: حساب جديد •••• 9083', submit: 'تقديم الطلب', approved: '✓ تمت الموافقة على التمويل وصرف المبلغ', remoteNote: 'المحتال يتحكم بهاتفك الآن',
      grpName: 'وظائف حكومية 2026 💼', grpMembers: '248 عضوًا', grpInvite: 'دعوة للانضمام إلى مجموعة', join: 'انضمام', admin: 'مشرف المجموعة',
      grpMsg1: 'أهلًا بك 👋 للتأكد أنك لست حسابًا وهميًا أرسل هنا الرمز المكوّن من 6 أرقام الذي وصلك الآن.', waCode: 'رمز تسجيل واتساب: 482-913. لا تشارك هذا الرمز مع أحد.', youSent: '482913',
      loggedOut: 'تم تسجيل خروجك', loggedOutBody: 'رقم هاتفك مسجّل الآن في واتساب على جهاز آخر.', hijackTitle: 'رسائل تُرسل الآن من حسابك:',
      hijack: [['أمي', 'هلا يمه، ممكن تحولين لي 2,000 درهم ضروري؟ برجعها بكرة 🙏'], ['العائلة 👨‍👩‍👧', 'تكفون اللي يقدر يحول لي مبلغ الحين، الموضوع طارئ'], ['سالم', 'وصلك رمز من 6 أرقام بالغلط؟ أرسله لي لو سمحت']],
      steps: {
        payment: ['أدخلت بيانات بطاقتك في صفحة دفع مزيفة', 'أدخلت رمز التحقق فوافقت على عملية لم تقصدها', 'سُحب كامل رصيدك في عمليات متتالية خلال أقل من دقيقة'],
        otp: ['شاركت رمز التحقق مع المحتال', 'دخل المحتال إلى حسابك من جهاز جديد وغيّر رقم هاتفك', 'أضاف مستفيدًا جديدًا وحوّل كامل الرصيد'],
        transfer: ['صدّقت أن حسابك في خطر', 'حوّلت كامل رصيدك إلى «حساب آمن» يملكه المحتال', 'رقم المتصل لم يعد في الخدمة ولا يمكن استرجاع المبلغ بسهولة'],
        approval: ['وافقت على إشعار تسجيل دخول لم تبدأه', 'استُخدمت هويتك الرقمية لطلب تمويل باسمك', 'حُوّل مبلغ التمويل إلى حساب خارجي وصُدرت شريحة جديدة باسمك'],
        remote: ['ثبّتّ برنامج تحكم عن بعد بطلب من «الدعم الفني»', 'دخل المحتال على معرض الصور ونسخ صورك الخاصة وصور هويتك وجوازك إلى جهازه', 'ابتزّك بنشر الصور مقابل المال، وبعد أن دفعت طلب المزيد'],
        whatsapp: ['انضممت إلى مجموعة بعرض مغرٍ', 'أرسلت رمز التسجيل المكوّن من 6 أرقام', 'سُرق حسابك وبدأ المحتال يطلب المال من أهلك وأصدقائك باسمك'],
      },
      loss: { payment: 'خسارة 18,640.25 درهم', otp: 'خسارة 18,640.25 درهم', transfer: 'خسارة 18,640.25 درهم', remote: 'ابتزاز: 15,000 درهم — وصورك الخاصة ما زالت عند المبتز', approval: 'دين بقيمة 50,000 درهم باسمك', whatsapp: 'سرقة حسابك في واتساب واستخدامه لخداع معارفك' },
      protectTxt: { payment: 'لا تدفع عبر روابط الرسائل. ادخل تطبيق الجهة الرسمي بنفسك وتحقق من الشحنة أو المخالفة.', otp: 'لا تشارك رمز التحقق مع أي أحد، حتى لو قال إنه من البنك.', transfer: 'لا توجد جهة رسمية تطلب تحويل أموالك إلى «حساب آمن». أنهِ المكالمة واتصل بالرقم الرسمي.', approval: 'لا توافق على أي إشعار تسجيل دخول لم تبدأه أنت.', remote: 'لا تثبّت برامج تحكم عن بعد بطلب من متصل. وإذا تعرّضت للابتزاز: لا تدفع ولا تتفاوض، احتفظ بالرسائل، وأبلغ فورًا شرطة أبوظبي عبر خدمة «أمان» 8002626 أو رسالة نصية إلى 2828 — بسرية تامة.', whatsapp: 'لا تنضم لمجموعات العروض المغرية ولا ترسل رمز التسجيل لأحد، وفعّل التحقق بخطوتين في واتساب.' },
    },
    en: {
      title: '⚠️ This is what would have happened if you ignored the warning', protect: '🛡️ What would have protected you', reset: 'Restore the phone', lossLbl: 'Outcome',
      fine: { title: 'Traffic fines payment portal', sub: 'E-service — inquiry & payment', q: 'Fines inquiry', plateSrc: 'Plate source', plateSrcV: 'Abu Dhabi', plate: 'Plate number', plateV: '5 • 48213', search: 'Search', found: 'Unpaid fines: 1', vio: 'Exceeding the speed limit by more than 20 km/h', when: '17/11/2026 — 21:42 • Sheikh Zayed Rd', amt: 'AED 400.00', fee: 'Service fee: AED 7.50', total: 'Total: AED 407.50', deadline: '⚠ Pay before vehicle impound:', pay: 'Pay AED 407.50 now', ok: '✓ Fine paid successfully — receipt TF-208741', icon: '🚦' },
      cardUpd: { bank: 'Blue Gulf Bank', title: 'Update card details', alert: '⚠ Your card is temporarily blocked. Update within one hour to avoid account closure.', login: 'Sign in', user: 'Username', pass: 'Password', next: 'Continue', upd: 'Card details', holder: 'Name on card', submit: 'Update & reactivate', ok: '✓ Your details were updated and your card reactivated', icon: '💳' },
      deliv: { title: 'Track shipment', track: 'Shipment number', trackV: 'EP 7741 0293 AE', status: '⚠ Shipment on hold — unpaid delivery fee: AED 7.50', resched: 'Reschedule delivery', pay: 'Pay AED 7.50', ok: '✓ Paid — your parcel will be delivered tomorrow', icon: '📦' },
      stepsBy: { fine: ['You opened a fake traffic-fines site from a text link', 'You entered your plate, card details and code; the site showed “paid successfully”', 'Behind the scenes your balance was drained'], card: ['You opened a fake bank page and entered your username and password', 'You entered your card details and code; the page showed “updated successfully”', 'Your card was used immediately for foreign purchases and transfers'] },
      protectBy: { fine: 'Fines are paid only in the official app or website of the traffic authority — never through a link in a message.', card: 'Banks never ask you to update card details through a link. Open the bank app yourself or call its official number.' },
      payTitle: 'Reschedule delivery', payNote: 'Enter your card details to pay the fee', card: 'Card number', exp: 'Expiry', cvv: 'Security code', payBtn: 'Pay now', verifying: 'Verifying…', otpField: 'Verification code sent to your phone',
      bankName: 'Nakhla Bank', acct: 'Current account •••• 4417', avail: 'Available balance', txTitle: 'Latest transactions', aed: 'AED',
      tx: { shop: 'Online purchase — foreign store', intl: 'International transfer', gift: 'Digital gift cards', bene: 'Transfer to new beneficiary', safe: 'Transfer to “safe account”', loanIn: 'Personal finance deposit', loanOut: 'Transfer to external account', blackmail: 'Transfer to new beneficiary — blackmailer' },
      gal: { title: 'Photos', count: '1,284 photos • 36 documents', select: 'Select all', selected: '1,284 items selected', copying: '⬆️ Copying to the scammer’s device…', copied: '✓ 1,284 photos and 36 documents copied', ended: 'Screen sharing ended', labels: ['Selfies', 'Family', 'ID card', 'Passport', 'Graduation', 'Documents'] },
      bm: { who: '+44 7700 900 418', unknown: 'Unknown number', m1: 'Maryam, I have your private photos, your family photos, your ID and passport.', m2: 'Transfer AED 15,000 within 24 hours to AE41 •••• 7730, or I post them to your family, friends and social media.', m3: 'If you go to the police I post them right away. Clock is ticking ⏳', you: 'Please don’t post them… I’ll transfer now', m4: 'Received. 10,000 more, or the deal is off 😈' },
      debited: (a) => `AED ${a} was debited from your account`, otpSms: 'Verification code 739201 for a purchase of AED 4,850.00. Do not share it.',
      newDevice: 'Your account was accessed from a new device', phoneChanged: 'The phone number on your account was changed', beneAdded: 'New beneficiary added: AE07 •••• 4421',
      numberGone: 'The number you are calling is not in service', idApproved: 'Digital ID: sign-in approved to a finance platform', loanApplied: 'A personal finance request of AED 50,000 was filed in your name', simIssued: 'A new SIM card was issued in your name',
      sharing: '🔴 Your screen is being shared — AnyDesk',
      bankLogin: 'Sign in — new device', user: 'Username', otpIn: 'Verification code', loginOk: '✓ Signed in to Maryam’s account from the scammer’s device', newDev: 'Unknown device • web browser',
      portal: 'Online finance portal', idLogin: 'Sign in with digital identity', idOk: '✓ Approved from Maryam’s phone', loanForm: 'Personal finance request', applicant: 'Applicant: Maryam', amount: 'Amount: AED 50,000', toAcct: 'Deposit to: new account •••• 9083', submit: 'Submit request', approved: '✓ Finance approved and paid out', remoteNote: 'The scammer is controlling your phone',
      grpName: 'Government jobs 2026 💼', grpMembers: '248 members', grpInvite: 'Invitation to join group', join: 'Join', admin: 'Group admin',
      grpMsg1: 'Welcome 👋 To prove you are not a fake account, send the 6-digit code you just received here.', waCode: 'WhatsApp registration code: 482-913. Do not share this code.', youSent: '482913',
      loggedOut: 'You have been logged out', loggedOutBody: 'Your phone number is now registered on WhatsApp on another device.', hijackTitle: 'Messages being sent from your account now:',
      hijack: [['Mom', 'Hi mom, can you transfer me AED 2,000? Urgent, I’ll return it tomorrow 🙏'], ['Family 👨‍👩‍👧', 'Whoever can, please transfer me some money now — it’s an emergency'], ['Salem', 'Did you get a 6-digit code by mistake? Please send it to me']],
      steps: {
        payment: ['You entered your card details on a fake payment page', 'You entered the code and approved a purchase you did not intend', 'Your whole balance was drained in rapid transactions within a minute'],
        otp: ['You shared the verification code', 'The scammer signed in from a new device and changed your phone number', 'They added a new beneficiary and transferred everything'],
        transfer: ['You believed your account was at risk', 'You transferred your whole balance to the scammer’s “safe account”', 'The caller’s number is out of service; the money is hard to recover'],
        approval: ['You approved a sign-in you did not start', 'Your digital ID was used to request finance in your name', 'The money went to an external account and a new SIM was issued'],
        remote: ['You installed a remote-control app for “tech support”', 'The scammer opened your gallery and copied your private photos, ID and passport', 'They blackmailed you for money — and after you paid, demanded more'],
        whatsapp: ['You joined a group with a too-good offer', 'You sent the 6-digit registration code', 'Your account was stolen and used to ask your family for money'],
      },
      loss: { payment: 'Loss of AED 18,640.25', otp: 'Loss of AED 18,640.25', transfer: 'Loss of AED 18,640.25', remote: 'Blackmail: AED 15,000 — and the blackmailer still has your photos', approval: 'AED 50,000 debt in your name', whatsapp: 'Your WhatsApp account stolen and used to scam your contacts' },
      protectTxt: { payment: 'Never pay through links in messages. Open the official app yourself.', otp: 'Never share a verification code with anyone, even “the bank”.', transfer: 'No authority asks you to move money to a “safe account”. Hang up and call the official number.', approval: 'Never approve a sign-in you did not start.', remote: 'Never install remote-control apps at a caller’s request. If you are blackmailed: don’t pay or negotiate, keep the messages, and report it to Abu Dhabi Police “Aman” on 8002626 or SMS 2828 — in full confidence.', whatsapp: 'Don’t join “too good” groups, never share registration codes, and turn on two-step verification.' },
    },
  };
  const sx = () => SIM[lang];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const BAL = 18640.25;
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let simLayer = null, curTpl = null;
  async function typeInto(node, text, ms = 70) { node.textContent = ''; for (const ch of text) { node.textContent += ch; await sleep(ms); } }
  function simShow(html) { const st = simLayer.querySelector('.sim-stage'); st.innerHTML = ''; const n = el(html); st.appendChild(n); return n; }
  function bankScreen(bankName) {
    const X = sx(); const BN = bankName || X.bankName;
    const n = simShow(`<div class="bk"><div class="bk-head"><div class="bk-top"><span class="bk-ico">${iconHTML('bank')}</span><b>${BN}</b></div><small>${X.acct}</small><div class="bk-lbl">${X.avail}</div><div class="bk-bal"><span>${fmt(BAL)}</span> <small>${X.aed}</small></div></div><div class="bk-tx-h">${X.txTitle}</div><ul class="bk-tx"></ul></div>`);
    let bal = BAL;
    return {
      async debit(label, amount) {
        const li = el(`<li class="bk-row new"><span></span><b>-${fmt(amount)}</b></li>`); li.querySelector('span').textContent = label;
        n.querySelector('.bk-tx').prepend(li);
        banner({ icon: 'bank', app: BN, title: BN, body: X.debited(fmt(amount)), danger: true, ttl: 3500 });
        const from = bal; bal = Math.max(0, +(bal - amount).toFixed(2));
        const balEl = n.querySelector('.bk-bal span');
        for (let i = 1; i <= 20; i++) { balEl.textContent = fmt(from - (from - bal) * (i / 20)); await sleep(30); }
        n.querySelector('.bk-bal').classList.toggle('zero', bal === 0);
        await sleep(900);
      },
      async credit(label, amount) {
        const li = el(`<li class="bk-row in"><span></span><b>+${fmt(amount)}</b></li>`); li.querySelector('span').textContent = label;
        n.querySelector('.bk-tx').prepend(li); bal += amount; n.querySelector('.bk-bal span').textContent = fmt(bal); await sleep(1200);
      },
    };
  }
  async function drain(steps, bankName) {
    const X = sx(), bk = bankScreen(bankName);
    await sleep(700);
    for (const [k, a] of steps) await bk.debit(X.tx[k], a);
  }
  // حالات تحدي الهاكثون: نصوص العواقب الإضافية
  (function extendSim() {
    const ADD = {
      ar: {
        loginSim: { bankTitle: 'بنك النخلة الوطني', socTitle: 'بنك النخلة Rewards', verify: 'تحقق من الهوية', bankAlert: '⚠️ رصدنا محاولة دخول غير معتادة. سجّل دخولك للتحقق.', socAlert: '🎉 مبروك! سجّل دخولك بحساب التواصل لاستلام الجائزة.', user: 'اسم المستخدم أو البريد', pass: 'كلمة المرور', btn: 'تسجيل الدخول', ok: '✓ تم التحقق من حسابك بنجاح',
          banners: { mail: [['mail', 'البريد', 'تنبيه أمني', 'تم تغيير كلمة مرور حسابك من جهاز غير معروف'], ['bank', 'بنك النخلة', 'تسجيل دخول جديد', 'دخول إلى حسابك من جهاز جديد خارج الدولة'], ['messages', 'الرسائل', 'سارة', 'وصلتني رسالة غريبة من بريدك فيها رابط… هل هذا أنت؟']],
            social: [['social', 'تواصل', 'تم تغيير البريد المرتبط', 'لم يعد بإمكانك الدخول إلى حسابك'], ['social', 'تواصل', 'منشور جديد من حسابك', '«ربحت iPhone! ادخل الرابط واستلم جائزتك» — أُرسل لـ 1,240 متابعًا'], ['whatsapp', 'واتساب', 'خالد', 'هل فعلًا ربحت؟ دخلت الرابط اللي نزلته وطلب بياناتي…']] } },
        appSim: { gameName: 'سباق الصحراء', bankName: 'بنك النخله', notStore: 'من خارج المتجر الرسمي — مطوّر غير معروف', downloading: 'جارٍ التحميل…', installed: '✓ تم التثبيت', wants: 'يطلب الوصول إلى', perms: ['🎙️ الميكروفون', '📷 الكاميرا', '👥 جهات الاتصال'], allow: 'السماح', deny: 'عدم السماح',
          exfil: 'التطبيق يرسل بياناتك في الخلفية إلى خادم مجهول', rows: [['👥', 'جهات الاتصال (312 جهة)'], ['📷', 'صور من الكاميرا كل 30 ثانية'], ['🎙️', 'تسجيلات صوتية من الميكروفون']], to: '← 185.22.1.9 (خارج الدولة)',
          spam: ['messages', 'الرسائل', 'أم سعيد', 'وصلني منك رابط لعبة غريب… انتبه حسابك مخترق؟'], bankLogin: 'سجّل دخولك لتفعيل التطبيق الجديد', act: 'تفعيل', activating: 'جارٍ تفعيل التطبيق…' },
        charity: { name: '💚 جمعية الخير', sub: 'تبرّع لإغاثة الأسر المحتاجة', notSecure: 'غير آمن', amt: 'اختر مبلغ التبرع', donate: 'تبرّع الآن', ok: '💚 شكرًا لتبرعك! تم استلام 250 درهم' },
        steps: { login: ['فتحت رابطًا في رسالة بدت رسمية، فوصلت إلى صفحة دخول مزيفة', 'أدخلت اسم المستخدم وكلمة المرور، فوصلت مباشرة للمحتال', 'دخل المحتال إلى حسابك وغيّر كلمة المرور واستخدمه لخداع معارفك'], app: ['حمّلت تطبيقًا من رابط خارج المتجر الرسمي', 'منحته أذونات لا يحتاجها', 'سرق التطبيق بياناتك وأرسلها لجهة غير موثوقة'], boss: ['اتصل بك صوت يشبه صوت مديرك (مولَّد بالذكاء الاصطناعي)', 'طلب تحويلًا عاجلًا وسريًا ثم رمز التحقق', 'حوّلت المبلغ وأعطيت الرمز دون التحقق عبر قناة أخرى'] },
        stepsBy: { social: ['رأيت حسابًا ينتحل علامة تجارية موثوقة ويعلن مسابقة', 'ضغطت الرابط وسجّلت دخولك بحساب التواصل وأدخلت بياناتك', 'سُرق حسابك، واستُخدم لنشر الخدعة نفسها لمتابعيك'], game: ['حمّلت لعبة «مجانية» من رابط خارج المتجر', 'منحتها الوصول للميكروفون والكاميرا وجهات الاتصال — أذونات لا تحتاجها لعبة', 'جمعت اللعبة بياناتك وشاركتها مع أطراف خارجية غير موثوقة'], bankapp: ['حمّلت تطبيقًا ينتحل اسم بنكك وشعاره من رابط في رسالة', 'سجّلت دخولك فيه باسم المستخدم وكلمة المرور', 'استخدم المحتال بياناتك لاختراق حسابك البنكي وسحب رصيدك'], charity: ['مسحت رمز QR للتبرع من ملصق في مكان عام', 'فتح الرمز صفحة دفع مزيفة بلا قفل أمان (http) تشبه موقع جمعية خيرية', 'أدخلت بيانات بطاقتك فحُوّل المبلغ لحساب احتيالي وانكشفت بياناتك المالية'] },
        loss: { login: 'اختراق حسابك وفقدان السيطرة عليه', app: 'تسريب جهات اتصالك وصورك وتسجيلاتك', boss: 'خسارة 18,640.25 درهم' },
        lossBy: { social: 'سرقة حسابك واستخدامه لخداع متابعيك', bankapp: 'خسارة 18,640.25 درهم', charity: 'خسارة 18,640.25 درهم وانكشاف بيانات بطاقتك' },
        protectTxt: { login: 'لا تنقر على الروابط المشبوهة أو تمسح رموز QR غير موثوقة، ولا تزوّد الغرباء بمعلوماتك. «حِصن» يذكّرك بتفعيل المصادقة متعددة العوامل والتحديثات التلقائية، ويبلّغ فورًا عن أي رسالة مشبوهة.', app: 'حمّل التطبيقات من المتجر الرسمي فقط، وراجع الأذونات قبل الموافقة.', boss: 'تحقّق دائمًا قبل أي تحويل أو مشاركة معلومة: اتصل بالشخص على رقمه المعروف (قناة أخرى موثوقة). لا تستجب للطلبات العاجلة والسرية، وانتبه للرسائل «المثالية» أكثر من اللازم والشعارات الرسمية فقد تكون مصمّمة لخداعك. فعّل المصادقة الثنائية وحدّث إعدادات الأمان باستمرار.' },
        protectBy: { social: 'العلامات التجارية الحقيقية لا تطلب تسجيل الدخول بحسابك عبر رابط لاستلام جائزة. تحقق من الحساب الموثّق عبر الموقع الرسمي، ولا تُدخل بياناتك.', game: 'لعبة لا تحتاج الميكروفون والكاميرا وجهات الاتصال. حمّل من المتجر الرسمي فقط، وارفض أي إذن غير ضروري.', bankapp: 'التطبيق البنكي الرسمي يُحمَّل فقط من App Store أو Google Play باسم البنك الموثّق. البنك لا يرسل روابط لتحميل تطبيقه، وموظفوه لا يطلبون كلمة المرور أو الرقم السري أو CVV أبدًا.', charity: 'قبل أي تبرع أو دفع: تأكد من رمز القفل وأن الموقع يستخدم HTTPS، لا تمسح رموز QR من مصادر مجهولة في الأماكن العامة، فعّل المصادقة الثنائية لعمليات الدفع، وتبرّع فقط عبر المواقع الرسمية الموثّقة للجهات الخيرية.' },
      },
      en: {
        loginSim: { bankTitle: 'Nakhla National Bank', socTitle: 'Nakhla Bank Rewards', verify: 'Identity check', bankAlert: '⚠️ Unusual sign-in detected. Sign in to verify.', socAlert: '🎉 Congratulations! Sign in with your social account to claim your prize.', user: 'Username or email', pass: 'Password', btn: 'Sign in', ok: '✓ Your account has been verified',
          banners: { mail: [['mail', 'Mail', 'Security alert', 'Your password was changed from an unknown device'], ['bank', 'Nakhla Bank', 'New sign-in', 'Your account was accessed from a new device abroad'], ['messages', 'Messages', 'Sara', 'I got a strange email from you with a link… is that you?']],
            social: [['social', 'Social', 'Linked email changed', 'You can no longer sign in to your account'], ['social', 'Social', 'New post from your account', '“I won an iPhone! Open the link to claim yours” — sent to 1,240 followers'], ['whatsapp', 'WhatsApp', 'Khalid', 'Did you really win? I opened your link and it asked for my details…']] } },
        appSim: { gameName: 'Desert Race', bankName: 'Nakhla Bnak', notStore: 'Outside the official store — unknown developer', downloading: 'Downloading…', installed: '✓ Installed', wants: 'wants access to', perms: ['🎙️ Microphone', '📷 Camera', '👥 Contacts'], allow: 'Allow', deny: 'Don’t allow',
          exfil: 'The app is sending your data in the background to an unknown server', rows: [['👥', 'Contacts (312)'], ['📷', 'Camera photos every 30 seconds'], ['🎙️', 'Microphone recordings']], to: '→ 185.22.1.9 (abroad)',
          spam: ['messages', 'Messages', 'Um Saeed', 'I got a weird game link from you… is your account hacked?'], bankLogin: 'Sign in to activate the new app', act: 'Activate', activating: 'Activating the app…' },
        charity: { name: '💚 Al Khair Charity', sub: 'Donate to help families in need', notSecure: 'Not secure', amt: 'Choose an amount', donate: 'Donate now', ok: '💚 Thank you! AED 250 received' },
        steps: { login: ['You opened a link in an official-looking message and reached a fake login page', 'You typed your username and password — straight to the scammer', 'The scammer took over your account, changed the password and used it to fool your contacts'], app: ['You installed an app from a link outside the official store', 'You granted permissions it does not need', 'The app stole your data and sent it to untrusted parties'], boss: ['A voice that sounded like your manager (AI-generated) called you', 'It asked for an urgent, confidential transfer, then the verification code', 'You transferred the money and gave the code without checking through another channel'] },
        stepsBy: { social: ['You saw an account impersonating a trusted brand announcing a contest', 'You tapped the link, signed in with your social account and entered your details', 'Your account was stolen and used to spread the same scam to your followers'], game: ['You installed a “free” game from a link outside the store', 'You gave it the microphone, camera and contacts — permissions no game needs', 'The game collected your data and shared it with untrusted third parties'], bankapp: ['You installed an app impersonating your bank’s name and logo from a link in a message', 'You signed in with your username and password', 'The scammer used them to break into your bank account and drain it'], charity: ['You scanned a donation QR code on a poster in a public place', 'It opened a fake payment page without a padlock (http) that looked like a charity', 'You entered your card details; the money went to a fraud account and your card data was exposed'] },
        loss: { login: 'Your account taken over', app: 'Your contacts, photos and recordings leaked', boss: 'Loss of AED 18,640.25' },
        lossBy: { social: 'Your account stolen and used to scam your followers', bankapp: 'Loss of AED 18,640.25', charity: 'Loss of AED 18,640.25 and your card data exposed' },
        protectTxt: { login: 'Don’t click suspicious links or scan untrusted QR codes, and don’t give personal information to strangers. HISN reminds you to turn on multi-factor authentication and automatic updates, and reports any suspicious message instantly.', app: 'Install apps only from the official store and review permissions before allowing them.', boss: 'Always verify before any transfer or sharing information: call the person back on the number you know (another trusted channel). Don’t respond to urgent, confidential requests, and beware of “perfect” messages and official logos — they may be designed to fool you. Turn on two-factor authentication and keep security settings updated.' },
        protectBy: { social: 'Real brands never ask you to sign in with your account through a link to claim a prize. Check the verified account on the official site and never enter your details.', game: 'A game does not need your microphone, camera and contacts. Install only from the official store and deny unnecessary permissions.', bankapp: 'The official banking app comes only from the App Store or Google Play under the verified bank name. Banks never send links to download their app, and staff never ask for your password, PIN or CVV.', charity: 'Before any donation or payment: check for the padlock and HTTPS, don’t scan QR codes from unknown sources in public places, turn on two-factor authentication for payments, and donate only through the charity’s official, verified sites.' },
      },
    };
    for (const l of ['ar', 'en']) { const X = SIM[l], A = ADD[l]; for (const k of ['steps', 'stepsBy', 'loss', 'protectTxt', 'protectBy']) X[k] = Object.assign(X[k] || {}, A[k]); X.lossBy = A.lossBy; X.loginSim = A.loginSim; X.appSim = A.appSim; X.charity = A.charity; }
  })();
  const SCRIPTS = {
    async payment(v) {
      const X = sx(), host = (v && v.urls && v.urls[0]) || 'secure-pay.example';
      const src = ((v && (v.text || '')) + ' ' + ((v && v.summary) || '')).toLowerCase();
      const tpl = /تبرع|تبرّع|جمعيه|جمعية|خيري|donat|charity/.test(src) ? 'charity' : /مخالف|غرام|مرور|traffic|fine|violation|impound/.test(src) ? 'fine' : /بطاق|card|تحديث|update|بيانات/.test(src) && !/شحن|توصيل|طرد|parcel|delivery/.test(src) ? 'card' : 'delivery';
      curTpl = tpl;
      const bar = (h) => `<div class="br-bar"><span class="br-lock">🔒</span><span class="br-host">${h}</span></div>`;
      const cardForm = (extra) => `<label>${X.card}</label><div class="br-in" id="fCard"></div><div class="br-row"><div><label>${X.exp}</label><div class="br-in" id="fExp"></div></div><div><label>${X.cvv}</label><div class="br-in" id="fCvv"></div></div></div>${extra || ''}
        <div class="br-otp" hidden><label>${X.otpField}</label><div class="br-in" id="fOtp"></div></div>`;
      const typeCard = async (n) => { await typeInto(n.querySelector('#fCard'), '4111 •••• •••• 1111', 55); await typeInto(n.querySelector('#fExp'), '08/28', 90); await typeInto(n.querySelector('#fCvv'), '•••', 120); };
      const otpStep = async (n, btn) => {
        n.querySelector(btn).classList.add('press'); await sleep(500);
        const w = n.querySelector('.br-wait'); w.hidden = false; await sleep(1300);
        banner({ icon: 'messages', app: tx().apps.messages, title: tpl === 'card' ? (lang === 'ar' ? 'مصرف الخليج الأزرق' : 'Blue Gulf Bank') : X.bankName, body: X.otpSms, ttl: 4000 });
        n.querySelector('.br-otp').hidden = false; await sleep(900);
        await typeInto(n.querySelector('#fOtp'), '739201', 120); await sleep(600);
        w.innerHTML = '<span class="spin"></span>' + X.verifying; await sleep(1200);
      };
      const success = async (n, txt) => { const ok = el(`<div class="br-ok">${txt}</div>`); n.querySelector('.br-page').appendChild(ok); ok.scrollIntoView({ block: 'end' }); await sleep(2200); };

      if (tpl === 'charity') {
        const C = X.charity;
        const n = simShow(`<div class="br card"><div class="br-bar insecure"><span class="br-lock">⚠️ ${C.notSecure}</span><span class="br-host">http://${host}</span></div><div class="bank-head" style="background:#1f8f4e"><span class="gov-ic">💚</span><div><b>${C.name}</b><small>${C.sub}</small></div></div><div class="br-page">
          <h3>${C.amt}</h3><div class="br-row"><div class="br-in">100</div><div class="br-in" style="outline:2px solid #1f8f4e">250</div><div class="br-in">500</div></div>${cardForm()}<button type="button" class="br-pay bank" id="bDon" style="background:#1f8f4e">${C.donate}</button><div class="br-wait" hidden><span class="spin"></span>${X.verifying}</div></div></div>`);
        await sleep(800); await typeCard(n); await otpStep(n, '#bDon');
        await success(n, C.ok);
        await drain([['intl', 9800], ['gift', 5000], ['shop', 3840.25]]);
        return;
      }
      if (tpl === 'fine') {
        const F = X.fine;
        const n = simShow(`<div class="br fine">${bar(host)}<div class="gov-head"><span class="gov-ic">${F.icon}</span><div><b>${F.title}</b><small>${F.sub}</small></div></div><div class="br-page">
          <h3>${F.q}</h3><div class="br-row"><div><label>${F.plateSrc}</label><div class="br-in">${F.plateSrcV}</div></div><div><label>${F.plate}</label><div class="br-in" id="pl"></div></div></div>
          <button type="button" class="br-pay gov" id="bSearch">${F.search}</button><div id="res" hidden></div><div id="payBox" hidden></div></div></div>`);
        await sleep(600); await typeInto(n.querySelector('#pl'), F.plateV, 110); await sleep(400);
        n.querySelector('#bSearch').classList.add('press'); await sleep(900);
        const res = n.querySelector('#res'); res.hidden = false;
        res.innerHTML = `<div class="fine-found">${F.found}</div><div class="fine-card"><b>${F.vio}</b><small>${F.when}</small><div class="fine-amt">${F.amt}</div></div><small class="fine-fee">${F.fee}</small><div class="fine-total">${F.total}</div><div class="fine-dl">${F.deadline} <b id="cd">23:59:41</b></div><button type="button" class="br-pay gov" id="bPay">${F.pay}</button>`;
        let secs = 23 * 3600 + 59 * 60 + 41; const cdT = setInterval(() => { secs--; const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s2 = secs % 60; const e = n.querySelector('#cd'); if (e) e.textContent = [h, m, s2].map((x) => String(x).padStart(2, '0')).join(':'); else clearInterval(cdT); }, 1000);
        await sleep(2600); n.querySelector('#bPay').classList.add('press'); await sleep(600);
        const pb = n.querySelector('#payBox'); pb.hidden = false; pb.innerHTML = cardForm() + `<button type="button" class="br-pay gov" id="bConfirm">${F.pay}</button><div class="br-wait" hidden><span class="spin"></span>${X.verifying}</div>`;
        pb.scrollIntoView({ block: 'start' }); await sleep(500);
        await typeCard(pb); await otpStep(pb, '#bConfirm');
        await success(n, F.ok); clearInterval(cdT);
        await drain([['shop', 4850], ['intl', 6200], ['gift', 3000], ['shop', 4590.25]]);
        return;
      }
      if (tpl === 'card') {
        const C = X.cardUpd;
        const n = simShow(`<div class="br card">${bar(host)}<div class="bank-head"><span class="gov-ic">🏦</span><div><b>${C.bank}</b><small>${C.title}</small></div></div><div class="br-page">
          <div class="br-alert">${C.alert}</div><h3 id="h1">${C.login}</h3>
          <div id="st1"><label>${C.user}</label><div class="br-in" id="cu"></div><label>${C.pass}</label><div class="br-in" id="cp"></div><button type="button" class="br-pay bank" id="bNext">${C.next}</button></div>
          <div id="st2" hidden><label>${C.holder}</label><div class="br-in" id="ch"></div>${cardForm()}<button type="button" class="br-pay bank" id="bUpd">${C.submit}</button><div class="br-wait" hidden><span class="spin"></span>${X.verifying}</div></div></div></div>`);
        await sleep(700); await typeInto(n.querySelector('#cu'), 'maryam.a', 90); await typeInto(n.querySelector('#cp'), '••••••••', 90);
        n.querySelector('#bNext').classList.add('press'); await sleep(900);
        n.querySelector('#st1').hidden = true; n.querySelector('#h1').textContent = C.upd; const s2 = n.querySelector('#st2'); s2.hidden = false;
        await typeInto(n.querySelector('#ch'), 'MARYAM A.', 80); await typeCard(s2); await otpStep(s2, '#bUpd');
        await success(n, C.ok);
        await drain([['shop', 5200], ['intl', 7400], ['gift', 3000], ['shop', 3040.25]], C.bank);
        return;
      }
      const D = X.deliv;
      const n = simShow(`<div class="br">${bar(host)}<div class="br-page"><div class="br-logo">${D.icon}</div><h3>${D.title}</h3>
        <label>${D.track}</label><div class="br-in">${D.trackV}</div><div class="br-alert">${D.status}</div><h3>${D.resched}</h3>${cardForm()}
        <button type="button" class="br-pay" id="bPay">${D.pay}</button><div class="br-wait" hidden><span class="spin"></span>${X.verifying}</div></div></div>`);
      await sleep(1800); await typeCard(n); await otpStep(n, '#bPay');
      await success(n, D.ok);
      await drain([['shop', 4850], ['intl', 6200], ['gift', 3000], ['shop', 4590.25]]);
    },
    async otp() {
      const X = sx();
      const lg = simShow(`<div class="br"><div class="br-bar"><span class="br-lock">🔒</span><span class="br-host">online.nakhlabank.ae</span></div><div class="br-page"><div class="br-logo">${iconHTML('bank')}</div><h3>${X.bankName} — ${X.bankLogin}</h3><p>${X.newDev}</p>
        <label>${X.user}</label><div class="br-in" id="lU"></div><label>${X.otpIn}</label><div class="br-in" id="lO"></div><div class="br-wait" hidden></div></div></div>`);
      await sleep(500); await typeInto(lg.querySelector('#lU'), 'maryam.a••••', 70);
      await typeInto(lg.querySelector('#lO'), '739201', 140); await sleep(500);
      const w = lg.querySelector('.br-wait'); w.hidden = false; w.textContent = X.loginOk; w.style.color = '#d70015'; w.style.fontWeight = '700'; await sleep(1800);
      bankScreen(); await sleep(600);
      for (const b of [X.newDevice, X.phoneChanged, X.beneAdded]) { banner({ icon: 'bank', app: X.bankName, title: X.bankName, body: b, danger: true, ttl: 3800 }); await sleep(1500); }
      await drain([['bene', 9000], ['bene', 9640.25]]);
    },
    async login(v) {
      const X = sx(), G = X.loginSim, host = (v && v.urls && v.urls[0]) || 'secure-login.example';
      const src = ((v && v.text) || '') + ' ' + ((v && v.summary) || '');
      const soc = /تواصل|مسابق|جائز|contest|prize|social|rewards/i.test(src); curTpl = soc ? 'social' : null;
      const n = simShow(`<div class="br card"><div class="br-bar"><span class="br-lock">🔒</span><span class="br-host">${host}</span></div><div class="bank-head"${soc ? ' style="background:linear-gradient(90deg,#d62976,#962fbf)"' : ''}><span class="gov-ic">${soc ? '📣' : '🏦'}</span><div><b>${soc ? G.socTitle : G.bankTitle}</b><small>${G.verify}</small></div></div><div class="br-page">
        <div class="br-alert">${soc ? G.socAlert : G.bankAlert}</div><label>${G.user}</label><div class="br-in" id="lu"></div><label>${G.pass}</label><div class="br-in" id="lp"></div><button type="button" class="br-pay bank" id="lb">${G.btn}</button><div class="br-wait" hidden><span class="spin"></span>${X.verifying}</div></div></div>`);
      await sleep(700); await typeInto(n.querySelector('#lu'), soc ? 'maryam_uae' : 'maryam.a@mail.ae', 70); await typeInto(n.querySelector('#lp'), '••••••••••', 90);
      n.querySelector('#lb').classList.add('press'); await sleep(500); n.querySelector('.br-wait').hidden = false; await sleep(1500);
      const ok = el(`<div class="br-ok">${G.ok}</div>`); n.querySelector('.br-page').appendChild(ok); await sleep(1600);
      for (const b of G.banners[soc ? 'social' : 'mail']) { banner({ icon: b[0], app: b[1], title: b[2], body: b[3], danger: true, ttl: 3800 }); await sleep(2000); }
      await sleep(600);
    },
    async app(v) {
      const X = sx(), A = X.appSim, host = (v && v.urls && v.urls[0]) || 'download.example';
      const src = ((v && v.text) || '') + ' ' + ((v && v.summary) || '');
      const bankish = /بنك|bank|مصرف/i.test(src); curTpl = bankish ? 'bankapp' : 'game';
      const n = simShow(`<div class="br card"><div class="br-bar"><span class="br-lock">🔒</span><span class="br-host">${host}</span></div><div class="br-page"><div class="dl-card"><div class="dl-ic">${bankish ? '🏦' : '🎮'}</div><b>${bankish ? A.bankName : A.gameName}</b><small>${A.notStore}</small><div class="dl-prog"><i></i></div><div class="dl-st">${A.downloading}</div></div><div id="appStage"></div></div></div>`);
      const bar = n.querySelector('.dl-prog i'); for (let i = 0; i <= 20; i++) { bar.style.width = (i * 5) + '%'; await sleep(70); }
      n.querySelector('.dl-st').textContent = A.installed; await sleep(700);
      const stage = n.querySelector('#appStage');
      if (!bankish) {
        for (const pm of A.perms) {
          const d = el(`<div class="perm"><b>«${A.gameName}» ${A.wants}</b><p>${pm}</p><div class="perm-b"><span>${A.deny}</span><span class="allow">${A.allow}</span></div></div>`); stage.appendChild(d); d.scrollIntoView({ block: 'end' });
          await sleep(900); d.querySelector('.allow').classList.add('press'); await sleep(450); d.classList.add('done');
        }
        const ex = el(`<div class="exfil"><b>⚠️ ${A.exfil}</b>${A.rows.map((r) => `<div class="ex-row"><span>${r[0]} ${r[1]}</span><small>${A.to}</small><div class="dl-prog"><i></i></div></div>`).join('')}</div>`); stage.appendChild(ex); ex.scrollIntoView({ block: 'end' });
        const bars = ex.querySelectorAll('.dl-prog i'); for (let i = 0; i <= 20; i++) { bars.forEach((b, k) => { b.style.width = Math.min(100, i * (5 + k)) + '%'; }); await sleep(90); }
        await sleep(500); banner({ icon: A.spam[0], app: A.spam[1], title: A.spam[2], body: A.spam[3], danger: true, ttl: 4500 }); await sleep(2600);
        return;
      }
      const f = el(`<div class="perm bankapp"><b>🏦 ${A.bankName}</b><p>${A.bankLogin}</p><label>${X.loginSim.user}</label><div class="br-in" id="au"></div><label>${X.loginSim.pass}</label><div class="br-in" id="ap"></div><button type="button" class="br-pay bank" id="ab">${A.act}</button><div class="br-wait" hidden><span class="spin"></span>${A.activating}</div></div>`); stage.appendChild(f); f.scrollIntoView({ block: 'end' });
      await sleep(600); await typeInto(f.querySelector('#au'), 'maryam.a', 80); await typeInto(f.querySelector('#ap'), '••••••••', 90);
      f.querySelector('#ab').classList.add('press'); await sleep(400); f.querySelector('.br-wait').hidden = false; await sleep(1600);
      await drain([['bene', 9800], ['intl', 5000], ['gift', 3840.25]]);
    },
    async boss() { curTpl = null; await SCRIPTS.transfer(); },
    async transfer() {
      const X = sx();
      await drain([['safe', BAL]]);
      await sleep(400);
      banner({ icon: 'phone', app: tx().apps.phone, title: tx().apps.phone, body: X.numberGone, ttl: 5000 }); await sleep(2200);
    },
    async approval() {
      const X = sx();
      const pg = simShow(`<div class="br"><div class="br-bar"><span class="br-lock">🔒</span><span class="br-host">finance-portal.example</span></div><div class="br-page"><div class="br-logo">🏛️</div><h3>${X.portal}</h3>
        <button type="button" class="br-pay" style="background:#0b2545;color:#fff">🪪 ${X.idLogin}</button><div class="br-wait" id="aOk" hidden></div>
        <div id="aForm" hidden><h3 style="margin-top:10px">${X.loanForm}</h3><div class="br-in">${X.applicant}</div><div class="br-in">${X.amount}</div><div class="br-in">${X.toAcct}</div><button type="button" class="br-pay" id="aSub">${X.submit}</button><div class="br-wait" id="aDone" hidden></div></div></div></div>`);
      await sleep(900); pg.querySelector('.br-pay').classList.add('press'); await sleep(700);
      banner({ icon: 'shield', app: 'ID', title: X.idApproved, body: '', danger: true, ttl: 3500 });
      const ok = pg.querySelector('#aOk'); ok.hidden = false; ok.textContent = X.idOk; ok.style.color = '#d70015'; ok.style.fontWeight = '700'; await sleep(1400);
      pg.querySelector('#aForm').hidden = false; await sleep(1300);
      pg.querySelector('#aSub').classList.add('press'); await sleep(900);
      const dn = pg.querySelector('#aDone'); dn.hidden = false; dn.textContent = X.approved; dn.style.color = '#d70015'; dn.style.fontWeight = '700';
      banner({ icon: 'mail', app: tx().apps.mail, title: X.loanApplied, body: '', danger: true, ttl: 3800 }); await sleep(2000);
      const bk = bankScreen(); await sleep(600);
      await bk.credit(X.tx.loanIn, 50000);
      await bk.debit(X.tx.loanOut, 50000 + BAL);
      banner({ icon: 'phone', app: tx().apps.phone, title: X.simIssued, body: '', danger: true, ttl: 4000 }); await sleep(2000);
    },
    async remote() {
      const X = sx(), G = X.gal, B = X.bm;
      simLayer.classList.add('remote');
      const pill = el(`<div class="sim-share">${X.sharing}</div>`); simLayer.appendChild(pill);
      const cur = el('<div class="sim-cursor"></div>'); simLayer.appendChild(cur);
      simShow(`<div class="sim-home"><div class="ip-grid">${['bank', 'messages', 'photos', 'settings'].map((id) => `<div class="ip-app-tile${id === 'photos' ? ' tgt' : ''}">${iconHTML(id)}<span class="ip-label">${tx().apps[id]}</span></div>`).join('')}</div><p class="sim-note">${X.remoteNote}</p></div>`);
      await sleep(500);
      const tgt = simLayer.querySelector('.tgt'), sr = simLayer.getBoundingClientRect(), tr = tgt.getBoundingClientRect(), cr = cur.getBoundingClientRect();
      const k = sr.width / simLayer.offsetWidth || 1;
      cur.style.transform = `translate(${(tr.left + tr.width / 2 - cr.left) / k}px,${(tr.top + tr.height / 2 - cr.top) / k}px)`;
      await sleep(1400); cur.classList.add('click'); tgt.classList.add('press'); await sleep(600); cur.classList.remove('click');
      const EM = ['🤳', '👨‍👩‍👧', '🪪', '🛂', '🎓', '📄', '🤳', '🏖️', '🎂', '👨‍👩‍👧', '🤳', '📄', '🏠', '🤳', '🎓', '👗', '🤳', '🪪'];
      const COL = ['#f6a5c0', '#a0c4ff', '#ffd6a5', '#caffbf', '#bdb2ff', '#ffc6ff', '#9bf6ff', '#fdffb6'];
      const g = simShow(`<div class="gal"><div class="gal-h"><b>${G.title}</b><small>${G.count}</small><span class="gal-sel">${G.select}</span></div>
        <div class="gal-cats">${G.labels.map((l) => `<span>${l}</span>`).join('')}</div>
        <div class="gal-grid">${EM.map((e, i) => `<div class="gal-t" style="background:linear-gradient(135deg,${COL[i % 8]},${COL[(i + 3) % 8]})"><span>${e}</span></div>`).join('')}</div>
        <div class="gal-bar" hidden><div class="gal-lbl">${G.copying}</div><div class="gal-prog"><i></i></div><small class="gal-pct">0%</small></div></div>`);
      await sleep(1000);
      cur.style.transform += ' translate(60px,-210px)'; await sleep(1300);
      cur.classList.add('click'); g.querySelector('.gal-sel').classList.add('on'); await sleep(400); cur.classList.remove('click');
      for (const t of g.querySelectorAll('.gal-t')) { t.classList.add('sel'); await sleep(70); }
      g.querySelector('.gal-sel').textContent = G.selected; await sleep(700);
      const bar = g.querySelector('.gal-bar'); bar.hidden = false;
      for (let p = 0; p <= 100; p += 4) { bar.querySelector('i').style.width = p + '%'; bar.querySelector('.gal-pct').textContent = p + '%'; await sleep(110); }
      bar.querySelector('.gal-lbl').textContent = G.copied; bar.classList.add('done'); await sleep(1600);
      pill.textContent = G.ended; pill.classList.add('off'); cur.remove(); await sleep(1200); pill.remove();
      banner({ icon: 'whatsapp', app: tx().apps.whatsapp, title: B.who, body: B.m1, danger: true, ttl: 3500 }); await sleep(1500);
      const c = simShow(`<div class="wa-sim"><div class="wa-head danger">👤 <b dir="ltr">${B.who}</b><small style="margin-inline-start:6px;opacity:.75">${B.unknown}</small></div><div class="wa-chat"></div><div class="wa-compose"><span class="wa-field"></span><span class="wa-send">➤</span></div></div>`);
      const chat = c.querySelector('.wa-chat');
      const add = (html, cls = 'in') => { const b = el(`<div class="bub ${cls}">${html}</div>`); chat.appendChild(b); b.scrollIntoView({ block: 'end' }); return b; };
      add(B.m1); await sleep(1500);
      add(`<div class="bm-pics">${['🤳', '👨‍👩‍👧', '🪪'].map((e, i) => `<span style="background:linear-gradient(135deg,${COL[i]},${COL[i + 4]})">${e}</span>`).join('')}</div>`); await sleep(1600);
      add(B.m2); await sleep(1900);
      add(B.m3); await sleep(1700);
      await typeInto(c.querySelector('.wa-field'), B.you, 55); add(B.you, 'out'); c.querySelector('.wa-field').textContent = ''; await sleep(1300);
      await drain([['blackmail', 15000]]);
      await sleep(600);
      banner({ icon: 'whatsapp', app: tx().apps.whatsapp, title: B.who, body: B.m4, danger: true, ttl: 4500 }); await sleep(2600);
    },
    async whatsapp() {
      const X = sx();
      const n = simShow(`<div class="wa-sim"><div class="wa-head">${iconHTML('whatsapp')}<b>${tx().apps.whatsapp}</b></div><div class="wa-invite"><div class="wa-gav">💼</div><small>${X.grpInvite}</small><h3>${X.grpName}</h3><small>${X.grpMembers}</small><button type="button" class="wa-join">${X.join}</button></div></div>`);
      await sleep(1200); n.querySelector('.wa-join').classList.add('press'); await sleep(600);
      const chat = simShow(`<div class="wa-sim"><div class="wa-head">💼 <b>${X.grpName}</b></div><div class="wa-chat"><div class="bub in"><small class="wa-who">${X.admin}</small><div>${X.grpMsg1}</div></div></div><div class="wa-compose"><span class="wa-field"></span><span class="wa-send">➤</span></div></div>`);
      await sleep(1600);
      banner({ icon: 'messages', app: tx().apps.messages, title: 'WhatsApp', body: X.waCode, ttl: 4200 }); await sleep(1500);
      await typeInto(chat.querySelector('.wa-field'), X.youSent, 140);
      chat.querySelector('.wa-chat').appendChild(el(`<div class="bub out">${X.youSent}</div>`)); chat.querySelector('.wa-field').textContent = ''; await sleep(1600);
      simShow(`<div class="wa-sim out"><div class="wa-lo">${iconHTML('whatsapp')}<h3>${X.loggedOut}</h3><p>${X.loggedOutBody}</p></div></div>`); await sleep(2200);
      const h = simShow(`<div class="wa-sim"><div class="wa-head danger">⚠️ <b>${X.hijackTitle}</b></div><ul class="wa-hj"></ul></div>`);
      for (const [who, msg] of X.hijack) { const li = el('<li><b></b><span></span></li>'); li.querySelector('b').textContent = who; li.querySelector('span').textContent = msg; h.querySelector('.wa-hj').appendChild(li); await sleep(1300); }
      await sleep(800);
    },
  };
  async function simulate(kind, v) {
    if (simLayer) return;
    kind = SCRIPTS[kind] ? kind : 'payment';
    openView('home');
    toParent({ type: 'hacked', kind });
    simLayer = el(`<div class="sim"><div class="sim-tag">${sx() && SIM[lang] ? tx().simTag : ''}</div><div class="sim-stage"></div></div>`);
    screen.appendChild(simLayer);
    try { await SCRIPTS[kind](v); } catch (e) { console.error(e); }
    const X = sx();
    const sum = el(`<div class="sim-sum"><h2>${X.title}</h2><div class="sim-loss"><small>${X.lossLbl}</small><b></b></div><ol></ol><div class="sim-protect"><b>${X.protect}</b><p></p></div><button type="button" class="sim-reset">${X.reset}</button></div>`);
    sum.querySelector('.sim-loss b').textContent = (X.lossBy && X.lossBy[curTpl]) || X.loss[kind];
    const stepsList = X.stepsBy[curTpl] || X.steps[kind];
    stepsList.forEach((st) => { const li = document.createElement('li'); li.textContent = st; sum.querySelector('ol').appendChild(li); });
    sum.querySelector('.sim-protect p').textContent = X.protectBy[curTpl] || X.protectTxt[kind];
    curTpl = null;
    sum.querySelector('.sim-reset').addEventListener('click', () => { simLayer.remove(); simLayer = null; document.getElementById('ipBanners').textContent = ''; toParent({ type: 'restored' }); });
    simLayer.appendChild(sum);
  }
  S.hooks.simulate = simulate;
  S.hooks.openUrl = (url, v) => { if (v && v.level === 'danger') simulate(v.kind, v); else window.open(url, '_blank', 'noopener'); };
  S.hooks.pattern = (p, title, body) => { banner({ icon: 'shield', app: tx().apps.shield, title: '📢 ' + title, body, ttl: 9000 }); toParent({ type: 'pattern-received' }); };

  /* ------------------------------ لوحة العارض ------------------------------ */
  function renderSide() {
    if (embed) return;
    const T = tx().side, code = S.code, on = !!S.settings;
    const side = document.getElementById('ipSide');
    side.dir = lang === 'ar' ? 'rtl' : 'ltr';
    side.innerHTML = `<img src="icon.svg" alt="" width="56" height="56"><h1>${T.title}</h1><p class="sub">${T.sub}</p>
      <div class="side-card"><div class="lbl">${T.code}</div><div class="code">${on && code ? code : '— — — —'}</div>${on ? '' : `<div class="lbl">${T.inactive}</div>`}
      ${on && code ? `<a class="side-link" href="/?sender=${code}" target="_blank" rel="noopener">${T.open} ↗</a>` : ''}</div>
      <ol>${T.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
  }
  setInterval(renderSide, 2000);

  /* ------------------------------ الحجم والوقت ------------------------------ */
  function fit() {
    const dev = document.getElementById('ipDevice');
    if (!dev) return;
    const s = Math.min(1, (window.innerHeight - 32) / 880, (window.innerWidth - 24) / 420);
    dev.style.setProperty('--s', s.toFixed(3));
  }
  function tick() {
    const d = new Date();
    document.getElementById('ipTime').textContent = d.getHours() % 12 === 0 ? `12:${String(d.getMinutes()).padStart(2, '0')}` : `${d.getHours() % 12}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  window.addEventListener('resize', fit);
  fit(); tick(); setInterval(tick, 10000);
  seedThreads(); threads.forEach((t) => { t.seed = true; });
  screen.dir = lang === 'ar' ? 'rtl' : 'ltr';
  screen.classList.add('dark-status');
  renderHome(); renderSide();
})();
