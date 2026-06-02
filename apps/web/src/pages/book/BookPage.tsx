import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BOOKS } from '@/shared/nav/books';
import { MASTER_PASSWORD, PASSWORD_KEY } from '@/shared/config/access';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import styles from './BookPage.module.css';

function extractMainHtml(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const main = doc.querySelector('main');
  const content = main?.querySelector('.container, .wide-container') ?? main ?? doc.body;

  content
    .querySelectorAll('script, style, .sidebar, .page-loader, .scroll-to-top')
    .forEach((el) => el.remove());
  return content.innerHTML;
}

export function BookPage() {
  const { bookKey = '', chapterId = '' } = useParams();
  const navigate = useNavigate();
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
    async function loadChapter() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${currentChapter.file}`);
        if (!res.ok) throw new Error(`Failed to load ${currentChapter.file}: ${res.status}`);
        const text = await res.text();
        if (!cancelled) setHtml(extractMainHtml(text));
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
  }, [chapter, locked]);

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
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="Введите пароль"
          value={password}
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
          {loading && <div className={styles.loader}>Загружаем главу...</div>}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && (
            <article className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </>
      )}
    </div>
  );
}
