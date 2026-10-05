import { api } from './api';

export const createOrder = (body: object) => api('/orders', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const getPendingOrders = () => api('/orders/pending');
export const getMyOrders = () => api('/orders/mine');
export const getOrder = (id: string) => api(`/orders/${id}`);
export const acceptOrder = (id: string) => api(`/orders/${id}/accept`, { method: 'PATCH' });
export const deliverOrder = (id: string) => api(`/orders/${id}/deliver`, { method: 'PATCH' });
export const cancelOrder = (id: string) => api(`/orders/${id}/cancel`, { method: 'PATCH' });
export const deleteOrder = (id: string) => api(`/orders/${id}`, { method: 'DELETE' });