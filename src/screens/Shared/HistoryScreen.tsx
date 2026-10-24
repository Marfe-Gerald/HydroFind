import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useOrders } from '../../hooks/useOrders';
import { getCustomerOrderHistory } from '../../services/customerOrderHistoryService';
import { getHistory } from '../../services/orderService';
import { colors, spacing } from '../Themes/colors';
import OrderCard from '../Components/OrderCard';
import { toUiOrder } from '../../utils/orderMapper';

export default function HistoryScreen({ navigation, role = 'customer' }: any) {
  const fetchHistory = role === 'rider' ? getHistory : getCustomerOrderHistory;
  const { orders } = useOrders(fetchHistory, 15000);

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
        ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', paddingTop: spacing.xl },
});
