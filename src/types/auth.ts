export type UserRole =
  | 'Primary Admin'
  | 'Backup Admin'
  | 'Finance Editor'
  | 'Viewer'
  | 'Presbyter Read-Only';

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  givenName?: string;
  familyName?: string;
}

export interface AuthSession {
  user: AuthUser;
  idToken: string;
  expiresAt: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAuthorized: (allowedRoles?: UserRole[]) => boolean;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signOut: () => void;
  devSignIn?: (role: UserRole) => void;
}
