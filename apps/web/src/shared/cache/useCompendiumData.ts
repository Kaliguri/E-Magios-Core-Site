import { useState, useEffect, useCallback } from 'react';
import { getCached, setCached, getCachedVersion } from './idb';
import { ContentRepository } from '@/shared/repositories/ContentRepository';

interface UseCompendiumDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCompendiumData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  manifestCollectionKey?: string,
): UseCompendiumDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  const reload = useCallback(() => setRev(r => r + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // 1. Serve from IndexedDB immediately
      const cached = await getCached<T>(cacheKey);
      if (cached && !cancelled) {
        setData(cached.data);
        setLoading(false);
      }

      // 2. Check manifest for version
      let manifestVersion: number | null = null;
      if (manifestCollectionKey) {
        try {
          const manifest = await ContentRepository.getManifest();
          if (manifest) {
            manifestVersion = manifest.collections[manifestCollectionKey]?.version ?? null;
          }
        } catch {
          // manifest unavailable — rely on cached or fresh fetch
        }
      }

      const cachedVersion = await getCachedVersion(cacheKey);

      // 3. If cached version matches manifest, skip network fetch
      if (
        cached &&
        manifestVersion !== null &&
        cachedVersion !== null &&
        cachedVersion >= manifestVersion
      ) {
        if (!cancelled) setLoading(false);
        return;
      }

      // 4. Fetch fresh data
      try {
        const fresh = await fetcher();
        if (!cancelled) {
          setData(fresh);
          await setCached(cacheKey, fresh, manifestVersion ?? (cachedVersion ?? 0) + 1);
        }
      } catch (err) {
        if (!cancelled) {
          if (!cached) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
          }
          // If we had cached data, keep it and silently fail
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [cacheKey, fetcher, manifestCollectionKey, rev]);

  return { data, loading, error, reload };
}
