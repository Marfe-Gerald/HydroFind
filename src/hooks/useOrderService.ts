import { useEffect, useState } from 'react';
import { listenPendingOrders } from '../services/orderService';

export function usePendingOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    const unsubscribe = listenPendingOrders(setOrders);
    return unsubscribe; // stop listening when the screen unmounts
  }, []);
  return orders;
}