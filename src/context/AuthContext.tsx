import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthUser, AuthContextType, UserRole } from '../types/auth';
import { gasFetch, setActiveIdToken, setOnUnauthorizedCallback } from '../api/gasFetch';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'gpbc_session_user';
const SESSION_TOKEN_KEY = 'gpbc_session_token';
const sessionVerificationRequests = new Map<string, Promise<{ user: AuthUser }>>();

const CANONICAL_ROLES: UserRole[] = [
  'Primary Admin',
  'Backup Admin',
  'Finance Editor',
  'Viewer',
  'Presbyter Read-Only'
];

const verifySessionToken = (token: string): Promise<{ user: AuthUser }> => {
  const existingRequest = sessionVerificationRequests.get(token);
  if (existingRequest) return existingRequest;

  const request = gasFetch<{ user: AuthUser }>('verifySession', {}, token);
  sessionVerificationRequests.set(token, request);
  void request.then(
    () => sessionVerificationRequests.delete(token),
    () => sessionVerificationRequests.delete(token)
  );
  return request;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Register unauthorized token handler
  useEffect(() => {
    setOnUnauthorizedCallback((msg) => {
      setUser(null);
      setIdTokenState(null);
      setActiveIdToken(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setError(msg || 'Your Google session expired. Please sign in again.');
    });
    return () => { setOnUnauthorizedCallback(null); };
  }, []);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

        if (storedToken) {
          const response = await verifySessionToken(storedToken);
          const verifiedUser = response.user;

          if (!verifiedUser?.email || !verifiedUser.name || !CANONICAL_ROLES.includes(verifiedUser.role)) {
            throw new Error('Backend returned an invalid authorized-user session');
          }

          if (!cancelled) {
            setUser(verifiedUser);
          setIdTokenState(storedToken);
          setActiveIdToken(storedToken);
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(verifiedUser));
          }
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setActiveIdToken(null);
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        setActiveIdToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

    };

    void restoreSession();
    return () => { cancelled = true; };
  }, []);

  const signInWithGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await verifySessionToken(credential);
      const verifiedUser = response.user;

      if (!verifiedUser?.email || !verifiedUser.name || !CANONICAL_ROLES.includes(verifiedUser.role)) {
        throw new Error('Backend returned an invalid authorized-user session');
      }

      setUser(verifiedUser);
      setIdTokenState(credential);
      setActiveIdToken(credential);

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(verifiedUser));
      sessionStorage.setItem(SESSION_TOKEN_KEY, credential);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setError(msg);
      setUser(null);
      setIdTokenState(null);
      setActiveIdToken(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIdTokenState(null);
    setError(null);
    setActiveIdToken(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }, []);

  // Development-only role switcher for local UI preview
  const devSignIn = useCallback((mockRole: UserRole) => {
    if (!import.meta.env.DEV) return;

    const mockUser: AuthUser = {
      email: `dev-${mockRole.toLowerCase().replace(/\s+/g, '-')}@gracepraise.church`,
      name: `Dev (${mockRole})`,
      role: mockRole,
    };

    setUser(mockUser);
    setIdTokenState(null);
    setActiveIdToken(null);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser));
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }, []);

  const isAuthorized = useCallback((allowedRoles?: UserRole[]): boolean => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    idToken,
    loading,
    error,
    isAuthenticated: !!user,
    isAuthorized,
    signInWithGoogleCredential,
    signOut,
    devSignIn: import.meta.env.DEV ? devSignIn : undefined
  }), [user, idToken, loading, error, isAuthorized, signInWithGoogleCredential, signOut, devSignIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
