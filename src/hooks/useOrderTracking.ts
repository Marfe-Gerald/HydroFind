import { useEffect, useState } from 'react';
import { getTracking } from '../services/trackingService';
import type { Tracking } from '../types';

export function useOrderTracking(orderId: string | null, intervalMs = 5000) {
  const [trackingState, setTrackingState] = useState<{
    orderId: string;
    tracking: Tracking;
  } | null>(null);
  const [errorState, setErrorState] = useState<{
    orderId: string;
    error: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let stopped = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const t = await getTracking(orderId);
        if (stopped) return;
        setTrackingState({ orderId, tracking: t });
        setErrorState(null);
        if (t.status === 'delivered' || t.status === 'cancelled') return;
      } catch (e) {
        if (!stopped) {
          setErrorState({
            orderId,
            error: e instanceof Error ? e.message : 'Unable to load tracking',
          });
        }
      }
      if (!stopped) timeout = setTimeout(() => void tick(), intervalMs);
    };

    void tick();

    return () => {
      stopped = true;
      clearTimeout(timeout);
    };
  }, [orderId, intervalMs]);

  return {
    tracking: trackingState?.orderId === orderId ? trackingState.tracking : null,
    error: errorState?.orderId === orderId ? errorState.error : null,
  };
}
