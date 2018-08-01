import DBHelper from './dbhelper';
import { resolve } from 'path';
const feather = require('feather-icons');
let restaurant;
let reviews;
let map;

const path = '/img/';

/**
 * Registering service worker for offline features
 */
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.register('./sw.js')
  .then(registration => navigator.serviceWorker.ready)
  .then(registration => {
    Notification.requestPermission();
    document.getElementById('submit-review').addEventListener('click', (e) => {
      e.preventDefault();
      let name = document.getElementById('name');
      let rating = document.getElementById('rating');
      let comments = document.getElementById('comments');
      let id = Number(self.restaurant.id);
      submitReview(
      {
        restaurant_id: id,
        name: name.value,
        rating: rating.value,
        comments: comments.value
      })
      name.value = "";
      rating.value = 5;
      comments.value = "";
    });
    console.log('Registration successful, scope is:', registration.scope)
  })
  .catch(error => console.log('Service worker registration failed, error:', error));
}

function submitReview(review){
  let reviewData = {
    "restaurant_id": review.restaurant_id,
    "name": review.name,
    "rating": review.rating,
    "comments": review.comments
  }
  if(navigator.onLine) {
    DBHelper.addReviewToServer(reviewData);
    console.log('Review fetched to the server');
  } else {
    DBHelper.saveReviewToIDBforSync(reviewData);
    
    console.log('Review saved for the future sync');
  }
  // reviewData.updatedAt = Date.now();
  const ul = document.getElementById('reviews-list');
  ul.prepend(createReviewHTML(reviewData));

  return Promise.resolve();
}

/**
 * For offline: fetching in offline mode
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      }
    });
});

window.addEventListener('offline', function(e) { console.log('offline'); });

window.addEventListener('online', function(e) {
  console.log('online');
  // sync reviews
  DBHelper.getOfflineReviewsAndClearIDB();
  // remover offline-review class and change time to "JUST ADDED" and maybe show notification that synced
  const listOffline = document.getElementsByClassName('offline-review');
  if(listOffline.length > 0) {
    console.log('listOffline.length:', listOffline.length, 'listOffline:', listOffline);
    // reverse order for iteration, because on "live" html collection, that changed length when removing classes
    for(let i = listOffline.length - 1; i >= 0; i--) {
      console.log(`listOffline[${i}]:`, listOffline[i]);
      listOffline[i].className = "";
    }
  }
  // sync favorites
  DBHelper.getOfflineFavsAndClearIDB();
});

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
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    disableDefaultUI: true,
    zoomControl: true,
    scrollwheel: false
  });

  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  DBHelper.removeFocusFromMap();
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillBreadcrumb();
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

const fetchReviewsFromUrl = (callback) => {
  if (self.reviews) { // restaurant reviews already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      console.log(self.reviews);
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;

  const fav = document.getElementById('fav');
  const starIcon = document.createElement('i');
  starIcon.dataset.feather = 'star';
  fav.append(starIcon);
  fav.href = '#';
  fav.title = 'Favorite';
  if(restaurant.is_favorite === 'false') {
    fav.className = 'favorite';
  } else {
    fav.className = 'favorite favorited';
  }
  fav.tabIndex = 0;
  fav.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
  fav.addEventListener('click', function(e){
    e.preventDefault();
    if(restaurant.is_favorite === 'false') {
      this.className += ' favorited'; 
      DBHelper.addToFavorites(restaurant.id, restaurant.is_favorite);
      DBHelper.favRestauraurantInIDB(restaurant.id, restaurant.is_favorite);
      restaurant.is_favorite = 'true';
      return;
    }
    this.className = this.className.replace(" favorited", "");
    DBHelper.addToFavorites(restaurant.id, restaurant.is_favorite);
    DBHelper.favRestauraurantInIDB(restaurant.id, restaurant.is_favorite);
    restaurant.is_favorite = 'false';
  });

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.tabIndex = 0;

  const picture = document.getElementById('restaurant-img');
  
  const source = document.createElement('source');
  const imageFullPath = DBHelper.imageUrlForRestaurant(restaurant);
  source.srcset = `${imageFullPath}.webp 800w, ${imageFullPath}-600w.webp 600w, ${imageFullPath}-400w.webp 400w`;
  source.setAttribute('sizes', '(max-width: 400px) 400px, (min-width: 401px) and (max-width: 600px) 600px, (min-width: 601px) and (max-width: 767px) 800px,(min-width: 768px) and (max-width: 890px) 400px,(min-width: 891px) and (max-width: 1290px) 600px, 800px');
  source.type = 'image/webp';
  picture.append(source);

  const image = document.createElement('img');
  image.className = 'restaurant-img'
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg`;
  image.srcset = `${imageFullPath}.jpg 800w, ${imageFullPath}-600w.jpg 600w, ${imageFullPath}-400w.jpg 400w`;
  image.setAttribute('sizes', '(max-width: 400px) 400px, (min-width: 401px) and (max-width: 600px) 600px, (min-width: 601px) and (max-width: 767px) 800px,(min-width: 768px) and (max-width: 890px) 400px,(min-width: 891px) and (max-width: 1290px) 600px, 800px');
  
  image.alt = restaurant.name;
  image.title = restaurant.name;
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  feather.replace();

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromUrl();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.tabIndex = 0;
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.prepend(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  if(review.id===undefined && !navigator.onLine) {
    li.className = 'offline-review';
  }
  if(review.updatedAt===undefined) {
    review.updatedAt = Date.now();
  }
  date.innerHTML = review.updatedAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

