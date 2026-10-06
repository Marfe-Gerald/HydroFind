// src/Screens/Types/Orders.ts

export type OrderStatus = 'Pending' | 'On the Way' | 'Delivered';

export interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  gallons: number;
  time: string;
  /** 0 to 1 — how far along the delivery is, used for the progress bar */
  progress: number;
}