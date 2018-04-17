!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=2)}([function(e,t,n){"use strict";n.r(t),n.d(t,"default",function(){return a});var r=n(1),o=n.n(r);class a{static get DATABASE_URL(){return"http://localhost:1337/restaurants"}static idbPromise(){return o.a.open("restaurants-db",1,e=>{e.createObjectStore("restaurants",{keyPath:"id"}).createIndex("updated","updatedAt")})}static cacheResonse(e){a.idbPromise().then(t=>{const n=t.transaction("restaurants","readwrite"),r=n.objectStore("restaurants");return e.forEach(e=>{r.put(e)}),n.complete}).then(function(){console.log("Restaurants cached in idb")})}static fetchRestaurantsFromIDB(e){a.idbPromise().then(t=>{t.transaction("restaurants").objectStore("restaurants").index("updated").getAll().then(t=>{0!=t.length?e(null,t):e("No restaurants in idb",null)})})}static fetchRestaurants(e){a.fetchRestaurantsFromIDB((t,n)=>{t?fetch(a.DATABASE_URL).then(e=>e.json()).then(t=>{console.log("No cached idb, fetched from Internet"),a.cacheResonse(t),e(null,t)}).catch(e=>console.log("Fetch Error:",e)):(console.log("Fetched from cached idb"),e(null,n))})}static fetchRestaurantByIdFromIDB(e,t){a.idbPromise().then(n=>{const r=n.transaction("restaurants").objectStore("restaurants");console.log("id:",e),r.get(Number(e)).then(e=>{e?(console.log("restaurant:",e),t(null,e)):t("No restaurant in idb",null)})})}static fetchRestaurantById(e,t){a.fetchRestaurantByIdFromIDB(e,(n,r)=>{n?fetch(`${a.DATABASE_URL}/${e}`).then(e=>e.json()).then(e=>{console.log("No cached idb, fetched from Internet"),t(null,e)}).catch(e=>t("No such restaurant in db",null)):(console.log("Fetched from cached idb"),t(null,r))})}static fetchRestaurantByCuisine(e,t){a.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){a.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){a.fetchRestaurants((r,o)=>{if(r)n(r,null);else{let r=o;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}})}static fetchNeighborhoods(e){a.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static fetchCuisines(e){a.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/img/${e.photograph}`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:a.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}static removeFocusFromMap(){window.setTimeout(()=>{document.querySelectorAll("#map iframe").forEach(e=>{e.setAttribute("title","Google map")}),document.getElementById("map").querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"]), iframe').forEach(e=>{e.setAttribute("tabindex","-1")})},1e3)}}},function(e,t,n){"use strict";!function(){function t(e){return new Promise(function(t,n){e.onsuccess=function(){t(e.result)},e.onerror=function(){n(e.error)}})}function n(e,n,r){var o,a=new Promise(function(a,i){t(o=e[n].apply(e,r)).then(a,i)});return a.request=o,a}function r(e,t,n){n.forEach(function(n){Object.defineProperty(e.prototype,n,{get:function(){return this[t][n]},set:function(e){this[t][n]=e}})})}function o(e,t,r,o){o.forEach(function(o){o in r.prototype&&(e.prototype[o]=function(){return n(this[t],o,arguments)})})}function a(e,t,n,r){r.forEach(function(r){r in n.prototype&&(e.prototype[r]=function(){return this[t][r].apply(this[t],arguments)})})}function i(e,t,r,o){o.forEach(function(o){o in r.prototype&&(e.prototype[o]=function(){return e=this[t],(r=n(e,o,arguments)).then(function(e){if(e)return new c(e,r.request)});var e,r})})}function s(e){this._index=e}function c(e,t){this._cursor=e,this._request=t}function u(e){this._store=e}function l(e){this._tx=e,this.complete=new Promise(function(t,n){e.oncomplete=function(){t()},e.onerror=function(){n(e.error)},e.onabort=function(){n(e.error)}})}function d(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new l(n)}function p(e){this._db=e}r(s,"_index",["name","keyPath","multiEntry","unique"]),o(s,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),i(s,"_index",IDBIndex,["openCursor","openKeyCursor"]),r(c,"_cursor",["direction","key","primaryKey","value"]),o(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(e){e in IDBCursor.prototype&&(c.prototype[e]=function(){var n=this,r=arguments;return Promise.resolve().then(function(){return n._cursor[e].apply(n._cursor,r),t(n._request).then(function(e){if(e)return new c(e,n._request)})})})}),u.prototype.createIndex=function(){return new s(this._store.createIndex.apply(this._store,arguments))},u.prototype.index=function(){return new s(this._store.index.apply(this._store,arguments))},r(u,"_store",["name","keyPath","indexNames","autoIncrement"]),o(u,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),i(u,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),a(u,"_store",IDBObjectStore,["deleteIndex"]),l.prototype.objectStore=function(){return new u(this._tx.objectStore.apply(this._tx,arguments))},r(l,"_tx",["objectStoreNames","mode"]),a(l,"_tx",IDBTransaction,["abort"]),d.prototype.createObjectStore=function(){return new u(this._db.createObjectStore.apply(this._db,arguments))},r(d,"_db",["name","version","objectStoreNames"]),a(d,"_db",IDBDatabase,["deleteObjectStore","close"]),p.prototype.transaction=function(){return new l(this._db.transaction.apply(this._db,arguments))},r(p,"_db",["name","version","objectStoreNames"]),a(p,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(e){[u,s].forEach(function(t){t.prototype[e.replace("open","iterate")]=function(){var t,n=(t=arguments,Array.prototype.slice.call(t)),r=n[n.length-1],o=this._store||this._index,a=o[e].apply(o,n.slice(0,-1));a.onsuccess=function(){r(a.result)}}})}),[s,u].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,t){var n=this,r=[];return new Promise(function(o){n.iterateCursor(e,function(e){e?(r.push(e.value),void 0===t||r.length!=t?e.continue():o(r)):o(r)})})})});var h={open:function(e,t,r){var o=n(indexedDB,"open",[e,t]),a=o.request;return a.onupgradeneeded=function(e){r&&r(new d(a.result,e.oldVersion,a.transaction))},o.then(function(e){return new p(e)})},delete:function(e){return n(indexedDB,"deleteDatabase",[e])}};e.exports=h,e.exports.default=e.exports}()},function(e,t,n){"use strict";n.r(t);var r=n(0);"serviceWorker"in navigator&&navigator.serviceWorker.register("./sw.js").then(e=>console.log("Registration successful, scope is:",e.scope)).catch(e=>console.log("Service worker registration failed, error:",e)),document.addEventListener("DOMContentLoaded",e=>{o((e,t)=>{e?console.error(e):u()})}),window.initMap=(()=>{o((e,t)=>{e?console.error(e):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1}),r.default.mapMarkerForRestaurant(self.restaurant,self.map),r.default.removeFocusFromMap())})});const o=e=>{if(self.restaurant)return void e(null,self.restaurant);const t=l("id");t?r.default.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(a(),e(null,n)):console.error(t)}):(error="No restaurant id in URL",e(error,null))},a=(e=self.restaurant)=>{const t=document.getElementById("restaurant-name");t.innerHTML=e.name,t.tabIndex=0;const n=document.getElementById("restaurant-address");n.innerHTML=e.address,n.tabIndex=0;const o=document.getElementById("restaurant-img"),a=document.createElement("source"),c=r.default.imageUrlForRestaurant(e);a.srcset=`${c}.webp 800w, ${c}-600w.webp 600w, ${c}-400w.webp 400w`,a.setAttribute("sizes","(max-width: 400px) 400px, (min-width: 401px) and (max-width: 600px) 600px, (min-width: 601px) and (max-width: 767px) 800px,(min-width: 768px) and (max-width: 890px) 400px,(min-width: 891px) and (max-width: 1290px) 600px, 800px"),a.type="image/webp",o.append(a);const u=document.createElement("img");u.className="restaurant-img",u.src=`${r.default.imageUrlForRestaurant(e)}.jpg`,u.srcset=`${c}.jpg 800w, ${c}-600w.jpg 600w, ${c}-400w.jpg 400w`,u.setAttribute("sizes","(max-width: 400px) 400px, (min-width: 401px) and (max-width: 600px) 600px, (min-width: 601px) and (max-width: 767px) 800px,(min-width: 768px) and (max-width: 890px) 400px,(min-width: 891px) and (max-width: 1290px) 600px, 800px"),u.alt=e.name,u.title=e.name,o.append(u),document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&i(),s()},i=(e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");t.tabIndex=0;for(let n in e){const r=document.createElement("tr"),o=document.createElement("td");o.innerHTML=n,r.appendChild(o);const a=document.createElement("td");a.innerHTML=e[n],r.appendChild(a),t.appendChild(r)}},s=(e=self.restaurant.reviews)=>{const t=document.getElementById("reviews-container"),n=document.createElement("h2");if(n.innerHTML="Reviews",t.appendChild(n),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const r=document.getElementById("reviews-list");e.forEach(e=>{r.appendChild(c(e))}),t.appendChild(r)},c=e=>{const t=document.createElement("li");t.tabIndex=0;const n=document.createElement("p");n.innerHTML=e.name,t.appendChild(n);const r=document.createElement("p");r.innerHTML=e.date,t.appendChild(r);const o=document.createElement("p");o.innerHTML=`Rating: ${e.rating}`,t.appendChild(o);const a=document.createElement("p");return a.innerHTML=e.comments,t.appendChild(a),t},u=(e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)},l=(e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null}}]);