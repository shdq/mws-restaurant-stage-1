!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";n.r(t),n.d(t,"default",function(){return i});var r=n(1),o=n.n(r);class i{static get DATABASE_URL(){return"http://localhost:1337"}static idbPromise(){return o.a.open("restaurants-db",1,e=>{switch(e.oldVersion){case 0:e.createObjectStore("restaurants",{keyPath:"id"}).createIndex("updated","updatedAt");case 1:e.createObjectStore("reviews",{keyPath:"id"}).createIndex("restaurant","restaurant_id");case 2:e.createObjectStore("offline-reviews",{keyPath:"updatedAt"}).createIndex("restaurant","restaurant_id");case 3:e.createObjectStore("offline-fav",{keyPath:"restaurant_id"})}})}static favRestauraurantInIDB(e,t){t="true"===t?"false":"true",i.idbPromise().then(n=>{const r=n.transaction("restaurants","readwrite").objectStore("restaurants");console.log("id:",e),r.get(Number(e)).then(e=>{if(e){if(e.is_favorite=t,console.log({is_favorite:t}),console.log(typeof t),console.log("restaurant:",e),console.log("favorited?",e.is_favorite),r.put(e),!navigator.onLine){console.log("Offline: store favs for the future sync");let t={restaurant_id:e.id,is_favorite:e.is_favorite};n.transaction("offline-fav","readwrite").objectStore("offline-fav").put(t)}console.log("Restaurant is_favorite updated in idb")}else console.log("No restaurant in idb")})})}static cacheResonse(e){i.idbPromise().then(t=>{const n=t.transaction("restaurants","readwrite"),r=n.objectStore("restaurants");return e.forEach(e=>{r.put(e)}),n.complete}).then(function(){console.log("Restaurants cached in idb")})}static fetchRestaurantsFromIDB(e){i.idbPromise().then(t=>{t.transaction("restaurants").objectStore("restaurants").index("updated").getAll().then(t=>{0!=t.length?e(null,t):e("No restaurants in idb",null)})})}static fetchRestaurants(e){i.fetchRestaurantsFromIDB((t,n)=>{t?fetch(`${i.DATABASE_URL}/restaurants`).then(e=>e.json()).then(t=>{console.log("No cached idb, fetched from Internet"),i.cacheResonse(t),e(null,t)}).catch(e=>console.log("Fetch Error:",e)):(console.log("Fetched from cached idb"),e(null,n))})}static fetchRestaurantByIdFromIDB(e,t){i.idbPromise().then(n=>{const r=n.transaction("restaurants").objectStore("restaurants");console.log("id:",e),r.get(Number(e)).then(e=>{e?(console.log("restaurant:",e),t(null,e)):t("No restaurant in idb",null)})})}static fetchRestaurantById(e,t){i.fetchRestaurantByIdFromIDB(e,(n,r)=>{n?fetch(`${i.DATABASE_URL}/restaurants/${e}`).then(e=>e.json()).then(e=>{console.log("No cached idb, fetched from Internet"),t(null,e)}).catch(e=>t("No such restaurant in db",null)):(console.log("Fetched from cached idb"),t(null,r))})}static fetchReviewsByRestaurantIdFromIDB(e,t){let n=[];i.getOfflineReviews(e,(e,t)=>{e?console.log(e):(n=t,console.log("Offline reviews:",n))}),i.idbPromise().then(r=>{const o=r.transaction("reviews").objectStore("reviews");console.log("id:",e);let i=o.index("restaurant");i.getAll(Number(e)).then(r=>{console.log({dbReviews:r}),i.getAll(e.toString()).then(e=>{if(console.log({newReviews:e}),0!=n.length|0!=r.length||0!=e.length){let o=[];0!=r.length&&r.forEach(e=>{o.push(e)}),0!=e.length&&e.forEach(e=>{o.push(e)}),0!=n.length&&n.forEach(e=>{o.push(e)}),console.log("Reviews from IDB (new, old, offline) for this restaurant:",o),t(null,o)}else t("No reviews in idb for this restaurant",null)})})})}static fetchReviewsByRestaurantId(e,t){fetch(`${i.DATABASE_URL}/reviews/?restaurant_id=${e}`).then(e=>e.json()).then(e=>{i.cacheRestaurantReviewsInIDB(e),console.log("No reviews in cached idb, reviews fetched from Internet"),t(null,e)}).catch(n=>{i.fetchReviewsByRestaurantIdFromIDB(e,(e,n)=>{e?t("No reviews for this restaurant in db and idb",null):(console.log("Reviews for this restaurant fetched from cached idb (with offline reviews if there are exists)",n),t(null,n))})})}static cacheRestaurantReviewsInIDB(e){i.idbPromise().then(t=>{const n=t.transaction("reviews","readwrite").objectStore("reviews");e.forEach(e=>n.put(e)),console.info("Reviews cached in idb")})}static saveReviewToIDBforSync(e){i.idbPromise().then(t=>{t.transaction("offline-reviews","readwrite").objectStore("offline-reviews").put(e)})}static addReviewToServer(e){fetch(`${i.DATABASE_URL}/reviews/?restaurant_id=${e.restaurant_id}`,{method:"POST",body:JSON.stringify(e)}).then(e=>{e.json().then(e=>{console.log("Review added to the server:",e),i.idbPromise().then(t=>{t.transaction("reviews","readwrite").objectStore("reviews").put(e)})})}).catch(e=>console.error("Fetch Error =\n",e))}static getOfflineReviews(e,t){i.idbPromise().then(n=>{n.transaction("offline-reviews","readwrite").objectStore("offline-reviews").index("restaurant").getAll(Number(e)).then(e=>{0!=e.length?t(null,e):t("No reviews for sync in offline store",null)})})}static getOfflineReviewsAndClearIDB(){i.idbPromise().then(e=>{const t=e.transaction("offline-reviews","readwrite").objectStore("offline-reviews");t.getAll().then(e=>{if(0!=e.length){if(i.fetchOfflineReviewsToServer(e),t.clear(),console.log("All offline reviews fetched to server, storage cleared"),"granted"===Notification.permission){new Notification("All data has synced to server")}}else console.log("No reviews for sync in offline store")})})}static fetchOfflineReviewsToServer(e){e.forEach(e=>{i.addReviewToServer(e)})}static getOfflineFavsAndClearIDB(){i.idbPromise().then(e=>{const t=e.transaction("offline-fav","readwrite").objectStore("offline-fav");t.getAll().then(e=>{if(0!=e.length){if(i.fetchOfflineFavsToServer(e),t.clear(),console.log("All offline favs fetched to server, storage cleared"),"granted"===Notification.permission){new Notification("All data has synced to server")}}else console.log("No favs for sync in offline store")})})}static fetchOfflineFavsToServer(e){e.forEach(e=>{let t=e.is_favorite;t="true"===t?"false":"true",console.log({offlineFav:e}),i.addToFavorites(e.restaurant_id,t)})}static fetchRestaurantByCuisine(e,t){i.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){i.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){i.fetchRestaurants((r,o)=>{if(r)n(r,null);else{let r=o;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}})}static fetchNeighborhoods(e){i.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static fetchCuisines(e){i.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/img/${e.photograph}`}static addToFavorites(e,t){t="true"===t?"false":"true",fetch(`${i.DATABASE_URL}/restaurants/${e}/?is_favorite=${t}`,{method:"PUT"}).then(e=>e.json()).catch(e=>console.error("Fetch Error =\n",e))}static mapMarkerForRestaurant(e,t){if("object"==typeof google&&"object"==typeof google.maps){return new google.maps.Marker({position:e.latlng,title:e.name,url:i.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}static removeFocusFromMap(){window.setTimeout(()=>{document.querySelectorAll("#map iframe").forEach(e=>{e.setAttribute("title","Google map")}),document.getElementById("map").querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"]), iframe').forEach(e=>{e.setAttribute("tabindex","-1")})},1e3)}}},function(e,t,n){"use strict";!function(){function t(e){return new Promise(function(t,n){e.onsuccess=function(){t(e.result)},e.onerror=function(){n(e.error)}})}function n(e,n,r){var o,i=new Promise(function(i,s){t(o=e[n].apply(e,r)).then(i,s)});return i.request=o,i}function r(e,t,n){n.forEach(function(n){Object.defineProperty(e.prototype,n,{get:function(){return this[t][n]},set:function(e){this[t][n]=e}})})}function o(e,t,r,o){o.forEach(function(o){o in r.prototype&&(e.prototype[o]=function(){return n(this[t],o,arguments)})})}function i(e,t,n,r){r.forEach(function(r){r in n.prototype&&(e.prototype[r]=function(){return this[t][r].apply(this[t],arguments)})})}function s(e,t,r,o){o.forEach(function(o){o in r.prototype&&(e.prototype[o]=function(){return e=this[t],(r=n(e,o,arguments)).then(function(e){if(e)return new c(e,r.request)});var e,r})})}function a(e){this._index=e}function c(e,t){this._cursor=e,this._request=t}function l(e){this._store=e}function u(e){this._tx=e,this.complete=new Promise(function(t,n){e.oncomplete=function(){t()},e.onerror=function(){n(e.error)},e.onabort=function(){n(e.error)}})}function f(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new u(n)}function d(e){this._db=e}r(a,"_index",["name","keyPath","multiEntry","unique"]),o(a,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),s(a,"_index",IDBIndex,["openCursor","openKeyCursor"]),r(c,"_cursor",["direction","key","primaryKey","value"]),o(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(e){e in IDBCursor.prototype&&(c.prototype[e]=function(){var n=this,r=arguments;return Promise.resolve().then(function(){return n._cursor[e].apply(n._cursor,r),t(n._request).then(function(e){if(e)return new c(e,n._request)})})})}),l.prototype.createIndex=function(){return new a(this._store.createIndex.apply(this._store,arguments))},l.prototype.index=function(){return new a(this._store.index.apply(this._store,arguments))},r(l,"_store",["name","keyPath","indexNames","autoIncrement"]),o(l,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),s(l,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),i(l,"_store",IDBObjectStore,["deleteIndex"]),u.prototype.objectStore=function(){return new l(this._tx.objectStore.apply(this._tx,arguments))},r(u,"_tx",["objectStoreNames","mode"]),i(u,"_tx",IDBTransaction,["abort"]),f.prototype.createObjectStore=function(){return new l(this._db.createObjectStore.apply(this._db,arguments))},r(f,"_db",["name","version","objectStoreNames"]),i(f,"_db",IDBDatabase,["deleteObjectStore","close"]),d.prototype.transaction=function(){return new u(this._db.transaction.apply(this._db,arguments))},r(d,"_db",["name","version","objectStoreNames"]),i(d,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(e){[l,a].forEach(function(t){t.prototype[e.replace("open","iterate")]=function(){var t,n=(t=arguments,Array.prototype.slice.call(t)),r=n[n.length-1],o=this._store||this._index,i=o[e].apply(o,n.slice(0,-1));i.onsuccess=function(){r(i.result)}}})}),[a,l].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,t){var n=this,r=[];return new Promise(function(o){n.iterateCursor(e,function(e){e?(r.push(e.value),void 0===t||r.length!=t?e.continue():o(r)):o(r)})})})});var h={open:function(e,t,r){var o=n(indexedDB,"open",[e,t]),i=o.request;return i.onupgradeneeded=function(e){r&&r(new f(i.result,e.oldVersion,i.transaction))},o.then(function(e){return new d(e)})},delete:function(e){return n(indexedDB,"deleteDatabase",[e])}};e.exports=h,e.exports.default=e.exports}()}]);