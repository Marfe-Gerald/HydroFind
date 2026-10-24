// src/screens/Shared/MapScreen.tsx
// Map is rendered with Leaflet inside a WebView, so no Google API key is needed.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { colors, spacing, radius } from '../Themes/colors';
import StatusBadge from '../Components/StatusBadge';
import type { Order } from '../Types/Orders';

interface MapViewScreenProps {
  role?: 'customer' | 'rider';
  station?: Coord | null;
  order?: Order | null;
  riderLocation?: Coord | null;
  deliveryActive?: boolean;
  navigation?: {
    navigate: (screen: string, params?: { id: string }) => void;
    goBack?: () => void;
  };
}

type Coord = { latitude: number; longitude: number };

// Messages sent from the Leaflet page to React Native
type MapMessage = { type: 'route'; distanceKm: number; durationMin: number };

// HydroFind station location (change to your real station)
const STATION: Coord = { latitude: 7.4594190, longitude: 125.7882083 };

// Free CARTO basemap key (request one at https://carto.com/basemaps/apikey).
// Put it in .env as EXPO_PUBLIC_CARTO_BASEMAP_KEY and restart Expo.
// It is not a secret: it is sent with every tile request anyway.
const CARTO_BASEMAP_KEY = process.env.EXPO_PUBLIC_CARTO_BASEMAP_KEY ?? '';

