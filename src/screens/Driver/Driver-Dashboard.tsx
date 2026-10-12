// src/Screens/HomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from '../Themes/colors';
import { MOCK_ORDERS } from '../Data/MockOrders';
import StatusBadge from '../Components/StatusBadge';
import type { Order } from '../Types/Orders';

type Role = 'driver' | 'customer';

type QuickAction = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
};

const CUSTOMER_ACTIONS: QuickAction[] = [
  { key: 'PlaceOrder', label: 'Place Order', icon: 'water', tint: '#3b82f6' },
  { key: 'MapView', label: 'Map View', icon: 'map', tint: '#0ea5e9' },
  { key: 'History', label: 'History', icon: 'time', tint: '#64748b' },
];

const DRIVER_ACTIONS: QuickAction[] = [
  { key: 'ViewOrders', label: 'View Orders', icon: 'clipboard', tint: '#ef4444' },
  { key: 'MapView', label: 'Map View', icon: 'map', tint: '#0ea5e9' },
  { key: 'History', label: 'History', icon: 'time', tint: '#64748b' },
];

interface HomeScreenProps {
  role?: Role;
  orders?: Order[];
  navigation?: {
    navigate: (screen: string, params?: { id: string }) => void;
  };
}

export default function HomeScreen({
  role = 'driver',
  orders = MOCK_ORDERS,
  navigation,
}: HomeScreenProps) {
  const isDriver = role === 'driver';

  const pending = orders.filter((o) => o.status === 'Pending').length;
  const onWay = orders.filter((o) => o.status === 'On the Way').length;
  const delivered = orders.filter((o) => o.status === 'Delivered').length;
  const active = orders.filter((o) => o.status !== 'Delivered').slice(0, 3);

  const stats = [
    { label: 'Pending', value: pending, bg: colors.pendingBg, text: colors.pendingText },
    { label: 'On the Way', value: onWay, bg: colors.onTheWayBg, text: colors.onTheWayText },
    { label: 'Delivered', value: delivered, bg: colors.deliveredBg, text: colors.deliveredText },
  ];

  const actions = isDriver ? DRIVER_ACTIONS : CUSTOMER_ACTIONS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>
            {isDriver ? 'Driver Dashboard' : 'Welcome'}
          </Text>
          <Text style={styles.headerTitle}>HydroFind</Text>
          <Text style={styles.headerSubtitle}>
            {isDriver ? 'Manage & track deliveries' : 'Water Refilling Station'}
          </Text>
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

          {/* Quick Actions */}
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  activeOpacity={0.7}
                  style={styles.actionCard}
                  onPress={() => navigation?.navigate(a.key)}
                >
                  <Ionicons name={a.icon} size={22} color={a.tint} />
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Orders — driver only */}
          {isDriver && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleInline}>Active Orders</Text>
                <TouchableOpacity onPress={() => navigation?.navigate('ViewOrders')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {active.length === 0 ? (
                <Text style={styles.empty}>No active orders</Text>
              ) : (
                active.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.7}
                    style={styles.orderCard}
                    onPress={() => navigation?.navigate('OrderDetails', { id: order.id })}
                  >
                    <View style={styles.orderTop}>
                      <Text style={styles.orderName}>{order.customerName}</Text>
                      <StatusBadge status={order.status} />
                    </View>
                    <Text style={styles.orderMeta}>
                      {order.gallons} gal · {order.preferredTime}
                    </Text>
                    <Text style={styles.orderAddress} numberOfLines={1} ellipsizeMode="tail">
                      {order.address}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bodyContent: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerEyebrow: {
    color: colors.primarySoft,
    fontSize: 12,
    marginBottom: 2,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.primarySoft,
    fontSize: 12,
    marginTop: 2,
  },

  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  sectionTitleInline: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
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
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDark,
  },

  empty: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  orderMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  orderAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});