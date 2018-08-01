  import idb from 'idb';
/**
 * Common database helper functions.
 */
  export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Create idb with store and return a promise
   */
  static idbPromise() {
    const dbPromise = idb.open('restaurants-db', 1, upgradeDB => {  

      switch (upgradeDB.oldVersion) {
        case 0:
          const restaurantsStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id'});
          restaurantsStore.createIndex('updated', 'updatedAt');
        case 1:
          const reviewsStore = upgradeDB.createObjectStore('reviews', { keyPath: 'id'});
          reviewsStore.createIndex('restaurant', 'restaurant_id');
        case 2:
          const reviewsOfflineStore = upgradeDB.createObjectStore('offline-reviews', { keyPath: 'updatedAt'});
          reviewsOfflineStore.createIndex('restaurant', 'restaurant_id');
        case 3:
          upgradeDB.createObjectStore('offline-fav', { keyPath: 'restaurant_id'});
          // favOfflineStore.createIndex('restaurant', 'restaurant_id');
      }
    });
    return dbPromise;
  }

  /**
   * Favorite/unfavorite restaurant in idb
   */
  static favRestauraurantInIDB(restaurant_id, is_favorite) {
    is_favorite === 'true' ? is_favorite = 'false' : is_favorite = 'true';
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const restaurantsStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
      console.log('id:', restaurant_id);
      restaurantsStore.get(Number(restaurant_id)).then(restaurant => {
        if(restaurant) {
          restaurant.is_favorite = is_favorite;
          console.log({is_favorite});
          console.log(typeof is_favorite);
          console.log('restaurant:', restaurant);
          console.log('favorited?', restaurant.is_favorite);
          restaurantsStore.put(restaurant);
          
          //if offline store for the sync
          if(!navigator.onLine) {
            console.log('Offline: store favs for the future sync');
            let offlineFav = {
              restaurant_id: restaurant.id,
              is_favorite: restaurant.is_favorite
            }
            const favOfflineStore = db.transaction('offline-fav', 'readwrite').objectStore('offline-fav');
            favOfflineStore.put(offlineFav);
          }
          console.log('Restaurant is_favorite updated in idb');
        } else {
          console.log('No restaurant in idb');
        }
      })
    });
  }

  /**
   * Cache response from server
   */
  static cacheResonse(restaurants) {
    // add restaurants to idb
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
    const tx = db.transaction('restaurants', 'readwrite');
    const restaurantsStore = tx.objectStore('restaurants');

    restaurants.forEach(restaurant => {
      restaurantsStore.put(restaurant);
    });
    
    return tx.complete;
    }).then(function() {
      console.log('Restaurants cached in idb');
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurantsFromIDB(callback) {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const restaurantsStore = db.transaction('restaurants').objectStore('restaurants').index('updated');
      restaurantsStore.getAll().then(restaurants => {
        if(restaurants.length != 0) {
          callback(null, restaurants);
        } else {
          callback('No restaurants in idb', null);
        }
      })
    });
  }

  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromIDB((error, restaurants) => {
      if (error) { // Got an error
        fetch(`${DBHelper.DATABASE_URL}/restaurants`)
        .then(response => response.json())
        .then((restaurants) => {
          console.log('No cached idb, fetched from Internet');
          DBHelper.cacheResonse(restaurants);
          callback(null, restaurants);
        })
        .catch(error => console.log('Fetch Error:', error)); 
      } else {
        console.log('Fetched from cached idb');
        callback(null, restaurants);
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantByIdFromIDB(id, callback) {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const restaurantsStore = db.transaction('restaurants').objectStore('restaurants');
      console.log('id:', id);
      restaurantsStore.get(Number(id)).then(restaurant => {
        if(restaurant) {
          console.log('restaurant:', restaurant);
          callback(null, restaurant);
        } else {
          callback('No restaurant in idb', null);
        }
      })
    });
  }
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurantByIdFromIDB(id, (error, restaurant) => {
      if (error) { // Got an error
        fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
        .then(response => response.json())
        .then((restaurant) => {
          console.log('No cached idb, fetched from Internet');
          callback(null, restaurant);
        })
        .catch(error => callback('No such restaurant in db', null));
      } else {
        console.log('Fetched from cached idb');
        callback(null, restaurant);
      }
    });
  }

  /**
   * Fetch a reviews by restaurant ID from IDB.
   */
  static fetchReviewsByRestaurantIdFromIDB(id, callback) {
    let offReviews = [];
    // getting offline reviews if any
    DBHelper.getOfflineReviews(id, (error, offlineReviews) => {
      if(error) {
        console.log(error);
      } else {
        offReviews = offlineReviews;
        console.log('Offline reviews:', offReviews);
      }
    });

    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const reviewsStore = db.transaction('reviews').objectStore('reviews');
      console.log('id:', id);
      let myIndex = reviewsStore.index('restaurant');
      // double query to idb because of inconsistency of the API (existent reviews with restaurant_id in number just added review returns with restaurant_id in string)
      myIndex.getAll(Number(id)).then(dbReviews => {
        console.log({dbReviews});
        myIndex.getAll(id.toString()).then(newReviews => {
          console.log({newReviews});
          if(offReviews.length != 0 | dbReviews.length != 0 || newReviews.length != 0) {
            let mergeReviews = [];
            if(dbReviews.length != 0) {
              dbReviews.forEach(dbReview => {
                mergeReviews.push(dbReview);
              })
            }
            if(newReviews.length != 0) {
              newReviews.forEach(newReview => {
                mergeReviews.push(newReview);
              })
            }
            if(offReviews.length != 0) {
              offReviews.forEach(offReview => {
                mergeReviews.push(offReview);
              })
            }
              console.log('Reviews from IDB (new, old, offline) for this restaurant:', mergeReviews);
              callback(null, mergeReviews);
            } else {
              callback('No reviews in idb for this restaurant', null);
          }
        })
      })
    });
  }

  /**
   * Fetch reviews by restaurant ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        DBHelper.cacheRestaurantReviewsInIDB(reviews);
        console.log('No reviews in cached idb, reviews fetched from Internet');
        callback(null, reviews);
      })
      .catch(error => {
        DBHelper.fetchReviewsByRestaurantIdFromIDB(id, (error, cachedReviews) => {
          if (error) { // Got an error
            callback('No reviews for this restaurant in db and idb', null)
          } else {
            console.log('Reviews for this restaurant fetched from cached idb (with offline reviews if there are exists)', cachedReviews);
            callback(null, cachedReviews);
          }
        });
      });
  }

  /**
   * Cache restaurant reviews in IDB
   */
  static cacheRestaurantReviewsInIDB(reviews) {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
      reviews.forEach(review => reviewsStore.put(review));
      console.info('Reviews cached in idb');
    })
  }
  /**
   * Add review in idb for offline sync
   */
  static saveReviewToIDBforSync(review) {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const reviewsOfflineStore = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews');
      reviewsOfflineStore.put(review);
    })
  }
  /**
   * Add review in idb for offline sync
   */
  static addReviewToServer(review) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${review.restaurant_id}`, {
      method: 'POST',
      body: JSON.stringify(review)
    })
    .then(response => {
      response.json()
      .then(data => {
        console.log('Review added to the server:', data);
        const dbPromise = DBHelper.idbPromise();
        dbPromise.then(db => {
          const reviewsOfflineStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
          reviewsOfflineStore.put(data);
        })
      }) 
    })
      
    .catch(error => console.error(`Fetch Error =\n`, error));
  }

  static getOfflineReviews(id, callback) {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const offlineReviewsStore = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews').index('restaurant');
      offlineReviewsStore.getAll(Number(id)).then(offlineReviews => {
        if(offlineReviews.length != 0) {
          callback(null, offlineReviews);
        } else {
          callback('No reviews for sync in offline store', null);
        }
      })
    });
  }
  /**
   * Get reviews from idb that have added dyring offline mode
   */
  static getOfflineReviewsAndClearIDB() {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const offlineReviewsStore = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews');
      offlineReviewsStore.getAll().then(offlineReviews => {
        if(offlineReviews.length != 0) {
          DBHelper.fetchOfflineReviewsToServer(offlineReviews);
          offlineReviewsStore.clear();
          console.log('All offline reviews fetched to server, storage cleared');
          if (Notification.permission === "granted") {
            let notification = new Notification("All data has synced to server");
          }
        } else {
          console.log('No reviews for sync in offline store');
        }
      })
    });
  }

  static fetchOfflineReviewsToServer(offlineReviews) {
    offlineReviews.forEach(offlineReview => {
        DBHelper.addReviewToServer(offlineReview);
    });
  }

  /**
   * Get favs from idb that have added dyring offline mode
   */
  static getOfflineFavsAndClearIDB() {
    const dbPromise = DBHelper.idbPromise();
    dbPromise.then(db => {
      const offlineFavsStore = db.transaction('offline-fav', 'readwrite').objectStore('offline-fav');
      offlineFavsStore.getAll().then(offlineFavs => {
        if(offlineFavs.length != 0) {
          DBHelper.fetchOfflineFavsToServer(offlineFavs);
          offlineFavsStore.clear();
          console.log('All offline favs fetched to server, storage cleared');
          if (Notification.permission === "granted") {
            let notification = new Notification("All data has synced to server");
          }
        } else {
          console.log('No favs for sync in offline store');
        }
      })
    });
  }

  static fetchOfflineFavsToServer(offlineFavs) {
    offlineFavs.forEach(offlineFav => {
        let is_favorite = offlineFav.is_favorite;
        is_favorite === 'true' ? is_favorite = 'false' : is_favorite = 'true';
        console.log({offlineFav});
        
        DBHelper.addToFavorites(offlineFav.restaurant_id, is_favorite);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const path = '/img/';
    return (`${path}${restaurant.photograph}`);
  }

  /**
   * Add to/remove restaurant from favorites
   */
  static addToFavorites(restaurant_id, is_favorite) {
    is_favorite === 'true' ? is_favorite = 'false' : is_favorite = 'true';
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=${is_favorite}`, {
      method: 'PUT'
    })
    .then(response => response.json())
    .catch(error => console.error(`Fetch Error =\n`, error));
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if (typeof google === 'object' && typeof google.maps === 'object') {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP}
      );
      return marker;
    }
  }

  static removeFocusFromMap() {
    // add title to iframe and remove focus from google map
    window.setTimeout(() => { 
    document.querySelectorAll('#map iframe').forEach((item) => {
      item.setAttribute('title', 'Google map');
    });
      let map = document.getElementById('map');
      map.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"]), iframe').forEach((item) => {
        item.setAttribute('tabindex', '-1');
      });
    }, 1000);
  }

}