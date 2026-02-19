/**
 * IndexedDB-based offline data layer for SplitKaro.
 * Caches API responses so the app works without network.
 */

const DB_NAME = 'splitkaro-offline';
const DB_VERSION = 1;

const STORES = {
  apiCache: 'apiCache',     // key-value cache of API GET responses
  syncQueue: 'syncQueue',   // queued mutations to replay when online
};

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.apiCache)) {
        db.createObjectStore(STORES.apiCache, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── API Cache ────────────────────────────────────

export async function getCachedResponse(url) {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.apiCache, 'readonly');
      const store = tx.objectStore(STORES.apiCache);
      const req = store.get(url);
      req.onsuccess = () => {
        const record = req.result;
        if (record && Date.now() - record.timestamp < 24 * 60 * 60 * 1000) {
          resolve(record.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedResponse(url, data) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.apiCache, 'readwrite');
    tx.objectStore(STORES.apiCache).put({ url, data, timestamp: Date.now() });
  } catch {
    // silently fail
  }
}

export async function clearCache() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.apiCache, 'readwrite');
    tx.objectStore(STORES.apiCache).clear();
  } catch {
    // silently fail
  }
}

// ── Sync Queue ───────────────────────────────────

export async function addToSyncQueue(entry) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.syncQueue, 'readwrite');
      const store = tx.objectStore(STORES.syncQueue);
      const req = store.add({
        ...entry,
        createdAt: Date.now(),
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[SyncQueue] Failed to add entry:', err);
    throw err;
  }
}

export async function getAllSyncQueue() {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.syncQueue, 'readonly');
      const store = tx.objectStore(STORES.syncQueue);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeSyncQueueItem(id) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    tx.objectStore(STORES.syncQueue).delete(id);
  } catch {
    // silently fail
  }
}

export async function clearSyncQueue() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    tx.objectStore(STORES.syncQueue).clear();
  } catch {
    // silently fail
  }
}
