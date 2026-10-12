import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/authService';
import { CustomerAuth } from '../screens/Customer-Driver-Login-Signup';
import HomeScreen from '../screens/HomeScreen';
import DriverDashboard from '../screens/Driver/Driver-Dashboard';
import { COLORS } from '../screens/Themes/colors';

export default function RootNavigator() {
  const { user, profile, loading, profileError, registering, refreshProfile } = useAuth();

  // Checking saved session / loading profile
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  // Not signed in -> signup / login
  // (also stay on the signup screen while the account is being created)
  if (!user || registering) return <CustomerAuth />;

  // Signed in, but profile not loaded (server offline, wrong URL, or no profile yet)
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>{profileError ?? 'Could not load your profile.'}</Text>
        <TouchableOpacity onPress={refreshProfile}>
          <Text style={styles.link}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Signed in -> screen depends on role stored in Firestore
  return (
    <View style={styles.flex}>
      {profile.role === 'rider' ? <DriverDashboard role="driver" /> : <HomeScreen />}
      <SafeAreaView edges={['bottom']} style={styles.logoutBar}>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.link}>Log out ({profile.fullName})</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  note: { marginTop: 12, color: COLORS.textSubHeader },
  link: { marginTop: 12, color: COLORS.primaryBlue, fontWeight: '600', textAlign: 'center' },
  logoutBar: { backgroundColor: '#FFF', paddingBottom: 8 },
});
