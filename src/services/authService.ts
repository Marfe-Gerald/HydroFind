import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

export async function register(
  email: string,
  password: string,
  fullName: string,
  contactNumber: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await api('/users/me', {
    method: 'POST',
    body: JSON.stringify({ fullName, contactNumber, email }),
  });
  return cred.user;
}

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const getUserProfile = () => api('/users/me');