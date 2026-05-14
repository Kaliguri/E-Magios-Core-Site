import { NavLink } from 'react-router-dom';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>E'Magios Core</h1>
        <p>Настольная ролевая система магии и приключений</p>
      </div>

      <div className={styles.cards}>
        <NavLink to="/news" className={styles.card}>
          <span className={styles.cardIcon}>📰</span>
          <h3>Новости</h3>
          <p>Последние обновления системы</p>
        </NavLink>
        <NavLink to="/db" className={styles.card}>
          <span className={styles.cardIcon}>📚</span>
          <h3>База Данных</h3>
          <p>Заклинания, школы магии, эффекты и навыки</p>
        </NavLink>
        <NavLink to="/character-editor" className={styles.card}>
          <span className={styles.cardIcon}>⚔️</span>
          <h3>Редактор Персонажей</h3>
          <p>Создай и сохрани своего персонажа</p>
        </NavLink>
      </div>
    </div>
  );
}
