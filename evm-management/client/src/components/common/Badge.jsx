import clsx from 'clsx';

const STATUS_STYLES = {
  // EVM Status
  IN_WAREHOUSE:       { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500',   label: 'In Warehouse' },
  IN_TRANSIT:         { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500',  label: 'In Transit' },
  DEPLOYED:           { bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500',  label: 'Deployed' },
  FAULTY:             { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500',    label: 'Faulty' },
  DECOMMISSIONED:     { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400',   label: 'Decommissioned' },
  RETURNED:           { bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-500', label: 'Returned' },

  // Dispatch Status
  PENDING:            { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-500', label: 'Pending' },
  RECEIVED:           { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500',label: 'Received' },
  PARTIALLY_RECEIVED: { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500', label: 'Partial' },
  CANCELLED:          { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400',    label: 'Cancelled' },

  // User Role
  ADMIN:              { bg: 'bg-navy-100',    text: 'text-navy-800',    dot: 'bg-navy-600',   label: 'Admin' },
  STATE_OFFICER:      { bg: 'bg-indigo-100',  text: 'text-indigo-800',  dot: 'bg-indigo-500', label: 'State Officer' },
  DISTRICT_OFFICER:   { bg: 'bg-teal-100',    text: 'text-teal-800',    dot: 'bg-teal-500',   label: 'District Officer' },

  // User Type
  PERMANENT:          { bg: 'bg-gray-100',    text: 'text-gray-700',    dot: 'bg-gray-400',   label: 'Permanent' },
  TEMPORARY:          { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400',  label: 'Temporary' },

  // Unit Type
  CONTROL_UNIT:       { bg: 'bg-sky-100',     text: 'text-sky-800',     dot: 'bg-sky-500',    label: 'Control Unit' },
  BALLOT_UNIT:        { bg: 'bg-violet-100',  text: 'text-violet-800',  dot: 'bg-violet-500', label: 'Ballot Unit' },
  VVPAT:              { bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-500',   label: 'VVPAT' },

  // Generic
  DISPATCHED:         { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400',   label: 'Dispatched' },
  MISSING:            { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400',    label: 'Missing' },
  DAMAGED:            { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400', label: 'Damaged' },
  GOOD:               { bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-400',  label: 'Good' },
};

/**
 * Status badge with color-coded dot and label
 * @param {string} status - the status key
 * @param {boolean} dot - show dot indicator
 */
export default function Badge({ status, label, dot = true, className }) {
  const style = STATUS_STYLES[status] || {
    bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: status
  };
  const displayLabel = label ?? style.label;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        style.bg, style.text, className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} aria-hidden="true" />}
      {displayLabel}
    </span>
  );
}
