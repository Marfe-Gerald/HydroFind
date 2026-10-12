import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

export async function register(
  email: string,
  password: string,
  fullName: string,
  contactNumber: string,
  role: 'customer' | 'driver' = 'customer'
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await api('/users/me', {
      method: 'POST',
      // the app says 'driver', the database calls it 'rider'
      body: JSON.stringify({
        fullName,
        contactNumber,
        email,
        role: role === 'driver' ? 'rider' : 'customer',
      }),
    });
  } catch (err) {
    // Profile save failed -> remove the Auth account so the email isn't stuck
    try {
      await deleteUser(cred.user);
    } catch (e) {
      console.warn('Could not roll back Auth user:', e);
    }
    throw err; // the signup screen shows this error
  }
  return cred.user;
}

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const getUserProfile = () => api('/users/me');
