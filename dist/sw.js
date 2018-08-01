importScripts("precache-manifest.e4f65bbf96b40e4896d411e8ff3598f0.js", "workbox-v3.4.1/workbox-sw.js");
workbox.setConfig({modulePathPrefix: "workbox-v3.4.1"});

let appCache = 'mws-restaurant-app-';
let urlsToCache = ['/'];
self.__precacheManifest.forEach(element => {
  urlsToCache.push(element.url);
  appCache += element.revision.substring(0, 2);
});

// Listen for install event, set callback
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(appCache)
          .then(function(cache) {
            console.log('Opened cache', appCache);
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch:true })
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
            // IMPORTANT: Clone the request. A request is a stream and
            // can only be consumed once. Since we are consuming this
            // once by cache and once by the browser for fetch, we need
            // to clone the response.
            var fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
            function(response) {
                // Check if we received a valid response
                if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                var responseToCache = response.clone();

                caches.open(appCache)
                .then(function(cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        }
      )
    );
  });

// SW activation event
self.addEventListener('activate', function(event) {
    // Perform some task
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName)=> {
            return cacheName.startsWith('mws-restaurant-app-') && cacheName != appCache;
          }).map((cacheName) => {
            return caches.delete(cacheName);
          })
        )
      })
    );
});

// function persistLocalChanges() {
//     console.log('persistLocalChanges');
//     // TODO:
//     DBHelper.getOfflineReviewsAndClearIDB();
//     return Promise.resolve();
// };

// background sync
// self.addEventListener('sync', event => {
//   if (event.tag === 'persistReviewToIDB') {
//     event.waitUntil(persistLocalChanges()
//       .then(() => {
//         self.registration.showNotification("All reviews synced to server");
//       })
//       .catch(() => {
//         console.log("Error syncing reviews to server");
//       })
//     );
//   }
// });
