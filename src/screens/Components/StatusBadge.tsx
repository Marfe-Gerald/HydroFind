// src/Screens/Components/StatusBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../Themes/colors';
import { OrderStatus } from '../Types/Orders';

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  Pending: { bg: colors.pendingBg, text: colors.pendingText },
  'On the Way': { bg: colors.onTheWayBg, text: colors.onTheWayText },
  Delivered: { bg: colors.deliveredBg, text: colors.deliveredText },
};

interface StatusBadgeProps {
  status: OrderStatus;
}

/** Exposed so OrderCard's progress bar can reuse the same status color. */
export function getStatusAccent(status: OrderStatus): string {
  return (STATUS_STYLES[status] ?? STATUS_STYLES.Pending).text;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});