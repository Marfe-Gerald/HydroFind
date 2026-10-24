import React, { useEffect, useState } from 'react';
import MapScreen from '../../screens/Shared/MapScreen';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { getOrder } from '../../services/orderService';
import { toUiOrder } from '../../utils/orderMapper';

export default function MapContainer({ route, navigation, role = 'rider' }: any) {
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
    <MapScreen
      role={role}
      station={tracking?.station ?? null}
      order={order ? toUiOrder(order) : null}
      navigation={navigation}
      riderLocation={tracking?.riderLocation ?? null}
    />
  );
}
