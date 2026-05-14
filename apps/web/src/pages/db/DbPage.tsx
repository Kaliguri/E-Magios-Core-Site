import { useState, useCallback } from 'react';
import { useCompendiumData } from '@/shared/cache/useCompendiumData';
import { CompendiumRepository } from '@/shared/repositories/CompendiumRepository';
import { COMPENDIUM_SCHEMAS } from '@/entities/compendium/schema';
import { useCompendiumFilters } from '@/features/db/useCompendiumFilters';
import { useCompendiumSort } from '@/features/db/useCompendiumSort';
import { useDetailModal } from '@/features/db/useDetailModal';
import { CompendiumTable } from '@/widgets/db-table/CompendiumTable';
import { FilterPanel } from '@/widgets/db-table/FilterPanel';
import { DetailModal } from '@/widgets/db-table/DetailModal';
import { Button } from '@/shared/ui/Button';
import type { CompendiumEntity } from '@/entities/compendium/types';
import styles from './DbPage.module.css';

type TabKey =
  | 'spells' | 'schools' | 'effects' | 'actions'
  | 'skills' | 'archetypes' | 'basics' | 'action-types'
  | 'combat' | 'craft-components' | 'craft-professions'
  | 'craft-specializations' | 'recipe-types' | 'recipes';

interface TabConfig {
  key: TabKey;
  label: string;
  fetcher: () => Promise<CompendiumEntity[]>;
}

const TABS: TabConfig[] = [
  { key: 'spells', label: 'Заклинания', fetcher: () => CompendiumRepository.getSpells() },
  { key: 'schools', label: 'Школы Магии', fetcher: () => CompendiumRepository.getSchools() },
  { key: 'effects', label: 'Эффекты', fetcher: () => CompendiumRepository.getEffects() },
  { key: 'actions', label: 'Действия', fetcher: () => CompendiumRepository.getActions() },
  { key: 'skills', label: 'Навыки', fetcher: () => CompendiumRepository.getSkills() },
  { key: 'archetypes', label: 'Архетипы', fetcher: () => CompendiumRepository.getArchetypes() },
  { key: 'basics', label: 'Базовые', fetcher: () => CompendiumRepository.getBasics() },
  { key: 'action-types', label: 'Типы Действий', fetcher: () => CompendiumRepository.getActionTypes() },
  { key: 'combat', label: 'Боевые', fetcher: () => CompendiumRepository.getCombatComponents() },
  { key: 'craft-components', label: 'Компоненты крафта', fetcher: () => CompendiumRepository.getCraftComponents() },
  { key: 'craft-professions', label: 'Профессии', fetcher: () => CompendiumRepository.getCraftProfessions() },
  { key: 'craft-specializations', label: 'Специализации', fetcher: () => CompendiumRepository.getCraftSpecializations() },
  { key: 'recipe-types', label: 'Типы рецептов', fetcher: () => CompendiumRepository.getRecipeTypes() },
  { key: 'recipes', label: 'Рецепты', fetcher: () => CompendiumRepository.getRecipes() },
];

const DEFAULT_FILTERS: Partial<Record<TabKey, Record<string, string[]>>> = {
  spells: { subspell: ['Нет'] },
};

function TabContent({ tabKey, fetcher }: { tabKey: TabKey; fetcher: () => Promise<CompendiumEntity[]> }) {
  const schema = COMPENDIUM_SCHEMAS[tabKey];
  const stableFetcher = useCallback(fetcher, []);
  const { data: items, loading, error } = useCompendiumData<CompendiumEntity[]>(
    `compendium:${tabKey}`,
    stableFetcher,
    tabKey,
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
  } = useCompendiumFilters(DEFAULT_FILTERS[tabKey]);
  const detailModal = useDetailModal();
  const [filterOpen, setFilterOpen] = useState(false);

  if (loading && !items) {
    return <div className={styles.loader}>Загружаем...</div>;
  }
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  if (!items) return null;

  const filtered = filterItems(items, schema?.filters ?? []);
  const sorted = sortItems(filtered);

  return (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{sorted.length} записей</span>
        {schema?.filters.length > 0 && (
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
        columns={schema?.columns ?? []}
        sort={sort}
        onSort={toggleSort}
        onRowClick={item => detailModal.open(item, tabKey)}
      />

      {schema?.filters.length > 0 && (
        <FilterPanel
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filterDefs={schema.filters}
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
        open={detailModal.isOpen}
        entity={detailModal.current?.entity ?? null}
        entityType={detailModal.current?.entityType ?? ''}
        canGoBack={detailModal.canGoBack}
        canGoForward={detailModal.canGoForward}
        onClose={detailModal.close}
        onBack={detailModal.goBack}
        onForward={detailModal.goForward}
        onNavigateTo={(entity, entityType) => detailModal.open(entity, entityType)}
        resolveEntityByName={(name, entityType) => {
          if (entityType !== tabKey) return null;
          return items.find(item => String((item as unknown as Record<string, unknown>)['name'] ?? '') === name) ?? null;
        }}
      />
    </div>
  );
}

export function DbPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('spells');
  const activeConfig = TABS.find(t => t.key === activeTab)!;

  return (
    <div className={styles.page}>
      <h1>База Данных</h1>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={[styles.tab, activeTab === tab.key ? styles.tabActive : ''].join(' ')}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent key={activeTab} tabKey={activeTab} fetcher={activeConfig.fetcher} />
    </div>
  );
}
