import { useState, useCallback } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';
import type { FilterDescriptor } from '@/entities/compendium/schema';

export type FilterState = Record<string, string[]>;

function cloneFilters(filters: FilterState): FilterState {
  return Object.fromEntries(Object.entries(filters).map(([key, values]) => [key, [...values]]));
}

function filtersEqual(a: FilterState, b: FilterState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key] ?? [];
    const bv = b[key] ?? [];
    if (av.length !== bv.length) return false;
    if (av.some(value => !bv.includes(value))) return false;
  }
  return true;
}

function splitToArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.includes(',')) {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (val != null && val !== '') return [String(val)];
  return [];
}

function hasAny(arr: string[], filter: string[]): boolean {
  if (!filter.length) return true;
  return filter.some(f => arr.includes(f));
}

function matchesFilters(item: CompendiumEntity, filters: FilterState, filterDefs: FilterDescriptor[]): boolean {
  const itemRecord = item as unknown as Record<string, unknown>;
  for (const fd of filterDefs) {
    const selected = filters[fd.key];
    if (!selected || !selected.length) continue;

    const raw = itemRecord[fd.sourceField ?? fd.key];

    if (fd.options) {
      // boolean-style filter: item field must match
      const val = raw;
      if (fd.key === 'concentration') {
        const hasConc = val === 'Да';
        if (selected.includes('Да') && !selected.includes('Нет') && !hasConc) return false;
        if (selected.includes('Нет') && !selected.includes('Да') && hasConc) return false;
      } else if (fd.key === 'subspell') {
        const isSubspell = val === 'Да' || val === true;
        if (selected.includes('Да') && !selected.includes('Нет') && !isSubspell) return false;
        if (selected.includes('Нет') && !selected.includes('Да') && isSubspell) return false;
      } else if (fd.key === 'signature') {
        const hasSig = raw != null && raw !== '' && raw !== false;
        if (selected.includes('Да') && !selected.includes('Нет') && !hasSig) return false;
        if (selected.includes('Нет') && !selected.includes('Да') && hasSig) return false;
      } else if (fd.key === 'source') {
        const src = String(raw ?? '');
        if (!selected.includes(src)) return false;
      } else {
        const src = String(raw ?? '');
        if (!selected.includes(src)) return false;
      }
    } else if (fd.split) {
      const arr = splitToArray(raw);
      if (!hasAny(arr, selected)) return false;
    } else if (fd.numeric) {
      const num = Number(raw);
      const selectedNums = selected.map(Number);
      if (!selectedNums.includes(num)) return false;
    } else {
      // single value match
      const arr = splitToArray(raw);
      if (!hasAny(arr, selected)) return false;
    }
  }
  return true;
}

function collectOptions(
  items: CompendiumEntity[],
  fd: FilterDescriptor,
): string[] {
  if (fd.options) return fd.options;
  const field = fd.sourceField ?? fd.key;
  const set = new Set<string>();
  for (const item of items) {
    const val = (item as unknown as Record<string, unknown>)[field];
    const arr = splitToArray(val);
    arr.forEach(v => set.add(v));
  }
  return Array.from(set).sort((a, b) => {
    if (fd.numeric) return Number(a) - Number(b);
    return a.localeCompare(b, 'ru');
  });
}

interface UseCompendiumFiltersResult {
  filters: FilterState;
  tempFilters: FilterState;
  setTempFilter: (key: string, values: string[]) => void;
  applyFilters: () => void;
  cancelFilters: () => void;
  clearFilters: () => void;
  filterItems: <T extends CompendiumEntity>(items: T[], filterDefs: FilterDescriptor[]) => T[];
  getOptions: (items: CompendiumEntity[], fd: FilterDescriptor) => string[];
  hasActiveFilters: boolean;
}

export function useCompendiumFilters(initialFilters?: FilterState): UseCompendiumFiltersResult {
  const initial = initialFilters ?? {};
  const [filters, setFilters] = useState<FilterState>(() => cloneFilters(initial));
  const [tempFilters, setTempFiltersState] = useState<FilterState>(() => cloneFilters(initial));

  const setTempFilter = useCallback((key: string, values: string[]) => {
    setTempFiltersState(prev => ({ ...prev, [key]: values }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
  }, [tempFilters]);

  const cancelFilters = useCallback(() => {
    setTempFiltersState(filters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setTempFiltersState(cloneFilters(initial));
  }, [initial]);

  const filterItems = useCallback(<T extends CompendiumEntity>(
    items: T[],
    filterDefs: FilterDescriptor[],
  ): T[] => {
    return items.filter(item => matchesFilters(item, filters, filterDefs));
  }, [filters]);

  const getOptions = useCallback((items: CompendiumEntity[], fd: FilterDescriptor) => {
    return collectOptions(items, fd);
  }, []);

  const hasActiveFilters = !filtersEqual(filters, initial);

  return {
    filters,
    tempFilters,
    setTempFilter,
    applyFilters,
    cancelFilters,
    clearFilters,
    filterItems,
    getOptions,
    hasActiveFilters,
  };
}
