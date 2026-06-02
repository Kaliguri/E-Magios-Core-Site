import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCompendiumFilters } from './useCompendiumFilters';
import type { FilterDescriptor } from '@/entities/compendium/schema';
import type { CompendiumEntity } from '@/entities/compendium/types';

const FILTER_DEFS: FilterDescriptor[] = [
  { key: 'school', label: 'School' },
  { key: 'concentration', label: 'Concentration', options: ['Да', 'Нет'] },
];

const ITEMS: CompendiumEntity[] = [
  { id: 's1', name: 'Огненный луч', school: 'Огонь', concentration: 'Да' } as CompendiumEntity,
  { id: 's2', name: 'Водный щит', school: 'Вода', concentration: 'Нет' } as CompendiumEntity,
  { id: 's3', name: 'Туман', school: 'Вода', concentration: 'Да' } as CompendiumEntity,
];

describe('useCompendiumFilters', () => {
  it('applies and clears filter state', () => {
    const { result } = renderHook(() => useCompendiumFilters({}));

    act(() => {
      result.current.setTempFilter('school', ['Вода']);
    });
    act(() => {
      result.current.applyFilters();
    });

    const filteredBySchool = result.current.filterItems(ITEMS, FILTER_DEFS);
    expect(filteredBySchool).toHaveLength(2);
    expect(filteredBySchool.map((item) => item.id)).toEqual(['s2', 's3']);

    act(() => {
      result.current.setTempFilter('concentration', ['Да']);
    });
    act(() => {
      result.current.applyFilters();
    });

    const filteredBySchoolAndConcentration = result.current.filterItems(ITEMS, FILTER_DEFS);
    expect(filteredBySchoolAndConcentration).toHaveLength(1);
    expect(filteredBySchoolAndConcentration[0]?.id).toBe('s3');

    act(() => {
      result.current.clearFilters();
    });

    const cleared = result.current.filterItems(ITEMS, FILTER_DEFS);
    expect(cleared).toHaveLength(3);
  });
});
