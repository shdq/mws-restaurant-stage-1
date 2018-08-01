// const images = require.context('../img', true);
const feather = require('feather-icons');
import '../css/styles.css';

import DBHelper from './dbhelper';

let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

const path = '/img/';

/**
 * Registering service worker for offline features
 */
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.register('./sw.js')
  .then(registration => navigator.serviceWorker.ready)
  .then(registration => {
    Notification.requestPermission();
    console.log('Registration successful, scope is:', registration.scope)
  })
  .catch(error => console.log('Service worker registration failed, error:', error));
}


/**
 * Check for online status and make sync with the server
 */
window.addEventListener('offline', function(e) { console.log('offline'); });

window.addEventListener('online', function(e) {
  console.log('online');
  // sync reviews
  DBHelper.getOfflineReviewsAndClearIDB();
  // sync favorites
  DBHelper.getOfflineFavsAndClearIDB();
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  
  document.querySelector('select[name="neighborhoods"]').onchange=updateRestaurants;
  document.querySelector('select[name="cuisines"]').onchange=updateRestaurants;
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  for (const neighborhood in neighborhoods) {
    const option = document.createElement('option');
    option.innerHTML = neighborhoods[neighborhood];
    option.value = neighborhoods[neighborhood];
    select.append(option);
  };
  
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  for (const cuisine in cuisines) {
    const option = document.createElement('option');
    option.innerHTML = cuisines[cuisine];
    option.value = cuisines[cuisine];
    select.append(option);
  };
}

/**
 * Initialize Google map on click.
 */
window.onload = () => {
  let map = document.getElementById('map');
  map.addEventListener('click', () => {
    let preloadedScript = document.createElement("script");
    preloadedScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyA2lu4ATHHFARA9-2cDDdn2R_lXhM8-ybI&callback=init";
    document.body.appendChild(preloadedScript);
  });
};

window.init = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    disableDefaultUI: true,
    zoomControl: true,
    scrollwheel: false
  });
  addMarkersToMap();
  DBHelper.removeFocusFromMap();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      DBHelper.removeFocusFromMap();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  for (const m in self.markers) {
    self.markers[m].setMap(null);
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {

  const ul = document.getElementById('restaurants-list'); 

  for (const restaurant in restaurants) {
    ul.append(createRestaurantHTML(restaurants[restaurant]));
  };

  // IntersectionObserver for lazy-load images
  const io = new IntersectionObserver(
    entries => {
      console.log(entries);
      entries.forEach(entry => {
        const container = entry.target;
        if(entry.isIntersecting) {
          const source = container.querySelector('source');
          const img = container.querySelector('img');
          source.srcset = source.dataset.srcset;
          delete source.dataset.srcset;
          img.srcset = img.dataset.srcset;
          delete img.dataset.srcset;
          img.src = img.dataset.src;
          delete img.dataset.src;
          io.unobserve(container);
        }
      })
    }, 
    {
      root: null,
      rootMargin: '0px',
      threshold: 0
    }
  );

  const targets = Array.from(document.querySelectorAll('#restaurants-list li'));
  // Start observing an element
  targets.forEach(target => {
    io.observe(target);
  });
  feather.replace();
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {

  console.log({restaurant});
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  
  const source = document.createElement('source');
  source.dataset.srcset = `${path}${restaurant.id}-600w.webp 2x, ${path}${restaurant.id}-400w.webp 1x`;
  source.type = 'image/webp';
  picture.append(source);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg`;
  image.alt = restaurant.name;
  image.title = restaurant.name;
  
  image.dataset.srcset = `${path}${restaurant.id}-600w.jpg 2x, ${path}${restaurant.id}-400w.jpg 1x`;

  picture.append(image);

  li.append(picture);

  const fav = document.createElement('a');
  const starIcon = document.createElement('i');
  starIcon.dataset.feather = 'star';
  fav.append(starIcon);
  fav.href = '#';
  // inconsistence of the API with types of is_favorite, so double check
  if(restaurant.is_favorite === 'false' || restaurant.is_favorite === false) {
    fav.className = 'favorite';
  } else {
    fav.className = 'favorite favorited';
  }
  
  fav.title = 'Favorite';
  fav.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
  fav.addEventListener('click', function(e){
    e.preventDefault();
    if(restaurant.is_favorite === 'false') {
      fav.className += ' favorited'; 
      DBHelper.addToFavorites(restaurant.id, restaurant.is_favorite);
      DBHelper.favRestauraurantInIDB(restaurant.id, restaurant.is_favorite);
      restaurant.is_favorite = 'true';
      return;
    }
    fav.className = fav.className.replace(" favorited", "");
    DBHelper.addToFavorites(restaurant.id, restaurant.is_favorite);
    DBHelper.favRestauraurantInIDB(restaurant.id, restaurant.is_favorite);
    restaurant.is_favorite = 'false';
  });
  li.append(fav);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', restaurant.name);
  more.className = 'button';
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  if (typeof google === 'object' && typeof google.maps === 'object') {
    for (const restaurant in restaurants) {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurants[restaurant], self.map);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url
      });
      self.markers.push(marker);
    }
  }
}

window.onresize = () => {
  DBHelper.removeFocusFromMap();
}