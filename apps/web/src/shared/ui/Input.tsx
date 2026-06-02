import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = '', ...props },
  ref,
) {
  const cls = [styles.field, invalid ? styles.invalid : '', className].filter(Boolean).join(' ');
  return <input ref={ref} className={cls} {...props} />;
});
