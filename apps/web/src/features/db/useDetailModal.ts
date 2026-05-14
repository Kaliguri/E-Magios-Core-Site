import { useState, useCallback } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';

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
  const [history, setHistory] = useState<ModalEntry[]>([]);
  const [index, setIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

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
