import React from 'react';
import Badge from '@/components/common/Badge';
import { Cpu, Trash2 } from 'lucide-react';

export default function ScannedUnitCard({ unit, onRemove, index }) {
  const boxNum = Math.floor(index / 10) + 1;

  return (
    <div className="bg-white border border-gray-200 rounded p-3.5 shadow-sm hover:border-gray-300 transition-colors flex items-center justify-between gap-4">
      {/* Unit details */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-navy-50 border border-navy-100 rounded text-navy-800 shrink-0 mt-0.5">
          <Cpu size={16} className="stroke-[1.5]" />
        </div>
        
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-gray-800 truncate block max-w-[150px] sm:max-w-none">
              {unit.unitCode}
            </span>
            <span className="text-[10px] font-mono font-bold bg-navy-50 text-navy-700 border border-navy-100 px-1.5 py-0.2 rounded shrink-0">
              Box {boxNum}
            </span>
            <Badge status={unit.unitType} />
            <Badge status={unit.currentStatus} />
          </div>
          
          <p className="text-[11px] text-gray-500 font-sans mt-1.5 leading-relaxed">
            <span className="font-semibold text-gray-600">Location: </span>
            {unit.currentDistrictName ? `${unit.currentDistrictName}, ` : ''}{unit.currentStateName} 
            {unit.currentLocationDescription && ` (${unit.currentLocationDescription})`}
          </p>
          <p className="text-[10px] text-gray-400 font-sans mt-0.5">
            Mfg: {unit.manufacturer} ({unit.manufacturingYear})
          </p>
        </div>
      </div>

      {/* Remove trigger */}
      <button
        type="button"
        onClick={() => onRemove(unit.unitCode)}
        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0 border border-transparent hover:border-red-150"
        title="Remove unit from dispatch queue"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
