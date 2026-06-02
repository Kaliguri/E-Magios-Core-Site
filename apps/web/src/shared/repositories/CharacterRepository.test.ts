import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterRepository } from './CharacterRepository';
import type { Character } from '@/entities/character/types';

const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  Timestamp: {
    now: () => 'ts-now',
  },
}));

vi.mock('@/shared/firebase/client', () => ({
  db: { name: 'db' },
}));

describe('CharacterRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes incremented version when saving character', async () => {
    mockDoc.mockReturnValue('character-doc');

    const character = {
      id: 'char-1',
      name: 'Hero',
      version: 5,
    } as unknown as Character;

    await CharacterRepository.saveCharacter('user-1', character);

    expect(mockSetDoc).toHaveBeenCalledWith(
      'character-doc',
      expect.objectContaining({
        version: 6,
        updatedAt: 'ts-now',
      }),
      { merge: true },
    );
  });

  it('reads character list for user', async () => {
    mockCollection.mockReturnValue('characters-collection');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'char-1',
          data: () => ({ name: 'Hero' }),
        },
      ],
    });

    const result = await CharacterRepository.getUserCharacters('user-1');

    expect(mockCollection).toHaveBeenCalledWith({ name: 'db' }, 'users', 'user-1', 'characters');
    expect(result[0]?.id).toBe('char-1');
  });
});
