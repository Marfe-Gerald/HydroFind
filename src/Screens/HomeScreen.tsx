// src/Screens/HomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from './Themes/colors';
import { MOCK_OVERVIEW } from './Data/MockOrders';
import PrimaryButton from './Components/PrimaryButton';

const QUICK_ACTIONS = [
  { key: 'PlaceOrder', label: 'Place Order', icon: 'add-circle-outline' as const },
  { key: 'ViewOrders', label: 'View Orders', icon: 'list-outline' as const },
  { key: 'MapView', label: 'Map View', icon: 'map-outline' as const },
  { key: 'History', label: 'History', icon: 'time-outline' as const },
];

interface HomeScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const goTo = (screen: string) => () => navigation?.navigate(screen);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HydroFind</Text>
          <Text style={styles.headerSubtitle}>Water refill delivery, made simple</Text>
        </View>
        <View style={styles.roleChip}>
          <Ionicons name="person-circle-outline" size={18} color={colors.white} />
          <Text style={styles.roleChipText}>Customer</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <Text style={styles.sectionTitle}>OVERVIEW</Text>
        <View style={styles.overviewRow}>
          {MOCK_OVERVIEW.map((item) => (
            <View key={item.label} style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{item.value}</Text>
              <Text style={styles.overviewLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <PrimaryButton
              key={action.key}
              icon={action.icon}
              label={action.label}
              onPress={goTo(action.key)}
            />
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.primarySoft,
    fontSize: 12,
    marginTop: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 6,
  },
  roleChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -spacing.lg,
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
  },
  overviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});