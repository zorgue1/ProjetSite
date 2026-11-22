// Service worker de SportApp
// Stratégie « réseau d'abord » : tu as toujours la dernière version du site.
// Le cache ne sert qu'en secours quand il n'y a pas de connexion.

const CACHE = "sportapp-v3";
// Versions figées (elles ne changent jamais) : à mettre à jour avec celles des pages HTML
const BIBLIOTHEQUES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/",
  "https://cdn.jsdelivr.net/npm/barcode-detector@3.2.4/",
  "https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.7/"
];

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

  // Seulement les fichiers du site (et la bibliothèque Supabase) : les données Supabase et les polices ne passent jamais par le cache
  const url = new URL(requete.url);

  // Bibliothèques figées : gardées pour marcher sans réseau
  if (BIBLIOTHEQUES.some(function (b) { return url.href.indexOf(b) === 0; })) {
    event.respondWith(
      caches.match(requete).then(function (enCache) {
        return enCache || fetch(requete).then(function (reponse) {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE).then(function (c) { c.put(requete, copie); });
          }
          return reponse;
        });
      })
    );
    return;
  }

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
/* ---------- Notifications ---------- */

// Message envoyé par Supabase : { titre, texte, url }
self.addEventListener("push", function (event) {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { texte: event.data && event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(d.titre || "SportApp", {
      body: d.texte || "",
      icon: "Image/icon-192.png",
      badge: "Image/icon-192.png",
      tag: d.tag || undefined,
      data: { url: d.url || "HTML/Accueil.html" }
    })
  );
});

// Toucher la notification ouvre la bonne page (ou la réutilise si l'appli est déjà ouverte)
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const cible = new URL(event.notification.data.url, self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (fenetres) {
      for (const f of fenetres) {
        if (f.url.indexOf(self.registration.scope) === 0 && "focus" in f) {
          f.navigate(cible);
          return f.focus();
        }
      }
      return self.clients.openWindow(cible);
    })
  );
});
