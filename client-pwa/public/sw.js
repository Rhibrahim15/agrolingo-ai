const CACHE_NAME = 'agrolingo-cache-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate for UI, Network First for Supabase API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Do not cache Supabase API calls so we always get fresh DB data
  if (request.url.includes('supabase.co')) {
    return; // Pass through to network natively
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((response) => {
        // Update cache dynamically for future visits
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse));
        return response;
      }).catch(() => cachedResponse); // Fallback to cache if offline
      
      return cachedResponse || networkFetch;
    })
  );
});