
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import CustomerHomeContainer from './containers/CustomerHomeContainer';
import CustomerPlaceOrderScreen from '../screens/Customer/PlaceOrderScreen';
import HistoryScreen from '../screens/Shared/HistoryScreen';
import OrderDetailsScreen from '../screens/Shared/OrderDetailsScreen';
import MapContainer from './containers/MapContainer';

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { key: 'PlaceOrder', label: 'Place Order', icon: 'water', iconOutline: 'water-outline' },
  { key: 'Map', label: 'Map View', icon: 'map', iconOutline: 'map-outline' },
  { key: 'MyHistory', label: 'History', icon: 'time', iconOutline: 'time-outline' },
] as const;

const Tab = createBottomTabNavigator();
const HistoryStack = createNativeStackNavigator();

function CustomerHistoryNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="History" component={HistoryScreen} />
      <HistoryStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </HistoryStack.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((item) => item.key === route.name);
        const icon = tab?.iconOutline ?? 'home-outline';

        return {
          headerShown: false,
          tabBarLabel: tab?.label ?? route.name,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                (focused ? tab?.icon : icon) as keyof typeof Ionicons.glyphMap
              }
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      {TABS.map((tab) => {
        if (tab.key === 'Map') {
          return (
            <Tab.Screen key={tab.key} name="Map">
              {(props) => <MapContainer {...props} role="customer" />}
            </Tab.Screen>
          );
        }

        if (tab.key === 'Home') {
          return (
            <Tab.Screen
              key={tab.key}
              name="Home"
              component={CustomerHomeContainer}
            />
          );
        }

        if (tab.key === 'PlaceOrder') {
          return (
            <Tab.Screen
              key={tab.key}
              name="PlaceOrder"
              component={CustomerPlaceOrderScreen}
            />
          );
        }

        return (
          <Tab.Screen
            key={tab.key}
            name="MyHistory"
            component={CustomerHistoryNavigator}
          />
        );
      })}
    </Tab.Navigator>
  );
}
