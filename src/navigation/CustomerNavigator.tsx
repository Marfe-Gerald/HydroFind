import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import CustomerHomeContainer from './containers/CustomerHomeContainer';
import MapContainer from './containers/MapContainer';
import CustomerPlaceOrderScreen from '../screens/Customer/PlaceOrderScreen';
import OrdersListScreen from '../screens/Shared/OrdersListScreen';
import OrderDetailsScreen from '../screens/Shared/OrderDetailsScreen';
import HistoryScreen from '../screens/Shared/HistoryScreen';
import DevLocationTestScreen from '../screens/Shared/DevLocationTestScreen';
import type { CustomerStackParamList, CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home' ? 'home' :
            route.name === 'ViewOrders' ? 'list' :
            route.name === 'MapView' ? 'map' :
            'time';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeContainer} />
      <Tab.Screen name="ViewOrders">
        {(props) => <OrdersListScreen {...props} role="customer" />}
      </Tab.Screen>
      <Tab.Screen name="MapView" component={MapContainer} />
      <Tab.Screen name="History">
        {(props) => <HistoryScreen {...props} role="customer" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={CustomerTabs} />
      <Stack.Screen name="PlaceOrder" component={CustomerPlaceOrderScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="DevLocation" component={DevLocationTestScreen} />
    </Stack.Navigator>
  );
}
