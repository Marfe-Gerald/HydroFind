import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrders } from '../../hooks/useOrders';
import { acceptOrder, getAssignedOrders, getMyOrders, getPendingOrders } from '../../services/orderService';
import { colors, radius, spacing } from '../Themes/colors';
import OrderCard from '../Components/OrderCard';
import { toUiOrder } from '../../utils/orderMapper';

export default function OrdersListScreen({ navigation, role = 'customer' }: any) {
  const myOrders = useOrders(() => getMyOrders(), 12000);
  const pendingOrders = useOrders(() => getPendingOrders(), 12000);
  const assignedOrders = useOrders(() => getAssignedOrders(), 12000);

  const orders = role === 'customer'
    ? myOrders.orders
    : [...pendingOrders.orders, ...assignedOrders.orders];

  const handleAccept = async (id: string) => {
    try {
      await acceptOrder(id);
      pendingOrders.refresh();
      assignedOrders.refresh();
    } catch (error: any) {
      Alert.alert('Unable to accept order', error.message ?? 'Please try again.');
    }
  };

  const renderItem = ({ item }: any) => {
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
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
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
