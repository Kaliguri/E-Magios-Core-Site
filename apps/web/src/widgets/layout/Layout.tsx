import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { PASSWORD_KEY } from '@/shared/config/access';
import { CompendiumOverlayProvider } from '@/shared/compendium/CompendiumOverlayContext';
import { GlobalDetailModal } from '@/shared/compendium/GlobalDetailModal';
import { DiceProvider, DiceWidget } from '@/features/dice';
import styles from './Layout.module.css';

/** "Scroll to top" affordance for the main content area (the app's scroller). */
function ScrollToTop({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 400);
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [targetRef]);

  if (!visible) return null;
  return (
    <button
      type="button"
      className={styles.scrollTop}
      onClick={() => targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Наверх"
      aria-label="Наверх"
    >
      ↑
    </button>
  );
}

export function Layout() {
  const mainRef = useRef<HTMLElement | null>(null);

  function resetBookAccess() {
    localStorage.removeItem(PASSWORD_KEY);
    window.location.reload();
  }

  return (
    <DiceProvider>
      <CompendiumOverlayProvider>
        <div className={styles.root}>
          <Sidebar />
          <main className={styles.main} ref={mainRef}>
            <Outlet />
          </main>
          <ScrollToTop targetRef={mainRef} />
          <div className={styles.resetAccessHover}>
            <button
              className={styles.resetAccessButton}
              type="button"
              title="Сбросить доступ к защищённым книгам"
              aria-label="Сбросить доступ к защищённым книгам"
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
