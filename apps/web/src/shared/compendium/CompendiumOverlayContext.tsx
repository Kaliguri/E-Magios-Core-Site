import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { COMPENDIUM_CONFIG_BY_KEY, isCompendiumKey } from '@/entities/compendium/config';
import type { CompendiumEntity, CompendiumEntityKey } from '@/entities/compendium/types';
import { getCached, setCached } from '@/shared/cache/idb';
import { useDetailModal } from '@/features/db/useDetailModal';
import {
  useCompendiumIndex,
  type CompendiumDatasets,
  type EntityRef,
} from '@/features/db/useCompendiumIndex';

interface CompendiumOverlayValue {
  /** Open the detail overlay for an entity, loading its collection on demand. */
  openEntity: (ref: EntityRef) => void;
  close: () => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  current: EntityRef | null;
  isOpen: boolean;
  resolve: (ref: EntityRef | null) => CompendiumEntity | null;
  resolveByName: (name: string, entityType: CompendiumEntityKey) => EntityRef | null;
  /** Ensure a collection is loaded (e.g. so cross-links resolve to buttons). */
  ensureLoaded: (entityType: CompendiumEntityKey) => void;
}

const CompendiumOverlayContext = createContext<CompendiumOverlayValue | null>(null);

/** Legacy single-param DB links (`db.html?spell=<id>`) → entity type. */
const LEGACY_PARAM_TO_TYPE: Record<string, CompendiumEntityKey> = {
  spell: 'spells',
  school: 'schools',
  effect: 'effects',
  archetype: 'archetypes',
  action: 'actions',
  basic: 'basics',
  craftComponent: 'craft-components',
  craftProfession: 'craft-professions',
  craftSpecialization: 'craft-specializations',
  recipeType: 'recipe-types',
  recipe: 'recipes',
};

/**
 * Parse a DB deep-link into an entity ref. Handles both the news format
 * (`#/db?tab=spells&detail=<id>`) and the legacy in-text format
 * (`db.html?spell=<id>`). Returns null for routes that aren't a single-entity
 * link (plain `/db`, a tab without detail, book chapters, `/profile`, …) so
 * callers fall back to navigation.
 */
export function parseEntityRoute(route: string): EntityRef | null {
  const cleaned = route.startsWith('#') ? route.slice(1) : route;
  const queryIdx = cleaned.indexOf('?');
  if (queryIdx < 0) return null;
  const path = cleaned.slice(0, queryIdx);
  if (path !== '/db' && path !== '/db.html' && path !== 'db.html') return null;
  const params = new URLSearchParams(cleaned.slice(queryIdx + 1));

  const tab = params.get('tab');
  const detail = params.get('detail');
  if (detail && isCompendiumKey(tab)) return { entityType: tab, id: detail };

  for (const [param, entityType] of Object.entries(LEGACY_PARAM_TO_TYPE)) {
    const id = params.get(param);
    if (id) return { entityType, id };
  }
  return null;
}

export function CompendiumOverlayProvider({ children }: { children: ReactNode }) {
  const modal = useDetailModal();
  const { open: openModal, close } = modal;
  const [datasets, setDatasets] = useState<CompendiumDatasets>({});
  const datasetsRef = useRef<CompendiumDatasets>(datasets);
  datasetsRef.current = datasets;
  const loadingRef = useRef<Set<CompendiumEntityKey>>(new Set());
  const location = useLocation();
  const index = useCompendiumIndex(datasets);

  const ensureLoaded = useCallback((entityType: CompendiumEntityKey) => {
    if (datasetsRef.current[entityType] || loadingRef.current.has(entityType)) return;
    const config = COMPENDIUM_CONFIG_BY_KEY[entityType];
    if (!config) return;
    loadingRef.current.add(entityType);
    const cacheKey = `compendium:${entityType}`;

    void (async () => {
      try {
        const cached = await getCached<CompendiumEntity[]>(cacheKey);
        if (cached && Array.isArray(cached.data) && cached.data.length) {
          setDatasets((prev) => ({ ...prev, [entityType]: cached.data }));
        }
        const fresh = await config.fetcher();
        setDatasets((prev) => ({ ...prev, [entityType]: fresh }));
        await setCached(cacheKey, fresh, (cached?.version ?? 0) + 1);
      } catch {
        // Best-effort: keep whatever was cached; the modal degrades to a spinner.
      } finally {
        loadingRef.current.delete(entityType);
      }
    })();
  }, []);

  const openEntity = useCallback(
    (ref: EntityRef) => {
      ensureLoaded(ref.entityType);
      openModal(ref);
    },
    [ensureLoaded, openModal],
  );

  // Close the overlay when the user navigates to a different page — a modal
  // lingering across route changes is disorienting. Detail deep-links re-open
  // it from the target page's own effect.
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== lastPathRef.current) {
      lastPathRef.current = location.pathname;
      close();
    }
  }, [location.pathname, close]);

  const value = useMemo<CompendiumOverlayValue>(
    () => ({
      openEntity,
      close,
      goBack: modal.goBack,
      goForward: modal.goForward,
      canGoBack: modal.canGoBack,
      canGoForward: modal.canGoForward,
      current: modal.current,
      isOpen: modal.isOpen,
      resolve: index.resolve,
      resolveByName: index.resolveByName,
      ensureLoaded,
    }),
    [openEntity, close, modal, index, ensureLoaded],
  );

  return (
    <CompendiumOverlayContext.Provider value={value}>{children}</CompendiumOverlayContext.Provider>
  );
}

export function useCompendiumOverlay(): CompendiumOverlayValue {
  const ctx = useContext(CompendiumOverlayContext);
  if (!ctx) {
    throw new Error('useCompendiumOverlay must be used within a CompendiumOverlayProvider');
  }
  return ctx;
}
