import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DriverHomeContainer from './containers/DriverHomeContainer';
import MapContainer from './containers/MapContainer';
import OrdersListScreen from '../screens/Shared/OrdersListScreen';
import OrderDetailsScreen from '../screens/Shared/OrderDetailsScreen';
import HistoryScreen from '../screens/Shared/HistoryScreen';
import DevLocationTestScreen from '../screens/Shared/DevLocationTestScreen';
import type { DriverStackParamList, DriverTabParamList } from './types';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home' ? 'home' :
            route.name === 'ViewOrders' ? 'clipboard' :
            route.name === 'MapView' ? 'map' :
            'time';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <DriverHomeContainer {...props} />}
      </Tab.Screen>
      <Tab.Screen name="ViewOrders">
        {(props) => <OrdersListScreen {...props} role="rider" />}
      </Tab.Screen>
      <Tab.Screen name="MapView">{(props) => <MapContainer {...props} role="rider" />}</Tab.Screen>
      <Tab.Screen name="History">
        {(props) => <HistoryScreen {...props} role="rider" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={DriverTabs} />
      <Stack.Screen name="OrderDetails">
        {(props) => <OrderDetailsScreen {...props} role="rider" />}
      </Stack.Screen>
      <Stack.Screen name="DevLocation" component={DevLocationTestScreen} />
    </Stack.Navigator>
  );
}
