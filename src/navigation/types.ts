// types.ts

export type CustomerTabParamList = {
  Home: undefined;
  PlaceOrder: undefined;
  OrderDetails: { id: string } | undefined; // optional, since a tab can render without params
  MapView: { id?: string } | undefined;
};

// Alias so any other files importing the old name keep compiling
export type CustomerStackParamList = CustomerTabParamList;

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
