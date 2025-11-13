import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { storeToken, storeUser, clearAuthData, getUser, UserData, getSessionId, removeSessionId } from '../services/authStorage';
import { initializeNotificationHandlers } from '../services/notifications';
import { getAuthProfile, validateSession, sessionLogout } from '../services/api';

type AuthMode = 'supabase' | 'jwt' | 'session' | 'none';

interface AuthContextValue {
  mode: AuthMode;
  loading: boolean;
  session: any | null;
  user: any | null;
  profile: any | null;
  refreshSession: () => Promise<void>;
  setJwtAuthenticated: () => Promise<void>;
  setSessionAuthenticated: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AuthMode>('none');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const appState = useRef<AppStateStatus>('active');

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize notifications handler once (no-op)
        try { await initializeNotificationHandlers(); } catch {}
        // Try Supabase session first
        const { data: sessData, error: sessErr } = await supabase.auth.getSession();
        if (!sessErr && sessData?.session) {
          const sess = sessData.session;
          setSession(sess);
          setMode('supabase');
          // Keep axios token in sync for backend calls
          await storeToken(sess.access_token);
          // Load user and profile from Supabase tables via backend API (protected by JWT)
          try {
            const authProfile = await getAuthProfile();
            setUser(authProfile.user);
            setProfile(authProfile.profile);
            const userData: UserData = {
              id: authProfile.user.id,
              phone: authProfile.user.phone,
              email: authProfile.user.email,
              role: authProfile.profile?.role,
              firstName: authProfile.profile?.first_name,
              lastName: authProfile.profile?.last_name,
            };
            await storeUser(userData);
            // Push registration disabled
          } catch (e) {
            // Fallback: attempt to infer user from local storage
            const cachedUser = await getUser();
            if (cachedUser) setUser(cachedUser);
          }
        } else {
          // Check for existing session-based auth first
          const sessionId = await getSessionId();
          if (sessionId) {
            try {
              const { user: u, profile: p } = await validateSession();
              setUser(u);
              setProfile(p);
              setMode('session');
            } catch {
              // If session invalid, fallback to JWT-only mode using stored token
              const token = await AsyncStorage.getItem('@auth_token');
              if (token) {
                try {
                  const authProfile = await getAuthProfile();
                  setUser(authProfile.user);
                  setProfile(authProfile.profile);
                  setMode('jwt');
                } catch {
                  setMode('none');
                }
              } else {
                setMode('none');
              }
            }
          } else {
            // Fallback to JWT-only
            const token = await AsyncStorage.getItem('@auth_token');
            if (token) {
              try {
                const authProfile = await getAuthProfile();
                setUser(authProfile.user);
                setProfile(authProfile.profile);
                setMode('jwt');
              } catch {
                setMode('none');
              }
            } else {
              setMode('none');
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();

    // Listen for Supabase auth changes and keep token in sync
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setMode('none');
        await clearAuthData().catch(() => {});
      } else if (newSession) {
        setSession(newSession);
        setMode('supabase');
        await storeToken(newSession.access_token);
        // Reload profile when tokens rotate
          try {
          const authProfile = await getAuthProfile();
          setUser(authProfile.user);
          setProfile(authProfile.profile);
        } catch {}
      }
    });

    // AppState listener: refresh session when returning to foreground
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      const prevState = appState.current;
      appState.current = nextState;
      if (prevState.match(/inactive|background/) && nextState === 'active') {
        await maybeRefreshSession();
      }
    });

    return () => {
      sub?.subscription?.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  const maybeRefreshSession = async () => {
    try {
      const { data: sessData } = await supabase.auth.getSession();
      const sess = sessData?.session;
      if (sess?.expires_at) {
        const nowSec = Math.floor(Date.now() / 1000);
        // Refresh if expiring within next 5 minutes
        if (sess.expires_at - nowSec < 300) {
          await refreshSession();
        }
      }
    } catch {}
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        setSession(data.session);
        await storeToken(data.session.access_token);
      }
    } catch {}
  };

  const setJwtAuthenticated = async () => {
    try {
      const authProfile = await getAuthProfile();
      setUser(authProfile.user);
      setProfile(authProfile.profile);
      setMode('jwt');
    } catch (e) {
      // If token invalid, ensure mode reflects unauthenticated
      setMode('none');
    }
  };

  const setSessionAuthenticated = async () => {
    try {
      const { user: u, profile: p } = await validateSession();
      setUser(u);
      setProfile(p);
      setMode('session');
    } catch (e) {
      setMode('none');
    }
  };

  const logout = async () => {
    try {
      // Attempt to invalidate session on server if using session auth
      if (mode === 'session') {
        try { await sessionLogout(); } catch {}
      }
      // Never auto-logout elsewhere; only here on explicit request
      await supabase.auth.signOut();
    } finally {
      await clearAuthData().catch(() => {});
      await removeSessionId().catch(() => {});
      setSession(null);
      setUser(null);
      setProfile(null);
      setMode('none');
    }
  };

  const value = useMemo(
    () => ({ mode, loading, session, user, profile, refreshSession, setJwtAuthenticated, setSessionAuthenticated, logout }),
    [mode, loading, session, user, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};