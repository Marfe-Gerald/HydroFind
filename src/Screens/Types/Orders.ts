// src/Screens/Types/Orders.ts

export type OrderStatus = 'Pending' | 'On the Way' | 'Delivered';

export interface Order {
  id: string;
  customerName: string;
  gallons: number;
  preferredTime: string;
  address: string;
  status: OrderStatus;
  progress: number; // 0 to 100, used by OrderCard's progress bar
  latitude?: number;
  longitude?: number;
  
}