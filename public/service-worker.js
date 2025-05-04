
// Service Worker for Jarvis PWA
const CACHE_NAME = 'jarvis-assistant-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_IMG = '/placeholder.svg';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/placeholder.svg',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Clone the request to make a network request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response to put one copy in cache and return the other
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache API requests or auth endpoints
                if (!event.request.url.includes('/api/') && 
                    !event.request.url.includes('/auth/') && 
                    !event.request.url.includes('/functions/')) {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          })
          .catch((error) => {
            // Network failed, try to serve the offline page or placeholder image
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            } else if (event.request.destination === 'image') {
              return caches.match(OFFLINE_IMG);
            }
            
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calendar-events') {
    event.waitUntil(syncCalendarEvents());
  } else if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Sync functions
async function syncCalendarEvents() {
  // Implementation for syncing calendar events when online again
  const db = await openDB();
  const pendingEvents = await db.getAll('pendingCalendarEvents');
  
  // Process pending events here
  
  console.log('Calendar events synchronized');
}

async function syncTasks() {
  // Implementation for syncing tasks when online again
  console.log('Tasks synchronized');
}

// IndexedDB for offline data
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JarvisOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('pendingCalendarEvents', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('pendingTasks', { keyPath: 'id', autoIncrement: true });
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject('IndexedDB error: ' + event.target.errorCode);
    };
  });
}
