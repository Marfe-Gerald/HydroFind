export type CustomerTabParamList = {
  Home: undefined;
  ViewOrders: undefined;
  MapView: { id?: string } | undefined;
  History: undefined;
};

export type CustomerStackParamList = CustomerTabParamList & {
  PlaceOrder: undefined;
  OrderDetails: { id: string };
  DevLocation: undefined;
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
