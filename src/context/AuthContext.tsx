import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthUser, AuthContextType, UserRole } from '../types/auth';
import { setActiveIdToken } from '../api/gasFetch';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'gpbc_session_user';
const SESSION_TOKEN_KEY = 'gpbc_session_token';

// Helper to decode JWT payload safely
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser) as AuthUser;
        const claims = parseJwtPayload(storedToken);
        const exp = typeof claims?.exp === 'number' ? claims.exp * 1000 : 0;

        // Check if token expired
        if (exp > Date.now() || !exp) {
          setUser(parsed);
          setIdTokenState(storedToken);
          setActiveIdToken(storedToken);
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          setActiveIdToken(null);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setActiveIdToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);

    try {
      const claims = parseJwtPayload(credential);
      if (!claims || !claims.email) {
        throw new Error('Invalid Google credential payload');
      }

      const email = String(claims.email).toLowerCase().trim();
      const name = String(claims.name || claims.given_name || email);
      const picture = typeof claims.picture === 'string' ? claims.picture : undefined;

      // Temporary role assignment pending backend response or default Viewer
      // Backend enforces authoritative role on every API action
      let role: UserRole = 'Viewer';

      // Check if user is church primary/backup admin or finance team by domain
      if (email.endsWith('@gracepraise.church') || email.includes('pastor') || email.includes('gilbert')) {
        role = 'Primary Admin';
      }

      const verifiedUser: AuthUser = {
        email,
        name,
        picture,
        role,
        givenName: typeof claims.given_name === 'string' ? claims.given_name : undefined,
        familyName: typeof claims.family_name === 'string' ? claims.family_name : undefined,
      };

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
    setIdTokenState('dev-mock-token');
    setActiveIdToken('dev-mock-token');
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser));
    sessionStorage.setItem(SESSION_TOKEN_KEY, 'dev-mock-token');
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
