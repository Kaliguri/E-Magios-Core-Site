import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BOOKS, resolveBookLink } from '@/shared/nav/books';
import { MASTER_PASSWORD, PASSWORD_KEY } from '@/shared/config/access';
import {
  useCompendiumOverlay,
  parseEntityRoute,
} from '@/shared/compendium/CompendiumOverlayContext';
import { Button, Input, Modal, Spinner } from '@/shared/ui';
import styles from './BookPage.module.css';

/**
 * Extract the readable content out of a legacy chapter HTML document and rewrite
 * its internal links into SPA targets (data-route / data-anchor) so navigation
 * stays inside the React app instead of triggering full page loads.
 */
function extractMainHtml(raw: string, currentBookKey: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const main = doc.querySelector('main');
  const content = main?.querySelector('.container, .wide-container') ?? main ?? doc.body;

  content
    .querySelectorAll('script, style, link, .sidebar, .page-loader, .scroll-to-top')
    .forEach((el) => el.remove());

  content.querySelectorAll('a[href]').forEach((el) => {
    const anchor = el as HTMLAnchorElement;
    const resolved = resolveBookLink(anchor.getAttribute('href') ?? '', currentBookKey);
    anchor.removeAttribute('data-route');
    anchor.removeAttribute('data-anchor');
    switch (resolved.kind) {
      case 'external':
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        break;
      case 'anchor':
        anchor.setAttribute('href', `#${resolved.anchor}`);
        anchor.setAttribute('data-anchor', resolved.anchor);
        break;
      case 'route':
        anchor.setAttribute('href', `#${resolved.route}`);
        anchor.setAttribute('data-route', resolved.route);
        if (resolved.anchor) anchor.setAttribute('data-anchor', resolved.anchor);
        break;
      case 'ignore':
      default:
        anchor.removeAttribute('href');
        break;
    }
  });

  return content.innerHTML;
}

function scrollToAnchor(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function BookPage() {
  const { bookKey = '', chapterId = '' } = useParams();
  const navigate = useNavigate();
  const overlay = useCompendiumOverlay();
  const [searchParams] = useSearchParams();
  const book = BOOKS[bookKey];
  const chapter = book?.chapters.find((item) => item.id === chapterId);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(() => localStorage.getItem(PASSWORD_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const locked = Boolean(book?.locked && !hasAccess);
  const title = useMemo(() => {
    if (!book || !chapter) return 'Книга';
    return `${book.title}: ${chapter.title}`;
  }, [book, chapter]);

  useEffect(() => {
    if (!chapter || locked) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const currentChapter = chapter;
    const currentBookKey = bookKey;
    async function loadChapter() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${currentChapter.file}`);
        if (!res.ok) throw new Error(`Failed to load ${currentChapter.file}: ${res.status}`);
        const text = await res.text();
        if (!cancelled) setHtml(extractMainHtml(text, currentBookKey));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки главы');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadChapter();
    return () => {
      cancelled = true;
    };
  }, [chapter, locked, bookKey]);

  // Scroll to a deep-linked section once the chapter content has rendered.
  useEffect(() => {
    if (loading || error || !html) return;
    const at = searchParams.get('at');
    if (at) scrollToAnchor(at);
  }, [loading, error, html, searchParams]);

  const handleContentClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const link = (event.target as HTMLElement).closest('a');
      if (!link) return;
      const route = link.getAttribute('data-route');
      const anchor = link.getAttribute('data-anchor');
      if (route) {
        event.preventDefault();
        // A link to a single DB entity opens the shared overlay over the book
        // page instead of navigating away to the DB tab.
        const entityRef = parseEntityRoute(route);
        if (entityRef) {
          overlay.openEntity(entityRef);
          return;
        }
        const at = anchor
          ? `${route.includes('?') ? '&' : '?'}at=${encodeURIComponent(anchor)}`
          : '';
        navigate(`${route}${at}`);
      } else if (anchor) {
        event.preventDefault();
        scrollToAnchor(anchor);
      }
    },
    [navigate, overlay],
  );

  if (!book || !chapter) {
    return <Navigate to="/" replace />;
  }

  function submitPassword() {
    if (password === MASTER_PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, 'true');
      setHasAccess(true);
      setPassword('');
      setPasswordError(false);
      return;
    }
    setPassword('');
    setPasswordError(true);
  }

  return (
    <div className={styles.page}>
      <Modal
        open={locked}
        onClose={() => navigate('/')}
        title={`Защищенный контент: ${book.title}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
            <Button variant="primary" onClick={submitPassword}>
              Войти
            </Button>
          </>
        }
      >
        <p>Эта страница защищена паролем. Введите пароль для доступа:</p>
        <Input
          className={styles.passwordInput}
          type="password"
          placeholder="Введите пароль"
          value={password}
          invalid={passwordError}
          autoFocus
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitPassword();
          }}
        />
        {passwordError && (
          <p className={styles.passwordError}>Неверный пароль. Попробуйте снова.</p>
        )}
      </Modal>

      {!locked && (
        <>
          <h1>{title}</h1>
          {loading && <Spinner label="Загружаем главу..." />}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && (
            <article
              className={styles.content}
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </>
      )}
    </div>
  );
}
