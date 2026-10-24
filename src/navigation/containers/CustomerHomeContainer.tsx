import React from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../screens/HomeScreen';
import { useOrders } from '../../hooks/useOrders';
import { getMyOrders } from '../../services/orderService';
import type { CustomerOrderOverview } from '../../screens/HomeScreen';
import type { CustomerTabParamList } from '../types';
import type { Order } from '../../types';

type Props = BottomTabScreenProps<CustomerTabParamList, 'Home'>;

export default function CustomerHomeContainer({ navigation }: Props) {
  const { orders, loading, error, refresh } = useOrders<Order>(getMyOrders, 15000);
  const overview = orders.reduce<CustomerOrderOverview>(
    (counts, order) => {
      if (order.status === 'pending') counts.pending += 1;
      if (order.status === 'on_the_way') counts.onTheWay += 1;
      if (order.status === 'delivered') counts.delivered += 1;
      return counts;
    },
    { pending: 0, onTheWay: 0, delivered: 0 },
  );

  return (
    <HomeScreen
      navigation={navigation}
      overview={overview}
      loading={loading}
      error={error}
      onRetry={refresh}
    />
  );
}
