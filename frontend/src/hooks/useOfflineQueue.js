import { useState, useEffect, useCallback, useRef } from 'react';
import { submitNote } from '../services/api.js';

const QUEUE_KEY = 'vtm_offline_queue';

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState(loadQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryRef = useRef(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const enqueue = useCallback((item) => {
    const entry = { id: Date.now(), ...item, queuedAt: new Date().toISOString(), attempts: 0 };
    setQueue(prev => {
      const next = [...prev, entry];
      saveQueue(next);
      return next;
    });
    return entry.id;
  }, []);

  const dequeue = useCallback((id) => {
    setQueue(prev => {
      const next = prev.filter(e => e.id !== id);
      saveQueue(next);
      return next;
    });
  }, []);

  const retryAll = useCallback(async () => {
    if (retryRef.current || !isOnline) return;
    const current = loadQueue();
    if (current.length === 0) return;

    retryRef.current = true;
    setIsRetrying(true);

    const remaining = [];
    for (const item of current) {
      try {
        await submitNote({ transcription: item.transcription, manualCategory: item.category });
      } catch {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    }

    saveQueue(remaining);
    setQueue(remaining);
    retryRef.current = false;
    setIsRetrying(false);
  }, [isOnline]);

  // Auto-retry when connection returns
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(retryAll, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, retryAll]);

  return { queue, isOnline, isRetrying, enqueue, dequeue, retryAll, queueCount: queue.length };
}
