import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'emerald' | 'blue' | 'purple' | 'danger' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  const cls = [styles.badge, styles[tone], className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}
