/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/// <reference lib="WebWorker" />

self.addEventListener("push", (event) => {
  const notif = event.data.json();

  event.waitUntil(
    self.registration.showNotification(notif.title, {
      body: notif.body,
      tag: notif.tag,
      icon: notif.icon,
      actions: notif.actions,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event?.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow("/");
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
