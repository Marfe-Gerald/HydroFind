import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';

// CREATE
export async function createOrder(data: {
  customerId: string;
  customerName: string;
  contactNumber: string;
  stationId: string;
  productName: string;
  unitPrice: number;
  gallons: number;
  location: { latitude: number; longitude: number };
  paymentMethod: string;
}) {
  return addDoc(collection(db, 'orders'), {
    ...data,
    totalAmount: data.unitPrice * data.gallons,
    riderId: null,
    riderName: null,
    status: 'pending',
    paymentStatus: 'paid', // simulated
    createdAt: serverTimestamp(),
    acceptedAt: null,
    deliveredAt: null,
  });
}

// READ (rider: live pending orders)
export function listenPendingOrders(cb: (orders: any[]) => void) {
  const q = query(
    collection(db, 'orders'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

// READ (customer: own orders / history)
export function listenCustomerOrders(uid: string, cb: (orders: any[]) => void) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

// READ (customer: one order's live status)
export function listenOrder(orderId: string, cb: (order: any) => void) {
  return onSnapshot(doc(db, 'orders', orderId), (d) =>
    cb(d.exists() ? { id: d.id, ...d.data() } : null)
  );
}

// UPDATE (rider accepts)
export const acceptOrder = (orderId: string, riderId: string, riderName: string) =>
  updateDoc(doc(db, 'orders', orderId), {
    status: 'on_the_way',
    riderId,
    riderName,
    acceptedAt: serverTimestamp(),
  });

// UPDATE (rider delivers)
export const markDelivered = (orderId: string) =>
  updateDoc(doc(db, 'orders', orderId), {
    status: 'delivered',
    deliveredAt: serverTimestamp(),
  });

// UPDATE (cancel, keeps it in history)
export const cancelOrder = (orderId: string) =>
  updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });

// DELETE (pending only)
export const deletePendingOrder = (orderId: string) =>
  deleteDoc(doc(db, 'orders', orderId));