// Straight-line distance in km (haversine)
function distanceKm(a: Coord, b: Coord) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Builds the HTML page that Leaflet runs in
function buildMapHtml(
  station: Coord,
  customer: Coord | null,
  name: string,
  address: string,
  tileKey: string,
  rider: Coord | null = null,
  deliveryActive = false,
) {
  const data = JSON.stringify({ station, customer, name, address, tileKey, rider, deliveryActive }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #dbeafe; }
    .pin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .pin-station { background: #1d4ed8; }
    .pin-customer { background: #ef4444; }
    .pin-rider { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: #16a34a; font-size: 21px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var DATA = ${data};
    var map = L.map('map', { zoomControl: true });

    // CARTO basemaps now require a free API key (otherwise tiles are watermarked)
    var tileUrl = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' +
      (DATA.tileKey ? '?key=' + encodeURIComponent(DATA.tileKey) : '');

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    function icon(cls) {
      return L.divIcon({ className: '', html: '<div class="pin ' + cls + '"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    }

    // Escape text before putting it into popup HTML
    function esc(t) {
      return String(t).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }

    // Send a message to React Native
    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    var s = [DATA.station.latitude, DATA.station.longitude];
    L.marker(s, { icon: icon('pin-station') }).addTo(map).bindPopup('<b>HydroFind Station</b><br>Pioneer Ave., Tagum City');

    var route = null;
    var routeVisible = true;
    var riderMarker = null;
    var lastRouteOrigin = null;
    var lastRouteAt = 0;
    var lastRouteUsedRider = false;
    var routeRequest = 0;

    function riderPoint(point) {
      return [point.latitude, point.longitude];
    }

    function updateRiderMarker(point) {
      if (!point) {
        if (riderMarker) map.removeLayer(riderMarker);
        riderMarker = null;
        return;
      }
      var position = riderPoint(point);
      if (riderMarker) {
        riderMarker.setLatLng(position);
      } else {
        riderMarker = L.marker(position, {
          icon: L.divIcon({
            className: '',
            html: '<div class="pin pin-rider">🚚</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        }).addTo(map).bindPopup('<b>Live rider</b>');
      }
    }

    function routeFrom(origin, fitBounds) {
      if (!DATA.customer) return;
      var c = [DATA.customer.latitude, DATA.customer.longitude];
      var currentRequest = ++routeRequest;
      if (route) map.removeLayer(route);
      route = L.polyline([origin, c], { color: '#1d4ed8', weight: 3, dashArray: '8,8' });
      if (routeVisible) route.addTo(map);
      if (fitBounds) map.fitBounds([origin, c], { padding: [50, 50] });
      lastRouteOrigin = origin;
      lastRouteAt = Date.now();
      lastRouteUsedRider = DATA.deliveryActive && Boolean(DATA.rider);

      // Choose the shortest-distance candidate returned by OSRM; keep the fallback line if routing fails.
      var url = 'https://router.project-osrm.org/route/v1/driving/' +
        origin[1] + ',' + origin[0] + ';' + c[1] + ',' + c[0] +
        '?overview=full&geometries=geojson&alternatives=true';
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (currentRequest !== routeRequest || !json.routes || !json.routes.length) return;
          var r = json.routes.reduce(function (shortest, candidate) {
            return candidate.distance < shortest.distance ? candidate : shortest;
          });
          var latlngs = r.geometry.coordinates.map(function (p) { return [p[1], p[0]]; });
          if (route) map.removeLayer(route);
          route = L.polyline(latlngs, { color: '#1d4ed8', weight: 5, opacity: 0.85 });
          if (routeVisible) route.addTo(map);
          if (fitBounds) map.fitBounds(route.getBounds(), { padding: [50, 50] });
          post({ type: 'route', distanceKm: r.distance / 1000, durationMin: r.duration / 60 });
        })
        .catch(function () { /* keep the straight-line fallback */ });
    }

    if (DATA.rider) updateRiderMarker(DATA.rider);

    if (DATA.customer) {
      var c = [DATA.customer.latitude, DATA.customer.longitude];
      L.marker(c, { icon: icon('pin-customer') }).addTo(map)
        .bindPopup('<b>' + esc(DATA.name) + '</b><br>' + esc(DATA.address));
      var origin = DATA.deliveryActive && DATA.rider ? riderPoint(DATA.rider) : s;
      routeFrom(origin, true);
    } else {
      map.setView(s, 14);
    }

    window.setRiderLocation = function (point) {
      DATA.rider = point;
      updateRiderMarker(point);
      if (!DATA.customer || !DATA.deliveryActive || !point) return;

      var origin = riderPoint(point);
      if (route && route.getLatLngs().length > 1) {
        var routePoints = route.getLatLngs();
        route.setLatLngs([origin].concat(routePoints.slice(1)));
      }
      var movedKm = lastRouteOrigin
        ? L.latLng(lastRouteOrigin).distanceTo(L.latLng(origin)) / 1000
        : Infinity;
      var shouldReroute = !lastRouteUsedRider || movedKm >= 0.1;
      if (shouldReroute && (!lastRouteUsedRider || Date.now() - lastRouteAt >= 10000)) {
        routeFrom(origin, false);
      }
    };

    // Called from React Native to show / hide the route line
    window.setRoute = function (show) {
      routeVisible = show;
      if (!route) return;
      if (show) { route.addTo(map); } else { map.removeLayer(route); }
    };
  </script>
</body>
</html>`;
}

export default function MapScreen({ role = 'customer', station: serverStation = null, order = null, riderLocation = null, deliveryActive = false, navigation }: MapViewScreenProps) {
  void role; // Both roles share the same authorized tracking fields.
  const webRef = useRef<WebView>(null);
  const [routeVisibility, setRouteVisibility] = useState<{
    orderId: string | undefined;
    visible: boolean;
  }>({ orderId: order?.id, visible: true });
  const showRoute =
    routeVisibility.orderId === order?.id ? routeVisibility.visible : true;
  // Real road distance / time reported by the map page (null until loaded)
  const [routeInfo, setRouteInfo] = useState<{
    orderId: string | undefined;
    km: number;
    min: number;
  } | null>(null);
  const currentRouteInfo =
    routeInfo?.orderId === order?.id ? routeInfo : null;

  const station = serverStation ?? STATION;
  const customer: Coord | null =
    order?.latitude != null && order?.longitude != null
      ? { latitude: order.latitude, longitude: order.longitude }
      : null;
  const routeOrigin = deliveryActive && riderLocation ? riderLocation : station;

  // Use the real road route when available, otherwise the straight-line estimate
  const km = currentRouteInfo?.km ?? (customer ? distanceKm(routeOrigin, customer) : 0);
  const minutes =
    currentRouteInfo?.min ?? Math.max(1, Math.round((km / 20) * 60)); // fallback assumes ~20 km/h

  const tripStats = [
    { label: 'Distance', value: `${km.toFixed(1)} km` },
    { label: 'Est. Time', value: `${minutes} min` },
    { label: 'Traffic', value: 'Light' },
  ];

  // Only rebuild the page when the order changes, not when the route is toggled
  const html = useMemo(
    () =>
      buildMapHtml(
        station,
        customer,
        order?.customerName ?? '',
        order?.address ?? '',
        CARTO_BASEMAP_KEY,
        riderLocation,
        deliveryActive,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order?.id, order?.latitude, order?.longitude, deliveryActive, serverStation?.latitude, serverStation?.longitude],
  );

  const riderLocationJson = JSON.stringify(riderLocation ?? null);
  useEffect(() => {
    webRef.current?.injectJavaScript(`window.setRiderLocation(${riderLocationJson}); true;`);
  }, [riderLocationJson]);

  const handleMessage = (e: { nativeEvent: { data: string } }) => {
    try {
      const msg: MapMessage = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'route') {
        setRouteInfo({
          orderId: order?.id,
          km: msg.distanceKm,
          min: Math.max(1, Math.round(msg.durationMin)),
        });
      }
    } catch {
      // ignore malformed messages
    }
  };

  const toggleRoute = () => {
    const next = !showRoute;
    setRouteVisibility({ orderId: order?.id, visible: next });
    webRef.current?.injectJavaScript(`window.setRoute(${next}); true;`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Map View</Text>
          <Text style={styles.headerSubtitle}>
            {order ? `Route to ${order.customerName}` : 'Delivery locations'}
          </Text>
        </View>

        {order && <StatusBadge status={order.status} />}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <View style={styles.mapWrap}>
          <WebView
            ref={webRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            nestedScrollEnabled
            setSupportMultipleWindows={false}
            onMessage={handleMessage}
            onLoadEnd={() => {
              const location = JSON.stringify(riderLocation ?? null);
              webRef.current?.injectJavaScript(
                `window.setRoute(${showRoute}); window.setRiderLocation(${location}); true;`,
              );
            }}
          />

          {customer && (
            <TouchableOpacity
              style={styles.routeToggle}
              activeOpacity={0.8}
              onPress={toggleRoute}
            >
              <Text style={styles.routeToggleText}>
                {showRoute ? 'Hide Route' : 'Show Route'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          {order ? (
            <>
              <View style={styles.card}>
                <View style={styles.statsRow}>
                  {tripStats.map((s, i) => (
                    <View key={s.label} style={[styles.statCell, i > 0 && styles.statCellDivider]}>
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.card, styles.routeCard]}>
                <View style={styles.stopRow}>
                  <View style={[styles.stopDot, { backgroundColor: '#1d4ed8' }]} />
                  <View style={styles.stopText}>
                    <Text style={styles.stopTag}>FROM</Text>
                    <Text style={styles.stopTitle}>
                      {deliveryActive && riderLocation ? 'Rider location' : 'HydroFind Station'}
                    </Text>
                  </View>
                </View>

                <View style={styles.connector} />

                <View style={styles.stopRow}>
                  <View style={[styles.stopDot, { backgroundColor: '#ef4444' }]} />
                  <View style={styles.stopText}>
                    <Text style={styles.stopTag}>TO</Text>
                    <Text style={styles.stopTitle}>{order.customerName}</Text>
                    <Text style={styles.stopAddress}>{order.address}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('OrderDetails', { id: order.id })}
              >
                <Text style={styles.primaryBtnText}>View Order Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.emptyText}>
                Select an order from the Orders list to view its route on the map.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { color: colors.primarySoft, fontSize: 11, marginTop: 1 },

  body: { flex: 1, backgroundColor: colors.background },
  bodyContent: { flexGrow: 1 },

  mapWrap: { height: 280, backgroundColor: '#dbeafe' },
  map: { flex: 1, backgroundColor: '#dbeafe' },
  routeToggle: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  routeToggleText: { fontSize: 11, fontWeight: '600', color: '#334155' },

  details: { padding: 14, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  statsRow: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  statCellDivider: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  statLabel: { fontSize: 9, color: colors.textMuted, marginTop: 2 },

  routeCard: { paddingVertical: 12, paddingHorizontal: 14 },
  stopRow: { flexDirection: 'row', gap: 10 },
  stopDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  stopText: { flex: 1 },
  stopTag: { fontSize: 10, color: colors.textMuted },
  stopTitle: { fontSize: 12, fontWeight: '500', color: colors.textDark },
  stopAddress: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  connector: {
    width: 2,
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 3,
    marginVertical: 8,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  emptyCard: { padding: 14 },
  emptyText: { fontSize: 12, color: colors.textMuted },
});