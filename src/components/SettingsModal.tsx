import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Database,
  Download,
  Cloud,
  HardDrive,
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Laptop,
  Palette,
  Layout,
  Table,
  Building2,
  Wallet,
  ShieldCheck,
  Check,
  UploadCloud,
  Layers,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { ColorTheme, SheetTable } from '../types';
import {
  getCloudDatabaseInfo,
  getActiveDatabaseDocId,
  setActiveDatabaseDocId,
  PRESET_DATABASE_PROFILES,
  pushEntireLocalDatabaseToCloud,
} from '../services/firestoreSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  onSelectTheme: (theme: ColorTheme) => void;
  databaseMode: 'cloud' | 'local' | 'google_drive';
  onChangeDatabaseMode: (mode: 'cloud' | 'local' | 'google_drive') => void;
  defaultOpeningView: string;
  onSelectDefaultOpeningView: (view: string) => void;
  sheets: SheetTable[];
  activeSheetIndex: number;
  onSelectSheetIndex: (index: number) => void;
  onDownloadFullExcel: () => void;
  onDownloadCurrentSheetExcel: () => void;
  onDownloadCsv: () => void;
  onDownloadJsonBackup: () => void;
  onRefreshCloud: () => Promise<void>;
  initialTab?: 'database' | 'download' | 'views' | 'appearance';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  databaseMode,
  onChangeDatabaseMode,
  defaultOpeningView,
  onSelectDefaultOpeningView,
  sheets,
  activeSheetIndex,
  onSelectSheetIndex,
  onDownloadFullExcel,
  onDownloadCurrentSheetExcel,
  onDownloadCsv,
  onDownloadJsonBackup,
  onRefreshCloud,
  initialTab = 'database',
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'download' | 'views' | 'appearance'>('database');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Active database profile state
  const [currentDocId, setCurrentDocId] = useState<string>(() => getActiveDatabaseDocId());
  const [customDocInput, setCustomDocInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCurrentDocId(getActiveDatabaseDocId());
    }
  }, [isOpen, initialTab]);

  const cloudInfo = getCloudDatabaseInfo();

  if (!isOpen) return null;

  const handleSwitchDatabaseProfile = async (docId: string) => {
    setActiveDatabaseDocId(docId);
    setCurrentDocId(docId);
    setIsCustomMode(false);
    setIsSyncing(true);
    setSyncStatusMsg(`Switching database to "${docId}"...`);
    try {
      await onRefreshCloud();
      setSyncStatusMsg(`Switched to database: ${docId}`);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } catch {
      setSyncStatusMsg(`Error connecting to database ${docId}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyCustomDatabase = async () => {
    if (!customDocInput.trim()) return;
    const cleanId = customDocInput.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    await handleSwitchDatabaseProfile(cleanId);
  };

  const handlePushLocalDataToCloud = async () => {
    setIsPushing(true);
    setSyncStatusMsg('Pushing local device database to cloud...');
    try {
      const ok = await pushEntireLocalDatabaseToCloud();
      if (ok) {
        setSyncStatusMsg('Successfully uploaded local database to Cloud Firestore!');
      } else {
        setSyncStatusMsg('Upload failed. Check connection.');
      }
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } catch (e: any) {
      setSyncStatusMsg('Upload failed: ' + (e.message || e));
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b1322] border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-[#061814] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                <span>System & Database Settings</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-none">
                Live database chooser, download options, default sheets & themes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-3 sm:px-4 pt-2 border-b border-slate-800 bg-slate-900/60 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Database Option</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'download'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>Download Options</span>
          </button>

          <button
            onClick={() => setActiveTab('views')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'views'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Layout className="h-3.5 w-3.5 text-amber-400" />
            <span>Default Sheet & Views</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-purple-400" />
            <span>Themes</span>
          </button>
        </div>

        {/* Status Toast inside Settings */}
        {syncStatusMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 text-xs font-semibold text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{syncStatusMsg}</span>
            </span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300 flex-1">
          {/* TAB 1: LIVE DATABASE CHOOSE OPTION */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* SECTION A: CHOOSE ACTIVE CLOUD DATABASE DOCUMENT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>Choose Live Database</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Active: {currentDocId}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select which database profile or snapshot to connect to in real time:
                </p>
              </div>

              <div className="space-y-2">
                {PRESET_DATABASE_PROFILES.map((profile) => {
                  const isCurrent = currentDocId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      onClick={() => handleSwitchDatabaseProfile(profile.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <Database className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {profile.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                              {profile.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {profile.description}
                          </p>
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            ID: <span className="text-slate-300">{profile.id}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchDatabaseProfile(profile.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 transition-colors shrink-0 cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Custom Database Name Input */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-sky-400" />
                      <span>Custom Database ID / Namespace</span>
                    </span>
                    {!isCustomMode && (
                      <button
                        onClick={() => setIsCustomMode(true)}
                        className="text-[11px] text-sky-400 hover:underline font-semibold cursor-pointer"
                      >
                        Enter Custom ID
                      </button>
                    )}
                  </div>
                  {isCustomMode && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="e.g. munsheer_2026_q4"
                        value={customDocInput}
                        onChange={(e) => setCustomDocInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                      <button
                        onClick={handleApplyCustomDatabase}
                        disabled={!customDocInput.trim()}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Connect
                      </button>
                      <button
                        onClick={() => setIsCustomMode(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: STORAGE MODE OPTIONS */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2">
                  Database Sync Storage Mode:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Mode 1: Cloud */}
                  <div
                    onClick={() => onChangeDatabaseMode('cloud')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      databaseMode === 'cloud'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Cloud className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs">Cloud Sync</span>
                      </div>
                      {databaseMode === 'cloud' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      All devices share the same live sheet database.
                    </p>
                  </div>

                  {/* Mode 2: Local */}
                  <div
                    onClick={() => onChangeDatabaseMode('local')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      databaseMode === 'local'
                        ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-4 w-4 text-amber-400" />
                        <span className="font-bold text-white text-xs">Offline Only</span>
                      </div>
                      {databaseMode === 'local' && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Saves only on this browser memory.
                    </p>
                  </div>

                  {/* Mode 3: Drive */}
                  <div
                    onClick={() => onChangeDatabaseMode('google_drive')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      databaseMode === 'google_drive'
                        ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-sky-400" />
                        <span className="font-bold text-white text-xs">Google Drive</span>
                      </div>
                      {databaseMode === 'google_drive' && <Check className="h-3.5 w-3.5 text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Target Google Drive folder sync.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION C: LIVE DATABASE DIAGNOSTICS & ACTIONS */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-xs">
                      Cloud Connection: Active & Live
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        setIsSyncing(true);
                        await onRefreshCloud();
                        setIsSyncing(false);
                      }}
                      disabled={isSyncing}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Pull freshest data from Cloud Firestore"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Force Pull Cloud'}</span>
                    </button>

                    <button
                      onClick={handlePushLocalDataToCloud}
                      disabled={isPushing}
                      className="px-2.5 py-1 text-[11px] font-bold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Upload local device data to Cloud Firestore"
                    >
                      <UploadCloud className={`h-3 w-3 ${isPushing ? 'animate-bounce' : ''}`} />
                      <span>{isPushing ? 'Pushing...' : 'Upload Local'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">Database ID: </span>
                    <span className="text-sky-400 truncate font-sans block truncate" title={cloudInfo.databaseId}>
                      {cloudInfo.databaseId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">GCP Project: </span>
                    <span className="text-slate-300 block">{cloudInfo.projectId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Active Doc: </span>
                    <span className="text-emerald-400 font-bold block">{currentDocId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Device ID: </span>
                    <span className="text-slate-300 block truncate" title={cloudInfo.deviceId}>
                      {cloudInfo.deviceId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD OPTIONS */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-sky-400" />
                  <span>Download & Export Options</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Export live financial data directly to Excel (.xlsx), CSV, or a full JSON database snapshot.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1. Download Complete Live Excel Workbook */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-between gap-3 hover:border-emerald-400 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Full Live Excel Workbook (.xlsx)</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono font-bold">
                          All 6 Sheets
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300/80 truncate">
                        12 Rooms, Expenses, Utilities, Personal Finance, Car 565816, Summary
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onDownloadFullExcel();
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Excel</span>
                  </button>
                </div>

                {/* 2. Download Current Active Sheet Table */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                      <Table className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs">
                        Download Current Sheet (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Exports active table: {sheets[activeSheetIndex]?.name || 'Active Sheet'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onDownloadCurrentSheetExcel();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-600/40 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export Sheet</span>
                  </button>
                </div>

                {/* 3. Download CSV Format */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs">
                        Download Comma-Separated Values (.csv)
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Clean CSV export compatible with any spreadsheet or accounting tool
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onDownloadCsv();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-600/40 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* 4. Download Full Database JSON Backup */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                      <Save className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs">
                        Download Full Database Backup (.json)
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Complete raw JSON snapshot of rooms, meters, maintenance & transactions
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onDownloadJsonBackup();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-600/40 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Backup JSON</span>
                  </button>
                </div>

                {/* 5. Print / PDF Summary View */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Printer className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs">
                        Printable Audit Statement & PDF
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Formatted print document for receipts and audit documentation
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      setTimeout(() => window.print(), 300);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEFAULT SHEET & VIEWS */}
          {activeTab === 'views' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Default View on Startup
                </h3>
                <p className="text-xs text-slate-400">
                  Select which sheet or view automatically opens when you launch the app on your mobile phone or PC.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'villa_manager',
                    title: 'Villa 12 Rooms Master',
                    desc: 'Full 12 Rooms Ledger, Directory & Rent Cards',
                    icon: Building2,
                  },
                  {
                    id: 'grid',
                    title: 'Spreadsheet Grid (All Tables)',
                    desc: 'Direct Excel grid view with tabs & inline editing',
                    icon: Table,
                  },
                  {
                    id: 'personal_finance',
                    title: 'Personal & Family Finance',
                    desc: 'Daily expenses, income, and Car 565816 KM log',
                    icon: Wallet,
                  },
                  {
                    id: 'front_page',
                    title: 'Front Page Dashboard',
                    desc: 'Overview portal with quick tasks and tools',
                    icon: Layout,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = defaultOpeningView === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectDefaultOpeningView(item.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="font-bold text-white text-xs">{item.title}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Sheet Selector */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">
                  Select Active Spreadsheet Tab:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {sheets.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      onClick={() => onSelectSheetIndex(idx)}
                      className={`p-2 rounded-lg text-left text-xs border transition-colors flex items-center justify-between cursor-pointer ${
                        activeSheetIndex === idx
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {activeSheetIndex === idx && <Check className="h-3 w-3 shrink-0 ml-1 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Color Theme Selection
                </h3>
                <p className="text-xs text-slate-400">
                  Choose your executive visual palette for high contrast and elegance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'emerald' as ColorTheme,
                    name: 'Emerald Luxury',
                    color: 'from-emerald-950 to-teal-900',
                    border: 'border-emerald-500',
                    accent: '#10b981',
                  },
                  {
                    id: 'amber' as ColorTheme,
                    name: 'Royal Amber',
                    color: 'from-amber-950 to-orange-900',
                    border: 'border-amber-500',
                    accent: '#f59e0b',
                  },
                  {
                    id: 'obsidian' as ColorTheme,
                    name: 'Obsidian Dark',
                    color: 'from-zinc-950 to-neutral-900',
                    border: 'border-zinc-500',
                    accent: '#ffffff',
                  },
                  {
                    id: 'sapphire' as ColorTheme,
                    name: 'Sapphire Blue',
                    color: 'from-blue-950 to-indigo-900',
                    border: 'border-blue-500',
                    accent: '#3b82f6',
                  },
                ].map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTheme(t.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? `bg-gradient-to-br ${t.color} ${t.border} ring-1 ring-emerald-500/40`
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{t.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.accent }} />
                        <span className="text-[11px] text-slate-400">Executive Palette</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Munsheer Master Database System</span>
            <span className="sm:hidden font-mono text-[11px]">{currentDocId}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
