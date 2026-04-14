// VoxCierge Service Worker
// Handles: static asset caching, push notifications, notification click events

const CACHE_VERSION = 'v1'
const CACHE_NAME = `voxcierge-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/home',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ---------------------------------------------------------------------------
// Install: pre-cache static assets
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// ---------------------------------------------------------------------------
// Activate: remove stale caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// ---------------------------------------------------------------------------
// Fetch: network-first with cache fallback for navigation,
//         cache-first for static assets
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  const url = new URL(request.url)

  // API routes: network only
  if (url.pathname.startsWith('/api/')) return

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/home') ?? caches.match('/'))
        .then((res) => res ?? fetch(request)),
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        // Only cache successful responses for same-origin assets
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    }),
  )
})

// ---------------------------------------------------------------------------
// Push: display a notification when a push message is received
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {
    title: 'VoxCierge',
    body: '새로운 알림이 있습니다.',
    url: '/home',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'voxcierge-default',
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    }),
  )
})

// ---------------------------------------------------------------------------
// Notification click: focus an existing window or open a new one
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/home'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin)) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl)
      }),
  )
})
