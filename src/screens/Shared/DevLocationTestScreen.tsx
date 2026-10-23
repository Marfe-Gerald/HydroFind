import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { colors, radius, spacing } from '../Themes/colors';

export default function DevLocationTestScreen() {
  const current = useCurrentLocation();
  const tracking = useOrderTracking('demo-order-id', 5000);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dev location test</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Current location</Text>
        <Text style={styles.value}>{current.address ?? 'Not available'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Tracking JSON</Text>
        <Text style={styles.value}>{JSON.stringify(tracking.tracking ?? {}, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  label: { fontSize: 12, color: colors.textMuted },
  value: { color: colors.textDark, marginTop: spacing.xs },
});
