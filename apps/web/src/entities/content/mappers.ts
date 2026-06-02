import type { NewsItem, ContentManifest } from './types';
import type { DocumentData } from 'firebase/firestore';

export function newsItemFromDto(id: string, data: DocumentData): NewsItem {
  return {
    id,
    date: data['date'] ?? '',
    title: data['title'] ?? '',
    brief: data['brief'] ?? '',
    features: data['features'] ?? [],
    status: data['status'],
    version: data['version'],
    updatedAt: data['updatedAt']?.toDate?.()?.toISOString() ?? null,
    publishedAt: data['publishedAt']?.toDate?.()?.toISOString() ?? null,
  };
}

export function newsItemFromJson(raw: Record<string, unknown>): NewsItem {
  return {
    id: raw['id'] as string,
    date: (raw['date'] as string) ?? '',
    title: (raw['title'] as string) ?? '',
    brief: (raw['brief'] as string) ?? '',
    features: (raw['features'] as string[]) ?? [],
    links: (raw['links'] as NewsItem['links']) ?? [],
    objectGroups: (raw['objectGroups'] as NewsItem['objectGroups']) ?? [],
    stats: (raw['stats'] as NewsItem['stats']) ?? null,
  };
}

export function manifestFromDto(id: string, data: DocumentData): ContentManifest {
  const release = data['release'];
  return {
    environment: id,
    contentRevision: data['contentRevision'] ?? undefined,
    publishedAt: data['publishedAt']?.toDate?.()?.toISOString() ?? null,
    release: release
      ? {
          version: Number(release['version'] ?? 0),
          tag: String(release['tag'] ?? ''),
          changedCollections: Number(release['changedCollections'] ?? 0),
          changedDocs: Number(release['changedDocs'] ?? 0),
          updatedAt: release['updatedAt']?.toDate?.()?.toISOString() ?? null,
        }
      : null,
    collections: data['collections'] ?? {},
  };
}
