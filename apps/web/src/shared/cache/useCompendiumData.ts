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

      // #region agent log
      fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H2,H3',location:'src/shared/cache/useCompendiumData.ts:31',message:'Data load started',data:{cacheKey,manifestCollectionKey},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      // 1. Serve from IndexedDB immediately
      const cached = await getCached<T>(cacheKey);
      if (cached && !cancelled) {
        // #region agent log
        fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H3',location:'src/shared/cache/useCompendiumData.ts:38',message:'Cached data used',data:{cacheKey,hasData:Boolean(cached.data),cachedVersion:cached.version},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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

      // #region agent log
      fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H2,H3',location:'src/shared/cache/useCompendiumData.ts:57',message:'Manifest and cache versions resolved',data:{cacheKey,manifestCollectionKey,manifestVersion,cachedVersion},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H2',location:'src/shared/cache/useCompendiumData.ts:77',message:'Fresh data fetched',data:{cacheKey,itemCount:Array.isArray(fresh) ? fresh.length : null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!cancelled) {
          setData(fresh);
          await setCached(cacheKey, fresh, manifestVersion ?? (cachedVersion ?? 0) + 1);
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H2',location:'src/shared/cache/useCompendiumData.ts:85',message:'Fresh data fetch failed',data:{cacheKey,error:err instanceof Error ? err.message : String(err),hadCachedData:Boolean(cached)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
