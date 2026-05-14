import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/shared/firebase/client';
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

export function useCharacterAuth(): UseCharacterAuthResult {
  const [authState, setAuthState] = useState<AuthState>({
    uid: null,
    displayName: null,
    email: null,
    photoURL: null,
    loading: true,
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthState({
        uid: user?.uid ?? null,
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
        photoURL: user?.photoURL ?? null,
        loading: false,
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authState.uid) {
      setCharacters([]);
      return;
    }
    setCharactersLoading(true);
    CharacterRepository.getUserCharacters(authState.uid)
      .then(chars => {
        setCharacters(chars.sort((a, b) => {
          const aTime = a.updatedAt ?? '';
          const bTime = b.updatedAt ?? '';
          return bTime.localeCompare(aTime);
        }));
      })
      .catch(() => {
        setCharacters([]);
      })
      .finally(() => setCharactersLoading(false));
  }, [authState.uid, refreshTick]);

  async function signIn() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function signOutUser() {
    await signOut(auth);
  }

  function refreshCharacters() {
    setRefreshTick(t => t + 1);
  }

  return {
    auth: authState,
    characters,
    charactersLoading,
    signIn,
    signOutUser,
    refreshCharacters,
  };
}
