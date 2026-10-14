import type { Order as ApiOrder } from '../types';
import type { Order as UiOrder, OrderStatus as UiStatus } from '../screens/Types/Orders';

const STATUS: Record<ApiOrder['status'], UiStatus> = {
  pending: 'Pending',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PROGRESS: Record<ApiOrder['status'], number> = {
  pending: 10,
  on_the_way: 60,
  delivered: 100,
  cancelled: 0,
};

export const toUiOrder = (o: ApiOrder): UiOrder => ({
  id: o.id,
  customerName: o.customerName,
  gallons: o.gallons,
  preferredTime: o.preferredTime ?? '',
  address: o.address ?? '',
  status: STATUS[o.status],
  progress: PROGRESS[o.status],
  latitude: o.location?.latitude,
  longitude: o.location?.longitude,
});
