import React, { useState } from 'react';
import { MonthKey, formatCurrency, formatQAR, RentPaymentStatus } from '../data/villaDatabase';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export interface MonthChartItem {
  month: MonthKey;
  received: number;
  totalRent: number;
  profit: number;
  rentStatus?: RentPaymentStatus;
}

interface VillaMonthlyChartProps {
  data: MonthChartItem[];
  selectedMonth: MonthKey;
  onSelectMonth: (month: MonthKey) => void;
}

export const VillaMonthlyChart: React.FC<VillaMonthlyChartProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<MonthKey | null>(null);

  // Determine scaling
  const maxFinancialVal = Math.max(
    ...data.map((d) => Math.max(d.received, d.totalRent)),
    28000
  );

  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 25;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  // Total summary for header
  const totalReceivedAll = data.reduce((sum, d) => sum + d.received, 0);
  const totalRentAll = data.reduce((sum, d) => sum + d.totalRent, 0);
  const totalProfitAll = totalReceivedAll - totalRentAll;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-6">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Monthly Financial Chart (Received vs Total Rent vs Profit)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
              Formula: Received - Total Rent = Profit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any month to inspect detailed room collections, landlord payment status, and Kahramaa meter readings
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 shadow-xs" />
            <span>Received (Tenant Rent)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="h-3 w-3 rounded-xs bg-rose-500 shadow-xs" />
            <span>Total Rent (Villa Lease)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 border border-white/50" />
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      {/* Responsive Bar & Line Chart Container */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 760 ${chartHeight}`}
            className="w-full h-56 select-none overflow-visible"
          >
            {/* Background Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + usableHeight * (1 - pct);
              const val = Math.round(maxFinancialVal * pct);
              return (
                <g key={i}>
                  <line
                    x1="45"
                    y1={y}
                    x2="745"
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray={pct === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x="40"
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {val === 0 ? '0' : `${Math.round(val / 1000)}k`}
                  </text>
                </g>
              );
            })}

            {/* Bars and Line Points for each month */}
            {data.map((item, index) => {
              const xCenter = 75 + index * 60;
              const isSelected = selectedMonth === item.month;
              const isHovered = hoveredMonth === item.month;

              // Bar Heights
              const receivedHeight = (item.received / maxFinancialVal) * usableHeight;
              const rentHeight = (item.totalRent / maxFinancialVal) * usableHeight;

              const yReceived = paddingTop + usableHeight - receivedHeight;
              const yRent = paddingTop + usableHeight - rentHeight;

              // Profit dot position (can be negative or positive)
              // Profit zero line is at usableHeight bottom
              const profitHeight = (Math.max(0, item.profit) / maxFinancialVal) * usableHeight;
              const yProfit = paddingTop + usableHeight - profitHeight;

              return (
                <g
                  key={item.month}
                  className="cursor-pointer transition-opacity"
                  onClick={() => onSelectMonth(item.month)}
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Selection / Hover column highlight */}
                  {(isSelected || isHovered) && (
                    <rect
                      x={xCenter - 26}
                      y={paddingTop - 10}
                      width={52}
                      height={usableHeight + 25}
                      rx={8}
                      fill={isSelected ? '#059669' : '#334155'}
                      fillOpacity={isSelected ? 0.15 : 0.1}
                      stroke={isSelected ? '#10b981' : '#64748b'}
                      strokeWidth={1}
                      strokeDasharray={isSelected ? 'none' : '2 2'}
                    />
                  )}

                  {/* Received Bar (Green) */}
                  <rect
                    x={xCenter - 18}
                    y={yReceived}
                    width={16}
                    height={Math.max(2, receivedHeight)}
                    rx={3}
                    className="transition-all duration-300"
                    fill={isSelected ? '#10b981' : '#059669'}
                    fillOpacity={isHovered ? 1 : 0.85}
                  />

                  {/* Total Rent Bar (Rose) */}
                  <rect
                    x={xCenter + 2}
                    y={yRent}
                    width={16}
                    height={Math.max(2, rentHeight)}
                    rx={3}
                    className="transition-all duration-300"
                    fill={isSelected ? '#f43f5e' : '#e11d48'}
                    fillOpacity={isHovered ? 1 : 0.85}
                  />

                  {/* Profit Dot */}
                  <circle
                    cx={xCenter}
                    cy={yProfit}
                    r={isSelected ? 5 : 4}
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth={2}
                  />

                  {/* Month Label */}
                  <text
                    x={xCenter}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      isSelected
                        ? 'fill-emerald-400 font-extrabold'
                        : 'fill-slate-400 hover:fill-slate-200'
                    }`}
                  >
                    {item.month}
                  </text>

                  {/* Status Indicator Pill */}
                  {item.rentStatus && (
                    <circle
                      cx={xCenter}
                      cy={chartHeight - 2}
                      r={2.5}
                      fill={
                        item.rentStatus === 'Paid'
                          ? '#10b981'
                          : item.rentStatus === 'Partial Paid'
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  )}

                  {/* Profit Value on top of selected / hovered */}
                  {(isSelected || isHovered) && (
                    <g>
                      <rect
                        x={xCenter - 28}
                        y={Math.min(yReceived, yRent) - 22}
                        width={56}
                        height={18}
                        rx={4}
                        fill="#020617"
                        stroke="#38bdf8"
                        strokeWidth={1}
                      />
                      <text
                        x={xCenter}
                        y={Math.min(yReceived, yRent) - 10}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-cyan-300"
                      >
                        +{formatCurrency(item.profit)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Connecting line for profit */}
            <path
              d={data
                .map((item, index) => {
                  const xCenter = 75 + index * 60;
                  const profitHeight =
                    (Math.max(0, item.profit) / maxFinancialVal) * usableHeight;
                  const yProfit = paddingTop + usableHeight - profitHeight;
                  return `${index === 0 ? 'M' : 'L'} ${xCenter} ${yProfit}`;
                })
                .join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeOpacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Bottom Quick Metric Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Year Received</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            QAR {formatCurrency(totalReceivedAll)}
          </span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Year Villa Rent</span>
          <span className="text-sm font-mono font-bold text-rose-400">
            QAR {formatCurrency(totalRentAll)}
          </span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Year Profit (Received - Rent)</span>
          <span className="text-sm font-mono font-black text-cyan-300">
            QAR {formatCurrency(totalProfitAll)}
          </span>
        </div>
      </div>
    </div>
  );
};
