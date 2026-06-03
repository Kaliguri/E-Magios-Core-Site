import { DetailModal } from '@/widgets/db-table/DetailModal';
import { useCompendiumOverlay } from './CompendiumOverlayContext';

/**
 * Single site-wide detail overlay. Mounted once in the Layout so entity links
 * from anywhere (DB, news, book text) open the same modal with a shared
 * back/forward history, instead of navigating to the DB page.
 */
export function GlobalDetailModal() {
  const overlay = useCompendiumOverlay();
  const entity = overlay.resolve(overlay.current);

  return (
    <DetailModal
      open={overlay.isOpen}
      entity={entity}
      entityType={overlay.current?.entityType ?? ''}
      canGoBack={overlay.canGoBack}
      canGoForward={overlay.canGoForward}
      onClose={overlay.close}
      onBack={overlay.goBack}
      onForward={overlay.goForward}
      onNavigateTo={overlay.openEntity}
      resolveEntityByName={overlay.resolveByName}
    />
  );
}
