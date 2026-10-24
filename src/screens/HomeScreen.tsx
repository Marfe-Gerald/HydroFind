
import React from 'react';
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

interface HomeScreenProps {
  orders?: Order[];
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
  overview?: { label: string; value: string | number }[];
}

const QUICK_ACTIONS = [
  { key: 'PlaceOrder', label: 'Place Order', icon: 'water' as const, tint: '#3b82f6' },
  { key: 'Map', label: 'Map View', icon: 'map' as const, tint: '#0ea5e9' },
  { key: 'MyHistory', label: 'History', icon: 'time' as const, tint: '#64748b' },
];

export default function HomeScreen({
  orders = MOCK_ORDERS,
  navigation,
}: HomeScreenProps) {
  const pending = orders.filter((o) => o.status === 'Pending').length;
  const onWay = orders.filter((o) => o.status === 'On the Way').length;
  const delivered = orders.filter((o) => o.status === 'Delivered').length;

  const stats = [
    { label: 'Pending', value: pending, bg: colors.pendingBg, text: colors.pendingText },
    { label: 'On the Way', value: onWay, bg: colors.onTheWayBg, text: colors.onTheWayText },
    { label: 'Delivered', value: delivered, bg: colors.deliveredBg, text: colors.deliveredText },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Welcome</Text>
          <Text style={styles.headerTitle}>HydroFind</Text>
          <Text style={styles.headerSubtitle}>Water Refilling Station</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: stat.bg }]}
              >
                <Text style={[styles.statValue, { color: stat.text }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  activeOpacity={0.7}
                  style={styles.actionCard}
                  onPress={() => navigation?.navigate(action.key)}
                >
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.tint}
                  />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
});
