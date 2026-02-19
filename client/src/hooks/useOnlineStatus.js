import { useState, useEffect, useCallback } from 'react';
import { getAllSyncQueue, removeSyncQueueItem } from '../lib/offlineDb';
import api from '../api';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const queue = await getAllSyncQueue();
    setPendingCount(queue.length);
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = await getAllSyncQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    let synced = 0;

    for (const item of queue) {
      try {
        if (item.method === 'post') {
          await api.post(item.url, item.data);
        } else if (item.method === 'put') {
          await api.put(item.url, item.data);
        } else if (item.method === 'delete') {
          await api.delete(item.url);
        }
        await removeSyncQueueItem(item.id);
        synced++;
      } catch (err) {
        console.warn('[Sync] Failed to sync item:', item, err);
        if (err.response?.status >= 400 && err.response?.status < 500) {
          await removeSyncQueueItem(item.id);
          synced++;
        } else {
          break;
        }
      }
    }

    await refreshPendingCount();
    setSyncing(false);
    return synced;
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingActions, refreshPendingCount]);

  return { isOnline, syncing, pendingCount, syncPendingActions, refreshPendingCount };
}
