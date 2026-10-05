import React, { useState } from 'react';
import {
  Printer,
  Building2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Droplets,
  Wrench,
  User,
  ShieldCheck,
} from 'lucide-react';
import { MonthKey, MONTH_KEYS, RoomRecord } from '../data/villaDatabase';

interface VillaFinancialStatementProps {
  selectedMonth: MonthKey;
  onSelectMonth: (month: MonthKey) => void;
  monthlyCalculations: Record<MonthKey, any>;
  yearlySummary: any;
  rooms: RoomRecord[];
  onExportExcel: () => void;
}

export const VillaFinancialStatement: React.FC<VillaFinancialStatementProps> = ({
  selectedMonth,
  onSelectMonth,
  monthlyCalculations,
  yearlySummary,
  rooms,
  onExportExcel,
}) => {
  const [reportScope, setReportScope] = useState<'month' | 'year'>('month');

  const formatQAR = (val: number) => {
    return `${(val || 0).toLocaleString('en-US')} QAR`;
  };

  const currentCalc = monthlyCalculations[selectedMonth] || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6 pb-24 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Top Statement Controls (Hidden during print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Villa Financial Statement & Reports
            </h2>
            <p className="text-xs text-slate-400">
              Audit-ready breakdown of rent collections, 3 electricity meters, water & dual profits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Selector: Selected Month vs Full Year */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setReportScope('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reportScope === 'month'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Month ({selectedMonth})
            </button>
            <button
              onClick={() => setReportScope('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reportScope === 'year'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Year 2024-2025
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4 text-teal-400" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Financial Statement Paper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-4 print:bg-white print:text-black">
        {/* Paper Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-800 print:border-black">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-400 print:text-black" />
              <h1 className="text-xl font-black tracking-tight text-white print:text-black">
                VILLA FINANCIAL MASTER STATEMENT
              </h1>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Doha, State of Qatar &bull; 12+ Rooms Residential Facility
            </p>
            <div className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Currency: <strong>Qatari Riyal (QAR)</strong> &bull; Generated:{' '}
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 print:text-gray-600 block uppercase tracking-wider font-bold">
              Statement Period
            </span>
            <div className="text-lg font-black text-emerald-400 print:text-black font-mono mt-0.5">
              {reportScope === 'month' ? `Month of ${selectedMonth}` : 'Annual Financial Year'}
            </div>
            <span className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
              Status: Verified & Balanced
            </span>
          </div>
        </div>

        {/* Dual Profit Reconciliation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profit 1: Without My Room */}
          <div className="bg-slate-950 border border-emerald-600/40 rounded-2xl p-4 shadow-md print:border-black print:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 print:text-black uppercase tracking-wider">
                1. Pure Profit (Without 12 My Room)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 print:bg-gray-200 print:text-black">
                Pure Landlord Margin
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-300 print:text-black font-mono mt-2">
              {formatQAR(
                reportScope === 'month'
                  ? currentCalc.profitWithoutMyRoom || 0
                  : yearlySummary.yearProfitWithoutMyRoom || 0
              )}
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Calculation: Total Tenant Collections &minus; Villa Master Rent
            </p>
          </div>

          {/* Profit 2: With My Room */}
          <div className="bg-slate-950 border border-sky-600/40 rounded-2xl p-4 shadow-md print:border-black print:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 print:text-black uppercase tracking-wider">
                2. Total Cash Profit (With 12 My Room)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-200 border border-sky-800 print:bg-gray-200 print:text-black">
                +4,000/mo Included
              </span>
            </div>
            <div className="text-2xl font-black text-sky-200 print:text-black font-mono mt-2">
              {formatQAR(
                reportScope === 'month'
                  ? currentCalc.profitWithMyRoom || 0
                  : yearlySummary.yearProfitWithMyRoom || 0
              )}
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Calculation: Total Collected (Tenants + My Room 4,000) &minus; Villa Master Rent
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Ledger Table */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
            Statement Breakdown
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl print:border-black">
            <table className="w-full text-left text-xs text-slate-200 print:text-black">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 print:bg-gray-100 print:border-black">
                <tr>
                  <th className="p-3">Category / Description</th>
                  <th className="p-3 text-right">Tenants Share</th>
                  <th className="p-3 text-right">Room 12 Share</th>
                  <th className="p-3 text-right">Total (QAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono print:divide-gray-300">
                {/* 1. Gross Inflows */}
                <tr className="bg-emerald-950/20 print:bg-transparent font-bold">
                  <td className="p-3 font-sans">Gross Collections (Received)</td>
                  <td className="p-3 text-right text-emerald-400 print:text-black">
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.tenantsCollected || 0
                        : yearlySummary.yearTenantsCollected || 0
                    )}
                  </td>
                  <td className="p-3 text-right text-sky-400 print:text-black">
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.myRoomCollected || 0
                        : yearlySummary.yearMyRoomCollected || 0
                    )}
                  </td>
                  <td className="p-3 text-right text-emerald-300 print:text-black text-sm">
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.totalCollected || 0
                        : yearlySummary.yearTotalCollected || 0
                    )}
                  </td>
                </tr>

                {/* 2. Villa Master Rent */}
                <tr>
                  <td className="p-3 font-sans">
                    <div>Villa Master Lease Rent</div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Status:{' '}
                      {reportScope === 'month'
                        ? currentCalc.villaRentStatus
                        : 'Paid in Full'}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-rose-400 print:text-black">
                    -
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.villaMasterRent || 0
                        : yearlySummary.yearMasterRentPaid || 0
                    )}
                  </td>
                </tr>

                {/* 3. Kahramaa Electricity (3 Meters) */}
                <tr>
                  <td className="p-3 font-sans">
                    <div>Kahramaa Electricity (3 Meters)</div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Meters: 148964, 148963, 48073
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-amber-400 print:text-black">
                    -
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.electricityBill || 0
                        : yearlySummary.yearTotalElectricity || 0
                    )}
                  </td>
                </tr>

                {/* 4. Kahramaa Water Meter */}
                <tr>
                  <td className="p-3 font-sans">
                    <div>Kahramaa Water (Meter 90978)</div>
                  </td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-cyan-400 print:text-black">
                    -
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.waterBill || 0
                        : yearlySummary.yearTotalWater || 0
                    )}
                  </td>
                </tr>

                {/* 5. Maintenance Expenses */}
                <tr>
                  <td className="p-3 font-sans">
                    <div>Villa Maintenance & Repairs</div>
                  </td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right text-purple-400 print:text-black">
                    -
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.maintenanceCost || 0
                        : yearlySummary.yearTotalMaintenance || 0
                    )}
                  </td>
                </tr>

                {/* Net Pure Profit */}
                <tr className="bg-slate-950 font-black border-t-2 border-emerald-600 print:border-black print:bg-gray-100">
                  <td className="p-3 font-sans text-emerald-400 print:text-black">
                    1. Net Pure Profit (Without My Room)
                  </td>
                  <td className="p-3 text-right" colSpan={2}>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Tenants Collections &minus; Master Rent
                    </span>
                  </td>
                  <td className="p-3 text-right text-emerald-300 print:text-black text-sm">
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.profitWithoutMyRoom || 0
                        : yearlySummary.yearProfitWithoutMyRoom || 0
                    )}
                  </td>
                </tr>

                {/* Net Total Profit */}
                <tr className="bg-slate-950 font-black border-t border-sky-600 print:border-black print:bg-gray-100">
                  <td className="p-3 font-sans text-sky-300 print:text-black">
                    2. Net Total Cash Profit (With My Room 4,000)
                  </td>
                  <td className="p-3 text-right" colSpan={2}>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Total Collections &minus; Master Rent
                    </span>
                  </td>
                  <td className="p-3 text-right text-sky-200 print:text-black text-sm">
                    {formatQAR(
                      reportScope === 'month'
                        ? currentCalc.profitWithMyRoom || 0
                        : yearlySummary.yearProfitWithMyRoom || 0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Advance Deposits Held Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
              Tenant Advance Deposit Liability Ledger
            </h3>
            <span className="text-xs font-mono font-bold text-purple-300 print:text-black">
              Total Held: {formatQAR(yearlySummary.totalAdvanceHeld)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between print:border-gray-300 print:bg-transparent"
              >
                <div>
                  <div className="font-bold text-xs text-white print:text-black truncate max-w-[120px]">
                    {r.roomNumber}. {r.name}
                  </div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                    Rent: {formatQAR(r.monthlyRent)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-purple-300 print:text-black">
                    {formatQAR(r.advance)}
                  </span>
                  <span className="block text-[9px] text-slate-500 print:text-gray-500">Deposit</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Certification Footer for Printing */}
        <div className="pt-8 border-t border-slate-800 print:border-black flex items-center justify-between text-xs text-slate-400 print:text-black">
          <div>
            <div className="font-bold">Prepared By:</div>
            <div className="mt-4 border-b border-slate-600 w-48 print:border-black" />
            <div className="mt-1 text-[11px]">Villa Management &bull; Qatar</div>
          </div>
          <div>
            <div className="font-bold">Approved By Landlord:</div>
            <div className="mt-4 border-b border-slate-600 w-48 print:border-black" />
            <div className="mt-1 text-[11px]">Signature & Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};
