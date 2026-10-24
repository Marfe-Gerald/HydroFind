import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrders } from '../../hooks/useOrders';
import { acceptOrder, getAssignedOrders, getMyOrders, getPendingOrders } from '../../services/orderService';
import { colors, radius, spacing } from '../Themes/colors';
import OrderCard from '../Components/OrderCard';
import { toUiOrder } from '../../utils/orderMapper';
import type { Order } from '../../types';

const emptyOrders = async (): Promise<Order[]> => [];

export default function OrdersListScreen({ navigation, role = 'customer' }: any) {
  const myOrders = useOrders<Order>(role === 'customer' ? getMyOrders : emptyOrders, 12000);
  const pendingOrders = useOrders<Order>(role === 'rider' ? getPendingOrders : emptyOrders, 12000);
  const assignedOrders = useOrders<Order>(role === 'rider' ? getAssignedOrders : emptyOrders, 12000);

  const orders = role === 'customer'
    ? myOrders.orders
    : Array.from(
        new Map(
          [...pendingOrders.orders, ...assignedOrders.orders].map((order) => [
            order.id,
            order,
          ] as const),
        ).values(),
      );
  const loading = role === 'customer'
    ? myOrders.loading
    : pendingOrders.loading || assignedOrders.loading;
  const error = role === 'customer'
    ? myOrders.error
    : pendingOrders.error ?? assignedOrders.error;
  const refresh = () => {
    if (role === 'customer') {
      void myOrders.refresh();
    } else {
      void pendingOrders.refresh();
      void assignedOrders.refresh();
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptOrder(id);
      pendingOrders.refresh();
      assignedOrders.refresh();
      navigation.navigate('MapView', { id });
    } catch (error: any) {
      Alert.alert('Unable to accept order', error.message ?? 'Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const uiOrder = toUiOrder(item);
    return (
      <View>
        <OrderCard
          order={uiOrder}
          onPress={() => navigation.navigate('OrderDetails', { id: item.id })}
        />
        {role === 'rider' && item.status === 'pending' && (
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role === 'customer' ? 'My orders' : 'Available & assigned orders'}</Text>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Could not refresh orders: {error}</Text>
          <TouchableOpacity onPress={refresh} accessibilityRole="button">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading orders...' : error ? 'Order data is unavailable.' : 'No orders yet.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  errorBox: { marginHorizontal: spacing.lg, padding: spacing.md, backgroundColor: colors.cancelledBg, borderRadius: radius.md },
  errorText: { color: colors.cancelledText, fontSize: 12 },
  retryText: { color: colors.primary, fontWeight: '600', paddingTop: spacing.xs },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  acceptButtonText: { color: colors.white, fontWeight: '600' },
});
