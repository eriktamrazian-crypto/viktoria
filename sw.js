const CACHE = "viktoria-v18";
const API = "https://script.google.com/macros/s/AKfycbyq-9XatEqTnFvL1Fhn3V9BSM1RwRVRKiK1bjCJbarBvAYx8Z_fHdxRKb6n98E8fH8CBw/exec";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./fonts/Mardoto-Regular.ttf", "./fonts/Mardoto-Medium.ttf", "./fonts/Mardoto-Bold.ttf"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
/* Уведомления: сигнал приходит пустым, текст забираем у таблицы. */
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let list = [], unread = 0;
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch(API, { method: "POST", body: JSON.stringify({ fn: "api_pushPull", args: [sub && sub.endpoint] }), redirect: "follow" });
      const j = await r.json(); if (j.ok) { const d = j.data || []; list = Array.isArray(d) ? d : (d.items || []); unread = Array.isArray(d) ? d.length : (d.unread || 0); }
    } catch (err) {}
    if (!list.length) list = [{ title: "Վիկտորյա", body: "Նոր ծանուցում" }];
    try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(unread || list.length); } catch (err) {}
    for (const n of list.slice(0, 4)) {
      await self.registration.showNotification(n.title, { body: n.body, icon: "icon-192.png", badge: "icon-192.png", tag: n.tag, data: { url: "./" } });
    }
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ("focus" in c) return c.focus();
    return self.clients.openWindow("./");
  }));
});
