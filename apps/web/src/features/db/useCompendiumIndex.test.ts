import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompendiumIndex, type CompendiumDatasets } from './useCompendiumIndex';

const datasets = {
  spells: [
    { id: 'fireball', name: 'Огненный шар' },
    { id: 'frost', name: 'Ледяная стрела' },
  ],
  schools: [{ id: 'fire', name: 'Огонь' }],
} as unknown as CompendiumDatasets;

describe('useCompendiumIndex', () => {
  it('resolves an entity by type and id', () => {
    const { result } = renderHook(() => useCompendiumIndex(datasets));
    const entity = result.current.resolve({ entityType: 'spells', id: 'fireball' });
    expect((entity as unknown as { name: string } | null)?.name).toBe('Огненный шар');
  });

  it('resolves cross-links by name within a type (case/space-insensitive)', () => {
    const { result } = renderHook(() => useCompendiumIndex(datasets));
    const ref = result.current.resolveByName('  огонь  ', 'schools');
    expect(ref).toEqual({ entityType: 'schools', id: 'fire' });
  });

  it('falls back to name lookup when id is actually a display name', () => {
    const { result } = renderHook(() => useCompendiumIndex(datasets));
    const entity = result.current.resolve({ entityType: 'spells', id: 'Ледяная стрела' });
    expect((entity as unknown as { id: string } | null)?.id).toBe('frost');
  });

  it('returns null for unknown references', () => {
    const { result } = renderHook(() => useCompendiumIndex(datasets));
    expect(result.current.resolve({ entityType: 'spells', id: 'missing' })).toBeNull();
    expect(result.current.resolveByName('nope', 'spells')).toBeNull();
    expect(result.current.resolve(null)).toBeNull();
  });
});
