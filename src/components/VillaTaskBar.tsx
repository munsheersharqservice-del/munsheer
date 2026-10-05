import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Zap,
  FileText,
  Plus,
  Printer,
  Clock,
  ChevronDown,
  Building2,
  Wrench,
  Droplets,
  DollarSign,
  Calendar,
  X,
  Sparkles,
  Paperclip,
  Settings,
  Download,
} from 'lucide-react';
import { MonthKey, MONTH_KEYS } from '../data/villaDatabase';

export type VillaPageView =
  | 'dashboard'
  | 'master_spreadsheet'
  | 'rooms_directory'
  | 'utilities_expenses'
  | 'financial_statement';

interface VillaTaskBarProps {
  activeView: VillaPageView;
  onSelectView: (view: VillaPageView) => void;
  selectedMonth: MonthKey;
  onSelectMonth: (month: MonthKey) => void;
  roomsCount: number;
  totalAdvance: number;
  profitWithoutMyRoom: number;
  profitWithMyRoom: number;
  onOpenAddRoom: () => void;
  onOpenElectricity: () => void;
  onOpenWater: () => void;
  onOpenMaintenance: () => void;
  onOpenVillaRent: () => void;
  onOpenItemsModal?: () => void;
  onExportExcel: () => void;
  onPrintReport?: () => void;
  onOpenMakeNewExcel?: () => void;
  onOpenSettings?: () => void;
  onOpenDownload?: () => void;
}

