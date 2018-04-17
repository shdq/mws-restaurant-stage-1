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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Create idb with store and return a promise
   */
  static idbPromise() {
    const dbPromise = idb.open('restaurants-db', 1, upgradeDB => {  
      const restaurantsStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id'});
      restaurantsStore.createIndex('updated', 'updatedAt');
    });
    return dbPromise;
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
        fetch(DBHelper.DATABASE_URL)
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
        fetch(`${DBHelper.DATABASE_URL}/${id}`)
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
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
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