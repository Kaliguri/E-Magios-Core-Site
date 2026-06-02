import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompendiumSort } from './useCompendiumSort';
import type { CompendiumEntity } from '@/entities/compendium/types';

function entities(rows: Array<Record<string, unknown>>): CompendiumEntity[] {
  return rows as unknown as CompendiumEntity[];
}

describe('useCompendiumSort', () => {
  it('sorts by name ascending using ru locale by default', () => {
    const { result } = renderHook(() => useCompendiumSort());
    const sorted = result.current.sortItems(
      entities([
        { id: '1', name: 'Яблоко' },
        { id: '2', name: 'Арбуз' },
        { id: '3', name: 'Банан' },
      ]),
    );
    expect(sorted.map((r) => (r as unknown as { name: string }).name)).toEqual([
      'Арбуз',
      'Банан',
      'Яблоко',
    ]);
  });

  it('toggles direction when the same field is selected again', () => {
    const { result } = renderHook(() => useCompendiumSort());
    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ field: 'name', ascending: false });
    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ field: 'name', ascending: true });
  });

  it('resets to ascending when switching to a new field', () => {
    const { result } = renderHook(() => useCompendiumSort());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('requiredLevel'));
    expect(result.current.sort).toEqual({ field: 'requiredLevel', ascending: true });
  });

  it('sorts numeric fields numerically, not lexically', () => {
    const { result } = renderHook(() => useCompendiumSort('requiredLevel'));
    const sorted = result.current.sortItems(
      entities([
        { id: 'a', requiredLevel: 10 },
        { id: 'b', requiredLevel: 2 },
        { id: 'c', requiredLevel: 1 },
      ]),
    );
    expect(sorted.map((r) => (r as unknown as { requiredLevel: number }).requiredLevel)).toEqual([
      1, 2, 10,
    ]);
  });

  it('pushes null/undefined values to the end', () => {
    const { result } = renderHook(() => useCompendiumSort('school'));
    const sorted = result.current.sortItems(
      entities([{ id: 'a', school: 'Огонь' }, { id: 'b' }, { id: 'c', school: 'Вода' }]),
    );
    expect(sorted.map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });
});
