import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  PersonalTransaction,
  EXPENSE_CATEGORIES,
  MONTH_NAMES,
} from '../data/personalFinanceData';
import {
  PieChart as PieIcon,
  Layers,
  Calendar,
  Plus,
  Car,
  UtensilsCrossed,
  ShoppingCart,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../data/villaDatabase';

export interface PersonalFinanceExpensePieChartProps {
  transactions: PersonalTransaction[];
  selectedMonth?: string;
  selectedYear?: number;
  onMonthChange?: (month: string) => void;
  onAddExpense?: () => void;
  compact?: boolean;
}

// Color palette curated for high contrast in dark theme
const CATEGORY_COLORS: Record<string, string> = {
  car: '#f43f5e', // Rose / Maroon for Car 565816
  grocery: '#10b981', // Emerald for Grocery
  food: '#f59e0b', // Amber for Food & Dining
  maid_salary: '#8b5cf6', // Violet for House Maid Salary
  school_fees: '#3b82f6', // Sky Blue for School
  madrasa_fees: '#6366f1', // Indigo for Madrasa
  dress: '#ec4899', // Pink for Dress & Shopping
  hospital: '#06b6d4', // Cyan for Medical
  villa_maintenance: '#14b8a6', // Teal for Villa
  entertainment: '#eab308', // Yellow for Entertainment
  miscellaneous: '#64748b', // Slate for Misc
  other_expense: '#94a3b8',
};

const FALLBACK_PALETTE = [
  '#f43f5e',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#3b82f6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#eab308',
  '#a855f7',
  '#64748b',
];

interface PieCategoryData {
  name: string;
  categoryKey: string;
  value: number;
  percent: number;
  count: number;
  color: string;
  icon?: string;
}

export const PersonalFinanceExpensePieChart: React.FC<PersonalFinanceExpensePieChartProps> = ({
  transactions,
  selectedMonth = 'OCT',
  selectedYear = 2026,
  onMonthChange,
  onAddExpense,
  compact = false,
}) => {
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth);
  const [groupCarExpenses, setGroupCarExpenses] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Sync with prop if provided
  const currentMonth = onMonthChange ? selectedMonth : activeMonth;

  // Filter transactions for expense type and current month/year
  const monthlyExpenses = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.type === 'expense' &&
        t.month === currentMonth &&
        (selectedYear ? t.year === selectedYear : true)
    );
  }, [transactions, currentMonth, selectedYear]);

  // Aggregate by category
  const { chartData, totalExpense, topCategory } = useMemo(() => {
    let total = 0;
    const categoryTotals: Record<string, { value: number; count: number; name: string }> = {};

    monthlyExpenses.forEach((t) => {
      total += t.amount;
      const catLower = (t.category || '').toLowerCase();

      // Check if this is a Car 565816 / Car expense
      const isCar =
        catLower.startsWith('car_') ||
        catLower.includes('565816') ||
        (t.reason || '').toLowerCase().includes('565816') ||
        (t.source || '').toLowerCase().includes('565816');

      let groupKey = t.category;
      let displayName =
        EXPENSE_CATEGORIES.find((c) => c.id === t.category)?.label || t.category;

      if (groupCarExpenses && isCar) {
        groupKey = 'car_565816_combined';
        displayName = 'Car 565816 Expenses';
      } else if (catLower === 'food') {
        displayName = 'Food & Dining';
      } else if (catLower === 'grocery') {
        displayName = 'Grocery & Provisions';
      } else if (catLower === 'maid_salary') {
        displayName = 'House Maid Salary';
      } else if (catLower === 'school_fees') {
        displayName = 'School Fees';
      } else if (catLower === 'madrasa_fees') {
        displayName = 'Madrasa Fees';
      } else if (catLower === 'dress') {
        displayName = 'Dress & Shopping';
      }

      if (!categoryTotals[groupKey]) {
        categoryTotals[groupKey] = {
          value: 0,
          count: 0,
          name: displayName,
        };
      }
      categoryTotals[groupKey].value += t.amount;
      categoryTotals[groupKey].count += 1;
    });

    const items: PieCategoryData[] = Object.entries(categoryTotals)
      .map(([key, data], idx) => {
        const percent = total > 0 ? Math.round((data.value / total) * 1000) / 10 : 0;
        let color = FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];

        if (key.includes('car')) color = CATEGORY_COLORS.car;
        else if (key === 'food') color = CATEGORY_COLORS.food;
        else if (key === 'grocery') color = CATEGORY_COLORS.grocery;
        else if (key === 'maid_salary') color = CATEGORY_COLORS.maid_salary;
        else if (key === 'school_fees') color = CATEGORY_COLORS.school_fees;
        else if (key === 'madrasa_fees') color = CATEGORY_COLORS.madrasa_fees;
        else if (key === 'dress') color = CATEGORY_COLORS.dress;
        else if (CATEGORY_COLORS[key]) color = CATEGORY_COLORS[key];

        return {
          name: data.name,
          categoryKey: key,
          value: data.value,
          percent,
          count: data.count,
          color,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      chartData: items,
      totalExpense: total,
      topCategory: items[0] || null,
    };
  }, [monthlyExpenses, groupCarExpenses]);

  const handleMonthSelect = (m: string) => {
    if (onMonthChange) {
      onMonthChange(m);
    } else {
      setActiveMonth(m);
    }
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PieCategoryData;
      return (
        <div className="bg-slate-950/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[200px] z-50 pointer-events-none">
          <div className="flex items-center gap-2 font-bold text-white pb-2 mb-2 border-b border-slate-800">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: data.color }}
            />
            <span className="truncate">{data.name}</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Total Spend:</span>
              <span className="font-mono font-bold text-white text-sm">
                QAR {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Monthly Share:</span>
              <span className="font-mono font-bold text-emerald-400">
                {data.percent}%
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Entries:</span>
              <span className="font-mono text-slate-300">{data.count} items</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="personal-finance-expense-pie-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
    >
      {/* Header with Title and Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <PieIcon className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Personal Finance Expenses by Category
            </h2>
            <span className="text-xs font-semibold text-emerald-400">
              · {currentMonth} {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Category distribution breakdown (Food, Grocery, Car 565816, Staff, etc.) for the current month
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Group Car toggle */}
          <button
            type="button"
            onClick={() => setGroupCarExpenses((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              groupCarExpenses
                ? 'bg-rose-950/80 border-rose-700/80 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Consolidate Car 565816 petrol, maintenance, wash into a single slice"
          >
            <Car className="h-3 w-3" />
            <span>{groupCarExpenses ? 'Car Consolidated' : 'Detailed Car Items'}</span>
          </button>

          {/* Month Selector Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {MONTH_NAMES.slice(8, 12).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMonthSelect(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  currentMonth === m
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {onAddExpense && (
            <button
              type="button"
              onClick={onAddExpense}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <PieIcon className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            No expenses recorded for {currentMonth} {selectedYear}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log your family groceries, food, car petrol, or household maintenance to visualize the expense breakdown.
          </p>
          {onAddExpense && (
            <button
              type="button"
              onClick={onAddExpense}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Log Expense for {currentMonth}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left/Center: Recharts Pie Chart with Center Stats */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    animationDuration={600}
                  >
                    {chartData.map((entry, index) => {
                      const isHovered = activeIndex === index;
                      const hasHover = activeIndex !== null;
                      return (
                        <Cell
                          key={`cell-${entry.categoryKey}-${index}`}
                          fill={entry.color}
                          stroke={isHovered ? '#ffffff' : '#0f172a'}
                          strokeWidth={isHovered ? 3 : 2}
                          opacity={hasHover ? (isHovered ? 1 : 0.5) : 1}
                          style={{
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Central Donut Stat */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Expenses
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono leading-tight">
                QAR {formatCurrency(totalExpense)}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {currentMonth} {selectedYear}
              </span>
            </div>
          </div>

          {/* Right: Category Legend & Details Breakdown */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Category</span>
              <div className="flex items-center gap-4">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Amount (QAR)</span>
                <span className="font-semibold uppercase tracking-wider text-[10px] w-12 text-right">Share</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {chartData.map((item, index) => {
                const isHovered = activeIndex === index;
                return (
                  <div
                    key={item.categoryKey}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                      isHovered
                        ? 'bg-slate-800/90 border-slate-700 shadow-md scale-[1.01]'
                        : 'bg-slate-950/60 border-slate-800/70 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="font-mono text-xs font-bold text-slate-100">
                        QAR {formatCurrency(item.value)}
                      </div>
                      <div className="w-12 text-right">
                        <span
                          className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            color: item.color,
                            backgroundColor: `${item.color}15`,
                          }}
                        >
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick summary highlights */}
            {topCategory && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>
                    Highest expense this month:{' '}
                    <strong className="text-white">{topCategory.name}</strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-300">
                  QAR {formatCurrency(topCategory.value)} ({topCategory.percent}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
