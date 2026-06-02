import { useEffect, useState, useCallback } from 'react';
import type { EntityRef } from './useCompendiumIndex';

const DB_MODAL_HISTORY_KEY = 'react_db_modal_history';

interface UseDetailModalResult {
  isOpen: boolean;
  current: EntityRef | null;
  canGoBack: boolean;
  canGoForward: boolean;
  open: (ref: EntityRef) => void;
  close: () => void;
  goBack: () => void;
  goForward: () => void;
}

export function useDetailModal(): UseDetailModalResult {
  const [history, setHistory] = useState<EntityRef[]>(() => {
    try {
      const raw = sessionStorage.getItem(DB_MODAL_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { history?: EntityRef[] };
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

  const open = useCallback(
    (ref: EntityRef) => {
      setHistory((prev) => {
        const next = prev.slice(0, index + 1);
        const latest = next[next.length - 1];
        if (latest?.entityType === ref.entityType && latest.id === ref.id) {
          return next;
        }
        return [...next, ref];
      });
      setIndex((prev) => {
        const latest = history[Math.max(0, prev)];
        if (latest?.entityType === ref.entityType && latest.id === ref.id) {
          return prev;
        }
        return prev + 1;
      });
      setIsOpen(true);
    },
    [history, index],
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goForward = useCallback(() => {
    setHistory((prev) => {
      setIndex((i) => Math.min(prev.length - 1, i + 1));
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
