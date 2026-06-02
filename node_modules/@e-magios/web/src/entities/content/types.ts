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

export interface ContentManifestRelease {
  version: number;
  tag: string;
  changedCollections: number;
  changedDocs: number;
  updatedAt: string | null;
}

export interface ContentManifest {
  environment: string;
  contentRevision?: number;
  publishedAt: string | null;
  release?: ContentManifestRelease | null;
  collections: Record<string, ContentManifestCollection>;
}
