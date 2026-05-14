import { useEffect, useState, useCallback } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';

const DB_MODAL_HISTORY_KEY = 'react_db_modal_history';

interface ModalEntry {
  entity: CompendiumEntity;
  entityType: string;
}

interface UseDetailModalResult {
  isOpen: boolean;
  current: ModalEntry | null;
  canGoBack: boolean;
  canGoForward: boolean;
  open: (entity: CompendiumEntity, entityType: string) => void;
  close: () => void;
  goBack: () => void;
  goForward: () => void;
}

export function useDetailModal(): UseDetailModalResult {
  const [history, setHistory] = useState<ModalEntry[]>(() => {
    try {
      const raw = sessionStorage.getItem(DB_MODAL_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { history?: ModalEntry[] };
      return Array.isArray(parsed.history) ? parsed.history : [];
    } catch {
      return [];
    }
  });
  const [index, setIndex] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DB_MODAL_HISTORY_KEY);
      if (!raw) return -1;
      const parsed = JSON.parse(raw) as { index?: number };
      return typeof parsed.index === 'number' ? parsed.index : -1;
    } catch {
      return -1;
    }
  });
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DB_MODAL_HISTORY_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { isOpen?: boolean };
      return Boolean(parsed.isOpen);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(DB_MODAL_HISTORY_KEY, JSON.stringify({ history, index, isOpen }));
    } catch {
      // Session persistence is a convenience; modal state can stay in memory.
    }
  }, [history, index, isOpen]);

  const open = useCallback((entity: CompendiumEntity, entityType: string) => {
    setHistory(prev => {
      const next = prev.slice(0, index + 1);
      return [...next, { entity, entityType }];
    });
    setIndex(prev => prev + 1);
    setIsOpen(true);
  }, [index]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goForward = useCallback(() => {
    setHistory(prev => {
      setIndex(i => Math.min(prev.length - 1, i + 1));
      return prev;
    });
  }, []);

  const current = index >= 0 && index < history.length ? history[index] : null;

  return {
    isOpen,
    current,
    canGoBack: index > 0,
    canGoForward: index < history.length - 1,
    open,
    close,
    goBack,
    goForward,
  };
}
