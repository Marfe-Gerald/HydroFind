
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS } from './Themes/colors';

const PRICE_PER_GALLON = 35.0;

export const CustomerPlaceOrderScreen = () => {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gallons, setGallons] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Calculate totals dynamically
  const gallonCount = parseInt(gallons, 10) || 0;
  const totalAmount = gallonCount * PRICE_PER_GALLON;

  const handleUseLocation = () => {
    Alert.alert('Location', 'Fetching your current location...');
    // GPS / Location logic goes here
  };

  const handleSubmitOrder = () => {
    if (!fullName || !contactNumber || !address || gallonCount <= 0) {
      Alert.alert('Missing Fields', 'Please complete all required fields (*)');
      return;
    }

    Alert.alert(
      'Order Placed!',
      `Order submitted for ${gallonCount} gallon(s).\nTotal: ₱${totalAmount.toFixed(2)}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlue} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Place Order</Text>
            <Text style={styles.headerSubtitle}>New water refill request</Text>
          </View>
        </View>
        <Text style={styles.roleTag}>Customer</Text>
      </View>

      {/* Form Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#9EA5B1"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Contact Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contact Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="09XXXXXXXXX"
            placeholderTextColor="#9EA5B1"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
          />
        </View>

        {/* Delivery Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Delivery Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, Barangay, City"
            placeholderTextColor="#9EA5B1"
            value={address}
            onChangeText={setAddress}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseLocation}
            activeOpacity={0.6}
          >
            <Text style={styles.locationText}>📍 Use current location</Text>
          </TouchableOpacity>
        </View>

        {/* Number of Gallons */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Number of Gallons *</Text>
          <View style={styles.gallonsRow}>
            <TextInput
              style={[styles.input, styles.gallonsInput]}
              placeholder="0"
              placeholderTextColor="#9EA5B1"
              keyboardType="number-pad"
              value={gallons}
              onChangeText={setGallons}
            />
            <Text style={styles.gallonsUnit}>gallons</Text>
          </View>
          <Text style={styles.helperText}>Enter how many gallons you need</Text>
        </View>

        {/* Preferred Delivery Time */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Preferred Delivery Time</Text>
          <TextInput
            style={styles.input}
            placeholder="Select time"
            placeholderTextColor="#9EA5B1"
            value={preferredTime}
            onChangeText={setPreferredTime}
          />
        </View>

        {/* Order Summary Box */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gallons</Text>
            <Text style={styles.summaryValue}>
              {gallonCount > 0 ? gallonCount : '—'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price / gallon</Text>
            <Text style={styles.summaryValue}>₱{PRICE_PER_GALLON.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitOrder}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Submit Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    backgroundColor: COLORS.primaryBlue || '#1D5BD8',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  headerTitleContainer: {},
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  roleTag: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A202C',
  },
  locationButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    color: COLORS.primaryBlue || '#1D5BD8',
    fontSize: 13,
    fontWeight: '600',
  },
  gallonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gallonsInput: {
    width: 100,
    textAlign: 'center',
    marginRight: 12,
  },
  gallonsUnit: {
    fontSize: 15,
    color: '#718096',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryBlue || '#1D5BD8',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4A5568',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E0',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryBlue || '#1D5BD8',
  },
  submitButton: {
    backgroundColor: COLORS.primaryBlue || '#1D5BD8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1D5BD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});