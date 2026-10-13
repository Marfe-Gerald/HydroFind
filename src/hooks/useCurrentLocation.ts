import { useCallback, useEffect, useState } from 'react';
import { getCurrentCoords, reverseGeocode } from '../services/locationService';
import type { Coord } from '../types';

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coord | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<Coord | null> => {
    setLoading(true);
    setError(null);
    try {
      const nextCoords = await getCurrentCoords();
      const nextAddress = await reverseGeocode(nextCoords);
      setCoords(nextCoords);
      setAddress(nextAddress);
      return nextCoords;
    } catch (e: any) {
      const message = e?.message ?? 'Unable to read location';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await refresh();
      if (cancelled) return;
      if (result) {
        setCoords(result);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { coords, address, loading, error, refresh };
}
