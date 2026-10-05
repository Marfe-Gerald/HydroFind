import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { AuthInput, AuthButton } from './Components/AuthComponents';
import { COLORS } from './Themes/colors';

export const CustomerAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const [userRole, setUserRole] = useState<'customer' | 'driver'>('customer');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (isSignUp) {
      console.log(`Registering ${userRole}:`, { name, email, password });
    } else {
      console.log(`Logging in ${userRole}:`, { email, password });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dynamic Title based on selected role */}
        <Text style={styles.title}>
          {userRole === 'customer' ? 'Customer' : 'Driver'} {isSignUp ? 'Sign Up' : 'Login'}
        </Text>

        {isSignUp && (
          <AuthInput
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />
        )}

        <AuthInput
          label="Email Address"
          placeholder={userRole === 'customer' ? 'customer@example.com' : 'driver@example.com'}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <AuthInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <AuthButton
          title={isSignUp ? 'Create Account' : 'Log In'}
          onPress={handleSubmit}
        />

        <AuthButton
          title={isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          onPress={() => setIsSignUp(!isSignUp)}
          variant="secondary"
        />

        {/* Role Toggle Button at the bottom */}
        <AuthButton
          title={userRole === 'customer' ? 'Are you a driver? Log in here' : 'Are you a customer? Log in here'}
          onPress={() => setUserRole(userRole === 'customer' ? 'driver' : 'customer')}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  // Add this block:
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.primaryBlue,
  },
  title: {
    color: COLORS.textHeader,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  error: {
    color: COLORS.textError,
    borderColor: COLORS.borderInvalid,
  },
});