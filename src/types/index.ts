export type Role = 'customer' | 'rider';

export type Profile = {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  role: Role;
};

export type Coord = { latitude: number; longitude: number };

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
  location: Coord;
  address: string;
  preferredTime: string;
  riderLocation?: (Coord & { heading: number | null; speed: number | null; updatedAt: number | null }) | null;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
};

export type Tracking = {
  orderId: string;
  status: OrderStatus;
  address: string | null;
  customerLocation: Coord;
  riderLocation: (Coord & { heading: number | null; speed: number | null; updatedAt: number | null }) | null;
  station: Coord;
  distanceKm: number;
  etaMinutes: number | null;
  serverTime: number;
};