import { useState } from 'react';
import type { FilterDescriptor } from '@/entities/compendium/schema';
import type { CompendiumEntity } from '@/entities/compendium/types';
import type { FilterState } from '@/features/db/useCompendiumFilters';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import styles from './FilterPanel.module.css';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filterDefs: FilterDescriptor[];
  allItems: CompendiumEntity[];
  tempFilters: FilterState;
  onSetFilter: (key: string, values: string[]) => void;
  onApply: () => void;
  onCancel: () => void;
  onClear: () => void;
  getOptions: (items: CompendiumEntity[], fd: FilterDescriptor) => string[];
}

function formatStars(val: string): string {
  const n = Number(val);
  if (isNaN(n)) return val;
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

function FilterCategory({
  fd,
  options,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  fd: FilterDescriptor;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.category}>
      <button
        className={styles.categoryHeader}
        onClick={() => setCollapsed((c) => !c)}
        type="button"
      >
        <span>{fd.label}</span>
        <span className={styles.categoryArrow}>{collapsed ? '▶' : '▼'}</span>
      </button>
      {!collapsed && (
        <div className={styles.categoryBody}>
          <div className={styles.categoryActions}>
            <button type="button" className={styles.textBtn} onClick={onSelectAll}>
              Выбрать все
            </button>
            <button type="button" className={styles.textBtn} onClick={onClearAll}>
              Снять все
            </button>
          </div>
          <div className={styles.tags}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={[styles.tag, selected.includes(opt) ? styles.tagActive : ''].join(' ')}
                onClick={() => onToggle(opt)}
              >
                {fd.formatter === 'stars' ? formatStars(opt) : opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterPanel({
  open,
  onClose,
  filterDefs,
  allItems,
  tempFilters,
  onSetFilter,
  onApply,
  onCancel,
  onClear,
  getOptions,
}: FilterPanelProps) {
  function handleApply() {
    onApply();
    onClose();
  }

  function handleCancel() {
    onCancel();
    onClose();
  }

  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Очистить фильтры
      </Button>
      <Button variant="secondary" size="sm" onClick={handleCancel}>
        Отменить изменения
      </Button>
      <Button variant="primary" size="sm" onClick={handleApply}>
        Применить изменения
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={handleCancel} title="Фильтры" footer={footer} wide>
      <div className={styles.content}>
        {filterDefs.map((fd) => {
          const options = getOptions(allItems, fd);
          if (!options.length) return null;
          const selected = tempFilters[fd.key] ?? [];
          return (
            <FilterCategory
              key={fd.key}
              fd={fd}
              options={options}
              selected={selected}
              onToggle={(val) => {
                const next = selected.includes(val)
                  ? selected.filter((v) => v !== val)
                  : [...selected, val];
                onSetFilter(fd.key, next);
              }}
              onSelectAll={() => onSetFilter(fd.key, options)}
              onClearAll={() => onSetFilter(fd.key, [])}
            />
          );
        })}
      </div>
    </Modal>
  );
}
