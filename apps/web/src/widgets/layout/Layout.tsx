import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { PASSWORD_KEY } from '@/shared/config/access';
import styles from './Layout.module.css';

export function Layout() {
  function resetBookAccess() {
    localStorage.removeItem(PASSWORD_KEY);
    window.location.reload();
  }

  return (
    <div className={styles.root}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <div className={styles.resetAccessHover}>
        <button
          className={styles.resetAccessButton}
          type="button"
          title="Reset protected content access"
          onClick={resetBookAccess}
        >
          🔓
        </button>
      </div>
    </div>
  );
}
