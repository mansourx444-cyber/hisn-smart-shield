/* بوابة الجهات الشريكة (طرف ثالث): البنوك والشركات والمؤسسات تنشر الممارسات الاحتيالية التي ترصدها
 * فيستعد لها الدرع الذكي ويتنبأ بأشكالها، وتصل فورًا لكل الأجهزة المحمية. لا تُنشر أي بيانات شخصية للعملاء.
 */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = window.ShieldEngine;
  const embed = new URLSearchParams(location.search).get('frame') === '0';
  let lang = 'ar';
  try { lang = JSON.parse(localStorage.getItem('ds.lang') || '"ar"'); } catch {}
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem('ds.partner') || 'null'); } catch {}
  let data = { patterns: [], hits: {} };

  const T = {
    ar: {
      brand: 'بوابة الجهات الشريكة', brandSub: 'حِصن — الدرع الذكي لحماية المجتمع من الاحتيال الإلكتروني', other: 'English',
      loginTitle: 'شاركونا ما ترصدونه من احتيال', loginDesc: 'للبنوك والشركات والمؤسسات التي تتواصل مع العملاء: انشروا الممارسات الاحتيالية التي تُنتحل فيها أسماؤكم، ليستعد لها الدرع الذكي بالذكاء الاصطناعي ويتنبأ بأشكالها ويحمي كل الأجهزة المحمية فورًا.',
      org: 'الجهة', loginBtn: 'ما عند المفوَّض حساب؟ دخول تجريبي للعرض', waiting: 'تم إرسال طلب الدخول إلى تطبيق الهوية الرقمية… بانتظار موافقة المفوَّض', loginFail: 'لم يكتمل الدخول بالهوية الرقمية، حاول مرة أخرى أو استخدم الدخول التجريبي', viaUae: (n) => `عبر UAE PASS${n ? ' — ' + n : ''}`, viaDemo: 'دخول تجريبي',
      privacy: '🔒 تُنشر الأنماط فقط (عبارات، نطاقات، أساليب) ولا تُشارك أي بيانات شخصية للعملاء. الدرع لا يطّلع على ملفات المستخدمين ولا يتتبعهم.',
      signedAs: 'مسجّل الدخول باسم الجهة', logout: 'تسجيل الخروج',
      mine: 'ممارسات نشرتموها', hits: 'مرات صد بفضل تحذيراتكم', all: 'ممارسات منشورة من كل الجهات',
      publish: 'نشر ممارسة احتيالية جديدة', publishDesc: 'ستصل فورًا لكل هواتف المستخدمين المحميين، ويستخدمها المحرك في فحص الرسائل والروابط والمكالمات.',
      channel: 'القناة', sev: 'الخطورة', title: 'عنوان الممارسة', desc: 'وصف مختصر للأسلوب', sample: 'مثال لرسالة أو عبارة يستخدمها المحتال', phrases: 'عبارات مميزة (افصل بفاصلة)', domains: 'نطاقات مزيفة رصدتموها (افصل بفاصلة)',
      example: 'املأ بمثال', publishBtn: '📢 انشر لكل الأجهزة المحمية', published: '✓ نُشرت ووصلت لكل الأجهزة المحمية، وتدرّب عليها نموذج التعلّم الآلي 🧠', need: 'أدخل العنوان وعبارة أو نطاقًا واحدًا على الأقل',
      predict: 'تنبؤ الدرع بالنطاقات المنتحلة', predictDesc: (d) => `نطاقات قد يستخدمها المحتالون لانتحال ${d}، يولّدها الدرع ويراقبها تلقائيًا ضمن كل ممارسة تنشرونها:`,
      list: 'الممارسات المنشورة', withdraw: 'سحب', hitsN: (n) => `صدّ ${n} محاولة`, none: 'لا توجد ممارسات منشورة بعد',
      ch: { sms: 'رسالة نصية', link: 'رابط', call: 'مكالمة', email: 'بريد إلكتروني', wa: 'واتساب', social: 'وسائل التواصل', any: 'أي قناة' }, sv: { high: 'عالية', medium: 'متوسطة' },
    },
    en: {
      brand: 'Partner institutions portal', brandSub: 'HISN — the smart shield protecting the community from online fraud', other: 'العربية',
      loginTitle: 'Share the fraud you see', loginDesc: 'Banks, companies and institutions that deal with customers: publish the scam practices that abuse your name, so Smart Shield’s AI can prepare for them, predict their variants and protect every device instantly.',
      org: 'Institution', loginBtn: 'Officer has no account? Demo sign-in', waiting: 'Sign-in request sent to the digital identity app… waiting for the authorised officer', loginFail: 'UAE PASS sign-in was not completed. Try again or use the demo sign-in', viaUae: (n) => `via UAE PASS${n ? ' — ' + n : ''}`, viaDemo: 'Demo sign-in',
      privacy: '🔒 Only patterns are published (phrases, domains, methods) — never customer personal data. The Shield does not read users’ files or track them.',
      signedAs: 'Signed in for', logout: 'Sign out',
      mine: 'Practices you published', hits: 'Attempts stopped thanks to you', all: 'Practices from all institutions',
      publish: 'Publish a new scam practice', publishDesc: 'It reaches every protected phone instantly and the engine uses it to check messages, links and calls.',
      channel: 'Channel', sev: 'Severity', title: 'Practice title', desc: 'Short description', sample: 'Example message or phrase the scammer uses', phrases: 'Distinctive phrases (comma-separated)', domains: 'Fake domains you have seen (comma-separated)',
      example: 'Fill with example', publishBtn: '📢 Publish to all protected devices', published: '✓ Published to every protected device, and the learning model has trained on it 🧠', need: 'Enter a title and at least one phrase or domain',
      predict: 'Shield’s impersonation-domain prediction', predictDesc: (d) => `Domains scammers may use to imitate ${d}. The Shield generates and watches them automatically with every practice you publish:`,
      list: 'Published practices', withdraw: 'Withdraw', hitsN: (n) => `Stopped ${n} attempts`, none: 'No practices published yet',
      ch: { sms: 'Text message', link: 'Link', call: 'Call', email: 'Email', wa: 'WhatsApp', social: 'Social media', any: 'Any channel' }, sv: { high: 'High', medium: 'Medium' },
    },
  };
  const t = (k, ...a) => { const v = T[lang][k]; return typeof v === 'function' ? v(...a) : v; };
  const EX = {
    ar: { title: 'رسائل «رسوم جمركية معلّقة» على الشحنات', desc: 'رسالة نصية تدّعي أن الشحنة محجوزة في الجمارك وتطلب دفع رسوم عبر رابط.', sample: 'شحنتك محجوزة بسبب رسوم جمركية معلقة بقيمة 12 درهم. ادفع الآن: https://customs-fee-uae.example/pay', phrases: 'رسوم جمركية معلقة, شحنتك محجوزة', domains: 'customs-fee-uae.example', channel: 'sms' },
    en: { title: '“Pending customs fee” texts about parcels', desc: 'A text claims the parcel is held at customs and asks for a fee through a link.', sample: 'Your parcel is held due to a pending customs fee of 12 AED. Pay now: https://customs-fee-uae.example/pay', phrases: 'pending customs fee, parcel is held', domains: 'customs-fee-uae.example', channel: 'sms' },
  };

  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const map = { tBrand: 'brand', tBrandSub: 'brandSub', tLoginTitle: 'loginTitle', tLoginDesc: 'loginDesc', tOrg: 'org', tLoginBtn: 'loginBtn', tPrivacy: 'privacy', tSignedAs: 'signedAs', tMine: 'mine', tHits: 'hits', tAll: 'all', tPublish: 'publish', tPublishDesc: 'publishDesc', tChannel: 'channel', tSev: 'sev', tTitle: 'title', tDesc: 'desc', tSample: 'sample', tPhrases: 'phrases', tDomains: 'domains', tPredict: 'predict', tList: 'list' };
    for (const [id, k] of Object.entries(map)) $('#' + id).textContent = t(k);
    $('#langBtn').textContent = t('other'); $('#btnLogout').textContent = t('logout'); $('#btnExample').textContent = t('example'); $('#btnPublish').textContent = t('publishBtn');
    const orgSel = $('#orgSel'), cur = orgSel.value;
    orgSel.innerHTML = E.ENTITIES.map((e) => `<option value="${e.id}">${e[lang]} — ${e.domains[0]}</option>`).join('');
    if (cur) orgSel.value = cur;
    const ch = $('#fChannel'), cv = ch.value; ch.innerHTML = Object.entries(T[lang].ch).map(([k, v]) => `<option value="${k}">${v}</option>`).join(''); ch.value = cv || 'sms';
    const sv = $('#fSev'), svv = sv.value; sv.innerHTML = Object.entries(T[lang].sv).map(([k, v]) => `<option value="${k}">${v}</option>`).join(''); sv.value = svv || 'high';
    $('#vLogin').hidden = !!session; $('#vDash').hidden = !session;
    if (session) renderDash();
  }
  function renderDash() {
    $('#orgName').textContent = session.org[lang]; $('#orgDomain').textContent = session.org.domains[0] + ' · ' + (session.via === 'uaepass' ? t('viaUae', session.officer) : t('viaDemo'));
    const mine = data.patterns.filter((p) => p.orgId === session.org.id);
    $('#sMine').textContent = mine.length;
    $('#sHits').textContent = mine.reduce((a, p) => a + (data.hits[p.id] || 0), 0);
    $('#sAll').textContent = data.patterns.length;
    $('#tPredictDesc').textContent = t('predictDesc', session.org.domains[0]);
    $('#predicted').innerHTML = '';
    E.predictDomains(session.org.domains[0]).slice(0, 24).forEach((d) => { const s = document.createElement('span'); s.textContent = d; $('#predicted').appendChild(s); });
    const ul = $('#list'); ul.textContent = '';
    if (!data.patterns.length) { const li = document.createElement('li'); li.textContent = t('none'); ul.appendChild(li); }
    for (const p of data.patterns) {
      const li = document.createElement('li'); if (p.orgId === session.org.id) li.className = 'mine';
      li.innerHTML = `<div class="p-li-top"><b dir="auto"></b><span class="p-badge ${p.severity}">${T[lang].sv[p.severity] || ''}</span></div><div class="p-meta"></div><div class="p-meta p-d" dir="auto"></div>`;
      li.querySelector('b').textContent = p.title[lang] || p.title.ar;
      li.querySelector('.p-meta').textContent = `${p.org[lang] || p.org.ar} • ${T[lang].ch[p.channel] || ''} • ${new Date(p.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB')} • ${t('hitsN', data.hits[p.id] || 0)}`;
      li.querySelector('.p-d').textContent = p.description || (p.phrases || []).join('، ');
      if (p.orgId === session.org.id) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'p-del'; b.textContent = t('withdraw');
        b.addEventListener('click', async () => { await fetch('/api/patterns', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: session.token, id: p.id }) }); load(); });
        li.querySelector('.p-li-top').appendChild(b);
      }
      ul.appendChild(li);
    }
  }
  async function load() { try { data = await fetch('/api/patterns').then((r) => r.json()); } catch {} if (session) renderDash(); }

  $('#btnLogin').addEventListener('click', async () => {
    const b = $('#btnLogin'); b.disabled = true;
    try {
      const r = await fetch('/api/partner/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId: $('#orgSel').value }) });
      if (!r.ok) throw new Error();
      session = await r.json(); sessionStorage.setItem('ds.partner', JSON.stringify(session));
      $('#loginState').textContent = ''; await load(); render();
    } catch { $('#loginState').textContent = t('loginFail'); }
    b.disabled = false;
  });
  // الدخول الفعلي بالهوية الرقمية (UAE PASS)
  $('#btnUaePass').addEventListener('click', () => {
    $('#loginState').innerHTML = '<span class="spin"></span>'; $('#loginState').append(t('waiting'));
    const u = `/auth/uaepass/start?role=partner&org=${encodeURIComponent($('#orgSel').value)}&lang=${lang}&next=${encodeURIComponent(location.pathname + location.search)}`;
    if (!window.open(u, 'uaepass', 'width=480,height=760')) location.href = u;
  });
  async function uaeResult(d) {
    if (!d || d.role !== 'partner') return;
    if (!d.ok || !d.session) { $('#loginState').textContent = t('loginFail'); return; }
    session = { ...d.session, via: 'uaepass', officer: d.user && d.user.name }; sessionStorage.setItem('ds.partner', JSON.stringify(session));
    $('#loginState').textContent = ''; await load(); render();
  }
  window.addEventListener('message', (e) => { if (e.origin === location.origin && e.data && e.data.uaepass) uaeResult(e.data.uaepass); });
  try { const r = sessionStorage.getItem('uaepass.result'); if (r) { sessionStorage.removeItem('uaepass.result'); setTimeout(() => uaeResult(JSON.parse(r)), 0); } } catch {}
  $('#btnLogout').addEventListener('click', () => { session = null; sessionStorage.removeItem('ds.partner'); render(); });
  $('#btnExample').addEventListener('click', () => {
    const x = EX[lang]; $('#fTitle').value = x.title; $('#fDesc').value = x.desc; $('#fSample').value = x.sample; $('#fPhrases').value = x.phrases; $('#fDomains').value = x.domains; $('#fChannel').value = x.channel; $('#fSev').value = 'high';
  });
  $('#btnPublish').addEventListener('click', async () => {
    const body = { token: session.token, title: $('#fTitle').value.trim(), description: $('#fDesc').value.trim(), sample: $('#fSample').value.trim(), phrases: $('#fPhrases').value, domains: $('#fDomains').value, channel: $('#fChannel').value, severity: $('#fSev').value };
    if (!body.title || (!body.phrases.trim() && !body.domains.trim())) { $('#pubState').textContent = t('need'); return; }
    const r = await fetch('/api/patterns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (r && r.status === 401) { session = null; sessionStorage.removeItem('ds.partner'); render(); return; }
    if (!r || !r.ok) { $('#pubState').textContent = t('need'); return; }
    $('#pubState').textContent = t('published');
    ['#fTitle', '#fDesc', '#fSample', '#fPhrases', '#fDomains'].forEach((s) => { $(s).value = ''; });
    if (embed && window.parent !== window) window.parent.postMessage({ src: 'partner', type: 'published', org: session.org[lang], title: body.title }, location.origin);
    load();
  });
  $('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('ds.lang', JSON.stringify(lang)); } catch {} render(); });
  setInterval(load, 4000);
  render(); load();
})();
