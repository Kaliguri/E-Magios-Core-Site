import type { CompendiumEntity } from '@/entities/compendium/types';
import type { ColumnDescriptor } from '@/entities/compendium/schema';
import type { SortState } from '@/features/db/useCompendiumSort';
import styles from './CompendiumTable.module.css';

function renderCellValue(item: CompendiumEntity, key: string): string {
  const val = (item as unknown as Record<string, unknown>)[key];
  if (val == null) return '—';
  if (Array.isArray(val)) return val.join(', ');
  if (key === 'difficulty' && typeof val === 'number') {
    return '★'.repeat(val) + '☆'.repeat(Math.max(0, 3 - val));
  }
  return String(val);
}

interface CompendiumTableProps {
  items: CompendiumEntity[];
  columns: ColumnDescriptor[];
  sort: SortState;
  onSort: (field: string) => void;
  onRowClick: (item: CompendiumEntity) => void;
}

export function CompendiumTable({ items, columns, sort, onSort, onRowClick }: CompendiumTableProps) {
  if (!items.length) {
    return <div className={styles.empty}>Ничего не найдено</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={styles.th}
                onClick={() => onSort(col.key)}
                role="button"
                aria-sort={sort.field === col.key ? (sort.ascending ? 'ascending' : 'descending') : 'none'}
              >
                <span className={styles.thContent}>
                  {col.label}
                  {sort.field === col.key && (
                    <span className={styles.sortArrow}>{sort.ascending ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr
              key={item.id}
              className={styles.row}
              onClick={() => onRowClick(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  {renderCellValue(item, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
