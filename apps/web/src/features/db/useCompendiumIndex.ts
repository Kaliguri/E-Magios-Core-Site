import { useMemo } from 'react';
import type { CompendiumEntity, CompendiumEntityKey } from '@/entities/compendium/types';

export interface EntityRef {
  entityType: CompendiumEntityKey;
  id: string;
}

export type CompendiumDatasets = Partial<Record<CompendiumEntityKey, CompendiumEntity[]>>;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('ru');
}

export function useCompendiumIndex(datasets: CompendiumDatasets) {
  return useMemo(() => {
    const byTypeAndId = new Map<string, CompendiumEntity>();
    const byTypeAndName = new Map<string, EntityRef>();
    const byTypeAndLookup = new Map<string, EntityRef>();

    for (const [entityType, items] of Object.entries(datasets) as [
      CompendiumEntityKey,
      CompendiumEntity[],
    ][]) {
      for (const item of items ?? []) {
        byTypeAndId.set(`${entityType}:${item.id}`, item);
        byTypeAndLookup.set(`${entityType}:${normalize(item.id)}`, { entityType, id: item.id });
        const name = (item as unknown as Record<string, unknown>)['name'];
        if (typeof name === 'string' && name.trim()) {
          const ref = { entityType, id: item.id };
          byTypeAndName.set(`${entityType}:${normalize(name)}`, ref);
          byTypeAndLookup.set(`${entityType}:${normalize(name)}`, ref);
        }
      }
    }

    return {
      resolve(ref: EntityRef | null): CompendiumEntity | null {
        if (!ref) return null;
        const direct = byTypeAndId.get(`${ref.entityType}:${ref.id}`);
        if (direct) return direct;
        const resolvedRef = byTypeAndLookup.get(`${ref.entityType}:${normalize(ref.id)}`);
        return resolvedRef
          ? (byTypeAndId.get(`${resolvedRef.entityType}:${resolvedRef.id}`) ?? null)
          : null;
      },
      resolveByName(name: string, entityType: CompendiumEntityKey): EntityRef | null {
        return byTypeAndName.get(`${entityType}:${normalize(name)}`) ?? null;
      },
    };
  }, [datasets]);
}
