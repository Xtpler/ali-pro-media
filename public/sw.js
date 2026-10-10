/* Ali Pro Media — Web Push + OneSignal worker
 * Registered at /sw.js so HTTPS clients (alipromedia4.com) receive
 * system notifications even when the site tab is closed.
 */
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (err) {
  /* OneSignal SDK optional — native push handler below still works */
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Ali Pro Media", body: "لديك تحديث جديد", url: "/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || parsed.headings?.ar || parsed.headings?.en || payload.title,
        body:
          parsed.body ||
          parsed.contents?.ar ||
          parsed.contents?.en ||
          parsed.message ||
          payload.body,
        url: parsed.url || parsed.data?.url || "/",
      };
    }
  } catch {
    try {
      payload.body = event.data.text();
    } catch {
      /* keep defaults */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/apple-icon.png",
      badge: "/icon-dark-32x32.png",
      dir: "rtl",
      lang: "ar",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
