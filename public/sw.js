// Service worker di Bevotoscano: rende l'app installabile sul telefono e la fa aprire
// anche con poca rete. Regole semplici, per non mostrare mai contenuti vecchi:
// - pagine: sempre dalla rete; solo se manca la rete, l'ultima copia salvata;
// - file dell'app in /assets/ (hanno il nome che cambia a ogni versione): dalla copia salvata;
// - dati (Supabase, mappe, font): mai toccati, vanno sempre in rete.
const CACHE = "bevotoscano-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put("/", copia)); }
          return r;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icone/") || url.pathname.startsWith("/img/")) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((x) => x.put(req, copia)); }
        return r;
      })),
    );
  }
});
