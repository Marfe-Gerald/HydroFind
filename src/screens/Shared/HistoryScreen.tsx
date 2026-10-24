import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrders } from '../../hooks/useOrders';
import { getHistory } from '../../services/orderService';
import type { Order } from '../../types';
import { colors, spacing } from '../Themes/colors';
import OrderCard from '../Components/OrderCard';
import { toUiOrder } from '../../utils/orderMapper';

export default function HistoryScreen({ navigation }: any) {
  const { orders, loading, error, refresh } = useOrders<Order>(getHistory, 15000);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order history</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={toUiOrder(item)} onPress={() => navigation.navigate('OrderDetails', { id: item.id })} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View>
            {loading ? (
              <Text style={styles.empty}>Loading order history...</Text>
            ) : error ? (
              <View>
                <Text style={styles.empty}>Could not load order history: {error}</Text>
                <TouchableOpacity onPress={refresh} accessibilityRole="button">
                  <Text style={styles.retry}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.empty}>No history yet.</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', paddingTop: spacing.xl },
  retry: { color: colors.primary, fontWeight: '600', textAlign: 'center', paddingTop: spacing.md },
});
