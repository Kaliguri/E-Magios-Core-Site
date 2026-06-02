import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { NewsItem, ContentManifest } from '@/entities/content/types';
import { newsItemFromJson, manifestFromDto } from '@/entities/content/mappers';

export const ContentRepository = {
  async getNews(): Promise<NewsItem[]> {
    // News is static, slow-changing content — served as a bundled asset
    // (like the books), so it deploys with the site and needs no Firestore
    // index or re-import. File is the full changelog, newest-first.
    const res = await fetch(`${import.meta.env.BASE_URL}data/news.json`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Не удалось загрузить новости (${res.status})`);
    }
    const raw = (await res.json()) as Array<Record<string, unknown>>;
    return Array.isArray(raw) ? raw.map((item) => newsItemFromJson(item)) : [];
  },

  async getManifest(environment = 'production'): Promise<ContentManifest | null> {
    try {
      const ref = doc(db, 'contentManifest', environment);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return manifestFromDto(snap.id, snap.data());
    } catch {
      return null;
    }
  },
};
