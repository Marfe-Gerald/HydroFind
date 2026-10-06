import { Platform } from 'react-native';
import { auth } from './firebase';

// Set EXPO_PUBLIC_API_URL in the root .env (plain line, no quotes), then restart: npx expo start -c
// Falls back to localhost when running in a web browser.
const BASE =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:3000' : undefined);

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env and restart with: npx expo start -c');
  }

  const token = await auth.currentUser?.getIdToken();
  const url = `${BASE}/api${path}`;
  console.log(`[api] ${options.method ?? 'GET'} ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach the server at ${BASE}. Is it running, and is the URL correct?`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}