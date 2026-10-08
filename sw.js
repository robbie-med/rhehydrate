/* Rhehydrate service worker — offline-first.
 *
 * Releases: bump VERSION here, APP_VERSION in js/app.js, and the ?v= on every
 * <script>/<link> in index.html and tables.html (tests/calc.test.js checks
 * they agree). Versioned URLs mean a new release never reuses a cached file
 * from an older one — neither from this cache nor the browser's HTTP cache
 * (GitHub Pages sends max-age=14400 for .js/.css). */
var VERSION = "1.6.0";
var CACHE = "rhehydrate-v" + VERSION;
var V = "?v=" + VERSION;
var PAGES = ["./", "./index.html", "./tables.html"];
var ASSETS = [
  "./css/styles.css" + V,
  "./js/i18n.js" + V,
  "./js/i18n-sam.js" + V,
  "./js/i18n-sheet.js" + V,
  "./js/calc.js" + V,
  "./js/sam.js" + V,
  "./js/sheet.js" + V,
  "./js/app.js" + V,
  "./js/tables.js" + V,
  "./js/tables-kr.js" + V,
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: "reload" bypasses the HTTP cache so a new release never stores stale files
      return Promise.all(PAGES.concat(ASSETS).map(function (u) {
        return fetch(new Request(u, { cache: "reload" })).then(function (res) {
          if (!res.ok) throw new Error(u + " " + res.status);
          return c.put(u, res);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  var upgraded = false;
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { upgraded = true; return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
      .then(function () {
        // Replacing an older release: pages open now were served by the old worker
        // and may run old scripts. Reload them once (inputs are saved locally).
        if (!upgraded) return;
        return self.clients.matchAll({ type: "window" }).then(function (list) {
          return Promise.all(list.map(function (c) { return c.navigate(c.url).catch(function () {}); }));
        });
      })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // only same-origin

  // Pages: network-first (revalidated, so a deploy shows up at once), cached
  // under their own path; offline falls back to that page, then to index.html.
  if (req.mode === "navigate") {
    var key = url.pathname;
    e.respondWith(
      fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" })).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(key, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(key).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  // Static assets: cache-first. URLs are versioned, so a hit is always the right release.
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
