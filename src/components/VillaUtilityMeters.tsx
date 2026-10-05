import React, { useState } from 'react';
import {
  VILLA_METERS,
  MeterMonthlyReading,
  MonthKey,
  formatCurrency,
  formatQAR,
} from '../data/villaDatabase';
import { Zap, Droplets, Edit2, CheckCircle2, Clock, AlertCircle, Plus, Check } from 'lucide-react';

interface VillaUtilityMetersProps {
  selectedMonth: MonthKey;
  readings: MeterMonthlyReading[];
  onUpdateReading: (updated: MeterMonthlyReading) => void;
  compact?: boolean;
}

export const VillaUtilityMeters: React.FC<VillaUtilityMetersProps> = ({
  selectedMonth,
  readings,
  onUpdateReading,
  compact = false,
}) => {
  const [editingReading, setEditingReading] = useState<MeterMonthlyReading | null>(null);

  // Form state
  const [prevVal, setPrevVal] = useState<number>(0);
  const [currVal, setCurrVal] = useState<number>(0);
  const [billVal, setBillVal] = useState<number>(0);
  const [statusVal, setStatusVal] = useState<'Paid' | 'Unpaid' | 'Pending'>('Paid');
  const [invoiceVal, setInvoiceVal] = useState<string>('');

  const openEditor = (meterNumber: string) => {
    const existing = readings.find(
      (r) => r.meterNumber === meterNumber && r.month === selectedMonth
    );

    if (existing) {
      setEditingReading(existing);
      setPrevVal(existing.previousReading);
      setCurrVal(existing.currentReading);
      setBillVal(existing.billAmountQAR);
      setStatusVal(existing.status);
      setInvoiceVal(existing.invoiceNo || '');
    } else {
      const defaultNew: MeterMonthlyReading = {
        id: `mr-${selectedMonth}-${meterNumber}`,
        meterNumber,
        month: selectedMonth,
        previousReading: 0,
        currentReading: 0,
        unitsConsumed: 0,
        billAmountQAR: 0,
        status: 'Pending',
        invoiceNo: '',
      };
      setEditingReading(defaultNew);
      setPrevVal(0);
      setCurrVal(0);
      setBillVal(0);
      setStatusVal('Pending');
      setInvoiceVal('');
    }
  };

  const handleSave = () => {
    if (!editingReading) return;
    const units = Math.max(0, currVal - prevVal);
    const updated: MeterMonthlyReading = {
      ...editingReading,
      previousReading: Number(prevVal) || 0,
      currentReading: Number(currVal) || 0,
      unitsConsumed: units,
      billAmountQAR: Number(billVal) || 0,
      status: statusVal,
      invoiceNo: invoiceVal.trim(),
    };
    onUpdateReading(updated);
    setEditingReading(null);
  };

  // Month totals
  const monthReadings = VILLA_METERS.map((meter) => {
    return (
      readings.find((r) => r.meterNumber === meter.meterNumber && r.month === selectedMonth) || {
        id: `mr-${selectedMonth}-${meter.meterNumber}`,
        meterNumber: meter.meterNumber,
        month: selectedMonth,
        previousReading: 0,
        currentReading: 0,
        unitsConsumed: 0,
        billAmountQAR: 0,
        status: 'Pending' as const,
      }
    );
  });

  const totalElecBill = monthReadings
    .filter((_, idx) => VILLA_METERS[idx].type === 'Electricity')
    .reduce((sum, r) => sum + r.billAmountQAR, 0);

  const waterBill = monthReadings
    .filter((_, idx) => VILLA_METERS[idx].type === 'Water')
    .reduce((sum, r) => sum + r.billAmountQAR, 0);

  const totalUtilityBill = totalElecBill + waterBill;

  if (compact) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              4 Utility Meters (3 Electricity & 1 Water)
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-300">
            {formatQAR(totalUtilityBill)}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VILLA_METERS.map((meter) => {
            const rd = monthReadings.find((r) => r.meterNumber === meter.meterNumber);
            return (
              <div
                key={meter.meterNumber}
                className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-[11px]"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300">{meter.label}</span>
                  <span className="font-mono text-[10px] text-amber-400">#{meter.meterNumber}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {rd ? `${rd.unitsConsumed} ${meter.type === 'Electricity' ? 'kWh' : 'm³'}` : '-'}
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {rd ? formatQAR(rd.billAmountQAR) : 'QAR 0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span>Electricity & Water Meters ({selectedMonth})</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
              3 Electricity + 1 Water Meter
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Meters: Electricity <strong className="text-slate-200">#148964</strong>,{' '}
            <strong className="text-slate-200">#148963</strong>,{' '}
            <strong className="text-slate-200">#48073</strong> &bull; Water{' '}
            <strong className="text-slate-200">#90978</strong>
          </p>
        </div>

        {/* Bill Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">
              3 Electricity Meters
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {formatQAR(totalElecBill)}
            </span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">
              1 Water Meter
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {formatQAR(waterBill)}
            </span>
          </div>
          <div className="bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-600/40 text-right">
            <span className="text-[10px] uppercase text-amber-300 block font-bold">
              Total {selectedMonth} Bill
            </span>
            <span className="text-sm font-mono font-black text-amber-200">
              {formatQAR(totalUtilityBill)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Meter Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VILLA_METERS.map((meter) => {
          const rd = monthReadings.find((r) => r.meterNumber === meter.meterNumber);
          const isElec = meter.type === 'Electricity';

          return (
            <div
              key={meter.meterNumber}
              className={`bg-slate-950 rounded-xl p-4 border transition-all hover:border-slate-700 flex flex-col justify-between ${
                isElec ? 'border-amber-500/20' : 'border-cyan-500/20'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isElec
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {isElec ? <Zap className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{meter.label}</h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        Meter #{meter.meterNumber}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rd?.status === 'Paid'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : rd?.status === 'Pending'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {rd?.status || 'Pending'}
                  </span>
                </div>

                {/* Readings Info */}
                <div className="space-y-1.5 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Previous:</span>
                    <span className="font-mono text-slate-300">
                      {rd?.previousReading?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {rd?.currentReading?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-slate-300">
                    <span>Units Used:</span>
                    <span className="font-mono font-bold text-white">
                      {rd?.unitsConsumed?.toLocaleString() || '0'} {isElec ? 'kWh' : 'm³'}
                    </span>
                  </div>
                </div>

                {/* Bill Amount */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Bill Amount:</span>
                  <span className="text-sm font-mono font-bold text-amber-300">
                    {rd ? formatQAR(rd.billAmountQAR) : 'QAR 0'}
                  </span>
                </div>
                {rd?.invoiceNo && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Inv: {rd.invoiceNo}
                  </div>
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={() => openEditor(meter.meterNumber)}
                className="w-full mt-3 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-800"
              >
                <Edit2 className="h-3 w-3 text-amber-400" />
                <span>Update Reading / Bill</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Meter Reading Edit Modal */}
      {editingReading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Update Meter #{editingReading.meterNumber}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedMonth} &bull;{' '}
                  {VILLA_METERS.find((m) => m.meterNumber === editingReading.meterNumber)?.label}
                </span>
              </div>
              <button
                onClick={() => setEditingReading(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Previous Meter Reading</label>
                <input
                  type="number"
                  value={prevVal || ''}
                  onChange={(e) => setPrevVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Current Meter Reading</label>
                <input
                  type="number"
                  value={currVal || ''}
                  onChange={(e) => setCurrVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Consumption:</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.max(0, currVal - prevVal).toLocaleString()}{' '}
                  {VILLA_METERS.find((m) => m.meterNumber === editingReading.meterNumber)?.type ===
                  'Electricity'
                    ? 'kWh'
                    : 'm³'}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Kahramaa Bill Amount (QAR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={billVal || ''}
                    onChange={(e) => setBillVal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Payment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Pending', 'Unpaid'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusVal(st)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        statusVal === st
                          ? st === 'Paid'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : st === 'Pending'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Kahramaa Invoice / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. KAH-98421"
                  value={invoiceVal}
                  onChange={(e) => setInvoiceVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingReading(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Save Reading</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
