self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Svuota completamente qualsiasi cache creata in precedenza per eliminare lo schermo bianco
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Nessun caching: lascia passare la richiesta direttamente alla rete.
  // In questo modo eviteremo per sempre il bug dei file JS non trovati (404) dopo i deploy.
});
