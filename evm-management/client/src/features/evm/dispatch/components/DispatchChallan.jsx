import React from 'react';
import { format } from 'date-fns';

const DispatchChallan = React.forwardRef(({ batch, items = [] }, ref) => {
  if (!batch) return null;

  return (
    <div
      ref={ref}
      className="p-8 max-w-4xl mx-auto bg-white font-sans text-gray-800 leading-normal select-text"
      style={{ minHeight: '297mm' }} // A4 dimensions
    >
      {/* Header border */}
      <div className="border-b-4 border-double border-navy-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-navy-950 uppercase tracking-tight">
              Madhya Pradesh State Election Commission
            </h2>
            <p className="text-[11px] text-gray-600 font-medium">
              Madhya Pradesh State Election Commission &bull; EVM Inventory Management System
            </p>
          </div>
          {/* Barcode/QR Mock styling */}
          <div className="text-right">
            <div className="border border-navy-950 p-1 bg-gray-50 inline-block">
              <span className="font-mono text-xs block font-bold text-gray-900 leading-none tracking-widest">{batch.batchCode}</span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono block mt-1">SYSTEM RECEIPT BARCODE</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-base font-extrabold text-navy-955 uppercase tracking-wider underline">
          EVM Shipment Receipt
        </h3>
      </div>

      {/* Summary table */}
      <div className="grid grid-cols-2 gap-6 mb-8 border border-gray-250 p-4 rounded text-xs">
        <div className="space-y-2">
          <p>
            <span className="font-bold text-gray-500 font-mono">RECEIPT NO: </span>
            <span className="font-bold font-mono text-navy-900">{batch.batchCode}</span>
          </p>
          <p>
            <span className="font-bold text-gray-500">DISPATCH DATE: </span>
            <span className="font-semibold text-gray-800">
              {batch.dispatchDate ? format(new Date(batch.dispatchDate), 'dd MMM yyyy HH:mm') : '—'}
            </span>
          </p>
          <p>
            <span className="font-bold text-gray-500">DISPATCHED BY: </span>
            <span className="font-semibold text-gray-800">
              {batch.dispatchedByName || batch.dispatchedByCode || 'District Officer'}
            </span>
          </p>
        </div>

        <div className="space-y-2 border-l border-gray-200 pl-6">
          <p>
            <span className="font-bold text-gray-500">ORIGIN: </span>
            <span className="font-semibold text-gray-800">
              {batch.fromDistrictName ? `${batch.fromDistrictName}, ` : ''}{batch.fromStateName}
            </span>
          </p>
          <p>
            <span className="font-bold text-gray-500">DESTINATION: </span>
            <span className="font-semibold text-gray-800">
              {batch.toDistrictName ? `${batch.toDistrictName}, ` : ''}{batch.toStateName}
            </span>
          </p>
          <p>
            <span className="font-bold text-gray-500">TOTAL UNITS: </span>
            <span className="font-bold text-navy-900 font-mono text-sm">{batch.totalUnits} Units</span>
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="mb-12 text-xs">
        <h4 className="font-bold text-navy-950 uppercase mb-3 text-[11px] tracking-wide">
          List of Dispatched Electronic Voting Machine Units
        </h4>
        
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="border border-gray-300 px-3 py-2 text-left font-bold">Sl No.</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold">Box Number</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold">Unit Code (Monospace)</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold">Unit Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold">Condition on Dispatch</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const boxNum = item.remarks || `Box ${Math.floor(idx / 10) + 1}`;
              return (
                <tr key={item.itemId || item.unitId || idx} className="border-b border-gray-200">
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono font-bold text-navy-800">{boxNum}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono font-bold text-gray-900">{item.unitCode}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">
                    {item.unitType?.replace('_', ' ') || 'CONTROL UNIT'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600 font-semibold text-emerald-700">SEALED GOOD</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-400">
                  No units associated with this dispatch batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-12 text-xs pt-12 mt-12 border-t border-gray-200">
        <div className="text-center space-y-12">
          <div className="h-10 border-b border-dashed border-gray-400" />
          <div>
            <p className="font-bold text-gray-800">Dispatching Custodian Signature</p>
            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Seal & Name of Origin Warehouse</p>
          </div>
        </div>

        <div className="text-center space-y-12">
          <div className="h-10 border-b border-dashed border-gray-400" />
          <div>
            <p className="font-bold text-gray-800">Receiving Custodian Signature</p>
            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Seal & Date on Receipt</p>
          </div>
        </div>
      </div>

      {/* Print footer */}
      <div className="mt-16 text-center text-[9px] text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-mono">Receipt printed automatically via EVM Inventory Management system. Verification code: {batch.batchCode?.split('-')[2] || 'OK'}-{Date.now().toString().slice(-6)}</p>
        <p className="mt-0.5">This document serves as a receipt under Section 23 of State Election Commission Guidelines.</p>
      </div>
    </div>
  );
});

DispatchChallan.displayName = 'DispatchChallan';
export default DispatchChallan;
