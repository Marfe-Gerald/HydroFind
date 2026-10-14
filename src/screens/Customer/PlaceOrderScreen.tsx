import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { createOrder } from '../../services/orderService';
import { CATALOG } from '../../config/catalog';
import { colors, radius, spacing } from '../Themes/colors';

export default function PlaceOrderScreen({ navigation }: any) {
  const { coords, address, loading, refresh } = useCurrentLocation();
  const [gallons, setGallons] = useState('2');
  const [preferredTime, setPreferredTime] = useState('ASAP');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async () => {
    if (!coords) {
      Alert.alert('Location required', 'Use your current location before placing an order.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder({
        stationId: CATALOG.stationId,
        productName: CATALOG.productName,
        unitPrice: CATALOG.unitPrice,
        gallons: Number(gallons) || 1,
        preferredTime,
        address: address ?? 'Current location',
        location: coords,
        paymentMethod: 'cash',
      });
      navigation.navigate('OrderDetails', { id: created.id });
    } catch (error: any) {
      Alert.alert('Could not place order', error.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Place Order</Text>
      <Text style={styles.label}>Delivery address</Text>
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>{address ?? 'Fetching current location...'}</Text>
      </View>

      <Text style={styles.label}>Gallons</Text>
      <TextInput
        style={styles.input}
        value={gallons}
        onChangeText={setGallons}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Preferred time</Text>
      <TextInput
        style={styles.input}
        value={preferredTime}
        onChangeText={setPreferredTime}
      />

      <Text style={styles.meta}>Estimated total: ${(Number(gallons || 0) * CATALOG.unitPrice).toFixed(2)}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting || loading}>
        <Text style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Submit order'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.textDark },
  label: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textDark,
  },
  noteBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { color: colors.textDark, fontSize: 13 },
  meta: { color: colors.textMuted, fontSize: 12 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { color: colors.white, fontWeight: '600' },
});
