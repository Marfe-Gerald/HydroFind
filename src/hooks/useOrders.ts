import { useCallback, useEffect, useRef, useState } from 'react';

export function useOrders<T = any>(fetcher: () => Promise<T[]>, intervalMs = 7000) {
  const [orders, setOrders] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const latestRequestId = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      const result = await fetcherRef.current();
      if (!Array.isArray(result)) {
        throw new TypeError('Orders response must be an array.');
      }
      if (requestId !== latestRequestId.current) return;
      setOrders(result);
      setError(null);
    } catch (e: any) {
      if (requestId !== latestRequestId.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => {
      latestRequestId.current += 1;
      clearInterval(id);
    };
  }, [refresh, intervalMs]);

  return { orders, loading, error, refresh };
}