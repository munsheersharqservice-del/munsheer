import React, { useMemo } from 'react';
import {
  DollarSign,
  Wrench,
  Zap,
  Droplets,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { SheetTable } from '../types';

interface VillaFinancialSummaryProps {
  table: SheetTable;
}

export const VillaFinancialSummary: React.FC<VillaFinancialSummaryProps> = ({ table }) => {
  const stats = useMemo(() => {
    let totalRent = 0;
    let totalMaintenance = 0;
    let totalElectricity = 0;
    let totalWater = 0;

    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const parseMoney = (val: any): number => {
      if (!val) return 0;
      const clean = String(val).replace(/[\$,QARqarQRqrر\.ق]/g, '').trim();
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : n;
    };

    for (const row of table.rows) {
      // Find rent field
      const rent = parseMoney(
        row['Rent Collected'] || row['Rent'] || row['Monthly Rent'] || row['Amount']
      );
      // Find maintenance field
      const maint = parseMoney(
        row['Maintenance Cost'] || row['Maintenance'] || row['Maintenance Expenses'] || row['Cost']
      );
      // Find electricity field
      const elec = parseMoney(
        row['Electricity Bill'] || row['Electricity'] || row['Power Bill']
      );
      // Find water field
      const water = parseMoney(
        row['Water Bill'] || row['Water']
      );

      totalRent += rent;
      totalMaintenance += maint;
      totalElectricity += elec;
      totalWater += water;

      // Status
      const status = String(row['Rent Status'] || row['Status'] || '').toLowerCase();
      if (status.includes('paid')) paidCount++;
      else if (status.includes('overdue')) overdueCount++;
      else if (status.includes('pending') || status.includes('partial')) pendingCount++;
    }

    const totalUtilities = totalElectricity + totalWater;
    const totalExpenses = totalMaintenance + totalUtilities;
    const totalProfit = totalRent - totalExpenses;
    const profitMargin = totalRent > 0 ? (totalProfit / totalRent) * 100 : 0;
    const collectionRate = table.rows.length > 0 ? Math.round((paidCount / table.rows.length) * 100) : 0;

    return {
      totalRent,
      totalMaintenance,
      totalElectricity,
      totalWater,
      totalUtilities,
      totalExpenses,
      totalProfit,
      profitMargin,
      paidCount,
      pendingCount,
      overdueCount,
      collectionRate,
      villasCount: table.rows.length,
    };
  }, [table]);

  const format = (num: number) =>
    `QAR ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div id="villa-financial-summary" className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
      {/* 5 Top KPI Cards: Rent, Maintenance, Electricity, Water, Total Profit */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Rent Collected */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Rent Collected</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
              {format(stats.totalRent)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span className="text-emerald-400 font-medium">{stats.collectionRate}%</span>
              <span>collected ({stats.paidCount}/{stats.villasCount} villas)</span>
            </div>
          </div>
        </div>

        {/* 2. Maintenance Costs */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Maintenance</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
              {format(stats.totalMaintenance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Repairs & scheduled service
            </div>
          </div>
        </div>

        {/* 3. Electricity Bill */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Electricity</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400 font-mono">
              {format(stats.totalElectricity)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Power & AC consumption
            </div>
          </div>
        </div>

        {/* 4. Water Bill */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Water Bill</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">
              {format(stats.totalWater)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Mains & irrigation supply
            </div>
          </div>
        </div>

        {/* 5. Total Net Profit */}
        <div className="col-span-2 sm:col-span-1 bg-linear-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/40 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              Total Net Profit
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{format(stats.totalProfit)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
              <Percent className="h-3 w-3" />
              <span>{stats.profitMargin.toFixed(1)}% net profit margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini status indicator row */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <strong>{stats.paidCount}</strong> Paid
          </span>
          {stats.pendingCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <strong>{stats.pendingCount}</strong> Pending
            </span>
          )}
          {stats.overdueCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <strong>{stats.overdueCount}</strong> Overdue
            </span>
          )}
        </div>

        <div className="text-slate-400 text-[11px]">
          Formula: <span className="font-mono text-slate-300">Total Profit = Rent - (Maintenance + Electricity + Water)</span>
        </div>
      </div>
    </div>
  );
};
