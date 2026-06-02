import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import styles from './OpsPage.module.css';

interface TelemetryRecord {
  id: string;
  eventName: string;
  level: string;
  route: string | null;
  createdAt: string | null;
}

interface PublicationRecord {
  id: string;
  collection: string;
  fromStatus: string;
  toStatus: string;
  actorRole: string;
  createdAt: string | null;
}

export function OpsPage() {
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [publicationLogs, setPublicationLogs] = useState<PublicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const telemetryQuery = query(
          collection(db, 'client_telemetry'),
          orderBy('createdAt', 'desc'),
          limit(200),
        );
        const publicationQuery = query(
          collection(db, 'content_publication_log'),
          orderBy('createdAt', 'desc'),
          limit(200),
        );

        const [telemetrySnap, publicationSnap] = await Promise.all([
          getDocs(telemetryQuery),
          getDocs(publicationQuery),
        ]);

        setTelemetry(
          telemetrySnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              eventName: String(data['eventName'] ?? ''),
              level: String(data['level'] ?? 'info'),
              route: (data['route'] as string | null) ?? null,
              createdAt: data['createdAt']?.toDate?.()?.toISOString?.() ?? null,
            };
          }),
        );

        setPublicationLogs(
          publicationSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              collection: String(data['collection'] ?? ''),
              fromStatus: String(data['fromStatus'] ?? ''),
              toStatus: String(data['toStatus'] ?? ''),
              actorRole: String(data['actorRole'] ?? ''),
              createdAt: data['createdAt']?.toDate?.()?.toISOString?.() ?? null,
            };
          }),
        );
      } catch {
        setError('Не удалось загрузить операционные метрики');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const telemetrySummary = useMemo(() => {
    return telemetry.reduce<Record<string, number>>((acc, row) => {
      acc[row.eventName] = (acc[row.eventName] ?? 0) + 1;
      return acc;
    }, {});
  }, [telemetry]);

  if (loading) return <div className={styles.page}>Загрузка метрик...</div>;
  if (error) return <div className={styles.page}>{error}</div>;

  return (
    <div className={styles.page}>
      <h1>Ops Metrics</h1>
      <p className={styles.hint}>
        Служебный обзор telemetry и публикационных событий за последние записи.
      </p>

      <section className={styles.section}>
        <h2>Telemetry Summary</h2>
        <div className={styles.cards}>
          {Object.entries(telemetrySummary).map(([eventName, count]) => (
            <div key={eventName} className={styles.card}>
              <span className={styles.cardTitle}>{eventName}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Latest Telemetry Events</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Level</th>
                <th>Route</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>{row.eventName}</td>
                  <td>{row.level}</td>
                  <td>{row.route ?? '-'}</td>
                  <td>{row.createdAt ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Latest Publication Logs</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Collection</th>
                <th>From</th>
                <th>To</th>
                <th>Role</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {publicationLogs.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>{row.collection}</td>
                  <td>{row.fromStatus}</td>
                  <td>{row.toStatus}</td>
                  <td>{row.actorRole}</td>
                  <td>{row.createdAt ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
