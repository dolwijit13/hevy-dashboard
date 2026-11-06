import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthorized: boolean;
  allowedEmails: string[];
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const allowedEmails = useMemo(() => {
    const raw = (import.meta.env.VITE_ALLOWED_EMAILS as string) || '';
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const isAuthorized = useMemo(() => {
    if (!user || !user.email) return false;
    // If no whitelist is specified, any authenticated user is allowed
    if (allowedEmails.length === 0) return true;
    return allowedEmails.includes(user.email.toLowerCase());
  }, [user, allowedEmails]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (error) {
          console.error('Error fetching Supabase session:', error);
          setAuthError(error.message);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((err) => {
        console.error('Auth initialization error:', err);
        setAuthError(err.message || 'Auth initialization failed');
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
      setAuthError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      setAuthError('Supabase is not configured.');
      return;
    }
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setAuthError(err.message || 'Google Sign-in failed');
      throw err;
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAuthError(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthorized,
        allowedEmails,
        authError,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

