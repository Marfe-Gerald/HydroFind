import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentCoords, reverseGeocode } from '../services/locationService';
import type { Coord } from '../types';

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coord | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const refresh = useCallback(async (): Promise<Coord | null> => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const nextCoords = await getCurrentCoords();
      const nextAddress = await reverseGeocode(nextCoords);
      if (requestId !== latestRequestId.current) return null;
      setCoords(nextCoords);
      setAddress(nextAddress);
      return nextCoords;
    } catch (e: any) {
      if (requestId !== latestRequestId.current) return null;
      const message = e?.message ?? 'Unable to read location';
      setError(message);
      return null;
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await refresh();
    };
    void run();
    return () => {
      latestRequestId.current += 1;
    };
  }, [refresh]);

  return { coords, address, loading, error, refresh };
}
