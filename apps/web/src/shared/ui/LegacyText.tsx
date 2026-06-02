import type { MouseEventHandler } from 'react';

interface LegacyTextProps {
  text: string;
  className?: string;
  block?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
}

export function renderLegacyTextHtml(text: string, block = false): string {
  const normalized = text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  if (!block) return normalized.replace(/\n/g, '<br>');

  return normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${part.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function LegacyText({ text, className, block = false, onClick }: LegacyTextProps) {
  const Component = block ? 'div' : 'span';
  return (
    <Component
      className={className}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: renderLegacyTextHtml(text, block) }}
    />
  );
}
