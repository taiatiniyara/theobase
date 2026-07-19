const CACHE_NAME = 'theobase-v1';
const SYNC_QUEUE = 'theobase-sync-queue';

self.addEventListener('install', (event) => {
  const evt = event as ExtendableEvent;
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/app',
        '/app.js',
        '/styles.css',
        '/manifest.json'
      ]);
    })
  );
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event) => {
  const evt = event as ExtendableEvent;
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  (self as any).clients.claim();
});

self.addEventListener('fetch', (event) => {
  const evt = event as FetchEvent;
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
  const evt = event as any;
  if (evt.tag === 'sync-transactions') {
    evt.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  const db = await openIDB();
  const tx = db.transaction(SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE);
  const pending = await new Promise<any[]>((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  if (pending.length === 0) return;

  const token = await getStoredToken(db);

  for (const item of pending) {
    try {
      const res = await fetch('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactions: [item.transaction] })
      });

      if (res.ok || res.status === 207) {
        await new Promise<void>((resolve) => {
          const delReq = store.delete(item.id);
          delReq.onsuccess = () => resolve();
        });
      }
    } catch (e) {
      // Will retry on next sync event
    }
  }

  // Notify all clients
  const clients = await (self as any).clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'sync-complete', synced: pending.length });
  }
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('theobase', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
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

function getStoredToken(db: IDBDatabase): Promise<string | null> {
  return new Promise((resolve) => {
    const tx = db.transaction('auth', 'readonly');
    const store = tx.objectStore('auth');
    const req = store.get('token');
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => resolve(null);
  });
}
