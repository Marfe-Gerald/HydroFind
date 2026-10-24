
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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { colors, spacing, radius } from './Themes/colors';
import type { CustomerTabParamList } from '../navigation/types';

export type CustomerOrderOverview = {
  pending: number;
  onTheWay: number;
  delivered: number;
};

interface HomeScreenProps {
  navigation: BottomTabNavigationProp<CustomerTabParamList, 'Home'>;
  overview: CustomerOrderOverview;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const QUICK_ACTIONS = [
  { route: 'PlaceOrder', label: 'Place Order', icon: 'water' as const, tint: '#3b82f6' },
  { route: 'MapView', label: 'Map View', icon: 'map' as const, tint: '#0ea5e9' },
  { route: 'History', label: 'History', icon: 'time' as const, tint: '#64748b' },
];

type QuickActionRoute = (typeof QUICK_ACTIONS)[number]['route'];

export default function HomeScreen({
  navigation,
  overview,
  loading,
  error,
  onRetry,
}: HomeScreenProps) {
  const navigateTo = (route: QuickActionRoute) => {
    if (route === 'PlaceOrder') navigation.navigate('PlaceOrder');
    if (route === 'MapView') navigation.navigate('MapView');
    if (route === 'History') navigation.navigate('History');
  };
  const displayValue = (value: number) => (loading || error ? '—' : value);
  const stats = [
    { label: 'Pending', value: displayValue(overview.pending), bg: colors.pendingBg, text: colors.pendingText },
    { label: 'On the Way', value: displayValue(overview.onTheWay), bg: colors.onTheWayBg, text: colors.onTheWayText },
    { label: 'Delivered', value: displayValue(overview.delivered), bg: colors.deliveredBg, text: colors.deliveredText },
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
                  key={action.route}
                  activeOpacity={0.7}
                  style={styles.actionCard}
                  onPress={() => navigateTo(action.route)}
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

          {loading && <Text style={styles.message}>Loading your order stats...</Text>}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Could not refresh your order stats: {error}</Text>
              <TouchableOpacity onPress={onRetry} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
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
  message: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: colors.cancelledBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.cancelledText,
    fontSize: 12,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});
