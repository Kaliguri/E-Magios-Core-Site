import { NavLink } from 'react-router-dom';
import { BOOKS, type Book } from '@/shared/nav/books';
import styles from './HomePage.module.css';

const TOOL_CARDS = [
  {
    to: '/character-editor',
    icon: '⚔️',
    title: 'Редактор Персонажей',
    text: 'Создай, сохрани и развивай своего персонажа',
  },
  {
    to: '/db',
    icon: '📚',
    title: 'База Данных',
    text: 'Заклинания, школы магии, эффекты и навыки',
  },
  {
    to: '/dashboard',
    icon: '📈',
    title: 'Дашборд',
    text: 'Метрики контента и аналитика бросков кубов',
  },
];

const SECTION_CARDS = [
  { to: '/news', icon: '📰', title: 'Новости', text: 'Последние обновления системы' },
  {
    to: '/profile',
    icon: '👤',
    title: 'Профиль',
    text: 'Вход через Google, настройки и интеграции',
  },
];

const BOOK_KEYS = Object.keys(BOOKS);

function BookCard({ bookKey }: { bookKey: string }) {
  const book = BOOKS[bookKey] as Book;
  const firstChapter = book.chapters[0];
  if (!firstChapter) return null;
  return (
    <NavLink to={`/${bookKey}/${firstChapter.id}`} className={styles.card}>
      <span className={styles.cardIcon}>{book.locked ? '🔒' : '📖'}</span>
      <h3>{book.title}</h3>
      <p>
        {book.chapters.length} {book.chapters.length === 1 ? 'глава' : 'глав'}
        {book.locked ? ' · защищено паролем' : ''}
      </p>
    </NavLink>
  );
}

function Cards({ cards }: { cards: typeof TOOL_CARDS }) {
  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <NavLink key={card.to} to={card.to} className={styles.card}>
          <span className={styles.cardIcon}>{card.icon}</span>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </NavLink>
      ))}
    </div>
  );
}

export function HomePage() {
  const availableBooks = BOOK_KEYS.filter((k) => !(BOOKS[k] as Book).locked);
  const protectedBooks = BOOK_KEYS.filter((k) => (BOOKS[k] as Book).locked);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>E'Magios Core</h1>
        <p>Настольная ролевая система магии и приключений</p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Инструменты</h2>
        <Cards cards={TOOL_CARDS} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Разделы</h2>
        <Cards cards={SECTION_CARDS} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Книги правил</h2>
        <h3 className={styles.subTitle}>Доступные</h3>
        <div className={styles.cards}>
          {availableBooks.map((key) => (
            <BookCard key={key} bookKey={key} />
          ))}
        </div>
        {protectedBooks.length > 0 && (
          <>
            <h3 className={styles.subTitle}>На тестировании 🔒</h3>
            <div className={styles.cards}>
              {protectedBooks.map((key) => (
                <BookCard key={key} bookKey={key} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
