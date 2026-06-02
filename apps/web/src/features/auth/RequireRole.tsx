import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/shared/ui/Spinner';
import { useAuth } from './AuthContext';

interface RequireRoleProps {
  /** Minimum access level. `'auth'` only requires a signed-in user. */
  require: 'auth' | 'editor' | 'admin';
  children: ReactNode;
  /** Where to send users who don't qualify. Defaults to home. */
  redirectTo?: string;
}

/**
 * Route guard. Shows a spinner while auth resolves, then either renders the
 * protected content or redirects. Server-side `firestore.rules` remain the
 * real enforcement — this only gates the UI.
 */
export function RequireRole({ require, children, redirectTo = '/' }: RequireRoleProps) {
  const { uid, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl, 2rem)' }}
      >
        <Spinner label="Проверка доступа..." />
      </div>
    );
  }

  if (!uid) {
    return <Navigate to={redirectTo} replace />;
  }

  const allowed =
    require === 'auth' ||
    (require === 'editor' && (role === 'editor' || role === 'admin')) ||
    (require === 'admin' && role === 'admin');

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
