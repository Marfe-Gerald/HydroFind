import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const read = (filePath) => fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');

describe('navigator route parity contract', () => {
  it('customer tabs are exactly Home, PlaceOrder, OrderDetails, MapView', () => {
    const source = read('src/navigation/CustomerNavigator.tsx');
    const names = [...source.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(names, ['Home', 'PlaceOrder', 'OrderDetails', 'MapView']);
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
});
