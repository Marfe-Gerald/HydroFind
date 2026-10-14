import * as Location from 'expo-location';
import type { Coord } from '../types';

export async function ensureForegroundPermission(): Promise<boolean> {
  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

export async function getCurrentCoords(): Promise<Coord> {
  if (!(await ensureForegroundPermission())) throw new Error('Location permission denied');
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: p.coords.latitude, longitude: p.coords.longitude };
}

export async function reverseGeocode(c: Coord): Promise<string | null> {
  try {
    const [a] = await Location.reverseGeocodeAsync(c);
    if (!a) return null;
    return [a.name, a.street, a.district ?? a.subregion, a.city, a.region].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}
