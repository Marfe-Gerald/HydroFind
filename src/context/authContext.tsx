import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authService';
import type { Profile } from '../types';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const p = await getUserProfile();
          setProfile(p as Profile | null);
        } catch (error: any) {
          if (error?.message?.includes('404')) {
            setProfile(null);
          } else {
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}