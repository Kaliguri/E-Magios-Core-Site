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
      // #region agent log
      fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H4',location:'src/features/character-editor/useCharacterAuth.ts:40',message:'Auth state changed',data:{hasUser:Boolean(user),uidPresent:Boolean(user?.uid),emailPresent:Boolean(user?.email)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H4',location:'src/features/character-editor/useCharacterAuth.ts:61',message:'User characters loaded',data:{uidPresent:Boolean(authState.uid),characterCount:chars.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setCharacters(chars.sort((a, b) => {
          const aTime = a.updatedAt ?? '';
          const bTime = b.updatedAt ?? '';
          return bTime.localeCompare(aTime);
        }));
      })
      .catch(err => {
        // #region agent log
        fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H4',location:'src/features/character-editor/useCharacterAuth.ts:72',message:'User characters failed to load',data:{uidPresent:Boolean(authState.uid),error:err instanceof Error ? err.message : String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
