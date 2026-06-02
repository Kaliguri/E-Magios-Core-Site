import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompendiumData } from '@/shared/cache/useCompendiumData';
import {
  COMPENDIUM_CONFIGS,
  COMPENDIUM_CONFIG_BY_KEY,
  isCompendiumKey,
  type CompendiumConfig,
} from '@/entities/compendium/config';
import { useCompendiumFilters } from '@/features/db/useCompendiumFilters';
import { useCompendiumSort } from '@/features/db/useCompendiumSort';
import { useDetailModal } from '@/features/db/useDetailModal';
import { useCompendiumIndex, type EntityRef } from '@/features/db/useCompendiumIndex';
import { CompendiumTable } from '@/widgets/db-table/CompendiumTable';
import { FilterPanel } from '@/widgets/db-table/FilterPanel';
import { DetailModal } from '@/widgets/db-table/DetailModal';
import { Button } from '@/shared/ui/Button';
import type { CompendiumEntity } from '@/entities/compendium/types';
import type { CompendiumEntityKey } from '@/entities/compendium/types';
import styles from './DbPage.module.css';

function TabContent({
  config,
  detailRef,
  detailOpen,
  canGoBack,
  canGoForward,
  onOpenDetail,
  onNavigateTo,
  onCloseDetail,
  onBack,
  onForward,
}: {
  config: CompendiumConfig;
  detailRef: EntityRef | null;
  detailOpen: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onOpenDetail: (ref: EntityRef) => void;
  onNavigateTo: (ref: EntityRef) => void;
  onCloseDetail: () => void;
  onBack: () => void;
  onForward: () => void;
}) {
  const stableFetcher = useCallback(config.fetcher, [config]);
  const {
    data: items,
    loading,
    error,
  } = useCompendiumData<CompendiumEntity[]>(
    `compendium:${config.key}`,
    stableFetcher,
    config.manifestKey,
  );

  const { sort, toggleSort, sortItems } = useCompendiumSort();
  const {
    tempFilters,
    setTempFilter,
    applyFilters,
    cancelFilters,
    clearFilters,
    filterItems,
    getOptions,
    hasActiveFilters,
  } = useCompendiumFilters(config.defaultFilters, `db_filters_${config.key}`);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState(() => {
    try {
      return sessionStorage.getItem(`db_search_${config.key}`) ?? '';
    } catch {
      return '';
    }
  });
  const datasets = useMemo(() => (items ? { [config.key]: items } : {}), [config.key, items]);
  const compendiumIndex = useCompendiumIndex(datasets);

  useEffect(() => {
    try {
      sessionStorage.setItem(`db_search_${config.key}`, search);
    } catch {
      // Search persistence is optional.
    }
  }, [config.key, search]);

  if (loading && !items) {
    return <div className={styles.loader}>Загружаем...</div>;
  }
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  if (!items) return null;

  const filtered = filterItems(items, config.schema.filters);
  const normalizedSearch = search.trim().toLocaleLowerCase('ru');
  const searched = normalizedSearch
    ? filtered.filter((item) => {
        const record = item as unknown as Record<string, unknown>;
        return ['name', 'description', 'type', 'school', 'profession', 'specialization'].some(
          (field) =>
            String(record[field] ?? '')
              .toLocaleLowerCase('ru')
              .includes(normalizedSearch),
        );
      })
    : filtered;
  const sorted = sortItems(searched);
  const detailEntity =
    detailRef?.entityType === config.key ? compendiumIndex.resolve(detailRef) : null;

  return (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{sorted.length} записей</span>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Поиск..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {config.schema.filters.length > 0 && (
          <Button
            variant={hasActiveFilters ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setFilterOpen(true)}
          >
            Фильтры{hasActiveFilters ? ' ✓' : ''}
          </Button>
        )}
      </div>

      <CompendiumTable
        items={sorted}
        columns={config.schema.columns}
        sort={sort}
        onSort={toggleSort}
        onRowClick={(item) => onOpenDetail({ entityType: config.key, id: item.id })}
      />

      {config.schema.filters.length > 0 && (
        <FilterPanel
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filterDefs={config.schema.filters}
          allItems={items}
          tempFilters={tempFilters}
          onSetFilter={setTempFilter}
          onApply={applyFilters}
          onCancel={cancelFilters}
          onClear={clearFilters}
          getOptions={getOptions}
        />
      )}

      <DetailModal
        open={detailOpen && Boolean(detailEntity)}
        entity={detailEntity}
        entityType={detailRef?.entityType ?? ''}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onClose={onCloseDetail}
        onBack={onBack}
        onForward={onForward}
        onNavigateTo={onNavigateTo}
        resolveEntityByName={(name, entityType) => compendiumIndex.resolveByName(name, entityType)}
      />
    </div>
  );
}