export const VillaTaskBar: React.FC<VillaTaskBarProps> = ({
  activeView,
  onSelectView,
  selectedMonth,
  onSelectMonth,
  roomsCount,
  totalAdvance,
  profitWithoutMyRoom,
  profitWithMyRoom,
  onOpenAddRoom,
  onOpenElectricity,
  onOpenWater,
  onOpenMaintenance,
  onOpenVillaRent,
  onOpenItemsModal,
  onExportExcel,
  onPrintReport,
  onOpenMakeNewExcel,
  onOpenSettings,
  onOpenDownload,
}) => {
  // Real-time clock for Taskbar
  const [timeStr, setTimeStr] = useState<string>('');
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatQAR = (num: number) => {
    return `${(num || 0).toLocaleString('en-US')} QAR`;
  };

  const pages = [
    {
      id: 'dashboard' as VillaPageView,
      name: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Profit',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
    },
    {
      id: 'master_spreadsheet' as VillaPageView,
      name: 'Master Table',
      icon: FileSpreadsheet,
      badge: `${roomsCount} Rooms`,
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700',
    },
    {
      id: 'rooms_directory' as VillaPageView,
      name: 'Rooms',
      icon: Users,
      badge: 'Cards',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-700',
    },
    {
      id: 'utilities_expenses' as VillaPageView,
      name: 'Utilities',
      icon: Zap,
      badge: '4 Meters',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    },
    {
      id: 'financial_statement' as VillaPageView,
      name: 'Statement',
      icon: FileText,
      badge: 'Report',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
    },
  ];

  return (
    <>
      {/* =========================================================================
          TOP EXECUTIVE TASK BAR
         ========================================================================= */}
      <header className="bg-[#0b1329]/95 backdrop-blur-md border-b border-indigo-900/40 sticky top-0 z-40 shadow-xl select-none">
        {/* Row 1: Brand, Pages Navigation Tabs, Quick Tasks & Month */}
        <div className="px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Villa Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                VILLA MANAGER
              </h2>
            </div>
          </div>

          {/* Desktop & Tablet: BIG SIZE Distinct Page Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-950/90 p-1 rounded-xl border border-indigo-900/40 text-xs font-semibold shadow-inner gap-0.5">
            {pages.map((page, index) => {
              const active = activeView === page.id;
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => onSelectView(page.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative text-xs sm:text-sm ${
                    active
                      ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                  title={page.name}
                >
                  <span className="text-[10px] font-mono opacity-60">{index + 1}.</span>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap font-bold">{page.name}</span>
                  {active && (
                    <span className="hidden xl:inline-block ml-1 px-1.5 py-0.2 rounded-sm text-[9px] bg-blue-700 text-blue-100 font-mono">
                      {page.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Tasks & System Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Active Month Quick Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMonthMenuOpen(!isMonthMenuOpen)}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-indigo-900/50 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="Switch Active Month"
              >
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono">{selectedMonth}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isMonthMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Select Active Month
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {MONTH_KEYS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          onSelectMonth(m);
                          setIsMonthMenuOpen(false);
                        }}
                        className={`py-1 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors ${
                          selectedMonth === m
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Task Launcher Menu (Desktop Dropdown) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsTaskMenuOpen(!isTaskMenuOpen)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                <span>+ Tasks</span>
                <ChevronDown className="h-3 w-3 text-emerald-200" />
              </button>

              {isTaskMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider border-b border-slate-800">
                    Quick Villa Tasks
                  </div>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenAddRoom();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">+ Add New Room</div>
                      <div className="text-[10px] text-slate-400">Scale beyond 12 rooms</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenElectricity();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-amber-950/60 hover:text-amber-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Zap className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-bold">Add 3 Electricity Bills</div>
                      <div className="text-[10px] text-slate-400">Choose meter 148964, 148963, 48073</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenWater();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Droplets className="h-4 w-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">Add Water Bill</div>
                      <div className="text-[10px] text-slate-400">Kahramaa Meter 90978</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenMaintenance();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-purple-950/60 hover:text-purple-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Wrench className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="font-bold">Log Maintenance</div>
                      <div className="text-[10px] text-slate-400">Track repairs & supplies</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenVillaRent();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-rose-950/60 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <DollarSign className="h-4 w-4 text-rose-400" />
                    <div>
                      <div className="font-bold">Edit Villa Lease Rent</div>
                      <div className="text-[10px] text-slate-400">Paid, Unpaid or Partial</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsTaskMenuOpen(false);
                      onOpenItemsModal?.();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">Item Expenses & Drive</div>
                      <div className="text-[10px] text-slate-400">Item Name, Reason & Drive receipts</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-800 pt-1 mt-1 space-y-1">
                    {onOpenMakeNewExcel && (
                      <button
                        onClick={() => {
                          setIsTaskMenuOpen(false);
                          onOpenMakeNewExcel();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300 hover:bg-emerald-950/70 flex items-center gap-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Live Database Grid</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download Option Button */}
            {onOpenDownload && (
              <button
                onClick={onOpenDownload}
                className="px-2 py-1 sm:px-2.5 sm:py-1 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-600/40 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                title="Download Excel, CSV, or Database Backup"
              >
                <Download className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {/* Settings Option Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2 py-1 sm:px-2.5 sm:py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-600/40 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                title="Settings & Live Database Choose Option"
              >
                <Settings className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Live Database Sync Indicator */}
            <div
              onClick={onOpenSettings}
              className="px-2 py-1 sm:px-2.5 sm:py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg sm:rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Two-way live update database connected. Click to open Settings & DB options."
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">LIVE SYNC</span>
              <span className="sm:hidden font-mono">LIVE</span>
            </div>

            {/* Live Taskbar Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{timeStr || '12:00 PM'}</span>
            </div>
          </div>
        </div>

      </header>

      {/* =========================================================================
          MOBILE BOTTOM TASK BAR & DOCK (Floating 5-Page Viewer with Quick Task Button)
         ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1 py-1 flex items-center justify-around shadow-2xl pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {pages.map((page) => {
          const active = activeView === page.id;
          const Icon = page.icon;
          const shortLabels: Record<VillaPageView, string> = {
            dashboard: 'Dash',
            master_spreadsheet: 'Matrix',
            rooms_directory: 'Rooms',
            utilities_expenses: 'Meters',
            financial_statement: 'Report',
          };
          return (
            <button
              key={page.id}
              onClick={() => onSelectView(page.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors min-h-[42px] ${
                active ? 'text-emerald-400 font-extrabold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5 mb-0.5" />
              <span className="truncate">{shortLabels[page.id] || page.name}</span>
            </button>
          );
        })}

        {/* Central Mobile Action Button */}
        <button
          onClick={onOpenAddRoom}
          className="flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] font-bold text-emerald-400 cursor-pointer min-h-[42px]"
          title="Add Room"
        >
          <div className="h-6 w-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <span className="mt-0.5 font-bold">+Room</span>
        </button>
      </div>
    </>
  );
};
