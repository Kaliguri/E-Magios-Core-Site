import { useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useCompendiumData } from '@/shared/cache/useCompendiumData';
import { ContentRepository } from '@/shared/repositories/ContentRepository';
import {
  useCompendiumOverlay,
  parseEntityRoute,
} from '@/shared/compendium/CompendiumOverlayContext';
import { LegacyText } from '@/shared/ui/LegacyText';
import type { NewsItem } from '@/entities/content/types';
import styles from './NewsPage.module.css';

/** Hash routes are baked as `#/db?...`; React Router Link wants the path. */
function toPath(route: string): string {
  return route.startsWith('#') ? route.slice(1) : route;
}

/**
 * A news link to a single DB entity (`#/db?tab=…&detail=…`) opens the shared
 * overlay over the news page; anything else (book chapter, `/db` tab, profile)
 * navigates as usual.
 */
function EntityRouteLink({ text, route }: { text: string; route: string }) {
  const overlay = useCompendiumOverlay();
  const ref = parseEntityRoute(route);
  if (ref) {
    return (
      <button type="button" className={styles.link} onClick={() => overlay.openEntity(ref)}>
        {text}
      </button>
    );
  }
  return (
    <Link to={toPath(route)} className={styles.link}>
      {text}
    </Link>
  );
}

function NewsEntry({ item, open }: { item: NewsItem; open: boolean }) {
  const groups = item.objectGroups ?? [];
  const stats = item.stats ?? [];
  const links = item.links ?? [];

  return (
    <article className={styles.item}>
      <details className={styles.details} open={open}>
        <summary className={styles.summary}>
          <span className={styles.summaryTop}>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.date}>{item.date}</span>
            <span className={styles.toggle}>▾</span>
          </span>
          <LegacyText text={item.brief} className={styles.brief} />
        </summary>

        <div className={styles.body}>
          {/* 1. Новый функционал на сайте */}
          {item.features.length > 0 && (
            <section className={styles.section}>
              <h3>Новый функционал на сайте</h3>
              <ul className={styles.features}>
                {item.features.map((f, i) => (
                  <li key={i}>
                    <LegacyText text={f} />
                  </li>
                ))}
              </ul>
              {links.length > 0 && (
                <p className={styles.seeAlso}>
                  См. также:{' '}
                  {links.map((link, i) => (
                    <Fragment key={link.route + i}>
                      {i > 0 && ' · '}
                      <EntityRouteLink text={link.text} route={link.route} />
                    </Fragment>
                  ))}
                </p>
              )}
            </section>
          )}

          {/* 2. Новые объекты в базе данных */}
          {groups.length > 0 && (
            <section className={styles.section}>
              <h3>Новые объекты в базе данных</h3>
              {groups.map((group) => (
                <p key={group.label} className={styles.objectGroup}>
                  <strong>{group.label}:</strong>{' '}
                  {group.items.length === 0 ? (
                    <span className={styles.muted}>—</span>
                  ) : (
                    group.items.map((obj, i) => (
                      <Fragment key={obj.route + i}>
                        {i > 0 && ', '}
                        <EntityRouteLink text={obj.name} route={obj.route} />
                      </Fragment>
                    ))
                  )}
                </p>
              ))}
            </section>
          )}

          {/* 3. Статистика после обновления */}
          {stats.length > 0 && (
            <section className={styles.section}>
              <h3>Статистика после обновления</h3>
              {stats.map((stat) => (
                <p key={stat.label} className={styles.statLine}>
                  <strong>{stat.label}:</strong> {stat.value}
                </p>
              ))}
            </section>
          )}
        </div>
      </details>
    </article>
  );
}

export function NewsPage() {
  const fetcher = useCallback(() => ContentRepository.getNews(), []);
  const { data: news, loading, error } = useCompendiumData<NewsItem[]>('news', fetcher, 'news');

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
          <NewsEntry key={item.id} item={item} open={index === 0} />
        ))}
      </div>
    </div>
  );
}
