import React from 'react';
import clsx from 'clsx';

export default function KPICard({ title, value, detail, icon: Icon, trend, trendType = 'neutral', className }) {
  return (
    <div
      className={clsx(
        "bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-500/20 transition-all duration-300 relative group overflow-hidden select-none cursor-default",
        className
      )}
    >
      {/* Sleek Blue/Sky highlight bar on hover */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-sans block truncate">
            {title}
          </span>
          <h3 className="text-xl md:text-3xl font-extrabold font-mono text-slate-900 mt-1 md:mt-1.5 leading-none">
            {value}
          </h3>
        </div>
        <div className="p-2 md:p-2.5 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 shrink-0">
          <Icon size={18} className="stroke-[1.5] md:w-5 md:h-5" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-slate-200/50 text-[10px] md:text-xs gap-1">
        <div className="truncate pr-2" title={typeof detail === 'string' ? detail : undefined}>
          {detail}
        </div>
        {trend && (
          <span
            className={clsx(
              "font-bold font-sans shrink-0 px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] self-start sm:self-auto uppercase tracking-wide",
              trendType === 'up' && "bg-emerald-50 text-emerald-700 border border-emerald-100/50",
              trendType === 'down' && "bg-rose-50 text-rose-700 border border-rose-100/50",
              trendType === 'neutral' && "bg-slate-100 text-slate-650 border border-slate-200/50"
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
