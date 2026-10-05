import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  Car,
  Table,
  BarChart3,
  Database,
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  LayoutList,
  LayoutGrid,
  Sparkles,
  Settings,
  Download,
} from 'lucide-react';
import { ColorTheme } from '../types';

interface FrontPageProps {
  onNavigate: (tab: 'villa_manager' | 'personal_finance' | 'grid' | 'cards' | 'analytics') => void;
  onOpenMakeNewExcel?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddIncome?: () => void;
  onOpenSettings?: () => void;
  onOpenDownload?: () => void;
  theme?: ColorTheme;
}

const TARGET_GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1DflkGubMRjXiMJCD970nILdICKe_QvaE';

export const FrontPage: React.FC<FrontPageProps> = ({
  onNavigate,
  onOpenMakeNewExcel,
  onOpenSettings,
  onOpenDownload,
  theme = 'emerald',
}) => {
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');

  const containerBg =
    theme === 'emerald'
      ? 'bg-[#02110e]'
      : theme === 'amber'
      ? 'bg-[#120d03]'
      : theme === 'obsidian'
      ? 'bg-[#09090b]'
      : 'bg-slate-950';

  return (
    <div
      id="front-page-container"
      className={`flex-1 overflow-y-auto ${containerBg} text-slate-100 p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-4`}
    >
      {/* Top Header Bar (Mobile Optimized: Clean & Bold) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          COMMAND CENTER
        </h2>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* List / Grid Toggle */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-2 rounded-lg font-bold transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                layoutMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-2 rounded-lg font-bold transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                layoutMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <a
            href={TARGET_GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-600/40 font-bold flex items-center gap-1.5 transition-colors min-h-[38px]"
            title="Google Drive Folder"
          >
            <FolderOpen className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline text-xs">Drive</span>
          </a>

          {/* Real-time Two-Way Live Database Indicator */}
          <div
            onClick={() => onNavigate('grid')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-emerald-900/80 transition-all min-h-[38px]"
            title="Two-way live update database: All changes sync automatically in real-time"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">LIVE DATABASE</span>
            <span className="sm:hidden">LIVE</span>
          </div>
        </div>
      </div>

      {/* Task List (Mobile-First Size, Pure Headings, No Small Clutter) */}
      <div
        className={
          layoutMode === 'list'
            ? 'space-y-2.5'
            : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
        }
      >
        {/* TASK 1: VILLA FINANCIAL MANAGER */}
        <div
          onClick={() => onNavigate('villa_manager')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                Villa Financial Manager
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
              12 Rooms
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 2: PERSONAL & FAMILY FINANCE */}
        <div
          onClick={() => onNavigate('personal_finance')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                Personal & Family Finance
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-teal-300">
              October 2026
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 3: CAR 565816 EXPENSES */}
        <div
          onClick={() => onNavigate('personal_finance')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Car className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                Car 565816 Expenses
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-rose-400">
              Plate 565816
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 4: TWO-WAY LIVE EXCEL SHEETS */}
        <div
          onClick={() => onNavigate('grid')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Database className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                Excel Sheets (Two-Way Live)
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Edit 12 Rooms Master, Expenses & Utilities with 2-way live sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              2-Way Live
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 5: DATA GRID & SPREADSHEETS */}
        <div
          onClick={() => onNavigate('grid')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Table className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                Data Grid & Tables
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-sky-300">
              Spreadsheet
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 6: FINANCIAL ANALYTICS */}
        <div
          onClick={() => onNavigate('analytics')}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                Visual Analytics & Charts
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-purple-300">
              Analytics
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 7: LIVE DATABASE & SETTINGS */}
        <div
          onClick={() => onOpenSettings && onOpenSettings()}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Settings className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                Settings & Live Database Choose Option
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Configure DB
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* TASK 8: DOWNLOAD & EXPORT CENTER */}
        <div
          onClick={() => onOpenDownload && onOpenDownload()}
          className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] min-h-[64px]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Download className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                Download & Export Options
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-mono font-bold text-sky-300">
              Excel / CSV / JSON
            </span>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};
