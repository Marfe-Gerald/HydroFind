import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { cancelOrder, deleteOrder, deliverOrder, getOrder } from '../../services/orderService';
import { colors, radius, spacing } from '../Themes/colors';
import StatusBadge from '../Components/StatusBadge';
import { toUiOrder } from '../../utils/orderMapper';
import type { Order } from '../../types';

export default function OrderDetailsScreen({ route, navigation, role = 'customer' }: any) {
  const { id } = route.params;
  const isFocused = useIsFocused();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const loadOrder = useCallback(async (currentRequest: number) => {
    try {
      const nextOrder = await getOrder(id);
      if (currentRequest === requestId.current) setOrder(nextOrder);
    } catch (error: any) {
      if (currentRequest === requestId.current) {
        Alert.alert('Load failed', error.message || 'Unable to load order.');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [id]);

  const refresh = useCallback(
    () => loadOrder(++requestId.current),
    [loadOrder],
  );

  useEffect(() => {
    if (!isFocused) return;
    const currentRequest = ++requestId.current;
    void loadOrder(currentRequest);
    return () => {
      requestId.current += 1;
    };
  }, [isFocused, loadOrder]);

  const handleAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      Alert.alert('Success', successMessage);
      refresh();
    } catch (error: any) {
      Alert.alert('Action failed', error.message || 'Please try again.');
    }
  };

  const confirmCancel = () => {
    Alert.alert('Cancel order?', 'Are you sure you want to cancel this order?', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => {
          void handleAction(() => cancelOrder(id), 'Order cancelled.');
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.container}><Text style={styles.empty}>Loading order...</Text></View>;
  }

  if (!order) {
    return <View style={styles.container}><Text style={styles.empty}>Order not found.</Text></View>;
  }

  const uiOrder = toUiOrder(order);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{uiOrder.customerName}</Text>
      <StatusBadge status={uiOrder.status} />

      <View style={styles.card}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{uiOrder.address || 'Not provided'}</Text>
        <Text style={styles.label}>Preferred time</Text>
        <Text style={styles.value}>{uiOrder.preferredTime || 'ASAP'}</Text>
        <Text style={styles.label}>Gallons</Text>
        <Text style={styles.value}>{uiOrder.gallons}</Text>
      </View>

      {role === 'customer' && (order.status === 'pending' || order.status === 'on_the_way') && (
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={confirmCancel}>
            <Text style={styles.secondaryText}>Cancel order</Text>
          </TouchableOpacity>
          {order.status === 'pending' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAction(() => deleteOrder(id), 'Order removed.')}>
              <Text style={styles.secondaryText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {order.status === 'on_the_way' && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate(
            role === 'rider' ? 'Home' : 'Main',
            { screen: 'MapView', params: { id } },
          )}
        >
          <Text style={styles.primaryText}>Open map</Text>
        </TouchableOpacity>
      )}

      {order.status === 'on_the_way' && order.riderId && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction(() => deliverOrder(id), 'Order marked as delivered.') }>
          <Text style={styles.primaryText}>Deliver</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textDark },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  label: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  value: { fontSize: 14, color: colors.textDark, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryText: { color: colors.textDark, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingTop: spacing.xl },
});
