import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table as TableIcon,
  LayoutGrid,
  BarChart2,
  FileSpreadsheet,
  AlertCircle,
  Upload,
  RefreshCw,
  Building2,
  Home,
  Wallet,
  Search,
  Plus,
  X,
  Palette,
  Check,
  Settings,
  Download,
} from 'lucide-react';
import { DatabaseSource, UserProfile, SheetTable, DriveFileItem, ColorTheme } from './types';
import { villaTables, calculateProfitAndExpenses, formatCurrency } from './data/villaDatabase';
import { Header } from './components/Header';
import { TableView } from './components/TableView';
import { RecordDrawer } from './components/RecordDrawer';
import { AddRecordModal } from './components/AddRecordModal';
import { AnalyticsView } from './components/AnalyticsView';
import { DrivePickerModal } from './components/DrivePickerModal';
import { VillaFinancialSummary } from './components/VillaFinancialSummary';
import { VillaMasterManager } from './components/VillaMasterManager';
import { FrontPage } from './components/FrontPage';
import { PersonalFinanceTracker } from './components/PersonalFinanceTracker';
import { CardsQuickActions } from './components/CardsQuickActions';
import { MakeNewExcelSheetModal } from './components/MakeNewExcelSheetModal';
import { parseExcelFile, parseExcelBuffer, exportTableToExcel, exportTableToCsv } from './services/excelParser';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import {
  fetchGoogleSpreadsheet,
  downloadDriveFileBuffer,
  appendGoogleSheetRow,
  updateGoogleSheetCell,
} from './services/googleSheets';
import { getLiveSheetTables, exportLiveExcelFile } from './services/liveExcelGenerator';
import { SettingsModal } from './components/SettingsModal';
import {
  subscribeToGlobalDatabase,
  syncSheetCellToGlobalState,
  initializeGlobalDatabase,
  fetchGlobalDatabaseFromCloud,
  pushGlobalDatabaseToCloud,
} from './services/firestoreSync';

