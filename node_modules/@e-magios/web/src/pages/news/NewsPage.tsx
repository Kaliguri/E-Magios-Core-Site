import { useCallback } from 'react';
import { useCompendiumData } from '@/shared/cache/useCompendiumData';
import { ContentRepository } from '@/shared/repositories/ContentRepository';
import type { NewsItem } from '@/entities/content/types';
import styles from './NewsPage.module.css';

export function NewsPage() {
  const fetcher = useCallback(() => ContentRepository.getNews(), []);
  const { data: news, loading, error } = useCompendiumData<NewsItem[]>(
    'news',
    fetcher,
    'news',
  );

  if (loading && !news) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>Загружаем новости...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Новости</h1>
      <div className={styles.list}>
        {news?.map(item => (
          <article key={item.id} className={styles.item}>
            <div className={styles.meta}>
              <span className={styles.date}>{item.date}</span>
            </div>
            <h2 className={styles.title}>{item.title}</h2>
            <p className={styles.brief}>{item.brief}</p>
            {item.features.length > 0 && (
              <ul className={styles.features}>
                {item.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
