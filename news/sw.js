// ニュース閲覧ボード（タブレットアプリ版）のサービスワーカー。
// 画面ファイルは「まずネットから取得、つながらないときは前回の保存分」を使う。
// こうしておくと、GitHub に新しい index.html を置けば次に開いたときに反映され、
// 電波がないときも前回の画面で開ける。ニュースはタブレット内（IndexedDB）にあり、ここでは扱わない。
// キャッシュ名はスケジュールカンバンボード（skbt-）と混ざらないよう nvta- にしている。
const CACHE = "nvta-app-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("nvta-") && k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("index.html")))
  );
});
