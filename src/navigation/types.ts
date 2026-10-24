import type { NavigatorScreenParams } from '@react-navigation/native';

export type CustomerTabParamList = {
  Home: undefined;
  PlaceOrder: undefined;
  MapView: { id?: string } | undefined;
  History: undefined;
};

export type CustomerStackParamList = {
  Main: NavigatorScreenParams<CustomerTabParamList> | undefined;
  OrderDetails: { id: string };
};

export type DriverTabParamList = {
  Home: undefined;
  ViewOrders: undefined;
  MapView: { id?: string } | undefined;
  History: undefined;
};

export type DriverStackParamList = DriverTabParamList & {
  OrderDetails: { id: string };
  DevLocation: undefined;
};
