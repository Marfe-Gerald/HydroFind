import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelOrder, deleteOrder, deliverOrder, getOrder } from '../../services/orderService';
import { colors, radius, spacing } from '../Themes/colors';
import StatusBadge from '../Components/StatusBadge';
import { toUiOrder } from '../../utils/orderMapper';

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const isFocused = useIsFocused();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setOrder(await getOrder(id));
    } catch (error: any) {
      Alert.alert('Load failed', error.message || 'Unable to load order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isFocused) return;

    let active = true;
    const load = async () => {
      const next = await getOrder(id);
      if (!active) return;
      setOrder(next);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [id, isFocused]);

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      await action();
      Alert.alert('Success', successMessage);
      refresh();
    } catch (error: any) {
      Alert.alert('Action failed', error.message || 'Please try again.');
    }
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

      {order.status === 'pending' && (
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAction(() => cancelOrder(id), 'Order cancelled.') }>
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAction(() => deleteOrder(id), 'Order removed.') }>
            <Text style={styles.secondaryText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'on_the_way' && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('MapView', { id })}>
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
