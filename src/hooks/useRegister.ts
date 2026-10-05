import { useState } from 'react';
import { register } from '../services/authService';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (email: string, password: string, fullName: string, contactNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      return await register(email, password, fullName, contactNumber);
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
}
