// src/screens/HomeScreen.tsx  (Customer Home with Highlighted Place Order Tab & Map View)

import React, { useState } from 'react';
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

import { colors, spacing, radius } from './Themes/colors';
import { MOCK_ORDERS } from './Data/MockOrders';
import type { Order } from './Types/Orders';
import CustomerMapViewScreen from './Customer-Map_UI'; // Integrated Customer Map View

interface HomeScreenProps {
  orders?: Order[];
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
  overview?: { label: string; value: string | number }[];
}

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { key: 'PlaceOrder', label: 'Place Order', icon: 'water', iconOutline: 'water-outline' },
  { key: 'Map', label: 'Map View', icon: 'map', iconOutline: 'map-outline' },
  { key: 'MyHistory', label: 'History', icon: 'time', iconOutline: 'time-outline' },
];

export default function HomeScreen({ orders = MOCK_ORDERS, navigation }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState('Home');

  const pending = orders.filter((o) => o.status === 'Pending').length;
  const onWay = orders.filter((o) => o.status === 'On the Way').length;
  const delivered = orders.filter((o) => o.status === 'Delivered').length;

  const stats = [
    { label: 'Pending', value: pending, bg: colors.pendingBg, text: colors.pendingText },
    { label: 'On the Way', value: onWay, bg: colors.onTheWayBg, text: colors.onTheWayText },
    { label: 'Delivered', value: delivered, bg: colors.deliveredBg, text: colors.deliveredText },
  ];

  const QUICK_ACTIONS = [
    { key: 'PlaceOrder', label: 'Place Order', icon: 'water' as const, tint: '#3b82f6' },
    { key: 'Map', label: 'Map View', icon: 'map' as const, tint: '#0ea5e9' },
    { key: 'MyHistory', label: 'History', icon: 'time' as const, tint: '#64748b' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Dynamic Main View Area based on Selected Tab */}
      <View style={styles.mainContainer}>
        {activeTab === 'Home' && (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEyebrow}>Welcome</Text>
              <Text style={styles.headerTitle}>HydroFind</Text>
              <Text style={styles.headerSubtitle}>Water Refilling Station</Text>
            </View>

            <View style={styles.content}>
              {/* Stats */}
              <View style={styles.statsRow}>
                {stats.map((s) => (
                  <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statValue, { color: s.text }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Quick actions */}
              <View>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickGrid}>
                  {QUICK_ACTIONS.map((a) => (
                    <TouchableOpacity
                      key={a.key}
                      activeOpacity={0.7}
                      style={styles.actionCard}
                      onPress={() => {
                        setActiveTab(a.key);
                        navigation?.navigate?.(a.key);
                      }}
                    >
                      <Ionicons name={a.icon} size={22} color={a.tint} />
                      <Text style={styles.actionLabel}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Map' && <CustomerMapViewScreen />}

        {activeTab === 'PlaceOrder' && (
          <View style={styles.placeholderView}>
            <Ionicons name="water" size={48} color={colors.primary} />
            <Text style={styles.placeholderText}>Place Order Screen UI</Text>
          </View>
        )}

        {activeTab === 'MyHistory' && (
          <View style={styles.placeholderView}>
            <Ionicons name="time" size={48} color="#64748b" />
            <Text style={styles.placeholderText}>History Screen UI</Text>
          </View>
        )}
      </View>

      {/* Built-in Bottom Tab Bar UI with Place Order Highlighted */}
      <View style={styles.tabBarContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const isPlaceOrder = tab.key === 'PlaceOrder';

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={[isPlaceOrder && styles.placeOrderIconBadge]}>
                <Ionicons
                  name={isActive ? (tab.icon as any) : (tab.iconOutline as any)}
                  size={isPlaceOrder ? 24 : 22}
                  color={isPlaceOrder ? colors.white : isActive ? colors.primary : '#94a3b8'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  isPlaceOrder && !isActive && styles.placeOrderLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  mainContainer: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1 },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerEyebrow: { color: colors.primarySoft, fontSize: 12, marginBottom: 2 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: colors.primarySoft, fontSize: 12, marginTop: 2 },

  content: { padding: spacing.lg, gap: spacing.lg },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  actionCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  actionLabel: { fontSize: 13, fontWeight: '500', color: colors.textDark },

  placeholderView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },

  // Bottom Tab Bar Styles
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 65,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Highlight Styles for Place Order Tab
  placeOrderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  placeOrderLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});