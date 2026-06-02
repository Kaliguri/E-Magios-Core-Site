import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge, Card, EmptyState, Input, Select, Spinner, Tabs, Table } from './index';

describe('shared/ui primitives', () => {
  it('Card renders title, body and footer', () => {
    render(
      <Card title="Заголовок" footer={<span>низ</span>}>
        содержимое
      </Card>,
    );
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
    expect(screen.getByText('содержимое')).toBeInTheDocument();
    expect(screen.getByText('низ')).toBeInTheDocument();
  });

  it('Badge renders children', () => {
    render(<Badge tone="emerald">tag</Badge>);
    expect(screen.getByText('tag')).toBeInTheDocument();
  });

  it('Spinner exposes status role with label', () => {
    render(<Spinner label="Загрузка" />);
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка');
  });

  it('EmptyState renders title and description', () => {
    render(<EmptyState title="Пусто" description="нет записей" />);
    expect(screen.getByText('Пусто')).toBeInTheDocument();
    expect(screen.getByText('нет записей')).toBeInTheDocument();
  });

  it('Input forwards value and change events', () => {
    const onChange = vi.fn();
    render(<Input placeholder="поиск" onChange={onChange} />);
    const input = screen.getByPlaceholderText('поиск');
    fireEvent.change(input, { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('Select renders options', () => {
    render(
      <Select aria-label="выбор">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
  });

  it('Tabs marks the active tab and emits change', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { key: 'one', label: 'One' },
          { key: 'two', label: 'Two' },
        ]}
        active="one"
        onChange={onChange}
      />,
    );
    const second = screen.getByRole('tab', { name: 'Two' });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(second);
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('Table renders rows and handles row clicks, with empty fallback', () => {
    const onRowClick = vi.fn();
    const { rerender } = render(
      <Table
        columns={[
          { key: 'name', header: 'Имя', render: (r: { id: string; name: string }) => r.name },
        ]}
        rows={[{ id: '1', name: 'Алиса' }]}
        getRowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Алиса'));
    expect(onRowClick).toHaveBeenCalled();

    rerender(
      <Table
        columns={[
          { key: 'name', header: 'Имя', render: (r: { id: string; name: string }) => r.name },
        ]}
        rows={[]}
        getRowKey={(r) => r.id}
        empty="Ничего нет"
      />,
    );
    expect(screen.getByText('Ничего нет')).toBeInTheDocument();
  });
});
