import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const read = (filePath) => fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');

describe('navigator route parity contract', () => {
  it('customer tabs expose Home, PlaceOrder, MapView, and History and register order details', () => {
    const source = read('src/navigation/CustomerNavigator.tsx');
    const names = [...source.matchAll(/\{ key: '([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(names, ['Home', 'PlaceOrder', 'MapView', 'History']);
    assert.ok(source.includes('<Stack.Screen name="OrderDetails">'));
    assert.ok(source.includes('<Stack.Screen name="Main" component={CustomerTabs} />'));
    assert.equal(source.includes('name="DevLocation"'), false);
  });

  it('rider tabs are exactly Home, ViewOrders, MapView, History', () => {
    const source = read('src/navigation/DriverNavigator.tsx');
    const names = [...source.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(names, ['Home', 'ViewOrders', 'MapView', 'History']);
  });

  it('both role containers render the shared map with role and order id route params', () => {
    const shared = read('src/screens/Shared/MapScreen.tsx');
    const container = read('src/navigation/containers/MapContainer.tsx');
    assert.ok(shared.includes("role?: 'customer' | 'rider'"));
    assert.ok(shared.includes('Distance'));
    assert.ok(shared.includes('Est. Time'));
    assert.ok(shared.includes('Live rider'));
    assert.ok(shared.includes('FROM'));
    assert.ok(shared.includes('TO'));
    assert.ok(container.includes('route?.params?.id'));
    assert.ok(container.includes('role={role}'));
    assert.ok(container.includes('tracking?.riderLocation'));
  });

  it('shows the shortest road option and updates the rider marker during active delivery', () => {
    const shared = read('src/screens/Shared/MapScreen.tsx');
    const container = read('src/navigation/containers/MapContainer.tsx');
    const broadcast = read('src/hooks/useRiderLocationBroadcast.ts');

    assert.ok(shared.includes('alternatives=true'));
    assert.ok(shared.includes('candidate.distance < shortest.distance'));
    assert.ok(shared.includes('window.setRiderLocation'));
    assert.ok(shared.includes('deliveryActive && DATA.rider'));
    assert.ok(shared.includes('pin-rider">🚚'));
    assert.ok(container.includes('useOrderTracking(orderId, 1000)'));
    assert.ok(broadcast.includes('timeInterval: 1000'));
  });

  it('offers hourly delivery slots and restricts immediate delivery to operating hours', () => {
    const placeOrder = read('src/screens/Customer/PlaceOrderScreen.tsx');
    const details = read('src/screens/Shared/OrderDetailsScreen.tsx');

    assert.ok(placeOrder.includes('Array.from({ length: 12 }'));
    assert.ok(placeOrder.includes('hour >= 7 && hour < 18'));
    assert.ok(placeOrder.includes('isNowAvailable() &&'));
    assert.ok(placeOrder.includes("preferredTime === 'Now' && !isNowAvailable()"));
    assert.ok(placeOrder.includes('Choose a delivery time'));
    assert.ok(details.includes('onPress={() => navigation.goBack()}'));
  });
});
