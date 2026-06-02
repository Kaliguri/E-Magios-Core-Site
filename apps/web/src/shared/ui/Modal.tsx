import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

type ModalSize = 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** md = 600px, lg = 900px, xl = 1040px (legacy spell-popup width). */
  size?: ModalSize;
  /** @deprecated use size="lg" */
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, footer, size, wide = false }: ModalProps) {
  const resolvedSize: ModalSize = size ?? (wide ? 'lg' : 'md');
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal>
      <div
        className={[styles.dialog, styles[resolvedSize]].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.close} onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
