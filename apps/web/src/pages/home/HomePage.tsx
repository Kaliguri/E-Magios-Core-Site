import { NavLink } from 'react-router-dom';
import { BOOKS, type Book } from '@/shared/nav/books';
import styles from './HomePage.module.css';

const PRIMARY_CARDS = [
  {
    to: '/db',
    icon: '📚',
    title: 'База Данных',
    text: 'Заклинания, школы магии, эффекты и навыки',
  },
  {
    to: '/character-editor',
    icon: '⚔️',
    title: 'Редактор Персонажей',
    text: 'Создай, сохрани и развивай своего персонажа',
  },
  { to: '/news', icon: '📰', title: 'Новости', text: 'Последние обновления системы' },
  {
    to: '/dashboard',
    icon: '📈',
    title: 'Дашборд',
    text: 'Метрики контента и аналитика бросков кубов',
  },
  {
    to: '/profile',
    icon: '👤',
    title: 'Профиль',
    text: 'Вход через Google, настройки и интеграции',
  },
];

const BOOK_KEYS = Object.keys(BOOKS);

export function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>E'Magios Core</h1>
        <p>Настольная ролевая система магии и приключений</p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Разделы</h2>
        <div className={styles.cards}>
          {PRIMARY_CARDS.map((card) => (
            <NavLink key={card.to} to={card.to} className={styles.card}>
              <span className={styles.cardIcon}>{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </NavLink>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Книги правил</h2>
        <div className={styles.cards}>
          {BOOK_KEYS.map((key) => {
            const book = BOOKS[key] as Book;
            const firstChapter = book.chapters[0];
            if (!firstChapter) return null;
            return (
              <NavLink key={key} to={`/${key}/${firstChapter.id}`} className={styles.card}>
                <span className={styles.cardIcon}>{book.locked ? '🔒' : '📖'}</span>
                <h3>{book.title}</h3>
                <p>
                  {book.chapters.length} {book.chapters.length === 1 ? 'глава' : 'глав'}
                  {book.locked ? ' · защищено паролем' : ''}
                </p>
              </NavLink>
            );
          })}
        </div>
      </section>
    </div>
  );
}
