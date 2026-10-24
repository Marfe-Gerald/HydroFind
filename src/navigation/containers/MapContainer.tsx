import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import MapScreen from '../../screens/Shared/MapScreen';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { useOrders } from '../../hooks/useOrders';
import { getAssignedOrders, getMyOrders } from '../../services/orderService';
import { toUiOrder } from '../../utils/orderMapper';
import { useRiderLocationBroadcast } from '../../hooks/useRiderLocationBroadcast';
import type { Order as ApiOrder } from '../../types';

export default function MapContainer({ route, navigation, role = 'rider' }: any) {
  const requestedOrderId = route?.params?.id ?? null;
  const { orders, refresh } = useOrders<ApiOrder>(
    role === 'rider' ? getAssignedOrders : getMyOrders,
    5000,
  );
  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));
  const order = requestedOrderId
    ? orders.find((item) => item.id === requestedOrderId) ?? null
    : orders.find((item) => item.status === 'on_the_way') ??
      orders.find((item) => item.status === 'pending') ??
      null;
  const orderId = requestedOrderId ?? order?.id ?? null;
  const { tracking } = useOrderTracking(orderId, 1000);
  const deliveryActive = order?.status === 'on_the_way' || tracking?.status === 'on_the_way';
  useRiderLocationBroadcast(orderId, role === 'rider' && deliveryActive);

  return (
    <MapScreen
      role={role}
      station={tracking?.station ?? null}
      order={order ? toUiOrder(order) : null}
      navigation={navigation}
      riderLocation={tracking?.riderLocation ?? null}
      deliveryActive={deliveryActive}
    />
  );
}
