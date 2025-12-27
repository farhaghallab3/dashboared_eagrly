import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  // Accept either an array of items or a paginated/boxed response from the API
  data: T[] | { results?: T[] } | any;
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

function Table<T extends { id: number | string }>({ data, columns, actions }: TableProps<T>) {
  // Normalize data: allow array responses or DRF-style paginated objects
  const rows: T[] = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);

  if (!Array.isArray(data) && data && !Array.isArray(data.results)) {
    // Unexpected shape — warn to help debugging but continue with empty rows
    // eslint-disable-next-line no-console
    console.warn('Table: `data` is not an array nor a paginated object with `results`. Received:', data);
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl backdrop-blur-xl"
      style={{
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            {columns.map((col, idx) => (
              <th key={idx} className={`p-4 font-semibold uppercase tracking-wide text-xs ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
            {actions && <th className="p-4 font-semibold uppercase tracking-wide text-xs text-center">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                No data found
              </td>
            </tr>
          ) : (
            rows.map((item) => (
              <tr
                key={item.id}
                className="transition-all duration-300"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`p-4 ${col.className || ''}`} style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
                    {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
                {actions && <td className="p-4 text-center">{actions(item)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
