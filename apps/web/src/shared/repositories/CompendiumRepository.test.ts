import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompendiumRepository } from './CompendiumRepository';

const mockCollection = vi.fn();
const mockWhere = vi.fn();
const mockQuery = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

vi.mock('@/shared/firebase/client', () => ({
  db: { name: 'db' },
}));

describe('CompendiumRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads published spells only', async () => {
    mockCollection.mockReturnValue('spells-ref');
    mockWhere.mockReturnValue('where-published');
    mockQuery.mockReturnValue('spells-query');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'spell-id',
          data: () => ({ id: 'spell-id', name: 'Spell', description: 'Desc', school: 'Fire' }),
        },
      ],
    });

    const result = await CompendiumRepository.getSpells();

    expect(mockCollection).toHaveBeenCalledWith({ name: 'db' }, 'spells');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'published');
    expect(mockGetDocs).toHaveBeenCalledWith('spells-query');
    expect(result[0]?.id).toBe('spell-id');
  });
});
