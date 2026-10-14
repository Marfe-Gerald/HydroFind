import { api } from './api';
import type { Coord, Tracking } from '../types';

export const getTracking = (orderId: string) => api<Tracking>(`/orders/${orderId}/tracking`);

export const pushRiderLocation = (
  orderId: string,
  p: Coord & { heading?: number | null; speed?: number | null }
) => api(`/orders/${orderId}/rider-location`, { method: 'PUT', body: JSON.stringify(p) });

export const updateOrderLocation = (orderId: string, body: { location: Coord; address?: string }) =>
  api(`/orders/${orderId}/location`, { method: 'PATCH', body: JSON.stringify(body) });
