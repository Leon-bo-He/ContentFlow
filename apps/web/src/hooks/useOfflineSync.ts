import { useEffect, useRef } from 'react';
import { useOfflineQueue } from '../store/offline-queue.store.js';
import { apiFetch } from '../api/client.js';
import { toast } from '../store/toast.store.js';
import i18n from '../i18n/index.js';
import { useOnlineStatus } from './useOnlineStatus.js';

export function useOfflineSync() {
  const { isOnline } = useOnlineStatus();
  const { queue, dequeue } = useOfflineQueue();
  const wasOfflineRef = useRef(!isOnline);

  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = !isOnline;

    if (!isOnline || !wasOffline) return;
    if (queue.length === 0) return;

    const pending = [...queue];
    toast.info(i18n.t('offline.back_online', { ns: 'common', count: pending.length }));

    void (async () => {
      let successCount = 0;
      for (const mutation of pending) {
        try {
          const opts: RequestInit = { method: mutation.method };
          if (mutation.body != null) opts.body = JSON.stringify(mutation.body);
          await apiFetch(mutation.url, opts);
          dequeue(mutation.id);
          successCount++;
        } catch {
          // leave in queue for next retry
        }
      }
      if (successCount > 0) {
        toast.success(i18n.t('offline.all_synced', { ns: 'common' }));
      }
    })();
  }, [isOnline, queue, dequeue]);
}
