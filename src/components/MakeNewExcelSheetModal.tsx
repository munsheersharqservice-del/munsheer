import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Database,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  FolderOpen,
  Table,
  Building2,
  Wallet,
  Zap,
  Car,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  getLiveSheetTables,
  getLiveRoomsData,
  getLivePersonalTransactions,
  getLiveMeterReadings,
} from '../services/liveExcelGenerator';
import { SheetTable, ColorTheme, UserProfile } from '../types';
import { TARGET_GOOGLE_DRIVE_FOLDER_URL } from '../services/googleSheets';

interface MakeNewExcelSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  accessToken: string | null;
  onGoogleSignIn: () => void;
  onLoadLiveTablesToApp: (tables: SheetTable[], fileName: string) => void;
  onShowNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  theme?: ColorTheme;
}

export const MakeNewExcelSheetModal: React.FC<MakeNewExcelSheetModalProps> = ({
  isOpen,
  onClose,
  onLoadLiveTablesToApp,
  onShowNotification,
  theme = 'emerald',
}) => {
  // One Fixed Official Database File (Protected & Immutable, Not changeable)
  const FIXED_FILE_NAME = 'MUNSHEER_OFFICIAL_LIVE_DATABASE_FIXED.xlsx';

  // Sheet inclusion checkboxes (all 6 master sheets included by default in the fixed database)
  const [includeVillaMaster] = useState(true);
  const [includeVillaReceipts] = useState(true);
  const [includeMeters] = useState(true);
  const [includePersonalFinance] = useState(true);
  const [includeCarExpenses] = useState(true);
  const [includeAuditSummary] = useState(true);

  if (!isOpen) return null;

  // Real-time counts from live app storage
  const liveRooms = getLiveRoomsData();
  const liveTxs = getLivePersonalTransactions();
  const liveMeters = getLiveMeterReadings();

  // Load into App Grid / Table View
  const handleLoadIntoApp = () => {
    try {
      const options = {
        includeVillaMaster: true,
        includeVillaReceipts: true,
        includeMeters: true,
        includePersonalFinance: true,
        includeCarExpenses: true,
        includeAuditSummary: true,
      };

      const tables = getLiveSheetTables(options);
      onLoadLiveTablesToApp(tables, FIXED_FILE_NAME);
      onShowNotification(`Connected to two-way live database with ${tables.length} tables!`, 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      onShowNotification(err.message || 'Failed to load live sheets into grid.', 'error');
    }
  };

  return (
    <div
      id="fixed-database-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Mobile Sized */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-sky-950/90 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Database className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Two-Way Live Database
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL-TIME CLOUD SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Live Database • Instant two-way sync across all devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area - Scrollable on Mobile */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm">
          {/* Security & Live Sync Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/70 border border-emerald-500/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                  Two-Way Live Database Active
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-200 border border-emerald-500/40">
                LIVE FIRESTORE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All edits in tables (Rooms Rent, Expenses, Meters, Personal Finance, and Car 565816 Mileage) are immediately saved and synchronized across all connected devices in real time with Cloud Firestore.
            </p>
          </div>

          {/* Fixed File Identifier */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Official Master File Name</span>
              <span className="text-emerald-400 font-mono text-[10px]">Read-Only Baseline</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-emerald-300">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="break-all">{FIXED_FILE_NAME}</span>
            </div>
          </div>

          {/* 6 Fixed Master Sheets List */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>6 Fixed Worksheets Included</span>
              <span className="text-[11px] text-slate-500 font-normal">All 6 sheets active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Sheet 1 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">12_Rooms_Rent_Master</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {liveRooms.length} Rooms (Room 12 My Room 4,000 QAR)
                  </p>
                </div>
              </div>

              {/* Sheet 2 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-purple-500/30">
                <FileText className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Villa_Expenses_&_Receipts</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Itemized repairs, bills & receipts
                  </p>
                </div>
              </div>

              {/* Sheet 3 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30">
                <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Kahramaa_4_Utility_Meters</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    3 Elec (148964, 148963, 48073) + 1 Water (90978)
                  </p>
                </div>
              </div>

              {/* Sheet 4 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30">
                <Wallet className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Personal_&_Family_Finance</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Fresh October 2026 ledger ({liveTxs.length} records)
                  </p>
                </div>
              </div>

              {/* Sheet 5 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-sky-500/30">
                <Car className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Car_565816_Expenses</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Dedicated petrol, wash, service logs
                  </p>
                </div>
              </div>

              {/* Sheet 6 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-yellow-500/30">
                <Sparkles className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Executive_Financial_Summary</div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Year KPIs, Dual Net Profit, Audit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Standard Excel workbook compatible with Microsoft Excel, Sheets & Numbers</span>
            </span>
          </div>
        </div>

        {/* Footer Actions - Responsive for Mobile with ONLY DOWNLOAD */}
        <div className="px-5 py-4 bg-slate-950/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Target Drive Folder Link for Reference */}
          <a
            href={TARGET_GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
            title="Google Drive Folder: 1DflkGubMRjXiMJCD970nILdICKe_QvaE"
          >
            <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
            <span>Open Drive Folder</span>
          </a>

          {/* Live Database Action */}
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {/* Primary Action: Load into App Grid */}
            <button
              id="load-live-sheet-app-btn"
              type="button"
              onClick={handleLoadIntoApp}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02]"
              title="Open the two-way live database spreadsheet in app view"
            >
              <Table className="h-4 w-4 text-white" />
              <span>Open Two-Way Live Database Grid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
