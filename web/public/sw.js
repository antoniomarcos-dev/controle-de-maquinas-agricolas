/// <reference lib="webworker" />
/**
 * Ceres Conecta Hub — Custom Service Worker
 * 
 * Handles offline caching with the following strategy:
 * - App Shell (HTML/CSS/JS): Cache-first, then network
 * - Supabase API: Network-first with 5s timeout, fallback to cache
 * - Google Fonts: Cache-first (immutable)
 * - Static assets: Stale-while-revalidate
 */

const CACHE_VERSION = 'ceres-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// App shell files to pre-cache
const APP_SHELL = [
  '/',
  '/dashboard',
  '/operators',
  '/machines',
  '/vehicles',
  '/services',
  '/maintenance',
  '/reports',
  '/login',
  '/manifest.json',
];

// Install: Pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Failed to pre-cache some resources:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('ceres-') && key !== STATIC_CACHE && key !== API_CACHE && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Apply routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Google Fonts — Cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Supabase API — Network-first with timeout
  if (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/')) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
    return;
  }

  // Static assets — Stale-while-revalidate
  if (/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Navigation requests (HTML pages) — Network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithTimeout(request, STATIC_CACHE, 5000));
    return;
  }

  // Everything else — Network-first
  event.respondWith(networkFirstWithTimeout(request, STATIC_CACHE, 5000));
});

// ===========================================
// Caching Strategies
// ===========================================

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeout) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed or timed out — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, return the cached root page
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response('', { status: 503 });
}
