!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:r})},n.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=0)}([function(t,e,n){"use strict";n.r(e),n.d(e,"default",function(){return i});var r=n(1),o=n.n(r);class i{static get DATABASE_URL(){return"http://localhost:1337/restaurants"}static idbPromise(){return o.a.open("restaurants-db",1,t=>{t.createObjectStore("restaurants",{keyPath:"id"}).createIndex("updated","updatedAt")})}static cacheResonse(t){i.idbPromise().then(e=>{const n=e.transaction("restaurants","readwrite"),r=n.objectStore("restaurants");return t.forEach(t=>{r.put(t)}),n.complete}).then(function(){console.log("Restaurants cached in idb")})}static fetchRestaurantsFromIDB(t){i.idbPromise().then(e=>{e.transaction("restaurants").objectStore("restaurants").index("updated").getAll().then(e=>{0!=e.length?t(null,e):t("No restaurants in idb",null)})})}static fetchRestaurants(t){i.fetchRestaurantsFromIDB((e,n)=>{e?fetch(i.DATABASE_URL).then(t=>t.json()).then(e=>{console.log("No cached idb, fetched from Internet"),i.cacheResonse(e),t(null,e)}).catch(t=>console.log("Fetch Error:",t)):(console.log("Fetched from cached idb"),t(null,n))})}static fetchRestaurantByIdFromIDB(t,e){i.idbPromise().then(n=>{const r=n.transaction("restaurants").objectStore("restaurants");console.log("id:",t),r.get(Number(t)).then(t=>{t?(console.log("restaurant:",t),e(null,t)):e("No restaurant in idb",null)})})}static fetchRestaurantById(t,e){i.fetchRestaurantByIdFromIDB(t,(n,r)=>{n?fetch(`${i.DATABASE_URL}/${t}`).then(t=>t.json()).then(t=>{console.log("No cached idb, fetched from Internet"),e(null,t)}).catch(t=>e("No such restaurant in db",null)):(console.log("Fetched from cached idb"),e(null,r))})}static fetchRestaurantByCuisine(t,e){i.fetchRestaurants((n,r)=>{if(n)e(n,null);else{const n=r.filter(e=>e.cuisine_type==t);e(null,n)}})}static fetchRestaurantByNeighborhood(t,e){i.fetchRestaurants((n,r)=>{if(n)e(n,null);else{const n=r.filter(e=>e.neighborhood==t);e(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(t,e,n){i.fetchRestaurants((r,o)=>{if(r)n(r,null);else{let r=o;"all"!=t&&(r=r.filter(e=>e.cuisine_type==t)),"all"!=e&&(r=r.filter(t=>t.neighborhood==e)),n(null,r)}})}static fetchNeighborhoods(t){i.fetchRestaurants((e,n)=>{if(e)t(e,null);else{const e=n.map((t,e)=>n[e].neighborhood),r=e.filter((t,n)=>e.indexOf(t)==n);t(null,r)}})}static fetchCuisines(t){i.fetchRestaurants((e,n)=>{if(e)t(e,null);else{const e=n.map((t,e)=>n[e].cuisine_type),r=e.filter((t,n)=>e.indexOf(t)==n);t(null,r)}})}static urlForRestaurant(t){return`./restaurant.html?id=${t.id}`}static imageUrlForRestaurant(t){return`/img/${t.photograph}`}static mapMarkerForRestaurant(t,e){return new google.maps.Marker({position:t.latlng,title:t.name,url:i.urlForRestaurant(t),map:e,animation:google.maps.Animation.DROP})}static removeFocusFromMap(){window.setTimeout(()=>{document.querySelectorAll("#map iframe").forEach(t=>{t.setAttribute("title","Google map")}),document.getElementById("map").querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"]), iframe').forEach(t=>{t.setAttribute("tabindex","-1")})},1e3)}}},function(t,e,n){"use strict";!function(){function e(t){return new Promise(function(e,n){t.onsuccess=function(){e(t.result)},t.onerror=function(){n(t.error)}})}function n(t,n,r){var o,i=new Promise(function(i,s){e(o=t[n].apply(t,r)).then(i,s)});return i.request=o,i}function r(t,e,n){n.forEach(function(n){Object.defineProperty(t.prototype,n,{get:function(){return this[e][n]},set:function(t){this[e][n]=t}})})}function o(t,e,r,o){o.forEach(function(o){o in r.prototype&&(t.prototype[o]=function(){return n(this[e],o,arguments)})})}function i(t,e,n,r){r.forEach(function(r){r in n.prototype&&(t.prototype[r]=function(){return this[e][r].apply(this[e],arguments)})})}function s(t,e,r,o){o.forEach(function(o){o in r.prototype&&(t.prototype[o]=function(){return t=this[e],(r=n(t,o,arguments)).then(function(t){if(t)return new c(t,r.request)});var t,r})})}function a(t){this._index=t}function c(t,e){this._cursor=t,this._request=e}function u(t){this._store=t}function l(t){this._tx=t,this.complete=new Promise(function(e,n){t.oncomplete=function(){e()},t.onerror=function(){n(t.error)},t.onabort=function(){n(t.error)}})}function f(t,e,n){this._db=t,this.oldVersion=e,this.transaction=new l(n)}function h(t){this._db=t}r(a,"_index",["name","keyPath","multiEntry","unique"]),o(a,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),s(a,"_index",IDBIndex,["openCursor","openKeyCursor"]),r(c,"_cursor",["direction","key","primaryKey","value"]),o(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(t){t in IDBCursor.prototype&&(c.prototype[t]=function(){var n=this,r=arguments;return Promise.resolve().then(function(){return n._cursor[t].apply(n._cursor,r),e(n._request).then(function(t){if(t)return new c(t,n._request)})})})}),u.prototype.createIndex=function(){return new a(this._store.createIndex.apply(this._store,arguments))},u.prototype.index=function(){return new a(this._store.index.apply(this._store,arguments))},r(u,"_store",["name","keyPath","indexNames","autoIncrement"]),o(u,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),s(u,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),i(u,"_store",IDBObjectStore,["deleteIndex"]),l.prototype.objectStore=function(){return new u(this._tx.objectStore.apply(this._tx,arguments))},r(l,"_tx",["objectStoreNames","mode"]),i(l,"_tx",IDBTransaction,["abort"]),f.prototype.createObjectStore=function(){return new u(this._db.createObjectStore.apply(this._db,arguments))},r(f,"_db",["name","version","objectStoreNames"]),i(f,"_db",IDBDatabase,["deleteObjectStore","close"]),h.prototype.transaction=function(){return new l(this._db.transaction.apply(this._db,arguments))},r(h,"_db",["name","version","objectStoreNames"]),i(h,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(t){[u,a].forEach(function(e){e.prototype[t.replace("open","iterate")]=function(){var e,n=(e=arguments,Array.prototype.slice.call(e)),r=n[n.length-1],o=this._store||this._index,i=o[t].apply(o,n.slice(0,-1));i.onsuccess=function(){r(i.result)}}})}),[a,u].forEach(function(t){t.prototype.getAll||(t.prototype.getAll=function(t,e){var n=this,r=[];return new Promise(function(o){n.iterateCursor(t,function(t){t?(r.push(t.value),void 0===e||r.length!=e?t.continue():o(r)):o(r)})})})});var d={open:function(t,e,r){var o=n(indexedDB,"open",[t,e]),i=o.request;return i.onupgradeneeded=function(t){r&&r(new f(i.result,t.oldVersion,i.transaction))},o.then(function(t){return new h(t)})},delete:function(t){return n(indexedDB,"deleteDatabase",[t])}};t.exports=d,t.exports.default=t.exports}()}]);