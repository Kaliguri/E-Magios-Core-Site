import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { PASSWORD_KEY } from '@/shared/config/access';
import { CompendiumOverlayProvider } from '@/shared/compendium/CompendiumOverlayContext';
import { GlobalDetailModal } from '@/shared/compendium/GlobalDetailModal';
import { DiceProvider, DiceWidget } from '@/features/dice';
import styles from './Layout.module.css';

export function Layout() {
  function resetBookAccess() {
    localStorage.removeItem(PASSWORD_KEY);
    window.location.reload();
  }

  return (
    <DiceProvider>
      <CompendiumOverlayProvider>
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
          <GlobalDetailModal />
          <DiceWidget />
        </div>
      </CompendiumOverlayProvider>
    </DiceProvider>
  );
}
