import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal } from '@/shared/ui/Modal';
import { Spinner } from '@/shared/ui/Spinner';
import { EmptyState } from '@/shared/ui/EmptyState';
import {
  DASHBOARD_LABELS,
  SUPPORTED_DICE,
  asNumber,
  formatDateTime,
  formatPercent,
  loadLocalDiceEvents,
  resolveDiceData,
} from '@/features/dashboard/diceAnalytics';
import type {
  DataReport,
  DiceResult,
  RollTypeStat,
  UserSummary,
  UserTypeStat,
} from '@/features/dashboard/types';
import styles from './DashboardPage.module.css';

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricTitle}>{title}</span>
      <strong className={styles.metricValue}>{value}</strong>
      {hint && <span className={styles.metricHint}>{hint}</span>}
    </div>
  );
}

function ContentSection({ report }: { report: DataReport }) {
  const content = report.content ?? {};
  const totals = content.totals ?? {};
  const rows = (content.spellsBySchool ?? []).slice(0, 12);
  const maxCount = rows.reduce((acc, row) => Math.max(acc, asNumber(row.count, 0)), 0);

  return (
    <Card title="Контент">
      <div className={styles.metricGrid}>
        <MetricCard
          title="Заклинания"
          value={String(asNumber(totals.spells, 0))}
          hint="Всего заклинаний"
        />
        <MetricCard title="Школы" value={String(asNumber(totals.schools, 0))} hint="Всего школ" />
        <MetricCard
          title="Концентрация"
          value={`${asNumber(content.concentrationShare, 0).toFixed(2)}%`}
          hint="Доля концентрации"
        />
        <MetricCard
          title="Подзаклинания"
          value={`${asNumber(content.subspellShare, 0).toFixed(2)}%`}
          hint="Доля подзаклинаний"
        />
        <MetricCard
          title="Неполные объекты"
          value={String(asNumber(content.incompleteObjects, 0))}
          hint="Неполные объекты"
        />
        <MetricCard
          title="Школы без заклинаний"
          value={String(asNumber(content.schoolsWithoutSpells, 0))}
          hint="Покрытие школ"
        />
      </div>

      <h3 className={styles.subhead}>Распределение заклинаний по школам</h3>
      {rows.length === 0 || maxCount <= 0 ? (
        <p className={styles.muted}>Недостаточно данных для распределения по школам.</p>
      ) : (
        <div className={styles.bars}>
          {rows.map((row) => {
            const school = String(row.school || DASHBOARD_LABELS.unknown);
            const count = asNumber(row.count, 0);
            const width = Math.max(4, Math.round((count / maxCount) * 100));
            return (
              <div key={school} className={styles.barItem}>
                <div className={styles.barHeader}>
                  <span>{school}</span>
                  <span>{count}</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function QualitySection({ report }: { report: DataReport }) {
  const quality = report.quality ?? {};
  const totals = quality.totals ?? {};
  const issuesByCollection = quality.issuesByCollection ?? {};
  const topRules = (quality.topRules ?? []).slice(0, 8);
  const collectionNames = Object.keys(issuesByCollection).sort((a, b) => a.localeCompare(b, 'ru'));

  return (
    <Card title="Качество данных">
      <div className={styles.metricGrid}>
        <MetricCard
          title="Ошибки"
          value={String(asNumber(totals.error, 0))}
          hint="Критические проблемы"
        />
        <MetricCard
          title="Предупреждения"
          value={String(asNumber(totals.warning, 0))}
          hint="Требует проверки"
        />
        <MetricCard
          title="Инфо"
          value={String(asNumber(totals.info, 0))}
          hint="Справочные замечания"
        />
      </div>

      <h3 className={styles.subhead}>Проблемы по коллекциям</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Коллекция</th>
              <th>Ошибки</th>
              <th>Предупреждения</th>
              <th>Инфо</th>
            </tr>
          </thead>
          <tbody>
            {collectionNames.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.muted}>
                  Нет данных
                </td>
              </tr>
            ) : (
              collectionNames.map((name) => {
                const data = issuesByCollection[name] ?? {};
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{asNumber(data.error, 0)}</td>
                    <td>{asNumber(data.warning, 0)}</td>
                    <td>{asNumber(data.info, 0)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subhead}>Топ правил</h3>
      {topRules.length === 0 ? (
        <p className={styles.muted}>Нет правил с проблемами</p>
      ) : (
        <ul className={styles.ruleList}>
          {topRules.map((item) => (
            <li key={item.rule}>
              {item.rule}: {item.count}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DiceSection({
  dice,
  usedLocal,
  onSelectUser,
}: {
  dice: DiceResult;
  usedLocal: boolean;
  onSelectUser: (summary: UserSummary) => void;
}) {
  const sourceLabel = usedLocal ? DASHBOARD_LABELS.localSource : DASHBOARD_LABELS.reportSource;

  if (dice.status !== 'ok') {
    return (
      <Card title="Аналитика бросков">
        <p className={styles.source}>{sourceLabel}</p>
        <EmptyState title="insufficient_data" description={dice.reason ?? 'Нет данных'} />
      </Card>
    );
  }

  const countByType = dice.rollsCountByDiceType;
  const totalRolls = Object.keys(countByType).reduce(
    (acc, key) => acc + asNumber(countByType[key], 0),
    0,
  );
  const top = dice.topRollType;
  const diceRows = SUPPORTED_DICE.filter((dt) => asNumber(countByType[dt], 0) > 0);

  return (
    <Card title="Аналитика бросков">
      <p className={styles.source}>{sourceLabel}</p>
      <div className={styles.metricGrid}>
        <MetricCard title="Всего бросков" value={String(totalRolls)} hint="Сумма всех бросков" />
        <MetricCard
          title="Активные типы кубов"
          value={String(Object.keys(countByType).length)}
          hint="Типы кубов с данными"
        />
        {top?.rollTypeKey ? (
          <MetricCard
            title="Самый популярный бросок"
            value={String(top.label || top.rollTypeKey)}
            hint={`Доля от общего числа: ${formatPercent(asNumber(top.share, 0))} (${asNumber(top.count, 0)})`}
          />
        ) : (
          <MetricCard title="Самый популярный бросок" value="Нет данных" />
        )}
      </div>

      <h3 className={styles.subhead}>Метрики по кубам</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Куб</th>
              <th>Бросков</th>
              <th>Среднее</th>
              <th>Ожидаемое</th>
              <th>Отклонение</th>
              <th>Крит. провалы</th>
              <th>Крит. успехи</th>
            </tr>
          </thead>
          <tbody>
            {diceRows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.muted}>
                  Недостаточно данных по броскам кубов.
                </td>
              </tr>
            ) : (
              diceRows.map((dt) => (
                <tr key={dt}>
                  <td>{dt}</td>
                  <td>{asNumber(countByType[dt], 0)}</td>
                  <td>{asNumber(dice.avgResultByDiceType[dt], 0).toFixed(3)}</td>
                  <td>{asNumber(dice.theoreticalAvgByDiceType[dt], 0).toFixed(3)}</td>
                  <td>{asNumber(dice.avgDeltaFromTheoretical[dt], 0).toFixed(3)}</td>
                  <td>{formatPercent(asNumber(dice.critFailRate[dt], 0))}</td>
                  <td>{formatPercent(asNumber(dice.critSuccessRate[dt], 0))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subhead}>Статистика по типам бросков</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Тип броска</th>
              <th>Куб</th>
              <th>Формула</th>
              <th>Бросков</th>
              <th>Среднее</th>
              <th>Ожидаемое</th>
              <th>Отклонение</th>
              <th>Крит. провалы</th>
              <th>Крит. успехи</th>
            </tr>
          </thead>
          <tbody>
            {dice.rollTypeStats.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.muted}>
                  Нет статистики по уникальным типам бросков.
                </td>
              </tr>
            ) : (
              dice.rollTypeStats.slice(0, 40).map((row: RollTypeStat) => (
                <tr key={row.rollTypeKey}>
                  <td>{String(row.label || row.rollTypeKey || DASHBOARD_LABELS.unknown)}</td>
                  <td>{String(row.diceType || DASHBOARD_LABELS.unknown)}</td>
                  <td>{String(row.expression || '-')}</td>
                  <td>{asNumber(row.count, 0)}</td>
                  <td>{asNumber(row.avg, 0).toFixed(3)}</td>
                  <td>{asNumber(row.theoreticalAvg, 0).toFixed(3)}</td>
                  <td>{asNumber(row.delta, 0).toFixed(3)}</td>
                  <td>{formatPercent(asNumber(row.critFailRate, 0))}</td>
                  <td>{formatPercent(asNumber(row.critSuccessRate, 0))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subhead}>Пользователи</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Бросков</th>
              <th>Последний бросок</th>
            </tr>
          </thead>
          <tbody>
            {dice.userSummaries.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.muted}>
                  Нет пользовательских метрик.
                </td>
              </tr>
            ) : (
              dice.userSummaries.slice(0, 50).map((row) => (
                <tr
                  key={row.userId}
                  className={styles.clickableRow}
                  title="Нажмите для деталей"
                  onClick={() => onSelectUser(row)}
                >
                  <td>{String(row.userDisplayName || row.userId || DASHBOARD_LABELS.anonymous)}</td>
                  <td>{asNumber(row.rollsCount, 0)}</td>
                  <td>{formatDateTime(row.lastRollAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UserStatsModal({
  summary,
  dice,
  onClose,
}: {
  summary: UserSummary | null;
  dice: DiceResult;
  onClose: () => void;
}) {
  const typeStats: UserTypeStat[] = summary
    ? dice.userTypeStats.filter((row) => String(row.userId) === String(summary.userId))
    : [];

  const columns: TableColumn<UserTypeStat>[] = [
    { key: 'label', header: 'Тип броска', render: (r) => String(r.label || r.rollTypeKey || '-') },
    { key: 'diceType', header: 'Куб', render: (r) => String(r.diceType || '-') },
    { key: 'expression', header: 'Формула', render: (r) => String(r.expression || '-') },
    { key: 'count', header: 'Бросков', render: (r) => asNumber(r.count, 0) },
    { key: 'avg', header: 'Среднее', render: (r) => asNumber(r.avg, 0).toFixed(3) },
    { key: 'theor', header: 'Ожидаемое', render: (r) => asNumber(r.theoreticalAvg, 0).toFixed(3) },
    { key: 'delta', header: 'Отклонение', render: (r) => asNumber(r.delta, 0).toFixed(3) },
    {
      key: 'fail',
      header: 'Крит. провалы',
      render: (r) =>
        `${asNumber(r.critFailCount, 0)} (${formatPercent(asNumber(r.critFailRate, 0))})`,
    },
    {
      key: 'success',
      header: 'Крит. успехи',
      render: (r) =>
        `${asNumber(r.critSuccessCount, 0)} (${formatPercent(asNumber(r.critSuccessRate, 0))})`,
    },
    { key: 'last', header: 'Последний бросок', render: (r) => formatDateTime(r.lastRollAt) },
  ];

  return (
    <Modal
      open={Boolean(summary)}
      onClose={onClose}
      wide
      title={summary ? `Статистика: ${summary.userDisplayName}` : ''}
    >
      {summary && (
        <>
          <div className={styles.modalSummary}>
            <div>
              <span className={styles.muted}>UID</span>
              <p>{summary.userId}</p>
            </div>
            <div>
              <span className={styles.muted}>Количество бросков</span>
              <p>{asNumber(summary.rollsCount, 0)}</p>
            </div>
            <div>
              <span className={styles.muted}>Последний бросок</span>
              <p>{formatDateTime(summary.lastRollAt)}</p>
            </div>
          </div>
          <Table
            columns={columns}
            rows={typeStats}
            getRowKey={(r) => r.rollTypeKey}
            empty="Нет данных по типам бросков."
          />
        </>
      )}
    </Modal>
  );
}

export function DashboardPage() {
  const [report, setReport] = useState<DataReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}reports/data_report.json`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Не удалось загрузить отчет (${res.status})`);
        }
        const json = (await res.json()) as DataReport;
        if (!cancelled) setReport(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки отчета');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { dice, usedLocal } = useMemo(() => {
    if (!report) return { dice: resolveDiceData(undefined, []).dice, usedLocal: false };
    return resolveDiceData(report.dice, loadLocalDiceEvents());
  }, [report]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Spinner label="Загрузка отчета..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.page}>
        <h1>Дашборд</h1>
        <EmptyState title="Ошибка загрузки отчета" description={error || 'Отчет недоступен'} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Дашборд</h1>
        <span className={styles.generatedAt}>
          Отчет обновлен: {new Date(report.generatedAt || Date.now()).toLocaleString('ru-RU')}
        </span>
      </div>

      <ContentSection report={report} />
      <DiceSection dice={dice} usedLocal={usedLocal} onSelectUser={setSelectedUser} />
      <QualitySection report={report} />

      <UserStatsModal summary={selectedUser} dice={dice} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
