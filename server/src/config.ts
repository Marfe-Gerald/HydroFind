export const STATION = { latitude: 40.7128, longitude: -74.006 };
export const AVG_SPEED_KMH = 25;
export const MIN_PUSH_INTERVAL_MS = 5000;

// Server-side source of truth for what can be ordered. The client must not decide prices.
// Keep in sync with src/config/catalog.ts in the app.
export const CATALOG = {
  stationId: 'hydrofind-station',
  productName: 'Filtered Water',
  unitPrice: 25,
};
export const MAX_GALLONS = 50;
