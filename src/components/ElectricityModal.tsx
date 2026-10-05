import React, { useState, useEffect } from 'react';
import {
  MonthKey,
  MONTH_KEYS,
  MeterMonthlyReading,
  formatCurrency,
  formatQAR,
} from '../data/villaDatabase';
import { Zap, X, Check, Calculator, AlertCircle, FileText } from 'lucide-react';

interface ElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: MonthKey;
  onMonthChange: (m: MonthKey) => void;
  readings: MeterMonthlyReading[];
  onSaveReadings: (updatedReadings: MeterMonthlyReading[]) => void;
  defaultMeterNumber?: string;
}

const ELECTRICITY_METERS = [
  {
    meterNumber: '148964',
    name: 'Electricity Meter 1',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    meterNumber: '148963',
    name: 'Electricity Meter 2',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  {
    meterNumber: '48073',
    name: 'Electricity Meter 3',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
];

export const ElectricityModal: React.FC<ElectricityModalProps> = ({
  isOpen,
  onClose,
  month,
  onMonthChange,
  readings,
  onSaveReadings,
  defaultMeterNumber,
}) => {
  // Option to choose electricity meter number: 'ALL' | '148964' | '148963' | '48073'
  const [chosenMeter, setChosenMeter] = useState<string>(defaultMeterNumber || 'ALL');

  // Form state for each of the 3 electricity meters
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        previousReading: number;
        currentReading: number;
        billAmountQAR: number;
        status: 'Paid' | 'Unpaid' | 'Pending';
        invoiceNo: string;
      }
    >
  >({});

  // Populate form data whenever month or readings change
  useEffect(() => {
    const data: typeof formData = {};
    ELECTRICITY_METERS.forEach((m) => {
      const existing = readings.find(
        (r) => r.meterNumber === m.meterNumber && r.month === month
      );
      if (existing) {
        data[m.meterNumber] = {
          previousReading: existing.previousReading || 0,
          currentReading: existing.currentReading || 0,
          billAmountQAR: existing.billAmountQAR || 0,
          status: existing.status || 'Paid',
          invoiceNo: existing.invoiceNo || '',
        };
      } else {
        data[m.meterNumber] = {
          previousReading: 0,
          currentReading: 0,
          billAmountQAR: 0,
          status: 'Pending',
          invoiceNo: '',
        };
      }
    });
    setFormData(data);
  }, [month, readings]);

  if (!isOpen) return null;

  const handleFieldChange = (
    meterNumber: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [meterNumber]: {
        ...prev[meterNumber],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const updatedList: MeterMonthlyReading[] = [];

    ELECTRICITY_METERS.forEach((m) => {
      const d = formData[m.meterNumber];
      if (!d) return;
      const units = Math.max(0, (Number(d.currentReading) || 0) - (Number(d.previousReading) || 0));

      const existing = readings.find(
        (r) => r.meterNumber === m.meterNumber && r.month === month
      );

      updatedList.push({
        id: existing?.id || `mr-${month}-${m.meterNumber}`,
        meterNumber: m.meterNumber,
        month,
        previousReading: Number(d.previousReading) || 0,
        currentReading: Number(d.currentReading) || 0,
        unitsConsumed: units,
        billAmountQAR: Number(d.billAmountQAR) || 0,
        status: d.status,
        invoiceNo: d.invoiceNo?.trim() || '',
      });
    });

    onSaveReadings(updatedList);
    onClose();
  };

  // Calculate live total across all 3 electricity meters
  const totalElecBill = ELECTRICITY_METERS.reduce((sum, m) => {
    return sum + (Number(formData[m.meterNumber]?.billAmountQAR) || 0);
  }, 0);

  const metersToDisplay =
    chosenMeter === 'ALL'
      ? ELECTRICITY_METERS
      : ELECTRICITY_METERS.filter((m) => m.meterNumber === chosenMeter);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Add / Edit Electricity Bills</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-mono font-bold">
                  {month}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose electricity meter number &amp; add all 3 monthly bills
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Month Selector Pills */}
        <div className="mb-4">
          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
            Select Month
          </label>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {MONTH_KEYS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMonthChange(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  m === month
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* OPTION TO CHOOSE ELECTRICITY NUMBER (Requested by User) */}
        <div className="mb-5">
          <label className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center justify-between">
            <span>Choose Electricity Meter Number</span>
            <span className="text-slate-400 normal-case font-normal text-[11px]">
              Switch tab to edit individual meter or all 3
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setChosenMeter('ALL')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                chosenMeter === 'ALL'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>All 3 Meters</span>
            </button>

            {ELECTRICITY_METERS.map((m) => (
              <button
                key={m.meterNumber}
                type="button"
                onClick={() => setChosenMeter(m.meterNumber)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                  chosenMeter === m.meterNumber
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="font-mono text-xs">#{m.meterNumber}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {m.name.replace('Electricity ', '')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Meter Forms */}
        <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
          {metersToDisplay.map((m) => {
            const currentData = formData[m.meterNumber] || {
              previousReading: 0,
              currentReading: 0,
              billAmountQAR: 0,
              status: 'Paid',
              invoiceNo: '',
            };
            const units = Math.max(
              0,
              (Number(currentData.currentReading) || 0) -
                (Number(currentData.previousReading) || 0)
            );

            return (
              <div
                key={m.meterNumber}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${m.badgeColor}`}
                    >
                      Meter #{m.meterNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {m.name}
                    </span>
                  </div>

                  {/* Status toggle */}
                  <div className="flex items-center gap-1">
                    {(['Paid', 'Pending', 'Unpaid'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          handleFieldChange(m.meterNumber, 'status', st)
                        }
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                          currentData.status === st
                            ? st === 'Paid'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : st === 'Pending'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-rose-950 text-rose-300 border-rose-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Previous Reading */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Previous Reading (kWh)
                    </label>
                    <input
                      type="number"
                      value={currentData.previousReading || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          m.meterNumber,
                          'previousReading',
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Current Reading */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Current Reading (kWh)
                    </label>
                    <input
                      type="number"
                      value={currentData.currentReading || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          m.meterNumber,
                          'currentReading',
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Units Consumed badge */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Units Consumed
                    </label>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 flex items-center justify-between">
                      <span>{formatCurrency(units)}</span>
                      <span className="text-[10px] text-slate-500 font-normal">kWh</span>
                    </div>
                  </div>
                </div>

                {/* Bill Amount QAR & Invoice Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-amber-300 block mb-1 font-bold">
                      Bill Amount (QAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">
                        QAR
                      </span>
                      <input
                        type="number"
                        value={currentData.billAmountQAR || ''}
                        onChange={(e) =>
                          handleFieldChange(
                            m.meterNumber,
                            'billAmountQAR',
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-slate-900 border border-amber-600/60 rounded-lg pl-12 pr-3 py-1.5 text-sm text-white font-mono font-bold focus:outline-hidden focus:border-amber-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Kahramaa Invoice / Bill #
                    </label>
                    <input
                      type="text"
                      value={currentData.invoiceNo || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          m.meterNumber,
                          'invoiceNo',
                          e.target.value
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                      placeholder="e.g. KAH-98421"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Total 3 Meters Aggregation Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 font-mono">
              <span>Meters Total ({month}): </span>
              <strong className="text-amber-300 text-sm font-bold">
                QAR {formatCurrency(totalElecBill)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Save 3 Electricity Bills</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
