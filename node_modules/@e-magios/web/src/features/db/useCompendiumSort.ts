import { useState, useCallback } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';

export interface SortState {
  field: string;
  ascending: boolean;
}

export function useCompendiumSort(defaultField = 'name') {
  const [sort, setSort] = useState<SortState>({ field: defaultField, ascending: true });

  const toggleSort = useCallback((field: string) => {
    setSort((prev) =>
      prev.field === field ? { field, ascending: !prev.ascending } : { field, ascending: true },
    );
  }, []);

  const sortItems = useCallback(
    <T extends CompendiumEntity>(items: T[]): T[] => {
      return [...items].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sort.field];
        const bVal = (b as unknown as Record<string, unknown>)[sort.field];

        let cmp = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else if (aVal == null && bVal == null) {
          cmp = 0;
        } else if (aVal == null) {
          cmp = 1;
        } else if (bVal == null) {
          cmp = -1;
        } else {
          const aStr = String(aVal);
          const bStr = String(bVal);
          cmp = aStr.localeCompare(bStr, 'ru');
        }

        return sort.ascending ? cmp : -cmp;
      });
    },
    [sort],
  );

  return { sort, toggleSort, sortItems };
}
