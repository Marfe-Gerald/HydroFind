import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { ApiError } from '../services/api';
import { ensureForegroundPermission } from '../services/locationService';
import { pushRiderLocation } from '../services/trackingService';

export function useRiderLocationBroadcast(orderId: string | null, enabled: boolean) {
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId || !enabled) {
      const reset = () => setError(null);
      void reset();
      return;
    }

    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    const start = async () => {
      try {
        const hasPermission = await ensureForegroundPermission();
        if (!active) return;
        if (!hasPermission) {
          setError('Location permission denied');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (!active) return;
            const payload = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading ?? null,
              speed: location.coords.speed ?? null,
            };

            pushRiderLocation(orderId, payload)
              .then(() => {
                if (!active) return;
                setLastSentAt(Date.now());
                setError(null);
              })
              .catch((e: any) => {
                if (!active) return;
                if (e instanceof ApiError && (e.status === 429 || e.status === 404 || e.status === 409)) {
                  if (e.status === 404 || e.status === 409) {
                    setError(e.message);
                    if (subscription) subscription.remove();
                    active = false;
                  }
                  return;
                }
                setError(e?.message ?? 'Could not push rider location');
              });
          }
        );
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Location tracking failed');
      }
    };

    void start();

    return () => {
      active = false;
      if (subscription) subscription.remove();
    };
  }, [enabled, orderId]);

  return { error, lastSentAt };
}
