import React from 'react';
import {
  MonthKey,
  MONTH_KEYS,
  formatCurrency,
  formatQAR,
} from '../data/villaDatabase';
import {
  Calendar,
  Building2,
  Zap,
  Droplets,
  Wrench,
  TrendingUp,
  TrendingDown,
  User,
  ChevronLeft,
  ChevronRight,
  Edit3,
  DollarSign,
  Plus,
  Scale,
  Sparkles,
} from 'lucide-react';

export interface MonthlyAggregateData {
  month: MonthKey;
  totalCollected: number;
  tenantsCollected: number;
  myRoomCollected: number;
  villaMasterRent: number;
  villaRentPaid: number;
  villaRentStatus: string;
  maintenanceCost: number;
  electricityBill: number;
  waterBill: number;
  totalUtilities: number;
  totalExpenses: number;
  profitWithoutMyRoom: number;
  profitWithMyRoom: number;
}

interface VillaMonthlySummaryCardProps {
  currentMonth: MonthKey;
  onSelectMonth: (month: MonthKey) => void;
  data: MonthlyAggregateData;
  onOpenEditElectricity: (month: MonthKey, meterNumber?: string) => void;
  onOpenEditMaintenance: (month: MonthKey) => void;
  onOpenEditVillaRent: (month: MonthKey) => void;
  onOpenEditWater: (month: MonthKey) => void;
}

