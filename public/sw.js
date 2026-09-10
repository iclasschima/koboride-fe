self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let data = { title: "KoboRide", body: "New update", url: "/" };
  try {
    data = { ...data, ...(event.data?.json() ?? {}) };
  } catch {
    const text = event.data?.text();
    if (text) data.body = text;
  }

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({
      type: "KOBORIDE_PUSH",
      title: data.title,
      body: data.body,
      url: data.url || "/",
    });
  }

  try {
    await self.registration.showNotification(data.title || "KoboRide", {
      body: data.body || "New update",
      data: { url: data.url || "/" },
      requireInteraction: true,
      tag: "koboride-push",
      renotify: true,
    });
  } catch (err) {
    console.error("[sw] showNotification failed", err);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) {
            return client.navigate(url).then((opened) => opened?.focus() ?? client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