export default function App() {
  // Database State - Populated with real-time live sheets (12 Rooms Master, Expenses, Utilities, Personal Finance, Car)
  const [dbSource, setDbSource] = useState<DatabaseSource>(() => ({
    type: 'sample',
    fileName: 'MUNSHEER_LIVE_FINANCE_MASTER.xlsx',
    sheets: getLiveSheetTables(),
    activeSheetIndex: 0,
  }));

  // Settings & Database Choose Mode
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'database' | 'download' | 'views' | 'appearance'>('database');
  const [databaseMode, setDatabaseMode] = useState<'cloud' | 'local' | 'google_drive'>(() => {
    const saved = localStorage.getItem('app_database_mode');
    return (saved as any) || 'cloud';
  });

  const handleOpenSettings = (tab: 'database' | 'download' | 'views' | 'appearance' = 'database') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  const handleOpenDownload = () => {
    setSettingsInitialTab('download');
    setIsSettingsOpen(true);
  };

  const handleSetDatabaseMode = (mode: 'cloud' | 'local' | 'google_drive') => {
    setDatabaseMode(mode);
    localStorage.setItem('app_database_mode', mode);
    if (mode === 'cloud') {
      showNotification('Switched to Live Cloud Firestore Database (Synced across all devices)!', 'success');
    } else if (mode === 'local') {
      showNotification('Switched to Local Offline Storage (This device only).', 'info');
    } else {
      showNotification('Switched to Google Drive mode.', 'info');
    }
  };

  const [defaultOpeningView, setDefaultOpeningView] = useState<string>(() => {
    return localStorage.getItem('app_default_opening_view') || 'villa_manager';
  });

  const handleSetDefaultOpeningView = (view: string) => {
    setDefaultOpeningView(view);
    localStorage.setItem('app_default_opening_view', view);
    showNotification(`Default startup view set to "${view}"!`, 'success');
  };

  // Download Handlers
  const handleDownloadFullExcel = () => {
    try {
      exportLiveExcelFile('MUNSHEER_FINANCIAL_LIVE_DATA_2026.xlsx');
      showNotification('Downloaded Complete Live Excel Workbook (.xlsx) with all 6 sheets!', 'success');
    } catch (e: any) {
      showNotification('Download failed: ' + (e.message || e), 'error');
    }
  };

  const handleDownloadJsonBackup = () => {
    try {
      const backup = {
        app: 'MUNSHEER Master Database',
        exportedAt: new Date().toISOString(),
        rooms: JSON.parse(localStorage.getItem('villa_12_rooms_data_v4') || '[]'),
        transactions: JSON.parse(localStorage.getItem('personal_finance_txs_october_v3') || '[]'),
        meterReadings: JSON.parse(localStorage.getItem('villa_meter_readings_v5') || '[]'),
        villaItems: JSON.parse(localStorage.getItem('villa_items_receipts_v1') || '[]'),
        monthlyMaintenance: JSON.parse(localStorage.getItem('villa_monthly_maintenance_v4') || '{}'),
        villaMasterRentDetails: JSON.parse(localStorage.getItem('villa_master_rent_details_v4') || '{}'),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MUNSHEER_DATABASE_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Downloaded Database Backup (.json)!', 'success');
    } catch (e: any) {
      showNotification('Backup export failed: ' + (e.message || e), 'error');
    }
  };

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Make New Excel Sheet Modal
  const [isMakeNewExcelOpen, setIsMakeNewExcelOpen] = useState(false);

  // UI Navigation - Multi-Window Architecture (Default to Villa 12 Rooms Master on all devices)
  const [activeTab, setActiveTab] = useState<'front_page' | 'villa_manager' | 'personal_finance' | 'grid' | 'cards' | 'analytics'>(() => {
    const saved = localStorage.getItem('app_active_tab');
    if (saved && ['front_page', 'villa_manager', 'personal_finance', 'grid', 'cards', 'analytics'].includes(saved)) {
      return saved as any;
    }
    return 'villa_manager'; // Default directly to Villa 12 Rooms Master Sheet
  });

  useEffect(() => {
    localStorage.setItem('app_active_tab', activeTab);
  }, [activeTab]);
  const [cardFilter, setCardFilter] = useState<'ALL' | 'OVERDUE' | 'PAID'>('ALL');
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  // Color Theme State - Default to new Emerald Luxury Theme requested by user
  const [theme, setTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('app_color_theme');
    return (saved as ColorTheme) || 'emerald';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_color_theme', theme);
  }, [theme]);

  // Modals & Drawers
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<{
    record: Record<string, any>;
    index: number;
  } | null>(null);

  // Loading & Notifications
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-Time Two-Way Live Database Sync Subscription
  // Subscribes to Cloud Firestore and local mutations so all sheets stay continuously live across any device
  useEffect(() => {
    // 1. Immediately connect and bootstrap the Cloud Firestore database on this device
    initializeGlobalDatabase().then((cloudData) => {
      if (cloudData) {
        setDbSource((prev) => {
          if (prev.type === 'google_sheet') return prev;
          return {
            ...prev,
            sheets: getLiveSheetTables(),
          };
        });
      }
    });

    // 2. Real-time live listener for any edits made on any device
    const unsub = subscribeToGlobalDatabase((_cloudData) => {
      setDbSource((prev) => {
        if (prev.type === 'google_sheet') return prev;
        return {
          ...prev,
          sheets: getLiveSheetTables(),
        };
      });
    });

    const handleLocalUpdate = () => {
      setDbSource((prev) => {
        if (prev.type === 'google_sheet') return prev;
        return {
          ...prev,
          sheets: getLiveSheetTables(),
        };
      });
    };

    window.addEventListener('app_database_updated', handleLocalUpdate);
    window.addEventListener('app_database_cloud_pushed', handleLocalUpdate);
    window.addEventListener('app_database_doc_changed', handleLocalUpdate);

    return () => {
      unsub();
      window.removeEventListener('app_database_updated', handleLocalUpdate);
      window.removeEventListener('app_database_cloud_pushed', handleLocalUpdate);
      window.removeEventListener('app_database_doc_changed', handleLocalUpdate);
    };
  }, []);

  // Force refresh and verify synchronization with the Cloud Database
  const handleRefreshCloudDatabase = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGlobalDatabaseFromCloud();
      if (data) {
        setDbSource((prev) => ({
          ...prev,
          sheets: getLiveSheetTables(),
        }));
        showNotification('Database verified & synced with Cloud Firestore! All devices are connected.', 'success');
      } else {
        showNotification('Connected to Cloud Firestore. Database is active and ready.', 'info');
      }
    } catch (e: any) {
      showNotification('Failed to sync with cloud: ' + (e.message || e), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsConnectingGoogle(true);
    try {
      const result = await googleSignIn();
      setUser({
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      });
      setAccessToken(result.accessToken);
      showNotification('Signed in with Google. You can now access your Google Drive & Sheets!', 'success');
      setIsDrivePickerOpen(true);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      showNotification(err.message || 'Failed to sign in with Google.', 'error');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showNotification('Signed out from Google account.');
  };

  // Handle Local File Upload
  const handleUploadExcel = async (file: File) => {
    setIsLoading(true);
    try {
      const tables = await parseExcelFile(file);
      if (tables.length === 0) {
        throw new Error('No valid sheets found in this file.');
      }
      setDbSource({
        type: 'local_file',
        fileName: file.name,
        sheets: tables,
        activeSheetIndex: 0,
      });
      showNotification(`Successfully imported "${file.name}" with ${tables.length} table(s)!`, 'success');
    } catch (err: any) {
      console.error('Excel parse error:', err);
      showNotification(err.message || 'Failed to read Excel file.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Drive / Sheets file selection
  const handleSelectDriveFile = async (fileItem: DriveFileItem) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const isGoogleSheet = fileItem.mimeType === 'application/vnd.google-apps.spreadsheet';

      if (isGoogleSheet) {
        // Fetch sheets via Google Sheets API v4
        const tables = await fetchGoogleSpreadsheet(fileItem.id, accessToken);
        if (tables.length === 0) {
          throw new Error('Spreadsheet has no data or tables.');
        }
        setDbSource({
          type: 'google_sheet',
          fileName: fileItem.name,
          fileId: fileItem.id,
          sheets: tables,
          activeSheetIndex: 0,
        });
        showNotification(`Connected to Google Sheet: "${fileItem.name}"`, 'success');
      } else {
        // Excel file stored in Google Drive: download and parse buffer
        const buffer = await downloadDriveFileBuffer(fileItem.id, accessToken);
        const tables = parseExcelBuffer(buffer);
        if (tables.length === 0) {
          throw new Error('No tables found in this Excel file.');
        }
        setDbSource({
          type: 'local_file',
          fileName: fileItem.name,
          fileId: fileItem.id,
          sheets: tables,
          activeSheetIndex: 0,
        });
        showNotification(`Loaded Excel file from Google Drive: "${fileItem.name}"`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to load file from Drive:', err);
      showNotification(err.message || 'Failed to load file from Drive.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Active Sheet helper
  const currentSheet = dbSource.sheets[dbSource.activeSheetIndex] || dbSource.sheets[0];

  // Update cell in current sheet
  const handleUpdateCell = async (rowId: string, colKey: string, newValue: any) => {
    const updatedSheets = [...dbSource.sheets];
    const sheet = { ...currentSheet };
    const rowIndex = sheet.rows.findIndex((r) => r._rowId === rowId);

    if (rowIndex >= 0) {
      const targetRow = sheet.rows[rowIndex];
      const updatedRow = { ...targetRow, [colKey]: newValue };

      // Auto-recalculate profit & expenses if this table has profit/expense columns
      const hasProfitCol = sheet.rawHeaders.some((h) => h.toLowerCase().includes('profit'));
      if (hasProfitCol) {
        const rentKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('rent'));
        const maintKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('maint'));
        const elecKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('elec'));
        const waterKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('water'));
        const expKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('expense'));
        const profitKey = sheet.rawHeaders.find((h) => h.toLowerCase().includes('profit'));

        const rent = rentKey ? updatedRow[rentKey] : 0;
        const maint = maintKey ? updatedRow[maintKey] : 0;
        const elec = elecKey ? updatedRow[elecKey] : 0;
        const water = waterKey ? updatedRow[waterKey] : 0;

        const { totalExpenses, totalProfit } = calculateProfitAndExpenses(rent, maint, elec, water);

        if (expKey) {
          updatedRow[expKey] = formatCurrency(totalExpenses);
        }
        if (profitKey) {
          updatedRow[profitKey] = formatCurrency(totalProfit);
        }
      }

      sheet.rows = [
        ...sheet.rows.slice(0, rowIndex),
        updatedRow,
        ...sheet.rows.slice(rowIndex + 1),
      ];
      updatedSheets[dbSource.activeSheetIndex] = sheet;
      setDbSource((prev) => ({ ...prev, sheets: updatedSheets }));

      // Two-Way Live Database: synchronize cell edit immediately to Global State & Cloud Firestore
      try {
        await syncSheetCellToGlobalState(sheet.name, targetRow, colKey, newValue);
        // Refresh live sheets with updated formulas, balances, and profits
        setDbSource((prev) => {
          if (prev.type === 'google_sheet') return prev;
          return {
            ...prev,
            sheets: getLiveSheetTables(),
          };
        });
        showNotification(`Updated ${colKey}: Live 2-way synced!`, 'success');
      } catch (syncErr) {
        console.warn('Error syncing cell to global database:', syncErr);
      }

      // If connected to live Google Sheet, sync cell to remote spreadsheet
      if (dbSource.type === 'google_sheet' && dbSource.fileId && accessToken) {
        try {
          const colIndex = sheet.rawHeaders.indexOf(colKey);
          if (colIndex >= 0 && targetRow._originalIndex) {
            const colLetter = String.fromCharCode(65 + (colIndex % 26)); // Basic column letter (A, B, C...)
            const range = `${encodeURIComponent(sheet.name)}!${colLetter}${targetRow._originalIndex}`;
            await updateGoogleSheetCell(dbSource.fileId, range, newValue, accessToken);
            showNotification(`Synced cell change to Google Sheets!`, 'success');
          }
        } catch (err: any) {
          console.warn('Google Sheets sync warning:', err);
        }
      }
    }
  };

  // Add new record to current sheet
  const handleAddRecord = async (newRecord: Record<string, any>) => {
    const updatedSheets = [...dbSource.sheets];
    const sheet = { ...currentSheet };

    const newRowId = `row_${Date.now()}`;
    const newOriginalIndex = sheet.rows.length + 2;

    const rowObj: Record<string, any> = {
      _rowId: newRowId,
      _originalIndex: newOriginalIndex,
      ...newRecord,
    };

    sheet.rows = [rowObj, ...sheet.rows];
    updatedSheets[dbSource.activeSheetIndex] = sheet;
    setDbSource((prev) => ({ ...prev, sheets: updatedSheets }));
    showNotification('Record added to table.', 'success');

    // If connected to Google Sheets, append to sheet
    if (dbSource.type === 'google_sheet' && dbSource.fileId && accessToken) {
      try {
        const rowValues = sheet.rawHeaders.map((header) => newRecord[header] ?? '');
        await appendGoogleSheetRow(dbSource.fileId, sheet.name, rowValues, accessToken);
        showNotification('Appended record to Google Sheets!', 'success');
      } catch (err: any) {
        console.warn('Failed to append to Google Sheet:', err);
      }
    }
  };

  // Update full record from Inspector Drawer
  const handleUpdateRecord = async (updatedRecord: Record<string, any>) => {
    const updatedSheets = [...dbSource.sheets];
    const sheet = { ...currentSheet };
    const rowIndex = sheet.rows.findIndex((r) => r._rowId === updatedRecord._rowId);

    if (rowIndex >= 0) {
      sheet.rows = [
        ...sheet.rows.slice(0, rowIndex),
        updatedRecord,
        ...sheet.rows.slice(rowIndex + 1),
      ];
      updatedSheets[dbSource.activeSheetIndex] = sheet;
      setDbSource((prev) => ({ ...prev, sheets: updatedSheets }));
      setInspectRecord({ record: updatedRecord, index: rowIndex });
      showNotification('Record updated.', 'success');

      // Sync updated room to Firestore if this is the Room matrix sheet
      if (sheet.name.toLowerCase().includes('room')) {
        const roomNum = updatedRecord['ROOM'] || updatedRecord['Room'];
        if (roomNum !== undefined) {
          const saved = localStorage.getItem('villa_12_rooms_data_v4');
          let rooms = saved ? JSON.parse(saved) : [];
          const idx = rooms.findIndex((r: any) => String(r.roomNumber).trim() === String(roomNum).trim());
          if (idx >= 0) {
            const r = { ...rooms[idx] };
            if (updatedRecord['TENANT NAME']) r.name = updatedRecord['TENANT NAME'];
            if (updatedRecord['MOBILE NO']) r.mobNo = updatedRecord['MOBILE NO'];
            if (updatedRecord['ADVANCE (QAR)'] !== undefined) r.advance = Number(updatedRecord['ADVANCE (QAR)']) || 0;
            if (updatedRecord['MONTHLY RENT (QAR)'] !== undefined) r.monthlyRent = Number(updatedRecord['MONTHLY RENT (QAR)']) || 0;
            const monthCols = ['FEB', 'MAR', 'APRIL', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            monthCols.forEach((m) => {
              if (updatedRecord[m] !== undefined) {
                r.monthlyPayments = { ...r.monthlyPayments, [m]: Number(updatedRecord[m]) || 0 };
              }
            });
            rooms[idx] = r;
            localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(rooms));
            pushGlobalDatabaseToCloud({ rooms });
          }
        }
      }

      // If connected to Google Sheet, update row
      if (dbSource.type === 'google_sheet' && dbSource.fileId && accessToken && updatedRecord._originalIndex) {
        try {
          const rowNum = updatedRecord._originalIndex;
          const endColLetter = String.fromCharCode(65 + Math.min(sheet.rawHeaders.length - 1, 25));
          const range = `${encodeURIComponent(sheet.name)}!A${rowNum}:${endColLetter}${rowNum}`;
          const rowValues = sheet.rawHeaders.map((h) => updatedRecord[h] ?? '');
          await updateGoogleSheetCell(dbSource.fileId, range, rowValues, accessToken);
          showNotification('Synced updated record to Google Sheets!', 'success');
        } catch (err) {
          console.warn('Sheets update warning:', err);
        }
      }
    }
  };

  // Delete records
  const handleDeleteRows = (rowIds: string[]) => {
    const idSet = new Set(rowIds);
    const updatedSheets = [...dbSource.sheets];
    const sheet = { ...currentSheet };

    sheet.rows = sheet.rows.filter((r) => !idSet.has(r._rowId));
    updatedSheets[dbSource.activeSheetIndex] = sheet;
    setDbSource((prev) => ({ ...prev, sheets: updatedSheets }));
    showNotification(`Deleted ${rowIds.length} record(s).`);
  };

  // Drag and drop event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        handleUploadExcel(file);
      } else {
        showNotification('Please drop a valid Excel (.xlsx, .xls) or CSV file.', 'error');
      }
    }
  }, []);

  // Export handlers
  const handleExportExcel = () => {
    if (!currentSheet) return;
    const baseName = dbSource.fileName.replace(/\.[^/.]+$/, '');
    exportTableToExcel(currentSheet, `${baseName}_${currentSheet.name}`);
    showNotification('Exported table to Excel (.xlsx)!', 'success');
  };

  const handleExportCsv = () => {
    if (!currentSheet) return;
    const baseName = dbSource.fileName.replace(/\.[^/.]+$/, '');
    exportTableToCsv(currentSheet, `${baseName}_${currentSheet.name}`);
    showNotification('Exported table to CSV (.csv)!', 'success');
  };

  const handleLoadLiveTablesToApp = (tables: SheetTable[], fileName: string) => {
    setDbSource({
      type: 'local_file',
      fileName: fileName || 'MUNSHEER_LIVE_FINANCE_MASTER.xlsx',
      sheets: tables,
      activeSheetIndex: 0,
    });
    setActiveTab('grid');
  };

  const sampleNames = [
    'Villa 12 Rooms Master 2026',
    'Villa Expenses & Receipts',
    'Kahramaa 4 Utility Meters',
    'Personal & Family Finance',
    'Car 565816 Expenses',
    'Executive Financial Summary',
  ];

  const handleLoadSample = (index: number) => {
    setDbSource((prev) => ({
      ...prev,
      sheets: getLiveSheetTables(),
      activeSheetIndex: index,
    }));
    setActiveTab('grid');
    showNotification(`Switched to "${sampleNames[index]}" sheet!`, 'success');
  };

  const appBg =
    theme === 'emerald'
      ? 'bg-[#02110e] text-slate-100'
      : theme === 'amber'
      ? 'bg-[#120d03] text-slate-100'
      : theme === 'obsidian'
      ? 'bg-[#09090b] text-slate-100'
      : 'bg-slate-950 text-slate-100';

  const taskBarBg =
    theme === 'emerald'
      ? 'bg-[#041a15] border-b border-emerald-900/60'
      : theme === 'amber'
      ? 'bg-[#181105] border-b border-amber-900/60'
      : theme === 'obsidian'
      ? 'bg-[#09090b] border-b border-zinc-800'
      : 'bg-[#0b1329] border-b border-indigo-900/50';

  const tabContainerBg =
    theme === 'emerald'
      ? 'bg-slate-950/90 border-emerald-900/50'
      : theme === 'amber'
      ? 'bg-slate-950/90 border-amber-900/50'
      : theme === 'obsidian'
      ? 'bg-zinc-900/90 border-zinc-800'
      : 'bg-slate-950/80 border-indigo-900/40';

  const activeTabClass =
    theme === 'emerald'
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/25 scale-[1.03] ring-1 ring-emerald-400/40'
      : theme === 'amber'
      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-black shadow-xl shadow-amber-500/25 scale-[1.03] ring-1 ring-amber-400/40'
      : theme === 'obsidian'
      ? 'bg-zinc-100 text-zinc-950 shadow-xl shadow-white/10 scale-[1.03] ring-1 ring-white/30'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 scale-[1.03] ring-1 ring-blue-400/40';

  const activeSecondaryTabClass =
    theme === 'emerald'
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
      : theme === 'amber'
      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 shadow-md font-bold'
      : theme === 'obsidian'
      ? 'bg-zinc-200 text-zinc-950 shadow-md'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md';

  return (
    <div
      id="spreadsheet-database-app"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen flex flex-col ${appBg} font-sans antialiased relative selection:bg-emerald-500 selection:text-white`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div
          id="drag-drop-overlay"
          className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-xs border-4 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none"
        >
          <Upload className="h-16 w-16 text-emerald-400 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white">Drop your Excel file here</h2>
          <p className="text-emerald-300 mt-2 text-sm">
            Import .xlsx, .xls or .csv instantly into the database
          </p>
        </div>
      )}

      {/* Global Status Banner / Toast */}
      {statusMessage && (
        <div
          id="status-toast"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl border text-xs sm:text-sm font-medium flex items-center gap-2 transition-all animate-in slide-in-from-bottom duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* App Header */}
      <Header
        dbSource={dbSource}
        user={user}
        isConnectingGoogle={isConnectingGoogle}
        onUploadExcel={handleUploadExcel}
        onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onLoadSample={handleLoadSample}
        sampleNames={sampleNames}
        theme={theme}
        onOpenMakeNewExcel={() => setIsMakeNewExcelOpen(true)}
        onRefreshCloud={handleRefreshCloudDatabase}
        onOpenSettings={() => handleOpenSettings('database')}
        onDownloadFullExcel={handleDownloadFullExcel}
        onDownloadJsonBackup={handleDownloadJsonBackup}
      />

      {/* EXECUTIVE TASK BAR (Mobile Arranged Size) */}
      <div id="view-mode-bar" className={`${taskBarBg} px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 border-b border-slate-800/80 shadow-md`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
          {/* View Switcher Tabs (Scrollable on small phones without pushing theme button) */}
          <div className={`flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl ${tabContainerBg} border overflow-x-auto scrollbar-none shadow-inner`}>
            <button
              id="tab-front-page"
              onClick={() => setActiveTab('front_page')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'front_page'
                  ? activeTabClass
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Home className="h-4 w-4 text-emerald-300 shrink-0" />
              <span className="sm:hidden">Home</span>
              <span className="hidden sm:inline">Front Page</span>
            </button>

            <button
              id="tab-villa-manager"
              onClick={() => setActiveTab('villa_manager')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'villa_manager'
                  ? activeTabClass
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Building2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <span className="sm:hidden">Villa</span>
              <span className="hidden sm:inline">Villa (12 Rooms)</span>
            </button>

            <button
              id="tab-personal-finance"
              onClick={() => setActiveTab('personal_finance')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'personal_finance'
                  ? activeTabClass
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Wallet className="h-4 w-4 text-teal-300 shrink-0" />
              <span className="sm:hidden">Finance</span>
              <span className="hidden sm:inline">Personal Finance</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5 hidden md:block" />

            <button
              id="tab-data-grid"
              onClick={() => setActiveTab('grid')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'grid'
                  ? activeTabClass
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
              title="Open Live Two-Way Excel Spreadsheets"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="sm:hidden">Excel</span>
              <span className="hidden sm:inline">Excel Sheets (Live)</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-0.5" />
            </button>

            <button
              id="tab-card-view"
              onClick={() => setActiveTab('cards')}
              className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'cards'
                  ? activeSecondaryTabClass
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px] ${
                activeTab === 'analytics'
                  ? activeSecondaryTabClass
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Charts</span>
            </button>
          </div>

          {/* Right Action: Download, Settings & Color Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Download Button in Taskbar */}
            <button
              id="taskbar-download-btn"
              type="button"
              onClick={handleOpenDownload}
              className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-900 border border-sky-600/50 text-sky-300 hover:text-white transition-all shadow-sm cursor-pointer min-h-[36px] sm:min-h-[38px]"
              title="Download Excel (.xlsx), CSV, and Database Backup"
            >
              <Download className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Quick Settings Button in Taskbar */}
            <button
              id="taskbar-settings-btn"
              type="button"
              onClick={() => handleOpenSettings('database')}
              className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-900 border border-emerald-600/50 text-emerald-300 hover:text-white transition-all shadow-sm cursor-pointer min-h-[36px] sm:min-h-[38px]"
              title="Settings & Live Database Choose Option"
            >
              <Settings className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <div className="relative">
              <button
                id="theme-switcher-btn"
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 transition-all shadow-sm cursor-pointer min-h-[36px] sm:min-h-[38px]"
                title="Change Color Theme"
              >
                <Palette className="h-4 w-4 text-emerald-400" />
                <span className="capitalize text-emerald-300 font-extrabold hidden sm:inline">{theme}</span>
              </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Select Color Theme
                </div>
                {(
                  [
                    { id: 'emerald', name: 'Emerald Luxury (New)', colorBg: 'bg-emerald-500' },
                    { id: 'sapphire', name: 'Royal Sapphire', colorBg: 'bg-blue-500' },
                    { id: 'amber', name: 'Gold Amber', colorBg: 'bg-amber-500' },
                    { id: 'obsidian', name: 'Obsidian Minimal', colorBg: 'bg-zinc-400' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsThemeMenuOpen(false);
                      showNotification(`Switched to ${t.name} theme!`, 'info');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                      theme === t.id
                        ? 'bg-slate-900 text-white border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${t.colorBg}`} />
                      <span>{t.name}</span>
                    </div>
                    {theme === t.id && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main id="app-main-content" className="flex-1 flex flex-col min-h-0 relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <RefreshCw className="h-10 w-10 animate-spin text-emerald-400 mb-3" />
            <p className="text-base font-medium text-slate-200">Processing spreadsheet...</p>
            <p className="text-xs text-slate-500 mt-1">
              Extracting tables, parsing schemas, and indexing records
            </p>
          </div>
        ) : activeTab === 'front_page' ? (
          <FrontPage
            onNavigate={(view) => setActiveTab(view)}
            onOpenAddExpense={() => setActiveTab('personal_finance')}
            onOpenAddIncome={() => setActiveTab('personal_finance')}
            theme={theme}
            onOpenMakeNewExcel={() => setIsMakeNewExcelOpen(true)}
            onOpenSettings={() => handleOpenSettings('database')}
            onOpenDownload={handleOpenDownload}
          />
        ) : activeTab === 'villa_manager' ? (
          <VillaMasterManager
            onExportExcel={handleExportExcel}
            onOpenMakeNewExcel={() => setIsMakeNewExcelOpen(true)}
            onOpenSettings={() => handleOpenSettings('database')}
            onOpenDownload={handleOpenDownload}
          />
        ) : activeTab === 'personal_finance' ? (
          <PersonalFinanceTracker
            villaNetProfit={3450}
            onOpenMakeNewExcel={() => setIsMakeNewExcelOpen(true)}
          />
        ) : activeTab === 'grid' ? (
          <TableView
            tables={dbSource.sheets}
            activeTableIndex={dbSource.activeSheetIndex}
            onSelectTable={(idx) => setDbSource((prev) => ({ ...prev, activeSheetIndex: idx }))}
            onOpenAddModal={() => setIsAddRecordOpen(true)}
            onOpenRecordDrawer={(record, index) => setInspectRecord({ record, index })}
            onUpdateCell={handleUpdateCell}
            onDeleteRows={handleDeleteRows}
            onOpenMakeNewExcel={() => setIsMakeNewExcelOpen(true)}
            onSwitchToVillaView={() => setActiveTab('villa_manager')}
          />
        ) : activeTab === 'cards' ? (
          /* Cards View */
          <div id="cards-view-container" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {currentSheet?.name} Records
                  </h2>
                  {cardFilter !== 'ALL' && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      cardFilter === 'OVERDUE'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      Filter: {cardFilter}
                    </span>
                  )}
                  {cardSearchQuery.trim() && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                      Search: &ldquo;{cardSearchQuery}&rdquo;
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Card grid representation with real-time record search and floating quick action shortcuts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="cards-add-record-btn"
                  onClick={() => setIsAddRecordOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Record</span>
                </button>
              </div>
            </div>

            {/* Real-time search bar inside cards-view-container */}
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="cards-search-input"
                type="text"
                placeholder="Search cards in real-time by tenant, room, amount, date, status..."
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
              {cardSearchQuery && (
                <button
                  onClick={() => setCardSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSheet?.rows
                .filter((r) => {
                  if (cardFilter === 'OVERDUE') {
                    const rowStr = JSON.stringify(r).toLowerCase();
                    const isOverdue = (
                      rowStr.includes('unpaid') ||
                      rowStr.includes('overdue') ||
                      rowStr.includes('pending') ||
                      rowStr.includes('vacant') ||
                      rowStr.includes('empty')
                    );
                    if (!isOverdue) return false;
                  } else if (cardFilter === 'PAID') {
                    const rowStr = JSON.stringify(r).toLowerCase();
                    const isPaid = (rowStr.includes('paid') && !rowStr.includes('unpaid')) || rowStr.includes('active');
                    if (!isPaid) return false;
                  }

                  if (cardSearchQuery.trim()) {
                    const q = cardSearchQuery.toLowerCase();
                    const rowStr = Object.values(r).map(v => String(v ?? '')).join(' ').toLowerCase();
                    if (!rowStr.includes(q)) return false;
                  }

                  return true;
                })
                .map((row, idx) => {
                  const visibleCols = currentSheet.columns
                    .filter((c) => !c.key.startsWith('_'))
                    .slice(0, 5);

                  const primaryField = visibleCols[0];
                  const secondaryField = visibleCols[1];

                  const rowStr = JSON.stringify(row).toLowerCase();
                  const isOverdue = rowStr.includes('unpaid') || rowStr.includes('overdue');

                  return (
                    <div
                      key={row._rowId || idx}
                      onClick={() => setInspectRecord({ record: row, index: idx })}
                      className={`bg-slate-900 border rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer space-y-3 group ${
                        isOverdue
                          ? 'border-rose-800/80 hover:border-rose-600 bg-linear-to-b from-rose-950/20 to-slate-900'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            Record #{idx + 1}
                          </span>
                          <h3 className="font-semibold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition-colors">
                            {primaryField ? String(row[primaryField.key] || 'Untitled') : 'Untitled'}
                          </h3>
                          {secondaryField && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {String(row[secondaryField.key] || '')}
                            </p>
                          )}
                        </div>

                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                            Unpaid / Overdue
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {visibleCols.slice(2).map((col) => {
                          const val = row[col.key];
                          return (
                            <div key={col.key} className="flex justify-between items-center gap-2">
                              <span className="text-slate-400 truncate">{col.label}:</span>
                              <span className="text-slate-200 font-medium truncate max-w-[150px]">
                                {val !== undefined && val !== null && String(val).trim() !== ''
                                  ? String(val)
                                  : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Floating 'Quick Actions' Menu Button inside cards-view-container */}
            <CardsQuickActions
              onAddExpense={() => setIsAddRecordOpen(true)}
              onCheckOverdue={() => setCardFilter((prev) => (prev === 'OVERDUE' ? 'ALL' : 'OVERDUE'))}
              onToggleFilter={() =>
                setCardFilter((prev) => (prev === 'ALL' ? 'OVERDUE' : prev === 'OVERDUE' ? 'PAID' : 'ALL'))
              }
              activeFilterState={cardFilter}
              isOverdueActive={cardFilter === 'OVERDUE'}
              overdueCount={
                currentSheet?.rows.filter((r) => {
                  const s = JSON.stringify(r).toLowerCase();
                  return s.includes('unpaid') || s.includes('overdue') || s.includes('pending');
                }).length || 0
              }
            />
          </div>
        ) : (
          /* Analytics & Schema View */
          currentSheet && (
            <AnalyticsView
              table={currentSheet}
              onNavigateToPersonalFinance={() => setActiveTab('personal_finance')}
            />
          )
        )}
      </main>

      {/* Slide-over Record Inspector Drawer */}
      {inspectRecord && currentSheet && (
        <RecordDrawer
          isOpen={Boolean(inspectRecord)}
          record={inspectRecord.record}
          columns={currentSheet.columns}
          currentIndex={inspectRecord.index}
          totalRecords={currentSheet.rows.length}
          onClose={() => setInspectRecord(null)}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={(rowId) => handleDeleteRows([rowId])}
          onNavigate={(newIdx) => {
            if (newIdx >= 0 && newIdx < currentSheet.rows.length) {
              setInspectRecord({
                record: currentSheet.rows[newIdx],
                index: newIdx,
              });
            }
          }}
        />
      )}

      {/* Add New Record Modal */}
      {isAddRecordOpen && currentSheet && (
        <AddRecordModal
          isOpen={isAddRecordOpen}
          tableName={currentSheet.name}
          columns={currentSheet.columns}
          onClose={() => setIsAddRecordOpen(false)}
          onAdd={handleAddRecord}
        />
      )}

      {/* Google Drive Spreadsheet Picker Modal */}
      {isDrivePickerOpen && (
        <DrivePickerModal
          isOpen={isDrivePickerOpen}
          accessToken={accessToken}
          onClose={() => setIsDrivePickerOpen(false)}
          onSelectFile={handleSelectDriveFile}
        />
      )}

      {/* Make New Excel Sheet (Live Data) Modal */}
      <MakeNewExcelSheetModal
        isOpen={isMakeNewExcelOpen}
        onClose={() => setIsMakeNewExcelOpen(false)}
        user={user}
        accessToken={accessToken}
        onGoogleSignIn={handleGoogleSignIn}
        onLoadLiveTablesToApp={handleLoadLiveTablesToApp}
        onShowNotification={showNotification}
        theme={theme}
      />

      {/* System Settings & Live Database Chooser Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onSelectTheme={setTheme}
        databaseMode={databaseMode}
        onChangeDatabaseMode={handleSetDatabaseMode}
        defaultOpeningView={defaultOpeningView}
        onSelectDefaultOpeningView={handleSetDefaultOpeningView}
        sheets={dbSource.sheets}
        activeSheetIndex={dbSource.activeSheetIndex}
        onSelectSheetIndex={(idx) => {
          setDbSource((prev) => ({ ...prev, activeSheetIndex: idx }));
          setActiveTab('grid');
        }}
        onDownloadFullExcel={handleDownloadFullExcel}
        onDownloadCurrentSheetExcel={handleExportExcel}
        onDownloadCsv={handleExportCsv}
        onDownloadJsonBackup={handleDownloadJsonBackup}
        onRefreshCloud={handleRefreshCloudDatabase}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
