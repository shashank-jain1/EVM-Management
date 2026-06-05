import clsx from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Pagination from './Pagination';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

/**
 * Reusable data table with sorting, pagination, selection, sticky header, and skeleton loading
 */
export default function Table({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = '',
  sortKey,
  sortDir,
  onSort,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  selectedIds = [],
  onSelectionChange,
  rowKey = 'id',
  className,
}) {
  const getRowKey = (row) => row[rowKey] ?? row.id ?? row.userId ?? row.unitId ?? row.batchId ?? row.logId;
  const canSelect = !!onSelectionChange;

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((r) => getRowKey(r)));
    }
  };

  const toggleRow = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm" role="grid">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {canSelect && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="rounded border-gray-300 text-saffron-500 focus:ring-saffron-500"
                  />
                </th>
              )}
              {columns.map((col) => {
                const colKey = col.accessor || col.key;
                const colLabel = col.header || col.label;
                return (
                  <th
                    key={colKey}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-900 transition-colors',
                      col.className
                    )}
                    onClick={col.sortable && onSort ? () => onSort(colKey) : undefined}
                    aria-sort={col.sortable ? (sortKey === colKey ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {colLabel}
                      {col.sortable && onSort && (
                        <span className="text-gray-400" aria-hidden="true">
                          {sortKey === colKey ? (
                            sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading
              ? Array.from({ length: limit || 5 }).map((_, i) => (
                  <tr key={i}>
                    {canSelect && <td className="px-4 py-3"><div className="skeleton h-4 w-4 rounded" /></td>}
                    {columns.map((col) => {
                      const colKey = col.accessor || col.key;
                      return (
                        <td key={colKey} className="px-4 py-3">
                          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                        </td>
                      );
                    })}
                  </tr>
                ))
              : data.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length + (canSelect ? 1 : 0)} className="px-4 py-12">
                      <EmptyState title={emptyTitle} description={emptyDescription} />
                    </td>
                  </tr>
                )
              : data.map((row, index) => {
                  const rKey = getRowKey(row);
                  return (
                    <tr
                      key={rKey || index}
                      className={clsx(
                        'hover:bg-gray-50 transition-colors',
                        selectedIds.includes(rKey) && 'bg-saffron-50'
                      )}
                    >
                      {canSelect && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(rKey)}
                            onChange={() => toggleRow(rKey)}
                            aria-label={`Select row ${rKey}`}
                            className="rounded border-gray-300 text-saffron-500 focus:ring-saffron-500"
                          />
                        </td>
                      )}
                      {columns.map((col) => {
                        const colKey = col.accessor || col.key;
                        return (
                          <td key={colKey} className={clsx('px-4 py-3 text-gray-700', col.cellClassName)}>
                            {col.render ? col.render(row[colKey], row, index) : row[colKey] ?? <span className="text-gray-400">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {(totalPages > 1 || total != null) && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">
            {total != null && `${total} total records`}
            {selectedIds.length > 0 && ` — ${selectedIds.length} selected`}
          </p>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
        </div>
      )}
    </div>
  );
}
