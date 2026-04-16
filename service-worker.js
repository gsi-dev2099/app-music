// Service Worker for "Boulevard of Broken Dreams" PWA
// Strategy: Cache-First for all assets, including the full MP3 for offline audio.
// Version bump this string to force a cache refresh on all clients.
const CACHE_NAME = 'bobd-pwa-v1';

// ─── ASSETS TO PRE-CACHE ON INSTALL ────────────────────────────────────────
// These are fetched and stored before the SW activates,
// guaranteeing full offline capability from the first visit.
const PRECACHE_ASSETS = [
  '/app-music/',
  '/app-music/index.html',
  '/app-music/css/style.css',
  '/app-music/css/app.css',
  '/app-music/js/AudioEngine.js',
  '/app-music/cover.png',
  '/app-music/favicon.png',
  '/app-music/icon-192.png',
  '/app-music/manifest.json',
  '/app-music/musica.mp3',   // ← Full audio cached for offline playback
  // Blazor runtime (these are large but essential for WASM to work offline)
  '/app-music/_framework/blazor.webassembly.js',
  '/app-music/_framework/blazor.boot.json',
];

// ─── INSTALL ────────────────────────────────────────────────────────────────
// Pre-cache all assets. Audio and images are fetched with 'no-cors' fallback
// if CORS headers aren't present in dev.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache non-audio assets normally
      const staticAssets = PRECACHE_ASSETS.filter(url => !url.endsWith('.mp3'));
      await cache.addAll(staticAssets).catch(err => {
        console.warn('[SW] Some static assets failed to pre-cache:', err);
      });

      // Cache audio with explicit Request to avoid partial-response issues
      try {
        const audioResponse = await fetch('/app-music/musica.mp3', { mode: 'cors' });
        if (audioResponse.ok) {
          await cache.put('/app-music/musica.mp3', audioResponse);
          console.log('[SW] Audio cached successfully for offline use.');
        }
      } catch (err) {
        console.warn('[SW] Audio cache skipped (will cache on first play):', err);
      }
    })
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
// Delete old caches on activation so stale content doesn't serve.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // ── Audio: handle Range requests for offline seeking ─────────────────────
  // Browsers send Range requests when seeking. We intercept and reconstruct
  // the range slice from our cached full audio response.
  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  // ── Navigation: Always serve index.html (Blazor SPA routing) ─────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/app-music/index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  // ── Everything else: Cache-first, network fallback ────────────────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache the result
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // Fully offline and not cached — nothing we can do for this resource
        console.warn('[SW] Fetch failed and no cache:', request.url);
      });
    })
  );
});

// ─── AUDIO RANGE REQUEST HANDLER ────────────────────────────────────────────
// Reconstructs HTTP 206 Partial Content from a cached full response.
// This lets the <audio> element seek while offline.
async function handleAudioRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match('/app-music/musica.mp3');

  // If we have the full file cached, handle range requests manually
  if (cachedResponse) {
    const rangeHeader = request.headers.get('range');

    if (!rangeHeader) {
      // Non-range request — just serve cached file
      return cachedResponse;
    }

    // Parse Range: bytes=START-END
    const arrayBuffer = await cachedResponse.clone().arrayBuffer();
    const totalLength = arrayBuffer.byteLength;

    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    const start = match[1] ? parseInt(match[1]) : 0;
    const end   = match[2] ? parseInt(match[2]) : totalLength - 1;
    const clampedEnd = Math.min(end, totalLength - 1);

    const slice = arrayBuffer.slice(start, clampedEnd + 1);

    return new Response(slice, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(slice.byteLength),
        'Content-Range': `bytes ${start}-${clampedEnd}/${totalLength}`,
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // Not cached yet — fetch from network and cache for next time
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the full response (ignore Range header for storage)
      const fullResponse = await fetch('/app-music/musica.mp3');
      if (fullResponse.ok) {
        const cloned = fullResponse.clone();
        cache.put('/app-music/musica.mp3', cloned);
      }
    }
    return networkResponse;
  } catch {
    return new Response('Audio unavailable offline', { status: 503 });
  }
}
