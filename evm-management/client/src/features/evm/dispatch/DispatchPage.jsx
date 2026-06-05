import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reports.api';
import { useAuthStore } from '@/store/authStore';
import { useDispatch } from './hooks/useDispatch';
import QRScanner from './components/QRScanner';
import ScannedUnitCard from './components/ScannedUnitCard';
import DispatchSummary from './components/DispatchSummary';
import DispatchChallan from './components/DispatchChallan';
import RegisterScannedUnitModal from './components/RegisterScannedUnitModal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { useReactToPrint } from 'react-to-print';
import {
  Camera,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  Truck,
  Printer,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function DispatchPage() {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const { t } = useTranslation();
  
  const {
    step,
    setStep,
    scannedUnits,
    lookupUnit,
    removeUnit,
    toStateId,
    setToStateId,
    toDistrictId,
    setToDistrictId,
    expectedArrival,
    setExpectedArrival,
    remarks,
    setRemarks,
    createdBatch,
    clearStaged,
    submitDispatch,
    unitCounts,
    isSubmitting,
    unregisteredCode,
    setUnregisteredCode,
    addRegisteredUnitToQueue,
  } = useDispatch();

  const [manualInput, setManualInput] = useState('');
  const challanRef = useRef(null);

  // 1. Fetch States for Destination
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await referenceApi.getStates();
      return res.data.data;
    },
    staleTime: 300000,
  });

  // 2. Fetch Districts for selected Destination State
  const districtsQuery = useQuery({
    queryKey: ['districts', toStateId],
    queryFn: async () => {
      const res = await referenceApi.getDistricts(toStateId);
      return res.data.data;
    },
    enabled: !!toStateId,
    staleTime: 300000,
  });

  // 3. Print triggering helper
  const handlePrint = useReactToPrint({
    content: () => challanRef.current,
    documentTitle: `ECI-CHALLAN-${createdBatch?.batchCode || 'PRINT'}`,
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    lookupUnit(manualInput.trim().toUpperCase());
    setManualInput('');
  };

  const getFromLocationName = () => {
    if (!user) return t('ECI Headquarters');
    const stateName = user.stateName || 'Central';
    const districtName = user.districtName ? `${user.districtName}, ` : '';
    return `${districtName}${stateName}`;
  };

  const getToLocationName = () => {
    const state = statesQuery.data?.find((s) => {
      const id = s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '';
      return id === toStateId;
    });
    const district = districtsQuery.data?.find((d) => {
      const id = d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '';
      return id === toDistrictId;
    });
    return {
      stateName: state ? (state.stateName ?? state.StateName) : '',
      districtName: district ? (district.districtName ?? district.DistrictName) : '',
    };
  };

  const totalCount = scannedUnits.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-saffron-50 text-saffron-600 rounded shrink-0 border border-saffron-100">
            <Truck size={20} className="stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
              {t('Send EVM Batch')}
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              {t('Send EVM units between warehouses.')}
            </p>
          </div>
        </div>

        {/* Step indicator tags */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-sans">
          <span className={`px-2 py-0.5 rounded font-semibold ${step === 1 ? 'bg-saffron-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{t('1. Scan Units')}</span>
          <span className="text-gray-300">&rarr;</span>
          <span className={`px-2 py-0.5 rounded font-semibold ${step === 2 ? 'bg-saffron-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{t('2. Destination')}</span>
          <span className="text-gray-300">&rarr;</span>
          <span className={`px-2 py-0.5 rounded font-semibold ${step === 3 ? 'bg-saffron-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{t('3. Gate Pass')}</span>
        </div>
      </div>

      {/* STEP 1: SCAN UNITS */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Barcode/QR video and text input */}
          <div className="lg:col-span-1 bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide pb-2 border-b border-gray-100 flex items-center gap-2">
                <Camera size={14} className="text-gray-400" />
                {t('Scan Barcode or QR Code')}
              </h3>
              <div className="mt-4">
                <QRScanner
                  onScanSuccess={(code) => {
                    setManualInput(code.toUpperCase());
                    lookupUnit(code.toUpperCase());
                  }}
                  hideManualOption={true}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide pb-2 border-b border-gray-100 flex items-center gap-2">
                <Keyboard size={14} className="text-gray-400" />
                {t('Type Unit Code')}
              </h3>
              <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                <Input
                  placeholder={t('Enter Unit Code (e.g. CU-192A)...')}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="font-mono text-xs uppercase flex-1 h-9"
                />
                <Button type="submit" variant="secondary" className="h-9 font-bold px-3 shrink-0 cursor-pointer">
                  {t('Stage')}
                </Button>
              </form>
            </div>
          </div>

          {/* Right panel: Scanned list review */}
          <div className="lg:col-span-2 bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm flex flex-col justify-between min-h-[50vh]">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide">
                  {t('Units List')} ({totalCount} {t('unit(s) ready')})
                </h3>
                {totalCount > 0 && (
                  <button
                    onClick={clearStaged}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider font-mono"
                  >
                    {t('Clear Queue')}
                  </button>
                )}
              </div>

              {scannedUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 select-none border-2 border-dashed border-gray-150 rounded-lg">
                  <Truck size={36} className="text-gray-300 stroke-[1.5] mb-3" />
                  <p className="text-xs font-sans font-bold">{t('EVM List is Empty')}</p>
                  <p className="text-[10px] text-gray-500 font-sans mt-1 max-w-xs leading-relaxed">
                    {t('Scan EVM barcode or type unit codes to add them to this shipping batch.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {scannedUnits.map((unit, index) => (
                    <ScannedUnitCard key={unit.unitCode} unit={unit} onRemove={removeUnit} index={index} />
                  ))}
                </div>
              )}
            </div>

            {/* Stage bottom panel */}
            <div className="pt-5 border-t border-gray-100 mt-6 flex justify-between items-center">
              <div className="text-xs font-sans text-gray-500">
                {t('Summary')}: <span className="font-bold text-gray-800">{unitCounts.CONTROL_UNIT} {t('CU')}</span> |{' '}
                <span className="font-bold text-gray-800">{unitCounts.BALLOT_UNIT} {t('BU')}</span> |{' '}
                <span className="font-bold text-gray-800">{unitCounts.VVPAT} {t('VVPAT')}</span>
              </div>
              
              <Button
                onClick={() => setStep(2)}
                variant="primary"
                disabled={totalCount === 0}
                className="cursor-pointer font-bold shadow-sm text-xs"
              >
                <span className="flex items-center gap-1.5">
                  {t('Next: Select Destination')} <ArrowRight size={14} />
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DESTINATION SELECTION */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Selection form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide pb-2 border-b border-gray-100">
              {t('Select Destination & Details')}
            </h3>

            {/* Auto-filled sender info */}
            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-bold">{t('Shipping From Location')}</span>
              <div className="p-3 bg-gray-50 border rounded text-xs text-gray-600 font-sans mt-1">
                <span className="font-bold text-gray-700">{t('Origin Warehouse')}: </span>
                {getFromLocationName()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('Destination State')}
                value={toStateId}
                onChange={setToStateId}
                options={(statesQuery.data || []).map((s) => ({ label: s.stateName ?? s.StateName, value: s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '' }))}
                isLoading={statesQuery.isLoading}
                placeholder={t('Select State')}
                required
              />

              <Select
                label={t('Destination District')}
                value={toDistrictId}
                onChange={setToDistrictId}
                options={(districtsQuery.data || []).map((d) => ({ label: d.districtName ?? d.DistrictName, value: d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '' }))}
                disabled={!toStateId}
                isLoading={districtsQuery.isLoading}
                placeholder={toStateId ? t('Select District') : t('Select State First')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('Expected Arrival Date')}
                type="date"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />

              <Input
                label={t('Shipping Notes')}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t('E.g. Vehicle number, remarks...')}
                maxLength={500}
              />
            </div>

            <div className="pt-5 border-t border-gray-100 mt-6 flex justify-between">
              <Button onClick={() => setStep(1)} variant="secondary" className="cursor-pointer text-xs font-bold">
                <span className="flex items-center gap-1.5"><ArrowLeft size={14} /> {t('Back to Scanner')}</span>
              </Button>
              
              <Button
                onClick={submitDispatch}
                variant="primary"
                loading={isSubmitting}
                className="cursor-pointer text-xs font-bold shadow-md shadow-saffron-500/10"
              >
                <span className="flex items-center gap-1.5">{t('Confirm & Create Challan')}</span>
              </Button>
            </div>
          </div>

          {/* Right Panel: Side summary */}
          <div className="lg:col-span-1">
            <DispatchSummary
              fromLocation={{ stateName: user.stateName || 'Central', districtName: user.districtName }}
              toLocation={getToLocationName()}
              expectedArrival={expectedArrival}
              remarks={remarks}
              unitCounts={unitCounts}
            />
          </div>
        </div>
      )}

      {/* STEP 3: RESULT AND PRINT */}
      {step === 3 && createdBatch && (
        <div className="space-y-6">
          {/* Completion actions bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden select-none">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded shrink-0">
                <CheckCircle size={22} className="stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 font-sans">
                  {t('EVM Batch Sent Successfully!')}
                </h4>
                <p className="text-xs text-emerald-700 font-sans mt-0.5">
                  {t('Batch code')} <span className="font-mono font-bold text-navy-950 text-[11px] bg-white border border-emerald-250 px-1 py-0.5 rounded">{createdBatch.batchCode}</span> {t('has been written. Print and sign the challan before shipping.')}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 self-stretch sm:self-auto">
              <Button
                onClick={handlePrint}
                variant="primary"
                className="shadow-sm shrink-0 cursor-pointer text-xs font-bold"
              >
                <span className="flex items-center gap-1.5 justify-center">
                  <Printer size={14} /> {t('Print Gate Pass')}
                </span>
              </Button>
              
              <Button
                onClick={clearStaged}
                variant="secondary"
                className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700 shrink-0 cursor-pointer text-xs font-bold"
              >
                <span className="flex items-center gap-1.5 justify-center">
                  <RotateCcw size={14} /> {t('Send Another Batch')}
                </span>
              </Button>
            </div>
          </div>

          {/* Challan Preview Frame */}
          <div className="bg-white border border-gray-250 border-t-4 border-t-navy-950 rounded-lg shadow-sm p-4 relative overflow-auto max-h-[70vh]">
            <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-400 uppercase tracking-widest pointer-events-none select-none bg-gray-50 border px-1.5 py-0.5 rounded">
              {t('Gate Pass Preview')}
            </div>
            
            {/* Challan printable component */}
            <div className="border border-gray-200 rounded shadow-inner bg-gray-50/50 p-2.5 md:p-6 mt-4">
              <DispatchChallan
                ref={challanRef}
                batch={{
                  ...createdBatch,
                  fromStateName: user.stateName || 'Central',
                  fromDistrictName: user.districtName,
                  toStateName: getToLocationName().stateName,
                  toDistrictName: getToLocationName().districtName,
                  dispatchedByName: user.fullName,
                  dispatchedByCode: user.userCode,
                }}
                items={scannedUnits}
              />
            </div>
          </div>
        </div>
      )}

      <RegisterScannedUnitModal
        isOpen={!!unregisteredCode}
        onClose={() => setUnregisteredCode(null)}
        code={unregisteredCode}
        onRegisterSuccess={(newUnit) => {
          addRegisteredUnitToQueue(newUnit);
          addToast(`${t('Unit')} ${newUnit.unitCode} ${t('registered and added to consignment')}`, 'success');
        }}
      />
    </div>
  );
}
