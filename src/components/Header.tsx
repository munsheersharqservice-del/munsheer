import React, { useState } from 'react';
import {
  FileSpreadsheet,
  LogOut,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Cloud,
  Database,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  ShieldCheck,
  Settings,
  Download,
  FileText,
  Save,
  ChevronDown,
  Table,
} from 'lucide-react';
import { UserProfile, DatabaseSource, ColorTheme } from '../types';
import { TARGET_GOOGLE_DRIVE_FOLDER_URL } from '../services/googleSheets';
import { getCloudDatabaseInfo } from '../services/firestoreSync';

interface HeaderProps {
  dbSource: DatabaseSource;
  user: UserProfile | null;
  isConnectingGoogle: boolean;
  onUploadExcel?: (file: File) => void;
  onOpenDrivePicker: () => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onLoadSample: (index: number) => void;
  sampleNames: string[];
  theme?: ColorTheme;
  onSaveAllToDrive?: () => void;
  onOpenMakeNewExcel?: () => void;
  onRefreshCloud?: () => void;
  onOpenSettings?: () => void;
  onDownloadFullExcel?: () => void;
  onDownloadJsonBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isConnectingGoogle,
  onOpenDrivePicker,
  onGoogleSignIn,
  onLogout,
  onExportExcel,
  onExportCsv,
  onLoadSample,
  sampleNames,
  theme = 'emerald',
  onRefreshCloud,
  onOpenSettings,
  onDownloadFullExcel,
  onDownloadJsonBackup,
}) => {
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const cloudInfo = getCloudDatabaseInfo();
  const headerBgClass =
    theme === 'emerald'
      ? 'bg-[#061814] border-b border-emerald-900/60'
      : theme === 'amber'
      ? 'bg-[#181207] border-b border-amber-900/60'
      : theme === 'obsidian'
      ? 'bg-[#09090b] border-b border-zinc-800'
      : 'bg-[#0b1329] border-b border-indigo-900/40';

  const iconContainerClass =
    theme === 'emerald'
      ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
      : theme === 'amber'
      ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
      : theme === 'obsidian'
      ? 'bg-zinc-800 border-zinc-700 text-white'
      : 'bg-blue-600/15 border-blue-500/30 text-blue-400';

  return (
    <header id="app-header" className={`${headerBgClass} text-slate-100 sticky top-0 z-30 shadow-md`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Application Title (Mobile Size Arranged) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${iconContainerClass}`}>
              <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-white text-base sm:text-lg tracking-tight truncate">
                MUNSHEER
              </h1>
            </div>
          </div>

          {/* Action Buttons: Live Database Status & Mobile Optimized Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* TWO-WAY LIVE CLOUD DATABASE STATUS BADGE */}
            <button
              id="live-db-status-badge"
              onClick={() => setIsCloudModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 shadow-sm min-h-[36px] transition-all cursor-pointer"
              title="Cloud Database: Connected across all devices. Click for sync details or to force refresh."
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">LIVE CLOUD DB</span>
              <span className="sm:hidden font-sans font-bold">CLOUD DB</span>
            </button>

            {/* Direct Google Drive Folder Link */}
            <a
              id="google-drive-folder-link"
              href={TARGET_GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-600/50 transition-colors shadow-sm cursor-pointer min-h-[36px]"
              title="Open Google Drive Folder: 1DflkGubMRjXiMJCD970nILdICKe_QvaE"
            >
              <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400" />
              <span className="hidden sm:inline">Drive Folder</span>
              <span className="sm:hidden">Drive</span>
            </a>

            {/* DOWNLOAD OPTIONS MENU */}
            <div className="relative">
              <button
                id="header-download-menu-btn"
                onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-600/50 transition-colors shadow-sm cursor-pointer min-h-[36px]"
                title="Download options: Excel (.xlsx), CSV, and Database Backup"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span className="hidden sm:inline">Download</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isDownloadMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDownloadMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 border-b border-slate-800">
                      Download Options
                    </div>
                    {onDownloadFullExcel && (
                      <button
                        onClick={() => {
                          setIsDownloadMenuOpen(false);
                          onDownloadFullExcel();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-emerald-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold">Full Live Excel (.xlsx)</div>
                          <div className="text-[10px] text-slate-400">All 6 sheets included</div>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsDownloadMenuOpen(false);
                        onExportExcel();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Table className="h-4 w-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Current Sheet (.xlsx)</div>
                        <div className="text-[10px] text-slate-400">Active table only</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setIsDownloadMenuOpen(false);
                        onExportCsv();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Export CSV (.csv)</div>
                        <div className="text-[10px] text-slate-400">Raw text data</div>
                      </div>
                    </button>
                    {onDownloadJsonBackup && (
                      <button
                        onClick={() => {
                          setIsDownloadMenuOpen(false);
                          onDownloadJsonBackup();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-800"
                      >
                        <Save className="h-4 w-4 text-purple-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Backup Database (.json)</div>
                          <div className="text-[10px] text-slate-400">Complete raw snapshot</div>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* SETTINGS BUTTON */}
            {onOpenSettings && (
              <button
                id="header-settings-btn"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-700/60 transition-colors shadow-sm cursor-pointer min-h-[36px]"
                title="Settings & Live Database Choose Option"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span className="inline">Settings</span>
              </button>
            )}

            {/* Google Drive / Sheets Picker Button (Read Only) */}
            {user ? (
              <button
                id="drive-picker-btn"
                onClick={onOpenDrivePicker}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors shadow-sm cursor-pointer"
                title="Open a spreadsheet from Google Drive or Google Sheets"
              >
                <Cloud className="h-3.5 w-3.5 text-blue-400" />
                <span>Google Drive</span>
              </button>
            ) : (
              <button
                id="google-signin-btn"
                onClick={onGoogleSignIn}
                disabled={isConnectingGoogle}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-slate-100 text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                title="Connect Google Drive & Google Sheets"
              >
                {isConnectingGoogle ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-600" />
                ) : (
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span className="hidden lg:inline">Sign in</span>
              </button>
            )}

            {/* Master Sheets Menu */}
            <div className="relative group hidden sm:block">
              <button
                id="sample-menu-btn"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Switch between live sheet tables"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline">Sheets</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  Live Master Sheets
                </div>
                {sampleNames.map((name, idx) => (
                  <button
                    key={name}
                    id={`sample-db-opt-${idx}`}
                    onClick={() => onLoadSample(idx)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Profile or Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-7 w-7 rounded-full border border-emerald-500/50 shadow-xs"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MULTI-DEVICE CLOUD DATABASE MODAL */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1322] border border-emerald-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#061814] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    Multi-Device Cloud Database
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Permanent Real-Time Sync</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">
                    One Database Across All Devices
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Any change made on your mobile phone, laptop, or tablet immediately updates the central database in real time. All 12 rooms, personal expenses, car metrics, and utility readings stay permanently synchronized.
                  </p>
                </div>
              </div>

              {/* Supported Devices Illustration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Mobile Phone</div>
                    <div className="text-[11px] text-slate-400">Live 2-Way Sync</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                  <Laptop className="h-5 w-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">PC / Tablet</div>
                    <div className="text-[11px] text-slate-400">Same Live DB</div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cloud Service:</span>
                  <span className="text-slate-300 font-sans">Google Cloud Firestore</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Database ID:</span>
                  <span className="text-sky-400 truncate max-w-[200px]" title={cloudInfo.databaseId}>
                    {cloudInfo.databaseId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shared Master Doc:</span>
                  <span className="text-emerald-400 font-bold">{cloudInfo.documentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">This Device ID:</span>
                  <span className="text-slate-300">{cloudInfo.deviceId}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  setIsCloudModalOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/40 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open Settings to choose database profile or configure storage"
              >
                <Settings className="h-3.5 w-3.5 text-emerald-400" />
                <span>Choose DB / Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCloudModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (onRefreshCloud) {
                      setIsSyncing(true);
                      await onRefreshCloud();
                      setIsSyncing(false);
                    }
                    setIsCloudModalOpen(false);
                  }}
                  disabled={isSyncing}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Verifying...' : 'Force Refresh DB'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
