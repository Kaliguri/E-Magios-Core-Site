import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem<K extends string = string> {
  key: K;
  label: ReactNode;
}

interface TabsProps<K extends string> {
  items: ReadonlyArray<TabItem<K>>;
  active: K;
  onChange: (key: K) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs<K extends string>({
  items,
  active,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<K>) {
  return (
    <div
      className={[styles.tabs, styles[variant], className].filter(Boolean).join(' ')}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={[styles.tab, active === item.key ? styles.active : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
