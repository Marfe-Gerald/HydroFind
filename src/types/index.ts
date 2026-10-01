export type Role = 'customer' | 'rider';

export type Profile = {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  role: Role;
};

export type OrderStatus = 'pending' | 'on_the_way' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  contactNumber: string;
  riderId: string | null;
  riderName: string | null;
  stationId: string;
  productName: string;
  unitPrice: number;
  gallons: number;
  totalAmount: number;
  location: { latitude: number; longitude: number };
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: any;
  acceptedAt: any;
  deliveredAt: any;
};