/**
 * Service Worker for En Pensent
 * 
 * Implements caching strategies for:
 * - Chess engine assets (Stockfish WASM)
 * - Static assets (JS, CSS, images)
 * - API responses with stale-while-revalidate
 * 
 * @version 1.0.0
 */

/// <reference lib="es2020" />
/// <reference lib="webworker" />

// Extend NotificationOptions to include actions
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Extend SyncEvent for TypeScript
interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

export type {};
declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `enpensent-static-${CACHE_VERSION}`;
const API_CACHE = `enpensent-api-${CACHE_VERSION}`;
const CHESS_CACHE = `enpensent-chess-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Chess engine files to cache
const CHESS_ASSETS = [
  '/stockfish.wasm',
  '/stockfish.js',
  '/gif.worker.js',
];

// API patterns to cache with stale-while-revalidate
const CACHEABLE_API_PATTERNS = [
  /\/api\/status/,
  /\/api\/accounts/,
  /\/api\/positions/,
  /\/api\/orders/,
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache chess engine assets
      caches.open(CHESS_CACHE).then((cache) => {
        console.log('[ServiceWorker] Caching chess engine assets');
        return cache.addAll(CHESS_ASSETS).catch((err) => {
          console.warn('[ServiceWorker] Failed to cache chess assets:', err);
        });
      }),
    ]).then(() => {
      console.log('[ServiceWorker] Installation complete');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('enpensent-') && !name.includes(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle chess engine assets
  if (CHESS_ASSETS.some((asset) => url.pathname.endsWith(asset))) {
    event.respondWith(chessEngineStrategy(request));
    return;
  }

  // Handle API requests
  if (CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

/**
 * Cache-first strategy for static assets
 * Used for: JS, CSS, images
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});

    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network-first strategy with cache fallback
 * Used for: HTML, dynamic content
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Used for: API endpoints
 */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always fetch from network for fresh data
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.warn('[ServiceWorker] Network fetch failed:', error);
    throw error;
  });

  // Return cached version immediately if available
  if (cached) {
    // Update cache in background
    networkPromise.catch(() => {});
    return cached;
  }

  // Otherwise wait for network
  return networkPromise;
}

/**
 * Chess engine assets strategy
 * Special handling for large WASM files
 */
async function chessEngineStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CHESS_CACHE);

  // Try cache first (these files are large and rarely change)
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  const { data } = event;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then(async (cacheNames) => {
        const sizes = await Promise.all(
          cacheNames.map(async (name) => {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            return { name, count: keys.length };
          })
        );
        event.ports[0]?.postMessage({ sizes });
      })
    );
  }
});

/**
 * Background sync for offline operations
 */
self.addEventListener('sync', ((event: SyncEvent) => {
  if (event.tag === 'sync-trades') {
    // Retry failed trades when online
    console.log('[ServiceWorker] Syncing pending trades...');
  }
}) as EventListener);

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions & { actions?: NotificationAction[] } = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'En Pensent', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

console.log('[ServiceWorker] Service worker script loaded');
