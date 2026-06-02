import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { NewsItem, ContentManifest } from '@/entities/content/types';
import { newsItemFromDto, manifestFromDto } from '@/entities/content/mappers';

export const ContentRepository = {
  async getNews(): Promise<NewsItem[]> {
    const col = collection(db, 'news');
    // Filter server-side, sort client-side: avoids requiring a composite
    // Firestore index on (status, date).
    const q = query(col, where('status', '==', 'published'));
    const snap = await getDocs(q);
    // Doc ids are ISO-date-prefixed (`2025-12-10-slug`), so sorting by id
    // descending yields newest-first — matching the legacy news order.
    return snap.docs
      .map((d) => newsItemFromDto(d.id, d.data()))
      .sort((a, b) => String(b.id ?? '').localeCompare(String(a.id ?? '')));
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
