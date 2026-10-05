import { useCallback, useEffect, useState } from 'react';

export function useOrders<T = any>(fetcher: () => Promise<T[]>, intervalMs = 7000) {
  const [orders, setOrders] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setOrders(await fetcher());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { orders, loading, error, refresh };
}