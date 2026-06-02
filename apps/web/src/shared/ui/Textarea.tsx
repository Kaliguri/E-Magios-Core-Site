import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className = '', ...props },
  ref,
) {
  const cls = [styles.field, styles.textarea, invalid ? styles.invalid : '', className]
    .filter(Boolean)
    .join(' ');
  return <textarea ref={ref} className={cls} {...props} />;
});
