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
    date: raw['date'] as string ?? '',
    title: raw['title'] as string ?? '',
    brief: raw['brief'] as string ?? '',
    features: raw['features'] as string[] ?? [],
  };
}

export function manifestFromDto(id: string, data: DocumentData): ContentManifest {
  return {
    environment: id,
    publishedAt: data['publishedAt']?.toDate?.()?.toISOString() ?? null,
    collections: data['collections'] ?? {},
  };
}
