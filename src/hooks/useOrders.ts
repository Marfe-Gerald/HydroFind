import { useCallback, useEffect, useRef, useState } from 'react';

export function useOrders<T = any>(fetcher: () => Promise<T[]>, intervalMs = 7000) {
  const [orders, setOrders] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (!Array.isArray(result)) {
        throw new TypeError('Orders response must be an array.');
      }
      setOrders(result);
      setError(null);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await refresh();
      if (!active) return;
    };
    void run();
    const id = setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [refresh, intervalMs]);

  return { orders, loading, error, refresh };
}