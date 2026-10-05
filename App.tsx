// TEMPORARY TEST SCREEN: delete after confirming Auth + Firestore work.
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './server/src/firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const addLog = (msg: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l]);

  // Listen to auth state, then load the Firestore profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setProfile(snap.exists() ? snap.data() : null);
          addLog(snap.exists() ? 'Profile loaded from Firestore' : 'No profile document found');
        } catch (e: any) {
          addLog('Profile read failed: ' + e.message);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSignUp = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName,
        contactNumber,
        email: email.trim(),
        role: 'customer',
        createdAt: serverTimestamp(),
      });
      addLog('Signed up + users/' + cred.user.uid + ' written');
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      setProfile(snap.data());
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
      addLog('Sign up error: ' + e.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      addLog('Signed in');
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
      addLog('Sign in error: ' + e.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    addLog('Signed out');
  };

  // Quick check that writing to the orders collection works
  const handleTestOrder = async () => {
    if (!user) return;
    try {
      const ref = await addDoc(collection(db, 'orders'), {
        customerId: user.uid,
        customerName: profile?.fullName ?? 'Test',
        contactNumber: profile?.contactNumber ?? '',
        riderId: null,
        riderName: null,
        gallons: 2,
        unitPrice: 30,
        totalAmount: 60,
        location: { latitude: 7.0731, longitude: 125.6128 },
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      addLog('Test order created: ' + ref.id);
    } catch (e: any) {
      addLog('Order write failed: ' + e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>HydroFind Auth Test</Text>

      {!user ? (
        <>
          <TextInput style={styles.input} placeholder="Full name (sign up only)" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Contact number (sign up only)" keyboardType="phone-pad" value={contactNumber} onChangeText={setContactNumber} />
          <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password (6+ chars)" secureTextEntry value={password} onChangeText={setPassword} />
          <View style={styles.row}>
            <Button title="Sign up" onPress={handleSignUp} />
            <Button title="Sign in" onPress={handleSignIn} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Auth UID:</Text>
          <Text selectable>{user.uid}</Text>
          <Text style={styles.label}>Firestore profile:</Text>
          <Text selectable>{profile ? JSON.stringify(profile, null, 2) : 'none'}</Text>
          <View style={styles.row}>
            <Button title="Create test order" onPress={handleTestOrder} />
            <Button title="Sign out" color="#c0392b" onPress={handleSignOut} />
          </View>
        </>
      )}

      <Text style={styles.label}>Log:</Text>
      {log.map((l, i) => (
        <Text key={i} style={styles.logLine}>{l}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 64, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  label: { fontWeight: '700', marginTop: 12 },
  logLine: { fontSize: 12, color: '#333' },
});