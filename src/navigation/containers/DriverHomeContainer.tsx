import React from 'react';
import DriverDashboard from '../../screens/Driver/Driver-Dashboard';
import { useOrders } from '../../hooks/useOrders';
import { getPendingOrders, getAssignedOrders, getHistory } from '../../services/orderService';
import { toUiOrder } from '../../utils/orderMapper';

export default function DriverHomeContainer({ navigation }: any) {
  const pending = useOrders(() => getPendingOrders(), 15000);
  const assigned = useOrders(() => getAssignedOrders(), 15000);
  const history = useOrders(() => getHistory(), 30000);

  const combined = [...pending.orders, ...assigned.orders, ...history.orders]
    .slice(0, 12)
    .map((o: any) => toUiOrder(o));

  return <DriverDashboard role="driver" orders={combined} navigation={navigation} />;
}
