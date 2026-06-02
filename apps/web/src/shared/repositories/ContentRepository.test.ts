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

  it('reads only published news and sorts newest-first by id (no composite index)', async () => {
    mockCollection.mockReturnValue('news-collection-ref');
    mockWhere.mockReturnValue('where-status-published');
    mockQuery.mockReturnValue('news-query');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: '2025-11-28-old',
          data: () => ({ title: 'Old', date: '28 ноября 2025', status: 'published' }),
        },
        {
          id: '2025-12-10-new',
          data: () => ({ title: 'New', date: '10 декабря 2025', status: 'published' }),
        },
      ],
    });

    const result = await ContentRepository.getNews();

    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'published');
    // No orderBy → no composite index requirement.
    expect(mockOrderBy).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith('news-collection-ref', 'where-status-published');
    // id-descending puts the newer ISO-prefixed id first.
    expect(result.map((n) => n.id)).toEqual(['2025-12-10-new', '2025-11-28-old']);
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
