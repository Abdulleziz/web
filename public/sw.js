/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// https://github.com/shadowwalker/next-pwa/blob/master/examples/custom-ts-worker/worker/index.ts

importScripts("https://js.pusher.com/beams/service-worker.js");

PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload }) => {
  const handleNotification = async () => {
    const siteHasFocus = await PusherPushNotifications._hasFocusedClient();
    if (
      siteHasFocus &&
      payload.notification.hide_notification_if_site_has_focus === true
    )
      return;

    const title = payload.notification.title || "";
    const body = payload.notification.body || "";
    const icon = payload.notification.icon;
    await self.registration.showNotification(title, {
      body,
      icon,
      data: {
        pusher: {
          customerPayload: payload,
          pusherMetadata: payload.data.pusher,
        },
      },
      actions: payload.data.actions,
      tag: payload.data.tag,
      silent: payload.data.delete,
    });

    const notifs = await self.registration.getNotifications();
    notifs.forEach((notif) => {
      const data = notif.data.pusher.customerPayload.data;
      if (data.delete) notif.close();
    });
  };

  pushEvent.waitUntil(handleNotification());
};

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
