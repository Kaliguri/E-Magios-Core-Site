import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BOOKS, type Book } from '@/shared/nav/books';
import { useAuth } from '@/features/auth';
import styles from './Sidebar.module.css';

const BOOK_KEYS: string[] = Object.keys(BOOKS);

interface ToolLink {
  id: string;
  label: string;
  path: string;
  icon: string;
  /** Minimum access level required to see this entry. */
  access?: 'editor';
}

const TOOLS: ToolLink[] = [
  { id: 'character-editor', label: 'Редактор Персонажей', path: '/character-editor', icon: '⚔️' },
  { id: 'db', label: 'База Данных', path: '/db', icon: '📚' },
  { id: 'dashboard', label: 'Дашборд', path: '/dashboard', icon: '📈' },
  { id: 'ops', label: 'Ops Метрики', path: '/ops', icon: '📊', access: 'editor' },
];

export function Sidebar() {
  const location = useLocation();
  const { uid, displayName, email, photoURL, role, isEditor, loading, signIn, signOutUser } =
    useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    BOOK_KEYS.forEach((k) => {
      init[k] = false;
    });
    return init;
  });

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const visibleTools = TOOLS.filter((tool) => tool.access !== 'editor' || isEditor);

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <NavLink to="/" className={styles.logoLink}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>E'Magios Core</span>
        </NavLink>
      </div>

      <div className={styles.section}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
        >
          📄 Главная
        </NavLink>
        <NavLink
          to="/news"
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
        >
          📰 Новости
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
        >
          👤 Профиль
        </NavLink>
      </div>

      <div className={styles.sectionLabel}>Книги</div>
      {BOOK_KEYS.map((key) => {
        const book = BOOKS[key] as Book;
        const isCurrentBook = location.pathname.startsWith(`/${key}/`);
        const isOpen = isCurrentBook || (expanded[key] ?? false);
        return (
          <div
            key={key}
            className={[styles.bookGroup, isCurrentBook ? styles.bookActive : ''].join(' ')}
          >
            <button
              className={styles.bookToggle}
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
            >
              <span className={styles.bookTitle}>
                {book.title}
                {book.locked ? ' 🔒' : ''}
              </span>
              <span className={[styles.arrow, isOpen ? styles.arrowOpen : ''].join(' ')}>▶</span>
            </button>
            {isOpen && (
              <div className={styles.chapters}>
                {book.chapters.map((ch) => {
                  const path = `/${key}/${ch.id}`;
                  const isActive = location.pathname === path;
                  return (
                    <NavLink
                      key={ch.id}
                      to={path}
                      className={[styles.chapterLink, isActive ? styles.active : ''].join(' ')}
                    >
                      {ch.title}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.sectionLabel}>Инструменты</div>
      {visibleTools.map((tool) => (
        <NavLink
          key={tool.id}
          to={tool.path}
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
        >
          {tool.icon} {tool.label}
        </NavLink>
      ))}

      <div className={styles.account}>
        {loading ? (
          <span className={styles.accountHint}>Проверка входа...</span>
        ) : uid ? (
          <div className={styles.accountUser}>
            <div className={styles.accountAvatar}>
              {photoURL ? <img src={photoURL} alt="" /> : '👤'}
            </div>
            <div className={styles.accountInfo}>
              <span className={styles.accountName}>{displayName ?? email ?? 'Аккаунт'}</span>
              {role && <span className={styles.accountRole}>{role}</span>}
            </div>
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => void signOutUser()}
              title="Выйти из аккаунта"
            >
              Выйти
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={[styles.accountButton, styles.accountSignIn].join(' ')}
            onClick={() => void signIn()}
          >
            Войти через Google
          </button>
        )}
      </div>
    </nav>
  );
}
