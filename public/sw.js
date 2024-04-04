/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/// <reference lib="WebWorker" />

self.addEventListener("push", (event) => {
  const notif = event.data.json();

  event.waitUntil(self.registration.showNotification(notif.title, notif));
});

self.addEventListener("notificationclick", (event) => {
  // event.notification.tag
  event?.waitUntil(
    clients.matchAll({ type: "window" }).then((clients) => {
      // If a Window tab matching the targeted URL already exists, focus that;
      const hadWindowToFocus = clients.some((windowClient) =>
        windowClient.url === event.action ? (windowClient.focus(), true) : false
      );
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus)
        clients
          // TODO: safari on ios should open / but other browsers can open event.action
          .openWindow("/")
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});

self.addEventListener("install", function (_event) {
  // Perform install steps
  console.log("installing sw");
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
