import { useEffect, useState } from 'react';
import { getTracking } from '../services/trackingService';
import type { Tracking } from '../types';

export function useOrderTracking(orderId: string | null, intervalMs = 5000) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setTracking(null);
      return;
    }

    let stopped = false;
    let id: ReturnType<typeof setInterval>;

    const tick = async () => {
      try {
        const t = await getTracking(orderId);
        if (stopped) return;
        setTracking(t);
        setError(null);
        if (t.status === 'delivered' || t.status === 'cancelled') clearInterval(id);
      } catch (e: any) {
        if (!stopped) setError(e.message ?? 'Unable to load tracking');
      }
    };

    id = setInterval(tick, intervalMs);
    void tick();

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [orderId, intervalMs]);

  return { tracking, error };
}
