import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ label, size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} role="status">
      <span className={[styles.spinner, styles[size]].join(' ')} aria-hidden />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
