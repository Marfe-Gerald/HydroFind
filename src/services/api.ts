import { Platform } from 'react-native';
import { auth } from './firebase';

// Set EXPO_PUBLIC_API_URL in the root .env (plain line, no quotes), then restart: npx expo start -c
// Falls back to localhost when running in a web browser.
const RAW_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:3000' : undefined);

// The Android emulator reaches your PC at 10.0.2.2, not localhost.
// So one .env value (http://localhost:3000) works for both web and the emulator.
const BASE =
  Platform.OS === 'android' ? RAW_BASE?.replace('localhost', '10.0.2.2') : RAW_BASE;

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env and restart with: npx expo start -c');
  }

  const token = await auth.currentUser?.getIdToken();
  const url = `${BASE}/api${path}`;
  console.log(`[api] ${options.method ?? 'GET'} ${url}`);

  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000); // give up after 10s instead of hanging
  try {
    res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach the server at ${BASE}. Is it running, and is the URL correct?`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}