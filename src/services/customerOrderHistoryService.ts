import type { Order } from '../types';
import { api } from './api';

export const getCustomerOrderHistory = () => api<Order[]>('/orders/history');
