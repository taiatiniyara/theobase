const CACHE_NAME = 'theobase-v2';
const SYNC_QUEUE = 'theobase-sync-queue';

self.addEventListener('install', (event) => {
  const evt = event;
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/theobase-icon.svg',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const evt = event;
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const evt = event;
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      const fetchPromise = fetch(evt.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(evt.request, clone);
          });
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('sync', (event) => {
  const evt = event;
  if (evt.tag === 'sync-transactions') {
    evt.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  const db = await openIDB();
  const tx = db.transaction(SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE);
  const pending = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  if (!pending || (pending as any[]).length === 0) return;

  const token = await getStoredToken(db);

  for (const item of pending as any[]) {
    try {
      const res = await fetch('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ transactions: [item.transaction] }),
      });

      if (res.ok || res.status === 207) {
        await new Promise((resolve) => {
          const delReq = store.delete(item.id);
          delReq.onsuccess = () => resolve(undefined);
        });
      }
    } catch (_e) {
      // Retry on next sync event
    }
  }

  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'sync-complete', synced: (pending as any[]).length });
  }
}

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('theobase', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE)) {
        db.createObjectStore(SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredToken(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('auth', 'readonly');
    const store = tx.objectStore('auth');
    const req = store.get('token');
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => resolve(null);
  });
}
