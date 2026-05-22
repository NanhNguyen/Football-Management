// Service worker placeholder to prevent 500 errors on local development
// and clean up any stale service workers from other projects on localhost:3000.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Unregister itself to completely clean up
      return self.registration.unregister();
    })
  );
});
