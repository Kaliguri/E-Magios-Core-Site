import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { NewsItem, ContentManifest } from '@/entities/content/types';
import { newsItemFromDto, newsItemFromJson, manifestFromDto } from '@/entities/content/mappers';

const BASE_URL = import.meta.env.BASE_URL;

export const ContentRepository = {
  async getNews(): Promise<NewsItem[]> {
    try {
      const col = collection(db, 'news');
      const q = query(col, where('status', '==', 'published'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => newsItemFromDto(d.id, d.data()));
    } catch {
      const url = `${BASE_URL}data/news.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch news.json: ${res.status}`);
      const json = await res.json() as Record<string, unknown>[];
      return json.map(newsItemFromJson);
    }
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
