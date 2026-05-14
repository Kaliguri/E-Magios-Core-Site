export interface NewsItem {
  id: string;
  date: string;
  title: string;
  brief: string;
  features: string[];
  status?: string;
  version?: number;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

export interface ContentManifestCollection {
  version: number;
  updatedAt: string | null;
}

export interface ContentManifest {
  environment: string;
  publishedAt: string | null;
  collections: Record<string, ContentManifestCollection>;
}
