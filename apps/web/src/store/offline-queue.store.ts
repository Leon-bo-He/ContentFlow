import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueuedMutation {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  body: unknown;
  timestamp: number;
  retries: number;
}

interface OfflineQueueState {
  queue: QueuedMutation[];
  enqueue: (mutation: Omit<QueuedMutation, 'timestamp' | 'retries'>) => void;
  dequeue: (id: string) => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (mutation) =>
        set((s) => ({
          queue: [...s.queue, { ...mutation, timestamp: Date.now(), retries: 0 }],
        })),
      dequeue: (id) => set((s) => ({ queue: s.queue.filter((m) => m.id !== id) })),
    }),
    { name: 'orbit-offline-queue' }
  )
);
