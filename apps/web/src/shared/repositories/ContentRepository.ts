import { collection, doc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { NewsItem, ContentManifest } from '@/entities/content/types';
import { newsItemFromDto, manifestFromDto } from '@/entities/content/mappers';

export const ContentRepository = {
  async getNews(): Promise<NewsItem[]> {
    const col = collection(db, 'news');
    const q = query(col, where('status', '==', 'published'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => newsItemFromDto(d.id, d.data()));
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
