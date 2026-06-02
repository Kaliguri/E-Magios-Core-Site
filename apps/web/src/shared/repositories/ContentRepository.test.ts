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

  it('reads only published news sorted by date', async () => {
    mockCollection.mockReturnValue('news-collection-ref');
    mockWhere.mockReturnValue('where-status-published');
    mockOrderBy.mockReturnValue('order-by-date-desc');
    mockQuery.mockReturnValue('news-query');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'n1',
          data: () => ({
            title: 'News',
            date: '2026-06-02',
            brief: 'Brief',
            features: ['Feature'],
            status: 'published',
          }),
        },
      ],
    });

    const result = await ContentRepository.getNews();

    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'published');
    expect(mockOrderBy).toHaveBeenCalledWith('date', 'desc');
    expect(mockQuery).toHaveBeenCalledWith(
      'news-collection-ref',
      'where-status-published',
      'order-by-date-desc',
    );
    expect(result[0]?.id).toBe('n1');
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
