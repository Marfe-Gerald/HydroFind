// src/Screens/Data/MockOrders.ts
// Placeholder data — replace with a Firestore query once that's wired up.

import { Order } from '../Types/Orders';

export const MOCK_OVERVIEW = [
  { label: 'Pending', value: 1 },
  { label: 'On the Way', value: 1 },
  { label: 'Delivered', value: 2 },
];
 export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    customerName: 'Maria Santos',
    gallons: 3,
    preferredTime: '10:00 AM',
    address: '123 Sampaguita St., Brgy. Bagong Ilog, Pasig City',
    status: 'Pending',
    progress: 10,
  },
  {
    id: '2',
    customerName: 'Juan Dela Cruz',
    gallons: 5,
    preferredTime: '2:00 PM',
    address: '45 Mabini Ave., Brgy. San Antonio, Makati City',
    status: 'On the Way',
    progress: 60,
  },
  {
    id: '3',
    customerName: 'Ana Reyes',
    gallons: 2,
    preferredTime: '9:00 AM',
    address: '8 Rizal St., Brgy. Poblacion, Makati City',
    status: 'Delivered',
    progress: 100,
  },
  {
    id: '4',
    customerName: 'Pedro Garcia',
    gallons: 4,
    preferredTime: '11:30 AM',
    address: '22 Luna St., Brgy. Kapitolyo, Pasig City',
    status: 'Delivered',
    progress: 100,
  },
];