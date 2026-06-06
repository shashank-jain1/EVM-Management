import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, className }) {
  if (totalPages <= 1) return null;

  const currentPage = Number(page);
  const pages = [];
  const delta = 2;

  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    pages.push(i);
  }

  const showLeftEllipsis = pages[0] > 2;
  const showRightEllipsis = pages[pages.length - 1] < totalPages - 1;

  return (
    <nav aria-label="Pagination" className={clsx('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <PageBtn page={1} current={currentPage} onClick={onPageChange} />
      )}
      {showLeftEllipsis && <span className="px-1 text-gray-400">…</span>}
      {pages.map((p) => <PageBtn key={p} page={p} current={currentPage} onClick={onPageChange} />)}
      {showRightEllipsis && <span className="px-1 text-gray-400">…</span>}
      {pages[pages.length - 1] < totalPages && (
        <PageBtn page={totalPages} current={currentPage} onClick={onPageChange} />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onPageChange(currentPage + 1);
        }}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

function PageBtn({ page, current, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick(page);
      }}
      aria-label={`Page ${page}`}
      aria-current={page === current ? 'page' : undefined}
      className={clsx(
        'w-8 h-8 rounded-md text-sm font-medium transition-colors',
        page === current
          ? 'bg-navy-800 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {page}
    </button>
  );
}
