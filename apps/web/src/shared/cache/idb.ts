import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'emagios-cache';
const DB_VERSION = 1;
const STORE_DATA = 'data';
const STORE_META = 'meta';

interface CacheEntry<T> {
  data: T;
  version: number;
  cachedAt: number;
}

interface MetaEntry {
  key: string;
  version: number;
  cachedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_DATA)) {
          database.createObjectStore(STORE_DATA);
        }
        if (!database.objectStoreNames.contains(STORE_META)) {
          database.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}

export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const database = await getDb();
    const entry = await database.get(STORE_DATA, key) as CacheEntry<T> | undefined;
    return entry ?? null;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, version: number): Promise<void> {
  try {
    const database = await getDb();
    const entry: CacheEntry<T> = { data, version, cachedAt: Date.now() };
    const meta: MetaEntry = { key, version, cachedAt: Date.now() };
    const tx = database.transaction([STORE_DATA, STORE_META], 'readwrite');
    await tx.objectStore(STORE_DATA).put(entry, key);
    await tx.objectStore(STORE_META).put(meta, key);
    await tx.done;
  } catch {
    // cache write failure is non-fatal
  }
}

export async function getCachedVersion(key: string): Promise<number | null> {
  try {
    const database = await getDb();
    const meta = await database.get(STORE_META, key) as MetaEntry | undefined;
    return meta?.version ?? null;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const database = await getDb();
    const tx = database.transaction([STORE_DATA, STORE_META], 'readwrite');
    await tx.objectStore(STORE_DATA).clear();
    await tx.objectStore(STORE_META).clear();
    await tx.done;
  } catch {
    // ignore
  }
}
