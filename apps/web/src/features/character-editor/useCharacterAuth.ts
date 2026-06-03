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
function sortByUpdated(chars: Character[]): Character[] {
  return [...chars].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

export function useCharacterAuth(): UseCharacterAuthResult {
  const { uid, displayName, email, photoURL, loading, signIn, signOutUser } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);

  // Live subscription so the list reflects saves from this or other tabs/devices.
  useEffect(() => {
    if (!uid) {
      setCharacters([]);
      setCharactersLoading(false);
      return;
    }
    setCharactersLoading(true);
    const unsubscribe = CharacterRepository.subscribeUserCharacters(
      uid,
      (chars) => {
        setCharacters(sortByUpdated(chars));
        setCharactersLoading(false);
      },
      () => {
        setCharacters([]);
        setCharactersLoading(false);
      },
    );
    return unsubscribe;
  }, [uid]);

  return {
    auth: { uid, displayName, email, photoURL, loading },
    characters,
    charactersLoading,
    signIn,
    signOutUser,
    // With a live subscription the list refreshes itself; kept for API stability.
    refreshCharacters: () => {},
  };
}
