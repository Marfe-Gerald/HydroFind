import React from 'react';
import HomeScreen from '../../screens/HomeScreen';
import { useOrders } from '../../hooks/useOrders';
import { getMyOrders } from '../../services/orderService';

export default function CustomerHomeContainer({ navigation }: any) {
  const { orders } = useOrders(() => getMyOrders(), 15000);

  const overview = [
    { label: 'Pending', value: orders.filter((o: any) => o.status === 'pending').length },
    { label: 'On the Way', value: orders.filter((o: any) => o.status === 'on_the_way').length },
    { label: 'Delivered', value: orders.filter((o: any) => o.status === 'delivered').length },
  ];

  return <HomeScreen navigation={navigation} overview={overview} />;
}
