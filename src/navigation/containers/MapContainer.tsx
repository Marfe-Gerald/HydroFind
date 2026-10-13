import React, { useEffect, useState } from 'react';
import MapViewScreen from '../../screens/Driver/Driver-MapScreen';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { getOrder } from '../../services/orderService';
import { toUiOrder } from '../../utils/orderMapper';

export default function MapContainer({ route, navigation }: any) {
  const orderId = route?.params?.id ?? null;
  const { tracking } = useOrderTracking(orderId, 5000);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    getOrder(orderId)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch(() => {
        if (active) setOrder(null);
      });
    return () => { active = false; };
  }, [orderId]);

  return (
    <MapViewScreen
      order={order ? toUiOrder(order) : null}
      navigation={navigation}
      riderLocation={tracking?.riderLocation ?? null}
    />
  );
}
