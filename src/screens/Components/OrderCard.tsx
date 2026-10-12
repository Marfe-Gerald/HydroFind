// src/Screens/Components/OrderCard.tsx

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../Themes/colors';
import { Order } from '../Types/Orders';
import StatusBadge, { getStatusAccent } from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const accent = getStatusAccent(order.status);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.customer}>{order.customerName}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${order.progress * 100}%`, backgroundColor: accent },
          ]}
        />
      </View>

      <Text style={styles.meta}>
        {/* {order.gallons} gal · {order.time} */}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customer: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
});