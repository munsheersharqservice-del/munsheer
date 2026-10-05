import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart3,
  Hash,
  Database,
  Layers,
  TrendingUp,
  Tag,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { SheetTable } from '../types';
import { PersonalFinanceExpensePieChart } from './PersonalFinanceExpensePieChart';
import { PersonalTransaction, INITIAL_TRANSACTIONS } from '../data/personalFinanceData';

interface AnalyticsViewProps {
  table: SheetTable;
  personalTransactions?: PersonalTransaction[];
  onNavigateToPersonalFinance?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  table,
  personalTransactions,
  onNavigateToPersonalFinance,
}) => {
  // Load personal finance transactions from prop or localStorage with fallback
  const [personalTxs, setPersonalTxs] = useState<PersonalTransaction[]>(() => {
    if (personalTransactions && personalTransactions.length > 0) {
      return personalTransactions;
    }
    const saved = localStorage.getItem('personal_finance_txs_october_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved personal finance txs', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    if (personalTransactions && personalTransactions.length > 0) {
      setPersonalTxs(personalTransactions);
    }
  }, [personalTransactions]);
  const columns = useMemo(() => {
    return table.columns.filter((c) => !c.key.startsWith('_'));
  }, [table]);

  // Find categorical column for breakdown
  const categoryCol = useMemo(() => {
    return (
      columns.find((c) => c.type === 'status') ||
      columns.find((c) => c.key.toLowerCase().includes('category')) ||
      columns.find((c) => c.key.toLowerCase().includes('department')) ||
      columns.find((c) => c.key.toLowerCase().includes('stage')) ||
      columns[0]
    );
  }, [columns]);

  // Compute distribution of the category column
  const distribution = useMemo(() => {
    if (!categoryCol) return [];
    const counts: Record<string, number> = {};
    for (const r of table.rows) {
      const val = String(r[categoryCol.key] || 'Unassigned');
      counts[val] = (counts[val] || 0) + 1;
    }
    const total = table.rows.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [table, categoryCol]);

  // Find numeric or currency columns for sum / average
  const numericMetrics = useMemo(() => {
    const numCols = columns.filter((c) => c.type === 'number' || c.type === 'currency');
    return numCols.map((col) => {
      let sum = 0;
      let validCount = 0;
      for (const r of table.rows) {
        const val = r[col.key];
        if (val !== undefined && val !== null && val !== '') {
          const num = Number(String(val).replace(/[\$,QARqarQRqrر\.ق]/g, ''));
          if (!isNaN(num)) {
            sum += num;
            validCount++;
          }
        }
      }
      const avg = validCount > 0 ? sum / validCount : 0;
      const isCurr = col.type === 'currency';
      return {
        label: col.label,
        sum: isCurr ? `QAR ${sum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : sum.toLocaleString(),
        avg: isCurr ? `QAR ${avg.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : avg.toFixed(1),
        count: validCount,
      };
    });
  }, [table, columns]);

  // Column quality metrics
  const columnStats = useMemo(() => {
    const total = table.rows.length || 1;
    return columns.map((col) => {
      const filledCount = table.rows.filter(
        (r) => r[col.key] !== undefined && r[col.key] !== null && String(r[col.key]).trim() !== ''
      ).length;
      const fillRate = Math.round((filledCount / total) * 100);
      return {
        ...col,
        fillRate,
      };
    });
  }, [table, columns]);

  const palette = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  // Chart Open/Close Option State (Requested by user)
  const [showCharts, setShowCharts] = useState<boolean>(true);

  return (
    <div id="analytics-view-container" className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner with Chart Open/Close Option */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">
            <span>Visual Analytics</span> &bull; <span>Telemetry Hub</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <span>Financial & Database Charts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual pie charts, category breakdown distributions, and database schema analytics
          </p>
        </div>

        {/* Open / Close Chart Button */}
        <button
          type="button"
          onClick={() => setShowCharts((prev) => !prev)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
            showCharts
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
              : 'bg-slate-950 text-purple-300 border-slate-700 hover:text-white hover:border-purple-500/60'
          }`}
          title={showCharts ? 'Close all charts to save vertical space' : 'Open all charts'}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{showCharts ? 'Close Charts ▲' : 'Open Charts 📊'}</span>
        </button>
      </div>

      {/* Dedicated Personal Finance Expense Pie Chart with Open/Close */}
      {showCharts ? (
        <PersonalFinanceExpensePieChart
          transactions={personalTxs}
          selectedMonth="OCT"
          selectedYear={2026}
          onAddExpense={onNavigateToPersonalFinance}
        />
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300 min-w-0">
            <BarChart3 className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="truncate">
              <strong>Visual Charts are Closed</strong> • Click Open Charts to view visual pie chart & category spending distribution
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCharts(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Open Charts 📊</span>
          </button>
        </div>
      )}

      {/* Database Schema & Sheet Metrics Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <span>Active Sheet Telemetry & Schema Analysis: {table.name}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time record density, column statistics, and inferred data distributions
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Records</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{table.rows.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">In active sheet: {table.name}</p>
        </div>

        {/* Total Columns / Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Schema Fields</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{columns.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Inferred attributes</p>
        </div>

        {/* Primary Metric 1 */}
        {numericMetrics.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">
                Total {numericMetrics[0].label}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 truncate">
              {numericMetrics[0].sum}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Avg: {numericMetrics[0].avg} across {numericMetrics[0].count} items
            </p>
          </div>
        )}

        {/* Primary Metric 2 or Category count */}
        {numericMetrics.length > 1 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">
                Total {numericMetrics[1].label}
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Hash className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 truncate">
              {numericMetrics[1].sum}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Avg: {numericMetrics[1].avg}</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Distinct Groups</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{distribution.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              By {categoryCol ? categoryCol.label : 'category'}
            </p>
          </div>
        )}
      </div>

      {/* Charts & Distribution Section */}
      <div className={`grid grid-cols-1 ${showCharts ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* Category Breakdown Bar Chart (Only when showCharts is true) */}
        {showCharts && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Distribution by {categoryCol ? categoryCol.label : 'Category'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proportion of database records grouped by values
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {distribution.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[200px]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <span>{item.count} items</span>
                      <span className="text-slate-200 font-semibold">{item.percent}%</span>
                    </div>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        palette[idx % palette.length]
                      }`}
                      style={{ width: `${Math.max(item.percent, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Quality & Schema Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                Database Schema & Completeness
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Column data types, uniqueness, and data fill rates
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] sticky top-0 bg-slate-900">
                <tr>
                  <th className="py-2 px-3">Column Name</th>
                  <th className="py-2 px-3">Detected Type</th>
                  <th className="py-2 px-3">Unique</th>
                  <th className="py-2 px-3 text-right">Completeness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {columnStats.map((col) => (
                  <tr key={col.key} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-medium text-slate-200">{col.label}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono uppercase text-slate-300">
                        {col.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">
                      {col.uniqueValues ?? '-'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono text-slate-300">{col.fillRate}%</span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              col.fillRate > 90
                                ? 'bg-emerald-500'
                                : col.fillRate > 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${col.fillRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
