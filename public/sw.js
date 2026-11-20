// عامل خدمة بسيط لعرض إشعارات الدرع والضغط عليها. لا يخزّن أي محتوى.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all[0];
    if (c) { await c.focus(); if (id) c.postMessage({ open: id }); }
    else await self.clients.openWindow('/');
  })());
});
