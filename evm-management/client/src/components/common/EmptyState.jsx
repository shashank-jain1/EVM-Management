import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ title, description, ctaLabel, onCta, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon size={28} className="text-gray-400" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>}
      </div>
      {ctaLabel && onCta && (
        <Button size="sm" variant="secondary" onClick={onCta}>{ctaLabel}</Button>
      )}
    </div>
  );
}
