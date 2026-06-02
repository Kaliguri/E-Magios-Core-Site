import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({
  title,
  actions,
  footer,
  padded = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const cls = [styles.card, className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...props}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <div className={styles.title}>{title}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={padded ? styles.body : undefined}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
