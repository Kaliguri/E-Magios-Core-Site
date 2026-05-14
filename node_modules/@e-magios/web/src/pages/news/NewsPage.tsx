import { useCallback } from 'react';
import { useCompendiumData } from '@/shared/cache/useCompendiumData';
import { ContentRepository } from '@/shared/repositories/ContentRepository';
import { LegacyText } from '@/shared/ui/LegacyText';
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
        {news?.map((item, index) => (
          <article key={item.id} className={styles.item}>
            <details className={styles.details} open={index === 0}>
              <summary className={styles.summary}>
                <span className={styles.summaryTop}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.date}>{item.date}</span>
                  <span className={styles.toggle}>▾</span>
                </span>
                <LegacyText text={item.brief} className={styles.brief} />
              </summary>
              {item.features.length > 0 && (
                <div className={styles.body}>
                  <section className={styles.section}>
                    <h3>Что изменилось</h3>
                    <ul className={styles.features}>
                      {item.features.map((f, i) => (
                        <li key={i}><LegacyText text={f} /></li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
