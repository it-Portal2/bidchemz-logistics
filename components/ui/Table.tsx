import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  const rowPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
  
  return (
    <div className="overflow-x-auto border border-secondary-200 rounded-lg">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${rowPadding} text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider ${column.width || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-secondary-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-secondary-50' : 'bg-white'}
                  ${hoverable ? 'hover:bg-primary-50 transition-colors duration-150' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`${rowPadding} text-sm text-secondary-900 ${column.width || ''}`}>
                    {column.render 
                      ? column.render(row[column.key], row) 
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
