import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthInput, AuthButton } from './Components/AuthComponents';
import { COLORS } from './Themes/colors';
import { useRegister } from '../hooks/useRegister';
import { useLogin } from '../hooks/useLogin';
import { useAuth } from '../hooks/useAuth';

export const CustomerAuth = () => {
  const [isSignUp, setIsSignUp] = useState(true);

  const [userRole, setUserRole] = useState<'customer' | 'driver'>('customer');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const { signUp, loading: registering, error: registerError } = useRegister();
  const { signIn, loading: loggingIn, error: loginError } = useLogin();
  const { refreshProfile } = useAuth();
  const busy = registering || loggingIn;
  const error = isSignUp ? registerError : loginError;

  const handleSubmit = async () => {
    if (busy) return;
    try {
      if (isSignUp) {
        if (!name.trim() || !contactNumber.trim() || !email.trim() || !password) {
          Alert.alert('Missing fields', 'Please fill in all fields.');
          return;
        }
        // Firebase Auth creates the user, then POST /api/users/me saves the profile via Express
        await signUp(email.trim(), password, name.trim(), contactNumber.trim(), userRole);
        await refreshProfile();
      } else {
        await signIn(email.trim(), password);
      }
    } catch {
      // error message is exposed by the hooks and shown below
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

        {isSignUp && (
          <AuthInput
            label="Contact Number"
            placeholder="09XXXXXXXXX"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AuthButton
          title={busy ? 'Please wait...' : isSignUp ? 'Create Account' : 'Log In'}
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
    marginBottom: 8,
    textAlign: 'center',
  },
});