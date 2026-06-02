import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/shared/firebase/client';

export type UserRole = 'author' | 'editor' | 'admin' | null;

export interface AuthContextValue {
  /** Firebase user, or null when signed out. */
  user: User | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  /** Role read from the auth token custom claim (`token.role`). */
  role: UserRole;
  /** True until the first auth-state resolution. */
  loading: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(value: unknown): UserRole {
  return value === 'author' || value === 'editor' || value === 'admin' ? value : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) {
        setRole(null);
        return;
      }
      // Role lives in the auth token custom claim (see firestore.rules → userRole()).
      nextUser
        .getIdTokenResult()
        .then((token) => setRole(normalizeRole(token.claims['role'])))
        .catch(() => setRole(null));
    });
  }, []);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      uid: user?.uid ?? null,
      displayName: user?.displayName ?? null,
      email: user?.email ?? null,
      photoURL: user?.photoURL ?? null,
      role,
      loading,
      isEditor: role === 'editor' || role === 'admin',
      isAdmin: role === 'admin',
      signIn,
      signOutUser,
    }),
    [user, role, loading, signIn, signOutUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
