// Service worker de SportApp
// Stratégie « réseau d'abord » : tu as toujours la dernière version du site.
// Le cache ne sert qu'en secours quand il n'y a pas de connexion.

const CACHE = "sportapp-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cles) {
        return Promise.all(
          cles.filter(function (c) { return c !== CACHE; })
              .map(function (c) { return caches.delete(c); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const requete = event.request;
  if (requete.method !== "GET") return;

  // Seulement les fichiers du site : Supabase, polices et CDN ne passent jamais par le cache
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(requete, { cache: "no-cache" })
      .then(function (reponse) {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then(function (c) { c.put(requete, copie); });
        }
        return reponse;
      })
      .catch(function () { return caches.match(requete); })
  );
});