import { useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { getAssignedOrders } from '../../services/orderService';

export function useAssigned() {
  const { orders, loading, error, refresh } = useOrders(() => getAssignedOrders());

  const activeOrderId = useMemo(
    () => orders.find((order: any) => order.status === 'on_the_way')?.id ?? orders[0]?.id ?? null,
    [orders]
  );

  return { orders, activeOrderId, loading, error, refresh };
}
