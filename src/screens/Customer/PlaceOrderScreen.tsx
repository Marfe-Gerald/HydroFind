import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { createOrder } from '../../services/orderService';
import { CATALOG } from '../../config/catalog';
import { colors, radius, spacing } from '../Themes/colors';

const DELIVERY_TIMES = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 7;
  return `${hour > 12 ? hour - 12 : hour} ${hour < 12 ? 'AM' : 'PM'}`;
});

const isNowAvailable = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 18;
};

export default function PlaceOrderScreen({ navigation }: any) {
  const { coords, address, loading, refresh } = useCurrentLocation();
  const [gallons, setGallons] = useState('2');
  const [preferredTime, setPreferredTime] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async () => {
    if (!coords) {
      Alert.alert('Location required', 'Use your current location before placing an order.');
      return;
    }
    if (!preferredTime) {
      Alert.alert('Delivery time required', 'Choose a preferred delivery time.');
      return;
    }
    if (preferredTime === 'Now' && !isNowAvailable()) {
      Alert.alert('Unavailable', 'Immediate delivery is available from 7 AM to 6 PM.');
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
      <TouchableOpacity
        style={styles.timeSelect}
        onPress={() => setTimePickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Preferred delivery time: ${preferredTime || 'Choose a time'}`}
      >
        <Text style={[styles.timeSelectText, !preferredTime && styles.placeholderText]}>
          {preferredTime || 'Choose a delivery time'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.meta}>Estimated total: ${(Number(gallons || 0) * CATALOG.unitPrice).toFixed(2)}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting || loading}>
        <Text style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Submit order'}</Text>
      </TouchableOpacity>

      <Modal
        visible={timePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setTimePickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close delivery time options"
          />
          <View style={styles.timeSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Delivery time</Text>
                <Text style={styles.sheetSubtitle}>Choose an hourly slot</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTimePickerVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {isNowAvailable() && (
                <TouchableOpacity
                  style={[styles.timeOption, preferredTime === 'Now' && styles.selectedTimeOption]}
                  onPress={() => {
                    setPreferredTime('Now');
                    setTimePickerVisible(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.timeOptionText}>Now</Text>
                  <Text style={styles.nowHint}>Available 7 AM–6 PM</Text>
                </TouchableOpacity>
              )}
              {DELIVERY_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, preferredTime === time && styles.selectedTimeOption]}
                  onPress={() => {
                    setPreferredTime(time);
                    setTimePickerVisible(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.timeOptionText}>{time}</Text>
                  {preferredTime === time && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  timeSelect: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  timeSelectText: { color: colors.textDark, fontSize: 14 },
  placeholderText: { color: colors.textMuted },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 30, 54, 0.45)',
  },
  timeSheet: {
    maxHeight: '75%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { color: colors.textDark, fontSize: 18, fontWeight: '700' },
  sheetSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  timeOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  selectedTimeOption: { backgroundColor: colors.primaryLight },
  timeOptionText: { color: colors.textDark, fontSize: 15 },
  nowHint: { color: colors.textMuted, fontSize: 12 },
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
