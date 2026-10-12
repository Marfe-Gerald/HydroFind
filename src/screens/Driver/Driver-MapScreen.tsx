// src/Screens/Driver/Driver-MapView.tsx
// Map is rendered with Leaflet inside a WebView, so no Google API key is needed.

import React, { useMemo, useRef, useState } from 'react';
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
  order?: Order | null;
  navigation?: {
    navigate: (screen: string, params?: { id: string }) => void;
    goBack?: () => void;
  };
}

type Coord = { latitude: number; longitude: number };

// HydroFind station location (change to your real station)
const STATION: Coord = { latitude: 14.5878, longitude: 121.0614 };

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
function buildMapHtml(station: Coord, customer: Coord | null, name: string, address: string) {
  const data = JSON.stringify({ station, customer, name, address }).replace(/</g, '\\u003c');

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
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var DATA = ${data};
    var map = L.map('map', { zoomControl: true });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    function icon(cls) {
      return L.divIcon({ className: '', html: '<div class="pin ' + cls + '"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    }

    var s = [DATA.station.latitude, DATA.station.longitude];
    L.marker(s, { icon: icon('pin-station') }).addTo(map).bindPopup('<b>HydroFind Station</b><br>Ortigas Ave., Pasig');

    var route = null;
    if (DATA.customer) {
      var c = [DATA.customer.latitude, DATA.customer.longitude];
      L.marker(c, { icon: icon('pin-customer') }).addTo(map).bindPopup('<b>' + DATA.name + '</b><br>' + DATA.address);
      route = L.polyline([s, c], { color: '#1d4ed8', weight: 3, dashArray: '8,8' }).addTo(map);
      map.fitBounds([s, c], { padding: [50, 50] });
    } else {
      map.setView(s, 14);
    }

    // Called from React Native to show / hide the route line
    window.setRoute = function (show) {
      if (!route) return;
      if (show) { route.addTo(map); } else { map.removeLayer(route); }
    };
  </script>
</body>
</html>`;
}

export default function MapViewScreen({ order = null, navigation }: MapViewScreenProps) {
  const webRef = useRef<WebView>(null);
  const [showRoute, setShowRoute] = useState(true);

  const customer: Coord | null =
    order?.latitude != null && order?.longitude != null
      ? { latitude: order.latitude, longitude: order.longitude }
      : null;

  const km = customer ? distanceKm(STATION, customer) : 0;
  const minutes = Math.max(1, Math.round((km / 20) * 60)); // assumes ~20 km/h

  const tripStats = [
    { label: 'Distance', value: `${km.toFixed(1)} km` },
    { label: 'Est. Time', value: `${minutes} min` },
    { label: 'Traffic', value: 'Light' },
  ];

  // Only rebuild the page when the order changes, not when the route is toggled
  const html = useMemo(
    () => buildMapHtml(STATION, customer, order?.customerName ?? '', order?.address ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order?.id, order?.latitude, order?.longitude],
  );

  const toggleRoute = () => {
    const next = !showRoute;
    setShowRoute(next);
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
                    <Text style={styles.stopTitle}>HydroFind Station · Ortigas Ave., Pasig</Text>
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