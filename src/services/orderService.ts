import { api } from './api';
import type { Order } from '../types';

export type CreateOrderInput = Pick<
  Order,
  'stationId' | 'productName' | 'unitPrice' | 'gallons' | 'location' | 'address' | 'preferredTime' | 'paymentMethod'
>;

export const createOrder = (body: CreateOrderInput) => api<{ id: string }>('/orders', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const getPendingOrders = () => api<Order[]>('/orders/pending');
export const getMyOrders = () => api<Order[]>('/orders/mine');
export const getAssignedOrders = () => api<Order[]>('/orders/assigned');
export const getHistory = () => api<Order[]>('/orders/history');
export const getOrder = (id: string) => api<Order>(`/orders/${id}`);
export const acceptOrder = (id: string) => api<{ ok: true }>(`/orders/${id}/accept`, { method: 'PATCH' });
export const deliverOrder = (id: string) => api<{ ok: true }>(`/orders/${id}/deliver`, { method: 'PATCH' });
export const cancelOrder = (id: string) => api<{ ok: true }>(`/orders/${id}/cancel`, { method: 'PATCH' });
export const deleteOrder = (id: string) => api<{ ok: true }>(`/orders/${id}`, { method: 'DELETE' });