export const VillaMonthlySummaryCard: React.FC<VillaMonthlySummaryCardProps> = ({
  currentMonth,
  onSelectMonth,
  data,
  onOpenEditElectricity,
  onOpenEditMaintenance,
  onOpenEditVillaRent,
  onOpenEditWater,
}) => {
  const currentIndex = MONTH_KEYS.indexOf(currentMonth);

  const handlePrevMonth = () => {
    if (currentIndex > 0) {
      onSelectMonth(MONTH_KEYS[currentIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex < MONTH_KEYS.length - 1) {
      onSelectMonth(MONTH_KEYS[currentIndex + 1]);
    }
  };

  const isProfit1Positive = data.profitWithoutMyRoom >= 0;
  const isProfit2Positive = data.profitWithMyRoom >= 0;

  return (
    <div
      id="monthly-summary-card"
      className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 shadow-xl transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Header Row: Month Selector & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Monthly Summary Dashboard</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700 font-mono font-bold">
                    {currentMonth} 2026
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Monthly aggregated rent, maintenance, utility costs &amp; dual-profit comparison
              </p>
            </div>
          </div>

          {/* Quick Month Switcher Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={currentIndex === 0}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
                {MONTH_KEYS.map((m) => {
                  const isSelected = m === currentMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSelectMonth(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={currentIndex === MONTH_KEYS.length - 1}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TWO PROMINENT DUAL PROFIT BOXES (REQUESTED BY USER)
            1. Profit Without My Room Rent
            2. Profit With My Room Rent
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* PROFIT 1: WITHOUT MY ROOM RENT */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isProfit1Positive
                ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                : 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/50 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border ${
                    isProfit1Positive
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                      : 'bg-rose-900/80 text-rose-200 border-rose-700'
                  }`}
                >
                  1. Profit (Without My Room)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Pure Tenants</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Tenants Received - Villa Rent
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isProfit1Positive ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {data.profitWithoutMyRoom >= 0 ? '+' : ''}
                {formatQAR(data.profitWithoutMyRoom)}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold font-mono">
                {isProfit1Positive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Surplus</span>
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>Shortfall</span>
                  </span>
                )}
              </div>
            </div>

            {/* Formula Breakdown Badge */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Tenants: <strong className="text-emerald-300">{formatCurrency(data.tenantsCollected)}</strong>
              </span>
              <span>-</span>
              <span>
                Villa Rent: <strong className="text-rose-300">{formatCurrency(data.villaMasterRent)}</strong>
              </span>
              <span>=</span>
              <span className={isProfit1Positive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {formatQAR(data.profitWithoutMyRoom)}
              </span>
            </div>
          </div>

          {/* PROFIT 2: WITH MY ROOM RENT */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isProfit2Positive
                ? 'bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border-blue-500/60 shadow-lg shadow-blue-950/30'
                : 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/50 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border ${
                    isProfit2Positive
                      ? 'bg-blue-900/80 text-blue-200 border-blue-700'
                      : 'bg-rose-900/80 text-rose-200 border-rose-700'
                  }`}
                >
                  2. Profit (With My Room 4,000)
                </span>
                <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Includes Room 12</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Total Received - Villa Rent
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isProfit2Positive ? 'text-blue-200' : 'text-rose-300'
                }`}
              >
                {data.profitWithMyRoom >= 0 ? '+' : ''}
                {formatQAR(data.profitWithMyRoom)}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold font-mono">
                {isProfit2Positive ? (
                  <span className="text-blue-400 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Net Gain</span>
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>Deficit</span>
                  </span>
                )}
              </div>
            </div>

            {/* Formula Breakdown Badge */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Total Received: <strong className="text-blue-300">{formatCurrency(data.totalCollected)}</strong>
              </span>
              <span>-</span>
              <span>
                Villa Rent: <strong className="text-rose-300">{formatCurrency(data.villaMasterRent)}</strong>
              </span>
              <span>=</span>
              <span className={isProfit2Positive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                {formatQAR(data.profitWithMyRoom)}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MONTHLY AGGREGATES: 4 ESSENTIAL PILLARS
            1. Total Rent Collected (Tenants + My Room)
            2. Villa Lease Rent (Paid to Landlord)
            3. Utility Costs (3 Electricity Meters + Water)
            4. Maintenance Cost
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Pillar 1: Total Rent Collected */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Total Rent Collected ({currentMonth})
              </span>
              <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                {formatQAR(data.totalCollected)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono">
              <span>Tenants: {formatCurrency(data.tenantsCollected)}</span>
              <span className="text-sky-400">My: +{formatCurrency(data.myRoomCollected)}</span>
            </div>
          </div>

          {/* Pillar 2: Villa Master Rent */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Total Villa Rent ({currentMonth})
                </span>
                <div className="text-lg font-black text-rose-300 font-mono mt-0.5">
                  {formatQAR(data.villaMasterRent)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenEditVillaRent(currentMonth)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Edit Total Villa Rent & Status"
              >
                <Edit3 className="h-3.5 w-3.5 text-rose-400" />
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span>Status:</span>
              <span
                className={`font-semibold px-1.5 py-0.2 rounded-xs text-[10px] ${
                  data.villaRentStatus === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300'
                    : data.villaRentStatus === 'Partial Paid'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {data.villaRentStatus}
              </span>
            </div>
          </div>

          {/* Pillar 3: Utility Costs (3 Electricity + 1 Water) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Utilities ({currentMonth})</span>
                </span>
                <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                  {formatQAR(data.totalUtilities)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenEditElectricity(currentMonth)}
                className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="Add/Edit 3 Electricity Bills (Choose Meter Number)"
              >
                <Edit3 className="h-3 w-3" />
                <span>3 Elec</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono">
              <span
                onClick={() => onOpenEditElectricity(currentMonth)}
                className="hover:text-amber-300 cursor-pointer underline"
              >
                3 Elec: {formatCurrency(data.electricityBill)}
              </span>
              <span
                onClick={() => onOpenEditWater(currentMonth)}
                className="hover:text-cyan-300 cursor-pointer underline text-cyan-400"
              >
                Water: {formatCurrency(data.waterBill)}
              </span>
            </div>
          </div>

          {/* Pillar 4: Maintenance Cost */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  <span>Maintenance ({currentMonth})</span>
                </span>
                <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
                  {formatQAR(data.maintenanceCost)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenEditMaintenance(currentMonth)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Edit Maintenance Cost"
              >
                <Edit3 className="h-3.5 w-3.5 text-purple-400" />
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span>{data.maintenanceCost === 0 ? 'Zero expense' : 'Repairs'}</span>
              <button
                type="button"
                onClick={() => onOpenEditMaintenance(currentMonth)}
                className="text-[10px] text-purple-400 hover:underline font-semibold cursor-pointer"
              >
                Update &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
