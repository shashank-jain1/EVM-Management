import clsx from 'clsx';
import { CheckCircle2, Truck, PlusCircle } from 'lucide-react';

const ACTION_ICONS = {
  REGISTERED:      <PlusCircle size={16} className="text-blue-500" />,
  DISPATCHED:      <Truck size={16} className="text-amber-500" />,
  RECEIVED:        <CheckCircle2 size={16} className="text-green-500" />,
};

/**
 * Vertical timeline for EVM movement history
 */
export default function Timeline({ items = [] }) {
  if (!items.length) return (
    <div className="text-center py-10 text-gray-500 text-sm">No history available</div>
  );

  return (
    <ol className="relative flex flex-col gap-0" aria-label="Movement history">
      {items.map((item, idx) => (
        <li key={item.historyId || idx} className="flex gap-4 group">
          {/* Line + dot */}
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm group-first:border-navy-600 z-10">
              {ACTION_ICONS[item.actionType] || <CheckCircle2 size={16} className="text-gray-400" />}
            </div>
            {idx < items.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 my-1 min-h-[24px]" aria-hidden="true" />
            )}
          </div>

          {/* Content */}
          <div className={clsx('flex-1 pb-6', idx === items.length - 1 && 'pb-0')}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-navy-800 capitalize">
                {item.actionType?.replace(/_/g, ' ').toLowerCase()}
              </span>
              <time className="text-xs text-gray-400 shrink-0" dateTime={item.actionDate}>
                {new Date(item.actionDate).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </time>
            </div>

            {(item.fromStateName || item.toStateName) && (
              <p className="text-xs text-gray-600 mt-0.5">
                {item.fromStateName && <span className="font-medium">{item.fromStateName}{item.fromDistrictName ? ` / ${item.fromDistrictName}` : ''}</span>}
                {item.fromStateName && item.toStateName && <span className="mx-1.5 text-gray-400">→</span>}
                {item.toStateName && <span className="font-medium">{item.toStateName}{item.toDistrictName ? ` / ${item.toDistrictName}` : ''}</span>}
              </p>
            )}

            {item.batchCode && (
              <p className="text-xs text-gray-500 mt-0.5">
                Batch: <span className="font-mono text-navy-700">{item.batchCode}</span>
              </p>
            )}

            <p className="text-xs text-gray-500 mt-0.5">
              By: <span className="font-medium">{item.actionByName}</span>
            </p>

            {item.remarks && (
              <p className="text-xs text-gray-400 italic mt-1">{item.remarks}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
