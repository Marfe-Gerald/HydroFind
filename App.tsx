import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CustomerAuth } from './src/screens/Customer-Driver-Login-Signup';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <CustomerAuth />
    </AuthProvider>
  );
}
