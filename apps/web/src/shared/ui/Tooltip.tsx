import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight CSS-only tooltip. Wraps children and shows `content` on hover/focus.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(' ')} tabIndex={0}>
      {children}
      <span className={styles.bubble} role="tooltip">
        {content}
      </span>
    </span>
  );
}
