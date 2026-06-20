/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `theobase-${version}`;
const ASSETS = [...build, ...files];
const OFFLINE_URL = '/offline.html';
const DB_NAME = 'theobase-offline';
const DB_VERSION = 3;
const API_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('api-cache')) {
        db.createObjectStore('api-cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        store.createIndex('ts', 'ts', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const API_PATH_PATTERN = /^\/(me|receipts|board|rota|treasury|congregations|pathfinder|sabbath-school|welfare|pantry|health|households|candidacies|communion|av|district|facilities|crisis|transfers|nominating|sessions|roles|items|attendance|classes|events|contacts|bookings|assets|rotations|visits|slots)\b/;

function isAPIPath(pathname: string): boolean {
  return API_PATH_PATTERN.test(pathname);
}

async function pruneAPICache() {
  try {
    const db = await openDB();
    const tx = db.transaction('api-cache', 'readwrite');
    const store = tx.objectStore('api-cache');
    const entries: any[] = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
    const cutoff = Date.now() - API_CACHE_TTL;
    for (const entry of entries) {
      if (entry.ts < cutoff) {
        store.delete(entry.url);
      }
    }
  } catch { /* IndexedDB not available */ }
}

async function cacheAPIResponse(url: string, data: unknown) {
  try {
    const db = await openDB();
    const tx = db.transaction('api-cache', 'readwrite');
    tx.objectStore('api-cache').put({ url, data, ts: Date.now() });
  } catch { /* IndexedDB not available */ }
}

async function getCachedAPI(url: string): Promise<{ data: unknown; fresh: boolean } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('api-cache', 'readonly');
      const req = tx.objectStore('api-cache').get(url);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        const fresh = Date.now() - entry.ts < API_CACHE_TTL;
        resolve({ data: entry.data, fresh });
      };
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function addToOutbox(request: { method: string; url: string; body?: string; authHeader?: string }) {
  try {
    const db = await openDB();
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').add({ ...request, ts: Date.now() });
    notifyClients({ type: 'outbox_queued' });
    await registerOutboxSync();
  } catch {}
}

async function registerOutboxSync() {
  try {
    const registration = self.registration as any;
    if ('sync' in registration) {
      await registration.sync.register('flush-outbox');
    }
  } catch {}
}

async function flushOutbox() {
  try {
    const db = await openDB();
    const tx = db.transaction('outbox', 'readonly');
    const items: any[] = await new Promise((resolve) => {
      const req = tx.objectStore('outbox').getAll();
      req.onsuccess = () => resolve(req.result || []);
    });

    for (const item of items) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (item.authHeader) {
          headers['Authorization'] = item.authHeader;
        }
        await fetch(item.url, { method: item.method, headers, body: item.body });
        const delTx = db.transaction('outbox', 'readwrite');
        delTx.objectStore('outbox').delete(item.id);
      } catch { break; }
    }

    const remainingTx = db.transaction('outbox', 'readonly');
    const remaining: any[] = await new Promise((resolve) => {
      const req = remainingTx.objectStore('outbox').getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
    notifyClients({ type: 'outbox_synced', remaining: remaining.length });
  } catch {}
}

function notifyClients(data: unknown) {
  self.clients.matchAll().then((clients) => {
    for (const client of clients) {
      client.postMessage(data);
    }
  });
}

async function isOnline(): Promise<boolean> {
  try {
    await fetch('/ping', { method: 'HEAD', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      );
      await pruneAPICache();
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  if (isAPIPath(url.pathname) && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request.clone())
        .then(async (response) => {
          if (response.ok) {
            const clone = response.clone();
            try {
              const data = await clone.json();
              await cacheAPIResponse(url.pathname + url.search, data);
            } catch {}
            return response;
          }
          const cached = await getCachedAPI(url.pathname + url.search);
          if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: { 'Content-Type': 'application/json' } });
          return response;
        })
        .catch(async () => {
          const cached = await getCachedAPI(url.pathname + url.search);
          if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: { 'Content-Type': 'application/json' } });
          return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        })
    );
    return;
  }

  if (isAPIPath(url.pathname) && event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        const body = await event.request.clone().text();
        const authHeader = event.request.headers.get('Authorization') || undefined;
        await addToOutbox({
          method: event.request.method,
          url: url.pathname + url.search,
          body: body || undefined,
          authHeader,
        });
        return new Response(JSON.stringify({ ok: true, queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  if (url.pathname.startsWith('/auth')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request.clone())
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL) || fetch(OFFLINE_URL);
            }
            return new Response('Offline', { status: 503 });
          });

        return cached || fetched;
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'sync_outbox') {
    event.waitUntil(flushOutbox());
  } else if (event.data?.type === 'check_online') {
    event.waitUntil(
      isOnline().then((online) => {
        notifyClients({ type: 'connectivity', online });
      })
    );
  } else if (event.data?.type === 'purge_cache') {
    event.waitUntil(purgeStaleEntries());
  } else if (event.data?.type === 'skip_waiting') {
    self.skipWaiting();
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'flush-outbox') {
    event.waitUntil(flushOutbox());
  } else if (event.tag === 'purge-cache') {
    event.waitUntil(purgeStaleEntries());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-outbox') {
    event.waitUntil(flushOutbox());
  }
});

self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'flush-outbox') {
    event.waitUntil(flushOutbox());
  }
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || 'Theobase';
    const options: NotificationOptions = {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.url || '/',
      tag: payload.tag || 'theobase',
      requireInteraction: payload.requireInteraction ?? false,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {}
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
