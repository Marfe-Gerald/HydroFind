import { useState } from 'react';
import { login } from '../services/authService';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}
