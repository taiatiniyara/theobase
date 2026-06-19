/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `theobase-${version}`;
const ASSETS = [...build, ...files];
const DB_NAME = 'theobase-offline';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('api-cache')) {
        db.createObjectStore('api-cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
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

async function cacheAPIResponse(url: string, data: unknown) {
  try {
    const db = await openDB();
    const tx = db.transaction('api-cache', 'readwrite');
    tx.objectStore('api-cache').put({ url, data, ts: Date.now() });
  } catch { /* IndexedDB not available */ }
}

async function getCachedAPI(url: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('api-cache', 'readonly');
      const req = tx.objectStore('api-cache').get(url);
      req.onsuccess = () => resolve(req.result?.data ?? null);
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
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
          if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
          return response;
        })
        .catch(async () => {
          const cached = await getCachedAPI(url.pathname + url.search);
          if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
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
      caches.match(event.request).then((cached) => cached || fetch(event.request))
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
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-outbox') {
    event.waitUntil(flushOutbox());
  }
});
