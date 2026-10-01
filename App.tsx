// import { useEffect, useState } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
// import {
//   onAuthStateChanged,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   User,
// } from 'firebase/auth';
// import { createMyProfile, getMyProfile } from '@dataconnect/generated';
// import { auth, dc } from './src/services/firebase';

// export default function App() {
//   const [user, setUser] = useState<User | null>(null);
//   const [profile, setProfile] = useState<any>(null);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [contact, setContact] = useState('');
//   const [msg, setMsg] = useState('');

//   const loadProfile = async () => {
//     try {
//       const res = await getMyProfile(dc);
//       setProfile(res.data.user);
//     } catch (e: any) {
//       setMsg('Profile load failed: ' + e.message);
//     }
//   };

//   useEffect(() => {
//     return onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       if (u) loadProfile();
//       else setProfile(null);
//     });
//   }, []);

//   const signUp = async () => {
//     try {
//       setMsg('Creating account...');
//       await createUserWithEmailAndPassword(auth, email.trim(), password);
//       await createMyProfile(dc, {
//         fullName,
//         contactNumber: contact,
//         email: email.trim(),
//         roleId: 1, // 1 = customer, 2 = rider
//       });
//       setMsg('Signed up');
//       await loadProfile();
//     } catch (e: any) {
//       setMsg('Sign up failed: ' + e.message);
//     }
//   };

//   const signIn = async () => {
//     try {
//       setMsg('Signing in...');
//       await signInWithEmailAndPassword(auth, email.trim(), password);
//       setMsg('Signed in');
//     } catch (e: any) {
//       setMsg('Sign in failed: ' + e.message);
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={s.box}>
//       <Text style={s.title}>HydroFind auth test</Text>

//       {user ? (
//         <>
//           <Text>Logged in as: {user.email}</Text>
//           <Text>UID: {user.uid}</Text>
//           <Text>Profile: {profile ? `${profile.fullName} (${profile.role.roleName})` : 'none yet'}</Text>
//           <Button title="Sign out" onPress={() => signOut(auth)} />
//         </>
//       ) : (
//         <>
//           <TextInput style={s.input} placeholder="Full name (sign up only)" value={fullName} onChangeText={setFullName} />
//           <TextInput style={s.input} placeholder="Contact number (sign up only)" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
//           <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
//           <TextInput style={s.input} placeholder="Password (6+ characters)" value={password} onChangeText={setPassword} secureTextEntry />
//           <Button title="Sign up" onPress={signUp} />
//           <View style={{ height: 8 }} />
//           <Button title="Sign in" onPress={signIn} />
//         </>
//       )}

//       <Text style={s.msg}>{msg}</Text>
//     </ScrollView>
//   );
// }

// const s = StyleSheet.create({
//   box: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 10 },
//   title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
//   input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10 },
//   msg: { marginTop: 12, color: '#185FA5' },
// });