import { useState, useEffect, useCallback } from 'react';
import { getCached, setCached, getCachedVersion } from './idb';
import { ContentRepository } from '@/shared/repositories/ContentRepository';
import { logTelemetry } from '@/shared/telemetry/clientTelemetry';

interface UseCompendiumDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Treats an empty payload (empty array / empty object) as a cache miss so a
 * stale empty entry — e.g. cached while the source data was still in `draft` —
 * can never short-circuit the network refetch and strand the UI on "nothing
 * found" after the data is published.
 */
function isEmptyData(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data as object).length === 0;
  return false;
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

  const reload = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const startedAt = performance.now();
      setLoading(true);
      setError(null);

      // 1. Serve from IndexedDB immediately (skip empty payloads so we show a
      //    spinner rather than a premature "nothing found" while we refetch)
      const cached = await getCached<T>(cacheKey);
      if (cached && !isEmptyData(cached.data) && !cancelled) {
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

      // 3. If cached version matches manifest, skip network fetch.
      //    Empty cached payloads are never trusted (see isEmptyData) — they
      //    always fall through to a fresh fetch.
      if (
        cached &&
        !isEmptyData(cached.data) &&
        manifestVersion !== null &&
        cachedVersion !== null &&
        cachedVersion >= manifestVersion
      ) {
        void logTelemetry({
          eventName: 'cache_hit',
          route: cacheKey,
          payload: { manifestVersion, cachedVersion },
        });
        if (!cancelled) setLoading(false);
        return;
      }

      // 4. Fetch fresh data
      try {
        const fresh = await fetcher();
        const elapsedMs = Math.round(performance.now() - startedAt);
        if (!cancelled) {
          setData(fresh);
          await setCached(cacheKey, fresh, manifestVersion ?? (cachedVersion ?? 0) + 1);
        }
        void logTelemetry({
          eventName: 'data_fetch_success',
          route: cacheKey,
          payload: { elapsedMs, hasManifestVersion: manifestVersion !== null },
        });
      } catch (err) {
        const elapsedMs = Math.round(performance.now() - startedAt);
        if (!cancelled) {
          if (!cached) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
          }
        }
        void logTelemetry({
          eventName: 'data_fetch_error',
          level: 'error',
          route: cacheKey,
          message: err instanceof Error ? err.message : 'Unknown fetch error',
          payload: { elapsedMs, hadCachedData: Boolean(cached) },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, fetcher, manifestCollectionKey, rev]);

  return { data, loading, error, reload };
}
