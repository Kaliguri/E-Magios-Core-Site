import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { Character } from '@/entities/character/types';

function characterFromDto(id: string, data: Record<string, unknown>): Character {
  return {
    ...(data as unknown as Character),
    id,
    updatedAt: (data['updatedAt'] as Timestamp | null)?.toDate?.()?.toISOString() ?? null,
  };
}

export const CharacterRepository = {
  async getUserCharacters(uid: string): Promise<Character[]> {
    const col = collection(db, 'users', uid, 'characters');
    const snap = await getDocs(col);
    return snap.docs.map((d) => characterFromDto(d.id, d.data() as Record<string, unknown>));
  },

  async saveCharacter(uid: string, character: Character): Promise<void> {
    const ref = doc(db, 'users', uid, 'characters', character.id);
    const { id: _id, ...data } = character;
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: Timestamp.now(),
        version: (character.version ?? 0) + 1,
      },
      { merge: true },
    );
  },

  async deleteCharacter(uid: string, characterId: string): Promise<void> {
    const ref = doc(db, 'users', uid, 'characters', characterId);
    await deleteDoc(ref);
  },
};
