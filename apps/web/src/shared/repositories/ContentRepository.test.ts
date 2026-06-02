import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentRepository } from './ContentRepository';

const mockCollection = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockQuery = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock('@/shared/firebase/client', () => ({
  db: { name: 'db' },
}));

describe('ContentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads news from the static bundled asset (no Firestore / index needed)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: '2025-12-10-new',
          date: '10 декабря 2025',
          title: 'New',
          brief: 'b',
          features: ['f'],
        },
        { id: '2025-11-28-old', date: '28 ноября 2025', title: 'Old', brief: 'b', features: [] },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await ContentRepository.getNews();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('data/news.json'), {
      cache: 'no-store',
    });
    // No Firestore query path is used for news anymore.
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result.map((n) => n.id)).toEqual(['2025-12-10-new', '2025-11-28-old']);
    expect(result[0].features).toEqual(['f']);

    vi.unstubAllGlobals();
  });

  it('returns null manifest when manifest doc is absent', async () => {
    mockDoc.mockReturnValue('manifest-ref');
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await ContentRepository.getManifest('production');

    expect(mockDoc).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
