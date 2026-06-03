import { useEffect, useState, useCallback } from 'react';
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
import { useCompendiumOverlay } from '@/shared/compendium/CompendiumOverlayContext';
import { CompendiumTable } from '@/widgets/db-table/CompendiumTable';
import { FilterPanel } from '@/widgets/db-table/FilterPanel';
import { Button, Input, Spinner, Tabs } from '@/shared/ui';
import type { CompendiumEntity, CompendiumEntityKey } from '@/entities/compendium/types';
import styles from './DbPage.module.css';

function TabContent({
  config,
  onOpenDetail,
}: {
  config: CompendiumConfig;
  onOpenDetail: (id: string) => void;
}) {
  const {
    data: items,
    loading,
    error,
  } = useCompendiumData<CompendiumEntity[]>(
    `compendium:${config.key}`,
    config.fetcher,
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

  useEffect(() => {
    try {
      sessionStorage.setItem(`db_search_${config.key}`, search);
    } catch {
      // Search persistence is optional.
    }
  }, [config.key, search]);

  if (loading && !items) {
    return <Spinner label="Загружаем..." />;
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

  return (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{sorted.length} записей</span>
        <Input
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
        onRowClick={(item) => onOpenDetail(item.id)}
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
    </div>
  );
}

function getInitialTab(searchParams: URLSearchParams): CompendiumEntityKey {
  const tab = searchParams.get('tab');
  return isCompendiumKey(tab) ? tab : 'spells';
}

export function DbPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const overlay = useCompendiumOverlay();
  const [activeTab, setActiveTabState] = useState<CompendiumEntityKey>(() =>
    getInitialTab(searchParams),
  );
  const activeConfig = COMPENDIUM_CONFIG_BY_KEY[activeTab];

  // Keep the active tab in sync with the URL (?tab=) — covers deep links and
  // in-app navigation onto an already-mounted DB page.
  useEffect(() => {
    const tab = getInitialTab(searchParams);
    setActiveTabState((prev) => (prev === tab ? prev : tab));
  }, [searchParams]);

  // Restore a deep-linked detail (?detail=) once, on mount. The shared overlay
  // owns the modal; we just ask it to open.
  useEffect(() => {
    const detailId = searchParams.get('detail');
    if (detailId) {
      overlay.openEntity({ entityType: getInitialTab(searchParams), id: detailId });
    }
    // Mount-only restore — intentionally not re-running on param changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the overlay closes, drop the stale ?detail= so a refresh doesn't reopen it.
  useEffect(() => {
    if (!overlay.isOpen && searchParams.get('detail')) {
      const next = new URLSearchParams(searchParams);
      next.delete('detail');
      setSearchParams(next, { replace: true });
    }
  }, [overlay.isOpen, searchParams, setSearchParams]);

  const setActiveTab = useCallback(
    (tab: CompendiumEntityKey) => {
      setActiveTabState(tab);
      overlay.close();
      const next = new URLSearchParams();
      next.set('tab', tab);
      setSearchParams(next, { replace: false });
    },
    [overlay, setSearchParams],
  );

  const openDetail = useCallback(
    (id: string) => {
      overlay.openEntity({ entityType: activeTab, id });
      const next = new URLSearchParams();
      next.set('tab', activeTab);
      next.set('detail', id);
      setSearchParams(next, { replace: false });
    },
    [overlay, activeTab, setSearchParams],
  );

  return (
    <div className={styles.page}>
      <h1>База Данных</h1>

      <Tabs
        variant="pills"
        items={COMPENDIUM_CONFIGS.map((tab) => ({ key: tab.key, label: tab.label }))}
        active={activeTab}
        onChange={setActiveTab}
      />

      <TabContent key={activeTab} config={activeConfig} onOpenDetail={openDetail} />
    </div>
  );
}
