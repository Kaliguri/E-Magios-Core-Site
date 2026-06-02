import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className = '', children, ...props },
  ref,
) {
  const cls = [styles.field, styles.select, invalid ? styles.invalid : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <select ref={ref} className={cls} {...props}>
      {children}
    </select>
  );
});
