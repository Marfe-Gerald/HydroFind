import React, { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authService';
import type { Profile } from '../types';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  registering: boolean;
  beginRegistration: () => void;
  endRegistration: () => void;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  registering: false,
  beginRegistration: () => {},
  endRegistration: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0); // only the newest fetch may update state
  const [registering, setRegistering] = useState(false);
  const registeringRef = useRef(false); // true while signup is creating the account + profile

  const beginRegistration = useCallback(() => {
    registeringRef.current = true;
    setRegistering(true);
  }, []);

  const endRegistration = useCallback(() => {
    registeringRef.current = false;
    setRegistering(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const p = (await getUserProfile()) as Profile;
      if (id !== requestId.current) return;
      setProfile(p);
      setProfileError(null);
    } catch (e: any) {
      if (id !== requestId.current) return;
      setProfile(null);
      setProfileError(e?.message ?? 'Could not load your profile');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // During signup the profile doesn't exist yet; the signup screen loads it when done
        if (!registeringRef.current) await refreshProfile();
      } else {
        requestId.current++;
        setProfile(null);
        setProfileError(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, registering, beginRegistration, endRegistration, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