function getInitialTab(searchParams: URLSearchParams): CompendiumEntityKey {
  const tab = searchParams.get('tab');
  return isCompendiumKey(tab) ? tab : 'spells';
}

export function DbPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<CompendiumEntityKey>(() =>
    getInitialTab(searchParams),
  );
  const detailModal = useDetailModal();
  const activeConfig = COMPENDIUM_CONFIG_BY_KEY[activeTab];
  const urlDetailId = searchParams.get('detail');
  const visibleDetailRef =
    detailModal.current ?? (urlDetailId ? { entityType: activeTab, id: urlDetailId } : null);

  const setDbUrlState = useCallback(
    (tab: CompendiumEntityKey, detail?: string | null) => {
      const next = new URLSearchParams();
      next.set('tab', tab);
      if (detail) next.set('detail', detail);
      setSearchParams(next, { replace: false });
    },
    [setSearchParams],
  );

  const setActiveTab = useCallback(
    (tab: CompendiumEntityKey) => {
      setActiveTabState(tab);
      setDbUrlState(tab, null);
    },
    [setDbUrlState],
  );

  const openDetail = useCallback(
    (ref: EntityRef) => {
      setActiveTabState(ref.entityType);
      detailModal.open(ref);
      setDbUrlState(ref.entityType, ref.id);
    },
    [detailModal, setDbUrlState],
  );

  const closeDetail = useCallback(() => {
    detailModal.close();
    setDbUrlState(activeTab, null);
  }, [activeTab, detailModal, setDbUrlState]);

  useEffect(() => {
    const tab = getInitialTab(searchParams);
    const detailId = searchParams.get('detail');
    setActiveTabState(tab);
    if (
      detailId &&
      (detailModal.current?.entityType !== tab || detailModal.current.id !== detailId)
    ) {
      detailModal.open({ entityType: tab, id: detailId });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!detailModal.isOpen || !detailModal.current) return;
    const { entityType, id } = detailModal.current;
    setActiveTabState(entityType);
    if (searchParams.get('tab') !== entityType || searchParams.get('detail') !== id) {
      setDbUrlState(entityType, id);
    }
  }, [detailModal.current?.entityType, detailModal.current?.id, detailModal.isOpen]);

  return (
    <div className={styles.page}>
      <h1>База Данных</h1>

      <div className={styles.tabs}>
        {COMPENDIUM_CONFIGS.map((tab) => (
          <button
            key={tab.key}
            className={[styles.tab, activeTab === tab.key ? styles.tabActive : ''].join(' ')}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent
        key={activeTab}
        config={activeConfig}
        detailRef={visibleDetailRef}
        detailOpen={detailModal.isOpen || Boolean(urlDetailId)}
        canGoBack={detailModal.canGoBack}
        canGoForward={detailModal.canGoForward}
        onOpenDetail={openDetail}
        onNavigateTo={openDetail}
        onCloseDetail={closeDetail}
        onBack={detailModal.goBack}
        onForward={detailModal.goForward}
      />
    </div>
  );
}
