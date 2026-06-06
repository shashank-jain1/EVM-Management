import { Truck } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function DispatchSummary({ fromLocation, toLocation, unitCounts }) {
  const { t } = useTranslation();
  const totalCounts = unitCounts.CONTROL_UNIT + unitCounts.BALLOT_UNIT + unitCounts.VVPAT;

  return (
    <div className="bg-white border border-gray-200 border-t-4 border-t-navy-955 rounded-lg p-5 shadow-sm space-y-5">
      <div className="pb-2 border-b border-gray-150 flex items-center gap-2">
        <Truck size={18} className="text-saffron-500" />
        <h4 className="text-xs font-bold text-navy-950 font-sans uppercase tracking-wide">
          {t('Shipment Details')}
        </h4>
      </div>

      <div className="space-y-4 text-xs">
        {/* Origin / Destination Flow */}
        <div className="relative pl-4 border-l border-gray-200 space-y-4 py-1">
          {/* Origin */}
          <div className="relative">
            <div className="absolute -left-[20.5px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border border-white" />
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold">{t('Shipping From')}</span>
            <p className="font-semibold text-gray-800 font-sans mt-0.5">
              {fromLocation.districtName ? `${fromLocation.districtName}, ` : ''}{fromLocation.stateName}
            </p>
          </div>

          {/* Destination */}
          <div className="relative">
            <div className="absolute -left-[20.5px] top-0.5 w-3 h-3 rounded-full bg-saffron-500 border border-white" />
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold">{t('Shipping To')}</span>
            <p className="font-semibold text-gray-800 font-sans mt-0.5">
              {toLocation.districtName ? `${toLocation.districtName}, ` : t('All Districts')}{toLocation.stateName ? `, ${toLocation.stateName}` : '—'}
            </p>
          </div>
        </div>

        {/* Units breakdown */}
        <div className="pt-3 border-t border-gray-150">
          <span className="text-[10px] text-gray-400 font-sans uppercase font-bold block mb-2">{t('Staged Inventory Summary')}</span>
          <div className="space-y-1.5 font-mono text-[11px] text-gray-600 bg-gray-50 p-3 rounded border border-gray-150">
            <div className="flex justify-between">
              <span>{t('Control Units (CU):')}</span>
              <span className="font-bold text-gray-800">{unitCounts.CONTROL_UNIT}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('Ballot Units (BU):')}</span>
              <span className="font-bold text-gray-800">{unitCounts.BALLOT_UNIT}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('VVPATs:')}</span>
              <span className="font-bold text-gray-800">{unitCounts.VVPAT}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 text-xs font-bold text-navy-950">
              <span>{t('Total Units:')}</span>
              <span>{totalCounts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
