import { auth } from './firebase';

const BASE = process.env.EXPO_PUBLIC_API_URL;

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
