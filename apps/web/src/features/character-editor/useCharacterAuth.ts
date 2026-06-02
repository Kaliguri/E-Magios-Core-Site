import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { CharacterRepository } from '@/shared/repositories/CharacterRepository';
import type { Character } from '@/entities/character/types';

export interface AuthState {
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  loading: boolean;
}

interface UseCharacterAuthResult {
  auth: AuthState;
  characters: Character[];
  charactersLoading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshCharacters: () => void;
}

/**
 * Character-ownership view over the shared auth context: exposes the current
 * user plus that user's saved characters (loaded from Firestore).
 */
export function useCharacterAuth(): UseCharacterAuthResult {
  const { uid, displayName, email, photoURL, loading, signIn, signOutUser } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!uid) {
      setCharacters([]);
      return;
    }
    setCharactersLoading(true);
    CharacterRepository.getUserCharacters(uid)
      .then((chars) => {
        setCharacters(
          chars.sort((a, b) => {
            const aTime = a.updatedAt ?? '';
            const bTime = b.updatedAt ?? '';
            return bTime.localeCompare(aTime);
          }),
        );
      })
      .catch(() => {
        setCharacters([]);
      })
      .finally(() => setCharactersLoading(false));
  }, [uid, refreshTick]);

  return {
    auth: { uid, displayName, email, photoURL, loading },
    characters,
    charactersLoading,
    signIn,
    signOutUser,
    refreshCharacters: () => setRefreshTick((t) => t + 1),
  };
}
