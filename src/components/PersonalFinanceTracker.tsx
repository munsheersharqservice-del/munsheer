import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Plus,
  Filter,
  Search,
  Calendar,
  CreditCard,
  Building,
  Banknote,
  DollarSign,
  TrendingUp,
  Gauge,
  Trash2,
  Edit2,
  Users,
  PieChart,
  BarChart3,
  Layers,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Globe2,
  HeartHandshake,
  Car,
  GraduationCap,
  ShoppingBag,
  Home,
  ShieldCheck,
  CheckCircle2,
  X,
  Paperclip,
  HardDrive,
  Upload,
  RotateCcw,
  UserCheck,
  FolderOpen,
  Fuel,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import {
  subscribeToGlobalDatabase,
  pushGlobalDatabaseToCloud,
  fetchGlobalDatabaseFromCloud,
} from '../services/firestoreSync';
import {
  PersonalTransaction,
  FamilyMember,
  PaymentMethod,
  FAMILY_MEMBERS,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES,
  MONTH_NAMES,
  INITIAL_TRANSACTIONS,
  DocumentAttachment,
  GOOGLE_DRIVE_DATA_FOLDER,
  USER_VEHICLE,
} from '../data/personalFinanceData';
import { DocumentAttachmentModal } from './DocumentAttachmentModal';
import { PersonalFinanceExpensePieChart } from './PersonalFinanceExpensePieChart';
import { formatCurrency, formatQAR } from '../data/villaDatabase';
import * as XLSX from 'xlsx';

interface PersonalFinanceTrackerProps {
  villaNetProfit?: number;
  onOpenMakeNewExcel?: () => void;
}

export const PersonalFinanceTracker: React.FC<PersonalFinanceTrackerProps> = ({
  villaNetProfit,
  onOpenMakeNewExcel,
}) => {
  // Persistence state - all previous data removed starting October 2026
  const [transactions, setTransactions] = useState<PersonalTransaction[]>(() => {
    localStorage.removeItem('personal_finance_txs_v2');
    localStorage.removeItem('personal_finance_txs_v1');
    const saved = localStorage.getItem('personal_finance_txs_october_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    }
    return [];
  });

  // Cloud Firestore Sync State (Keeps the same transactions database on all devices)
  const [isSyncingTxsWithCloud, setIsSyncingTxsWithCloud] = useState<boolean>(false);
  const [lastTxCloudSync, setLastTxCloudSync] = useState<string>('');

  // 1. Subscribe to Cloud Firestore real-time updates for Personal Transactions
  useEffect(() => {
    const unsub = subscribeToGlobalDatabase((data) => {
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setLastTxCloudSync(new Date().toLocaleTimeString());
      }
    });

    // Fetch latest cloud state on load
    fetchGlobalDatabaseFromCloud().then((cloudData) => {
      if (cloudData && cloudData.transactions && Array.isArray(cloudData.transactions)) {
        setTransactions(cloudData.transactions);
        setLastTxCloudSync(new Date().toLocaleTimeString());
      }
    });

    const handleAppDatabaseUpdated = (e: any) => {
      const data = e.detail;
      if (data && data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setLastTxCloudSync(new Date().toLocaleTimeString());
      }
    };

    window.addEventListener('app_database_updated', handleAppDatabaseUpdated);

    return () => {
      unsub();
      window.removeEventListener('app_database_updated', handleAppDatabaseUpdated);
    };
  }, []);

  // 2. Keep local storage updated with state
  useEffect(() => {
    localStorage.setItem('personal_finance_txs_october_v3', JSON.stringify(transactions));
  }, [transactions]);

  // Handler for manual cloud sync refresh
  const handleManualTxCloudRefresh = async () => {
    setIsSyncingTxsWithCloud(true);
    try {
      const cloudData = await fetchGlobalDatabaseFromCloud();
      if (cloudData && cloudData.transactions && Array.isArray(cloudData.transactions)) {
        setTransactions(cloudData.transactions);
        localStorage.setItem('personal_finance_txs_october_v3', JSON.stringify(cloudData.transactions));
      }
      setLastTxCloudSync(new Date().toLocaleTimeString());
    } finally {
      setIsSyncingTxsWithCloud(false);
    }
  };

  // View Controls
  const [timeMode, setTimeMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>('OCT');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<FamilyMember | 'ALL'>('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'income' | 'expense' | 'transfer'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'monthly_breakdown' | 'members' | 'car_565816'>('overview');

  // Chart Open/Close Option State (Requested by user)
  const [showFinanceCharts, setShowFinanceCharts] = useState<boolean>(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [showCarKmFields, setShowCarKmFields] = useState<boolean>(false);

  // Form Fields
  const [formCategory, setFormCategory] = useState<string>('grocery');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formMember, setFormMember] = useState<FamilyMember>('munsheer');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('cbq');
  const [formSource, setFormSource] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');
  const [formOdometerKm, setFormOdometerKm] = useState<number | ''>('');
  const [formFuelLitres, setFormFuelLitres] = useState<number | ''>('');
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith('2026-10') ? today : '2026-10-01';
  });
  const [formAttachment, setFormAttachment] = useState<DocumentAttachment | null>(null);
  const [formDriveUrl, setFormDriveUrl] = useState<string>('');

  // Dedicated helper to open Car 565816 Expense Modal
  const openCarExpenseModal = (
    category: string = 'car_565816_petrol',
    defaultReason: string = 'Car 565816 Petrol refill',
    defaultSource: string = 'Woqod Petrol Station'
  ) => {
    setModalType('expense');
    setFormCategory(category);
    setFormAmount('');
    setFormMember('munsheer');
    setFormPaymentMethod('cbq');
    setFormSource(defaultSource);
    setFormReason(defaultReason);
    setFormOdometerKm('');
    setFormFuelLitres('');
    setShowCarKmFields(true);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAttachment(null);
    setFormDriveUrl(GOOGLE_DRIVE_DATA_FOLDER.url);
    setIsAddModalOpen(true);
  };

  // Document Viewer Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<{
    attachment: DocumentAttachment;
    txId?: string;
    title: string;
  } | null>(null);

  // File upload handler
  const handleFormFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormAttachment({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: event.target?.result as string,
        driveUrl: formDriveUrl.trim() || undefined,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
      });
    };
    reader.readAsDataURL(file);
  };

  // Reset form when modal opens
  const openModal = (type: 'income' | 'expense' | 'transfer') => {
    setModalType(type);
    if (type === 'income') {
      setFormCategory('salary');
      setFormSource('Sharq Service Payroll');
      setFormReason('Monthly salary');
      setFormPaymentMethod('cbq');
    } else if (type === 'expense') {
      setFormCategory('food');
      setFormSource('');
      setFormReason('Family grocery & provisions');
      setFormPaymentMethod('credit_card');
    } else {
      setFormCategory('transfer_to_saving');
      setFormSource('CBQ Bank Account');
      setFormReason('Emergency savings reserve');
      setFormPaymentMethod('cbq');
    }
    setFormAmount('');
    setFormAttachment(null);
    setFormDriveUrl('');
    setFormOdometerKm('');
    setFormFuelLitres('');
    setShowCarKmFields(false);
    setIsAddModalOpen(true);
  };

  // Dedicated 1-Click Maid Salary Action
  const openMaidSalaryModal = () => {
    setModalType('expense');
    setFormCategory('maid_salary');
    setFormMember('house_maid');
    setFormPaymentMethod('cash');
    setFormSource('Household Payroll');
    setFormReason('Monthly house maid salary');
    setFormAmount(1500);
    setFormAttachment(null);
    setFormDriveUrl('');
    setFormOdometerKm('');
    setFormFuelLitres('');
    setShowCarKmFields(false);
    setIsAddModalOpen(true);
  };

  // Start fresh at zero for October 2026
  const handleResetForOctober = () => {
    setTransactions([]);
    setSelectedMonth('OCT');
    setSelectedYear(2026);
    localStorage.setItem('personal_finance_txs_october_v3', '[]');
    localStorage.removeItem('personal_finance_txs_v2');
    localStorage.removeItem('personal_finance_txs_v1');
    pushGlobalDatabaseToCloud({ transactions: [] });
  };

  const handleUpdateTxDriveUrl = (txId: string, newDriveUrl: string) => {
    const updatedTxs = transactions.map((t) =>
      t.id === txId
        ? {
            ...t,
            attachment: t.attachment
              ? { ...t.attachment, driveUrl: newDriveUrl }
              : {
                  name: `${t.reason || 'Transaction'} Receipt`,
                  driveUrl: newDriveUrl,
                  uploadedAt: new Date().toLocaleDateString('en-GB'),
                },
          }
        : t
    );
    setTransactions(updatedTxs);
    pushGlobalDatabaseToCloud({ transactions: updatedTxs });
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(formAmount);
    if (!numAmount || numAmount <= 0) {
      return;
    }

    const txDate = formDate || '2026-10-01';
    const monthNum = parseInt(txDate.split('-')[1], 10);
    const calculatedMonth = MONTH_NAMES[monthNum - 1] || 'OCT';
    const calculatedYear = parseInt(txDate.split('-')[0], 10) || 2026;

    const finalAttachment: DocumentAttachment | undefined =
      formAttachment || formDriveUrl.trim()
        ? {
            name: formAttachment?.name || `${formReason || 'Expense'} Document`,
            size: formAttachment?.size,
            type: formAttachment?.type || 'application/pdf',
            dataUrl: formAttachment?.dataUrl,
            driveUrl: formDriveUrl.trim() || formAttachment?.driveUrl,
            uploadedAt: new Date().toLocaleDateString('en-GB'),
          }
        : undefined;

    const numOdometer = formOdometerKm !== '' ? Number(formOdometerKm) : undefined;
    const numFuelLitres = formFuelLitres !== '' ? Number(formFuelLitres) : undefined;

    const newTx: PersonalTransaction = {
      id: `tx-${Date.now()}`,
      type: modalType,
      category: formCategory,
      amount: numAmount,
      currency: 'QAR',
      date: txDate,
      month: calculatedMonth,
      year: calculatedYear,
      member: formMember,
      paymentMethod: formPaymentMethod,
      source: formSource.trim() || undefined,
      reason: formReason.trim() || undefined,
      odometerKm: numOdometer && numOdometer > 0 ? numOdometer : undefined,
      fuelLitres: numFuelLitres && numFuelLitres > 0 ? numFuelLitres : undefined,
      attachment: finalAttachment,
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    pushGlobalDatabaseToCloud({ transactions: updatedTxs });
    setIsAddModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const updatedTxs = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxs);
    pushGlobalDatabaseToCloud({ transactions: updatedTxs });
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Time filter
      if (timeMode === 'monthly') {
        if (t.month !== selectedMonth || t.year !== selectedYear) return false;
      } else {
        if (t.year !== selectedYear) return false;
      }

      // Member filter
      if (selectedMemberFilter !== 'ALL' && t.member !== selectedMemberFilter) return false;

      // Payment filter
      if (selectedPaymentFilter !== 'ALL' && t.paymentMethod !== selectedPaymentFilter) return false;

      // Type filter
      if (selectedTypeFilter !== 'ALL' && t.type !== selectedTypeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catLabel =
          INCOME_CATEGORIES.find((c) => c.id === t.category)?.label ||
          EXPENSE_CATEGORIES.find((c) => c.id === t.category)?.label ||
          TRANSFER_CATEGORIES.find((c) => c.id === t.category)?.label ||
          t.category;
        const matchCat = catLabel.toLowerCase().includes(q);
        const matchReason = (t.reason || '').toLowerCase().includes(q);
        const matchSource = (t.source || '').toLowerCase().includes(q);
        const matchMember = FAMILY_MEMBERS[t.member]?.name.toLowerCase().includes(q);
        return matchCat || matchReason || matchSource || matchMember;
      }

      return true;
    });
  }, [
    transactions,
    timeMode,
    selectedMonth,
    selectedYear,
    selectedMemberFilter,
    selectedPaymentFilter,
    selectedTypeFilter,
    searchQuery,
  ]);

  // Aggregated Financial Metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    let transferToSaving = 0;
    let transferToIndia = 0;
    let investedTrading = 0;

    const byPayment: Record<PaymentMethod, number> = {
      cbq: 0,
      credit_card: 0,
      cash: 0,
    };

    const byMember: Record<FamilyMember, { income: number; expense: number; transfer: number }> = {
      munsheer: { income: 0, expense: 0, transfer: 0 },
      rubeena: { income: 0, expense: 0, transfer: 0 },
      aifa: { income: 0, expense: 0, transfer: 0 },
      ahlam: { income: 0, expense: 0, transfer: 0 },
      house_maid: { income: 0, expense: 0, transfer: 0 },
    };

    const categoryExpenseTotals: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        byMember[t.member].income += t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
        byMember[t.member].expense += t.amount;
        byPayment[t.paymentMethod] = (byPayment[t.paymentMethod] || 0) + t.amount;
        categoryExpenseTotals[t.category] = (categoryExpenseTotals[t.category] || 0) + t.amount;
      } else if (t.type === 'transfer') {
        totalTransfers += t.amount;
        byMember[t.member].transfer += t.amount;
        byPayment[t.paymentMethod] = (byPayment[t.paymentMethod] || 0) + t.amount;

        if (t.category === 'transfer_to_saving') transferToSaving += t.amount;
        if (t.category === 'transfer_to_india') transferToIndia += t.amount;
        if (t.category === 'invested_in_trading') investedTrading += t.amount;
      }
    });

    const netSurplus = totalIncome - totalExpenses - totalTransfers;
    // Estimated INR rate (~22.8 INR per 1 QAR)
    const transferIndiaINR = transferToIndia * 22.8;

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      transferToSaving,
      transferToIndia,
      investedTrading,
      transferIndiaINR,
      netSurplus,
      byPayment,
      byMember,
      categoryExpenseTotals,
    };
  }, [filteredTransactions]);

  // Car 565816 Metrics Calculation (Requested by user)
  const carMetrics = useMemo(() => {
    const isCarTx = (t: PersonalTransaction) => {
      const cat = String(t.category).toLowerCase();
      const reason = String(t.reason || '').toLowerCase();
      const source = String(t.source || '').toLowerCase();
      return (
        cat.startsWith('car_565816') ||
        cat === 'car_petrol' ||
        cat === 'car_maintenance' ||
        reason.includes('565816') ||
        source.includes('565816')
      );
    };

    const allCarTxs = transactions.filter(isCarTx);
    const filteredCarTxs = filteredTransactions.filter(isCarTx);

    const totalCarExpense = filteredCarTxs.reduce((sum, t) => sum + t.amount, 0);
    const allTimeCarExpense = allCarTxs.reduce((sum, t) => sum + t.amount, 0);

    const petrolExpense = filteredCarTxs
      .filter((t) => t.category.includes('petrol') || (t.reason || '').toLowerCase().includes('petrol'))
      .reduce((sum, t) => sum + t.amount, 0);

    const maintenanceExpense = filteredCarTxs
      .filter(
        (t) =>
          t.category.includes('maintenance') ||
          t.category.includes('service') ||
          (t.reason || '').toLowerCase().includes('service')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const insuranceExpense = filteredCarTxs
      .filter(
        (t) =>
          t.category.includes('insurance') ||
          (t.reason || '').toLowerCase().includes('istimara')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const washExpense = filteredCarTxs
      .filter((t) => t.category.includes('wash') || (t.reason || '').toLowerCase().includes('wash'))
      .reduce((sum, t) => sum + t.amount, 0);

    const finesExpense = filteredCarTxs
      .filter(
        (t) =>
          t.category.includes('fines') ||
          (t.reason || '').toLowerCase().includes('fine') ||
          (t.reason || '').toLowerCase().includes('parking')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Odometer KM metrics & Fuel consumption
    const carTxsWithKm = allCarTxs.filter((t) => t.odometerKm && t.odometerKm > 0);
    const latestOdometer = carTxsWithKm.length > 0
      ? Math.max(...carTxsWithKm.map((t) => t.odometerKm || 0))
      : 0;
    const totalFuelLitres = filteredCarTxs.reduce((sum, t) => sum + (t.fuelLitres || 0), 0);
    const allTimeFuelLitres = allCarTxs.reduce((sum, t) => sum + (t.fuelLitres || 0), 0);

    return {
      allCarTxs,
      filteredCarTxs,
      totalCarExpense,
      allTimeCarExpense,
      petrolExpense,
      maintenanceExpense,
      insuranceExpense,
      washExpense,
      finesExpense,
      latestOdometer,
      totalFuelLitres,
      allTimeFuelLitres,
      hasKmRecords: carTxsWithKm.length > 0,
    };
  }, [transactions, filteredTransactions]);

  // Save All Data to Google Drive Folder (Folder ID: 1DflkGubMRjXiMJCD970nILdICKe_QvaE)
  const handleSaveToDriveFolder = () => {
    handleExportExcel();
    const link = document.createElement('a');
    link.href = GOOGLE_DRIVE_DATA_FOLDER.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'ID',
      'Date',
      'Type',
      'Category',
      'Amount (QAR)',
      'Member',
      'Payment Method',
      'Source',
      'Reason / Purpose',
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      t.category,
      t.amount,
      FAMILY_MEMBERS[t.member]?.name || t.member,
      t.paymentMethod.toUpperCase(),
      t.source || '',
      t.reason || '',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Personal Finance');
    XLSX.writeFile(wb, `Personal_Finance_${selectedMonth}_${selectedYear}.xlsx`);
  };

  // Export Car 565816 specific expenses
  const handleExportCarExcel = () => {
    const headers = [
      'ID',
      'Date',
      'Vehicle',
      'Category',
      'Amount (QAR)',
      'Payment Method',
      'Station / Vendor',
      'Purpose / Description',
      'Attachment',
    ];

    const rows = carMetrics.filteredCarTxs.map((t) => [
      t.id,
      t.date,
      'Car 565816 (Qatar)',
      t.category,
      t.amount,
      t.paymentMethod.toUpperCase(),
      t.source || '',
      t.reason || '',
      t.attachment?.name || 'No attachment',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Car 565816 Expenses');
    XLSX.writeFile(wb, `Car_565816_Expenses_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div id="personal-finance-tracker" className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Top Professional App Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Personal & Family Finance
              </h1>
            </div>
          </div>

          {/* Action Bar: Time Toggle, Add Buttons & Export */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Monthly / Yearly Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-semibold">
              <button
                onClick={() => setTimeMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeMode === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeMode('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeMode === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Month Selector (if monthly) */}
            {timeMode === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Select month"
                className="bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m} {selectedYear}
                  </option>
                ))}
              </select>
            )}

            {/* Quick Add Action Dropdown / Buttons */}
            <button
              onClick={() => openModal('income')}
              className="px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Income</span>
            </button>

            <button
              onClick={() => openModal('expense')}
              className="px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Expense</span>
            </button>

            <button
              onClick={() => openModal('transfer')}
              className="px-3 py-2 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer transition-all"
            >
              <Repeat className="h-3.5 w-3.5" />
              <span>+ Transfer / Trading</span>
            </button>

            {/* Dedicated Maid Salary Action */}
            <button
              id="maid-salary-quick-btn"
              onClick={openMaidSalaryModal}
              className="px-3 py-2 bg-amber-600/90 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all"
              title="Add House Maid Monthly Salary"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>+ Maid Salary</span>
            </button>

            {/* Dedicated Car 565816 Expense Action (Requested by user) */}
            <button
              id="car-565816-quick-btn"
              onClick={() => openCarExpenseModal('car_565816_petrol', 'Car 565816 Petrol refill', 'Woqod Petrol Station')}
              className="px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer transition-all"
              title="Log Petrol / Service / Istimara for Car 565816"
            >
              <Car className="h-3.5 w-3.5" />
              <span>+ Car 565816</span>
            </button>

            {/* Cloud Sync Status Badge (Cross-Device Sync) */}
            <button
              type="button"
              onClick={handleManualTxCloudRefresh}
              disabled={isSyncingTxsWithCloud}
              className="px-2.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`Transactions synced in real-time across all devices via Cloud Firestore. Last sync: ${lastTxCloudSync || 'Active'}. Click to refresh.`}
            >
              <span className={`h-2 w-2 rounded-full bg-emerald-400 ${isSyncingTxsWithCloud ? 'animate-ping' : 'animate-pulse'}`} />
              <span className="hidden xs:inline">Live Cloud Sync</span>
              <span className="xs:hidden">Sync</span>
              {isSyncingTxsWithCloud ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
            </button>

            {/* Open / Close Chart Toggle Button (Requested by user) */}
            <button
              id="pf-charts-toggle-btn"
              type="button"
              onClick={() => setShowFinanceCharts((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                showFinanceCharts
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
                  : 'bg-slate-950 text-purple-300 border-slate-800 hover:text-white hover:border-purple-500/60'
              }`}
              title={showFinanceCharts ? 'Close Visual Category Charts' : 'Open Visual Category Charts'}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{showFinanceCharts ? 'Close Charts ▲' : 'Open Charts 📊'}</span>
            </button>

            {/* Make New Excel Sheet (Live Data) */}
            {onOpenMakeNewExcel && (
              <button
                id="pf-make-new-excel-btn"
                onClick={onOpenMakeNewExcel}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all hover:scale-[1.02]"
                title="Make New Excel Sheet with all live personal and villa data"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Make New Excel Sheet</span>
              </button>
            )}

            {/* Save All Data to Google Drive Folder */}
            <button
              id="drive-folder-save-btn"
              onClick={handleSaveToDriveFolder}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-sky-600/40 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer transition-all"
              title="Export & Save all data in Google Drive folder: 1DflkGubMRjXiMJCD970nILdICKe_QvaE"
            >
              <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
              <span>Save to Drive Folder</span>
            </button>

            {/* Reset to 0 for October */}
            <button
              onClick={handleResetForOctober}
              className="px-2.5 py-2 bg-slate-950 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Clear all records and start at zero for October 2026"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Start Oct (Reset 0)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 border-t border-slate-800/80 pt-2.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Overview & Analytics</span>
          </button>

          {/* Dedicated Car 565816 Tab */}
          <button
            id="tab-car-565816"
            onClick={() => setActiveTab('car_565816')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'car_565816'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="h-3.5 w-3.5 text-rose-400" />
            <span>Car 565816 Hub</span>
            {carMetrics.filteredCarTxs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                {carMetrics.filteredCarTxs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Transaction Ledger ({filteredTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_breakdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'monthly_breakdown'
                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>12-Month Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Family Portfolios</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Strip: 4 Executive Highlight Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. Total Inflow */}
          <div className="bg-slate-900 border border-emerald-800/50 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[75px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                <span>Inflow</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {timeMode === 'monthly' ? selectedMonth : 'Year'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-1 sm:mt-2">
              QAR {formatCurrency(metrics.totalIncome)}
            </div>
          </div>

          {/* 2. Total Outflow (Expenses) */}
          <div className="bg-slate-900 border border-rose-800/50 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[75px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4" />
                <span>Expenses</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                Outflow
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-1 sm:mt-2">
              QAR {formatCurrency(metrics.totalExpenses)}
            </div>
          </div>

          {/* 3. Transfers & Investments */}
          <div className="bg-slate-900 border border-sky-800/50 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[75px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Repeat className="h-4 w-4" />
                <span>Transfers</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                India
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono mt-1 sm:mt-2">
              QAR {formatCurrency(metrics.totalTransfers)}
            </div>
          </div>

          {/* 4. Net Monthly Free Cash / Surplus */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[75px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Net Free Cash</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                Balance
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono mt-1 sm:mt-2 ${
                metrics.netSurplus >= 0 ? 'text-purple-300' : 'text-rose-400'
              }`}
            >
              {metrics.netSurplus >= 0 ? '+' : ''}QAR {formatCurrency(metrics.netSurplus)}
            </div>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* CAR 565816 DEDICATED EXPENSE CARD (Requested by user) */}
            <div
              id="car-565816-expense-card"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#180e14] border-2 border-rose-900/60 hover:border-rose-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl transition-all space-y-5"
            >
              {/* Header: Qatar Number Plate + Title + Spending */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3.5">
                  {/* Sleek Qatar License Plate Emblem */}
                  <div className="flex items-center rounded-xl border-2 border-slate-700 bg-white text-slate-950 font-mono shadow-lg overflow-hidden shrink-0">
                    <div className="bg-[#8A1538] text-white px-2.5 py-1.5 text-[9px] uppercase font-black flex flex-col items-center justify-center leading-none tracking-tighter">
                      <span>QATAR</span>
                      <span className="text-[7px]">قطر</span>
                    </div>
                    <div className="px-3.5 py-1 text-xl sm:text-2xl font-black tracking-widest text-slate-950 font-mono">
                      565816
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                        <Car className="h-5 w-5 text-rose-400" />
                        <span>Car 565816 Expense Card</span>
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        Qatar Vehicle
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fuel refills, oil & parts, istimara renewal, wash, and vehicle maintenance receipts
                    </p>
                  </div>
                </div>

                {/* Spending Totals */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      {timeMode === 'monthly' ? `${selectedMonth} Car Spend` : 'Year Car Spend'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
                      QAR {formatCurrency(carMetrics.totalCarExpense)}
                    </span>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      All-Time Total
                    </span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      QAR {formatCurrency(carMetrics.allTimeCarExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Category Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" />
                    <span>Petrol (Woqod)</span>
                  </span>
                  <div className="text-sm sm:text-base font-black text-amber-300 font-mono mt-1">
                    QAR {formatCurrency(carMetrics.petrolExpense)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Maintenance / Oil</span>
                  </span>
                  <div className="text-sm sm:text-base font-black text-sky-300 font-mono mt-1">
                    QAR {formatCurrency(carMetrics.maintenanceExpense)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Insurance / Istimara</span>
                  </span>
                  <div className="text-sm sm:text-base font-black text-purple-300 font-mono mt-1">
                    QAR {formatCurrency(carMetrics.insuranceExpense)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🧼 Wash & Care</span>
                  </span>
                  <div className="text-sm sm:text-base font-black text-teal-300 font-mono mt-1">
                    QAR {formatCurrency(carMetrics.washExpense)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🚨 Fines & Tolls</span>
                  </span>
                  <div className="text-sm sm:text-base font-black text-rose-300 font-mono mt-1">
                    QAR {formatCurrency(carMetrics.finesExpense)}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_petrol',
                        'Car 565816 Petrol refill',
                        'Woqod Petrol Station'
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600/90 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Log Petrol</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_maintenance',
                        'Car 565816 Service & Maintenance',
                        'Woqod / Garage'
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600/90 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Log Service</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_insurance',
                        'Car 565816 Istimara & Insurance',
                        'Insurance Agency'
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600/90 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Istimara / Insurance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_wash',
                        'Car 565816 Wash & Care',
                        'Car Wash'
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600/90 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Car Wash</span>
                  </button>
                </div>

                {/* Target Google Drive Folder Link */}
                <a
                  href={GOOGLE_DRIVE_DATA_FOLDER.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-sky-300 border border-sky-600/40 shadow-sm cursor-pointer transition-colors"
                  title="Open Google Drive Data Folder: 1DflkGubMRjXiMJCD970nILdICKe_QvaE"
                >
                  <FolderOpen className="h-4 w-4 text-sky-400" />
                  <span>Google Drive Folder (1DflkGub...)</span>
                </a>

                {/* Direct Link to Car 565816 Full Hub */}
                <button
                  type="button"
                  onClick={() => setActiveTab('car_565816')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer transition-all"
                >
                  <Car className="h-4 w-4" />
                  <span>View Car 565816 Full Hub & History ({carMetrics.filteredCarTxs.length}) &rarr;</span>
                </button>
              </div>
            </div>

            {/* Special India Remittance & Wealth Portfolio Strip */}
            <div className="bg-linear-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border border-emerald-700/50 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>India Remittance & Wealth Allocation</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-900 text-emerald-200">
                        1 QAR ≈ 22.8 INR
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Transfers sent to parents / family maintenance in India, emergency savings deposits, and equities trading.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-emerald-400">
                      Sent to India (Estimated INR)
                    </div>
                    <div className="text-lg font-black text-white font-mono">
                      ₹ {Math.round(metrics.transferIndiaINR).toLocaleString()} INR
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-sky-400">
                      Bank Savings Reserve
                    </div>
                    <div className="text-lg font-black text-sky-300 font-mono">
                      QAR {formatCurrency(metrics.transferToSaving)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Finance Expense Breakdown by Category Pie Chart (Open / Close Option) */}
            {showFinanceCharts ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                    <span>Expense Breakdown & Category Pie Chart ({selectedMonth} {selectedYear})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFinanceCharts(false)}
                    className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <span>Close Charts ▲</span>
                  </button>
                </div>
                <PersonalFinanceExpensePieChart
                  transactions={transactions}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={(m) => setSelectedMonth(m)}
                  onAddExpense={() => openModal('expense')}
                />
              </div>
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
                  onClick={() => setShowFinanceCharts(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Open Charts 📊</span>
                </button>
              </div>
            )}

            {/* 3 Analytics Cards Grid: Payment Methods, Family Members, Expense Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Payment Methods Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <span>Payment Methods Used</span>
                  </h2>
                  <span className="text-[10px] text-slate-400">Used for Pay</span>
                </div>

                <div className="space-y-3">
                  {/* CBQ */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-blue-400" />
                        <span>CBQ Bank Account</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        QAR {formatCurrency(metrics.byPayment.cbq)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            metrics.totalExpenses + metrics.totalTransfers > 0
                              ? Math.min(
                                  100,
                                  (metrics.byPayment.cbq /
                                    (metrics.totalExpenses + metrics.totalTransfers)) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Credit Card */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-purple-400" />
                        <span>Credit Card</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        QAR {formatCurrency(metrics.byPayment.credit_card)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${
                            metrics.totalExpenses + metrics.totalTransfers > 0
                              ? Math.min(
                                  100,
                                  (metrics.byPayment.credit_card /
                                    (metrics.totalExpenses + metrics.totalTransfers)) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Cash */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Cash</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        QAR {formatCurrency(metrics.byPayment.cash)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${
                            metrics.totalExpenses + metrics.totalTransfers > 0
                              ? Math.min(
                                  100,
                                  (metrics.byPayment.cash /
                                    (metrics.totalExpenses + metrics.totalTransfers)) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Members Flow */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>Family Members Share</span>
                  </h2>
                  <span className="text-[10px] text-slate-400">4 Family Members</span>
                </div>

                <div className="space-y-2.5">
                  {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((memId) => {
                    const mem = FAMILY_MEMBERS[memId];
                    const data = metrics.byMember[memId];
                    return (
                      <div
                        key={memId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-lg bg-linear-to-tr ${mem.avatarColor} text-white font-black text-xs flex items-center justify-center`}
                          >
                            {mem.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{mem.name}</div>
                            <div className="text-[10px] text-slate-400">{mem.relation}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-rose-300">
                            -QAR {formatCurrency(data.expense)}
                          </div>
                          {data.income > 0 && (
                            <div className="text-[10px] font-mono text-emerald-400">
                              +QAR {formatCurrency(data.income)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expense Categories Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <span>Top Expense Categories</span>
                  </h2>
                  <span className="text-[10px] text-slate-400">Living & Education</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(metrics.categoryExpenseTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([catId, amount]) => {
                      const catInfo = EXPENSE_CATEGORIES.find((c) => c.id === catId);
                      const label = catInfo?.label || catId;
                      return (
                        <div
                          key={catId}
                          className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50"
                        >
                          <span className="text-slate-300 truncate max-w-[170px]">{label}</span>
                          <span className="font-mono font-bold text-white">
                            QAR {formatCurrency(amount)}
                          </span>
                        </div>
                      );
                    })}
                  {Object.keys(metrics.categoryExpenseTotals).length === 0 && (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      No expenses logged for this period.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TRANSACTION LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search reason, source, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Filter Member */}
                <select
                  value={selectedMemberFilter}
                  onChange={(e) => setSelectedMemberFilter(e.target.value as any)}
                  aria-label="Filter by member"
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="ALL">All Members</option>
                  {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((m) => (
                    <option key={m} value={m}>
                      {FAMILY_MEMBERS[m].name}
                    </option>
                  ))}
                </select>

                {/* Filter Payment */}
                <select
                  value={selectedPaymentFilter}
                  onChange={(e) => setSelectedPaymentFilter(e.target.value as any)}
                  aria-label="Filter by payment method"
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="ALL">All Payments</option>
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {/* Filter Type */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                  aria-label="Filter by transaction type"
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                  <option value="transfer">Transfers Only</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredTransactions.length}</strong> records
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Member</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Source & Reason</th>
                    <th className="py-3 px-3 text-center">Receipt / Doc</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredTransactions.map((t) => {
                    const memberInfo = FAMILY_MEMBERS[t.member];
                    const catLabel =
                      INCOME_CATEGORIES.find((c) => c.id === t.category)?.label ||
                      EXPENSE_CATEGORIES.find((c) => c.id === t.category)?.label ||
                      TRANSFER_CATEGORIES.find((c) => c.id === t.category)?.label ||
                      t.category;

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {t.date}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              t.type === 'income'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : t.type === 'expense'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-sky-950 text-sky-300 border border-sky-800'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                          {catLabel}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${memberInfo?.badgeColor}`}
                          >
                            {memberInfo?.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap uppercase font-mono text-[11px]">
                          {t.paymentMethod}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate">
                          {t.source && (
                            <span className="font-semibold text-slate-200 mr-1">
                              [{t.source}]
                            </span>
                          )}
                          <span className="text-slate-400">{t.reason || '-'}</span>
                          {t.odometerKm && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 font-mono text-[10px] font-bold inline-flex items-center gap-1 border border-rose-800/60">
                              <Gauge className="h-3 w-3 text-rose-400" />
                              <span>{t.odometerKm.toLocaleString()} KM</span>
                              {t.fuelLitres && <span className="text-amber-400">({t.fuelLitres}L)</span>}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {t.attachment ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewAttachment({
                                  attachment: t.attachment!,
                                  txId: t.id,
                                  title: `${t.reason || t.category} Receipt`,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors cursor-pointer"
                              title="Click to view receipt or Google Drive link"
                            >
                              <Paperclip className="h-3 w-3" />
                              <span>{t.attachment.driveUrl ? 'Drive Doc' : 'Receipt'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              t.type === 'income'
                                ? 'text-emerald-300'
                                : t.type === 'expense'
                                ? 'text-rose-300'
                                : 'text-sky-300'
                            }
                          >
                            {t.type === 'income' ? '+' : '-'}QAR {formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: 12-MONTH COMPARISON */}
        {activeTab === 'monthly_breakdown' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Full Year 2025 Month-by-Month Statement</h2>
              <p className="text-xs text-slate-400">
                Consolidated income, family expenses, India remittances, and net retained surplus.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3 text-right">Income (QAR)</th>
                    <th className="py-3 px-3 text-right">Expenses (QAR)</th>
                    <th className="py-3 px-3 text-right">Transfers / India (QAR)</th>
                    <th className="py-3 px-3 text-right">Net Free Surplus (QAR)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {MONTH_NAMES.map((m) => {
                    const mtxs = transactions.filter((t) => t.month === m && t.year === selectedYear);
                    const inc = mtxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                    const exp = mtxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                    const trf = mtxs.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
                    const bal = inc - exp - trf;

                    return (
                      <tr key={m} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-white font-mono">{m}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-300 font-semibold">
                          {inc > 0 ? formatCurrency(inc) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-300 font-semibold">
                          {exp > 0 ? formatCurrency(exp) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sky-300 font-semibold">
                          {trf > 0 ? formatCurrency(trf) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {inc > 0 || exp > 0 ? (
                            <span className={bal >= 0 ? 'text-purple-300' : 'text-rose-400'}>
                              {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {inc > 0 || exp > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Planned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: FAMILY MEMBERS HUB */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((memId) => {
              const mem = FAMILY_MEMBERS[memId];
              const memTxs = filteredTransactions.filter((t) => t.member === memId);
              const inc = memTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const exp = memTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const trf = memTxs.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.amount, 0);

              return (
                <div
                  key={memId}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-2xl bg-linear-to-tr ${mem.avatarColor} text-white font-black text-sm flex items-center justify-center shadow-lg ring-1 ring-white/20`}
                      >
                        {mem.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">{mem.name}</h2>
                        <span className="text-xs text-slate-400">{mem.relation}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {memTxs.length} Transactions
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-emerald-400 uppercase font-bold">Income</div>
                      <div className="font-mono text-xs font-bold text-white mt-0.5">
                        QAR {formatCurrency(inc)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-rose-400 uppercase font-bold">Expenses</div>
                      <div className="font-mono text-xs font-bold text-white mt-0.5">
                        QAR {formatCurrency(exp)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-sky-400 uppercase font-bold">Transfers</div>
                      <div className="font-mono text-xs font-bold text-white mt-0.5">
                        QAR {formatCurrency(trf)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Recent Items:</div>
                    {memTxs.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-slate-950/60"
                      >
                        <span className="text-slate-300 truncate max-w-[200px]">
                          {t.reason || t.category}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}QAR {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                    {memTxs.length === 0 && (
                      <div className="text-xs text-slate-500 py-2 text-center">
                        No transactions for {mem.name}.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 5: DEDICATED CAR 565816 EXPENSE HUB & VEHICLE LEDGER */}
        {activeTab === 'car_565816' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Executive Qatar Plate Hero Header */}
            <div
              id="car-565816-full-expense-card"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#1e0e15] border-2 border-rose-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* High Fidelity Qatar License Plate */}
                  <div className="flex items-center rounded-2xl border-2 border-slate-600 bg-white text-slate-950 font-mono shadow-2xl overflow-hidden shrink-0 ring-2 ring-rose-500/30">
                    <div className="bg-[#8A1538] text-white px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase font-black flex flex-col items-center justify-center leading-none tracking-tighter">
                      <span>QATAR</span>
                      <span className="text-[8px] sm:text-[9px] mt-0.5">قطر</span>
                    </div>
                    <div className="px-4 sm:px-6 py-2 sm:py-3 text-2xl sm:text-4xl font-black tracking-widest text-slate-950 font-mono">
                      565816
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Car className="h-6 w-6 text-rose-400" />
                        <span>Car 565816 Expense Hub</span>
                      </h2>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 shadow-sm">
                        Qatar Private Vehicle
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Munsheer's Personal Vehicle • Petrol refills, oil service, Woqod receipts, Istimara & insurance renewals
                    </p>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                  <div className="bg-slate-950 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      {timeMode === 'monthly' ? `${selectedMonth} ${selectedYear} Spend` : `${selectedYear} Total Spend`}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                      QAR {formatCurrency(carMetrics.totalCarExpense)}
                    </span>
                  </div>

                  <div className="bg-slate-950 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      All-Time Spend
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      QAR {formatCurrency(carMetrics.allTimeCarExpense)}
                    </span>
                  </div>

                  {/* Odometer KM Metric */}
                  <div className="bg-slate-950 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-rose-900/60 text-right">
                    <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
                      <Gauge className="h-3 w-3" />
                      <span>Car Odometer</span>
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {carMetrics.latestOdometer ? `${carMetrics.latestOdometer.toLocaleString()} KM` : 'Track KM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Category Live Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Petrol */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Fuel className="h-4 w-4" />
                      <span>Woqod Petrol</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 font-mono">
                      95 Super
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-300 font-mono mt-3">
                    QAR {formatCurrency(carMetrics.petrolExpense)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Full tank refills</p>
                </div>

                {/* 2. Service & Maintenance */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="h-4 w-4" />
                      <span>Maintenance</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-950/80 text-sky-300 font-mono">
                      Oil / Parts
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-sky-300 font-mono mt-3">
                    QAR {formatCurrency(carMetrics.maintenanceExpense)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Periodic servicing</p>
                </div>

                {/* 3. Insurance & Istimara */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Insurance</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 font-mono">
                      Istimara
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-purple-300 font-mono mt-3">
                    QAR {formatCurrency(carMetrics.insuranceExpense)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Annual renewal</p>
                </div>

                {/* 4. Wash & Care */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🧼 Wash & Care</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-950/80 text-teal-300 font-mono">
                      Detailing
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-teal-300 font-mono mt-3">
                    QAR {formatCurrency(carMetrics.washExpense)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Body & interior</p>
                </div>

                {/* 5. Fines & Tolls */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🚨 Fines & Salik</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-950/80 text-rose-300 font-mono">
                      Radar
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-rose-300 font-mono mt-3">
                    QAR {formatCurrency(carMetrics.finesExpense)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Traffic & tolls</p>
                </div>
              </div>

              {/* Action Toolbar: 1-Click Log Buttons & Drive Link */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_petrol',
                        'Car 565816 Super Petrol 95 Refill',
                        'Woqod Petrol Station'
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Log Woqod Petrol</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_maintenance',
                        'Car 565816 Service & Oil Change',
                        'Woqod AutoCare'
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Log Service / Oil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_insurance',
                        'Car 565816 Istimara & Insurance Renewal',
                        'Insurance Agency'
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Log Istimara / Insurance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_wash',
                        'Car 565816 Body Wash & Cleaning',
                        'Car Wash'
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-teal-950/40 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Log Wash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_fines',
                        'Car 565816 Traffic Fine / Parking Toll',
                        'Ministry of Interior'
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Log Fine</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Google Drive Folder Direct Link */}
                  <a
                    href={GOOGLE_DRIVE_DATA_FOLDER.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-sky-300 border border-sky-600/40 shadow-sm cursor-pointer transition-colors"
                    title="Open Google Drive Target Folder: 1DflkGubMRjXiMJCD970nILdICKe_QvaE"
                  >
                    <FolderOpen className="h-4 w-4 text-sky-400" />
                    <span>Drive Folder (1DflkGub...)</span>
                  </a>

                  {/* Log Car KM Action */}
                  <button
                    type="button"
                    onClick={() =>
                      openCarExpenseModal(
                        'car_565816_petrol',
                        'Car 565816 Petrol refill & Odometer reading',
                        'Woqod Petrol Station'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-sm cursor-pointer transition-all"
                    title="Log new petrol expense with odometer KM"
                  >
                    <Gauge className="h-4 w-4 text-white" />
                    <span>+ Log KM Refill</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Car 565816 Specific Expense Ledger Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-rose-400" />
                    <span>Car 565816 Expense Ledger</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    {carMetrics.filteredCarTxs.length} Record{carMetrics.filteredCarTxs.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Showing entries for {timeMode === 'monthly' ? `${selectedMonth} ${selectedYear}` : selectedYear}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-4">Station / Source</th>
                      <th className="py-3 px-3 text-center">Odometer (KM)</th>
                      <th className="py-3 px-4">Purpose / Reason</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-center">Receipt</th>
                      <th className="py-3 px-4 text-right">Amount (QAR)</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {carMetrics.filteredCarTxs.map((t) => {
                      const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.id === t.category);
                      const paymentInfo = PAYMENT_METHODS.find((p) => p.id === t.paymentMethod);

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80 inline-flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              <span>{categoryInfo?.label.replace('Car 565816 - ', '') || t.category}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-200 font-medium whitespace-nowrap">
                            {t.source || 'Woqod'}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {t.odometerKm ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-rose-950/80 text-rose-300 border border-rose-800/60 inline-flex items-center gap-1">
                                  <Gauge className="h-3 w-3 text-rose-400" />
                                  <span>{t.odometerKm.toLocaleString()} KM</span>
                                </span>
                                {t.fuelLitres && (
                                  <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                                    {t.fuelLitres} Litres
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="block max-w-[280px] truncate" title={t.reason}>
                              {t.reason || 'Vehicle Expense'}
                            </span>
                            {t.notes && (
                              <span className="text-[10px] text-slate-500 block truncate">{t.notes}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {paymentInfo?.label || t.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {t.attachment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewAttachment({
                                    attachment: t.attachment!,
                                    txId: t.id,
                                    title: `${t.reason || 'Car 565816'} Receipt`,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors cursor-pointer"
                                title={`View ${t.attachment.name}`}
                              >
                                <Paperclip className="h-3 w-3 text-sky-400" />
                                <span>Receipt</span>
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-rose-300 whitespace-nowrap text-sm">
                            -QAR {formatCurrency(t.amount)}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {carMetrics.filteredCarTxs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                          <Car className="h-10 w-10 text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-slate-400">No expenses recorded for Car 565816 in {selectedMonth} {selectedYear}.</p>
                          <p className="text-[11px] text-slate-500 mt-1">Use the quick buttons above to log fuel refills or service receipts.</p>
                          <button
                            type="button"
                            onClick={() =>
                              openCarExpenseModal(
                                'car_565816_petrol',
                                'Car 565816 Super Petrol 95 Refill',
                                'Woqod Petrol Station'
                              )
                            }
                            className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>+ Log First Woqod Refill</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TRANSACTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    modalType === 'income'
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : modalType === 'expense'
                      ? 'bg-rose-600/20 text-rose-400'
                      : 'bg-sky-600/20 text-sky-400'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                </div>
                <span>
                  Log New {modalType === 'income' ? 'Income' : modalType === 'expense' ? 'Expense' : 'Transfer'}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => openModal('income')}
                  className={`py-2 rounded-xl font-bold transition-all text-xs min-h-[40px] cursor-pointer ${
                    modalType === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => openModal('expense')}
                  className={`py-2 rounded-xl font-bold transition-all text-xs min-h-[40px] cursor-pointer ${
                    modalType === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => openModal('transfer')}
                  className={`py-2 rounded-xl font-bold transition-all text-xs min-h-[40px] cursor-pointer ${
                    modalType === 'transfer'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* BOX 1: CORE FINANCIAL FILLING BOX */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/80 flex items-center justify-between">
                  <span>1. Expense & Amount Details</span>
                  <span className="text-emerald-400 font-mono">QAR Currency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount with prominent currency badge */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Amount (QAR)*</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold text-sm">
                        QAR
                      </span>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-14 pr-3.5 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono text-base font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Date*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Category*</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value.startsWith('car_')) {
                        setShowCarKmFields(true);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                  >
                    {modalType === 'income' &&
                      INCOME_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    {modalType === 'expense' &&
                      EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.group})
                        </option>
                      ))}
                    {modalType === 'transfer' &&
                      TRANSFER_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} - {c.description}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Reason / Purpose */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Reason / Purpose*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Woqod Super 95 refill, School fees, Lulu groceries"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              {/* BOX 2: CAR 565816 MILEAGE & KM FILLING BOX (ARRANGED SPACE) */}
              {modalType === 'expense' && (formCategory.startsWith('car_') || showCarKmFields) ? (
                <div className="bg-gradient-to-b from-rose-950/30 to-slate-950 border-2 border-rose-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-900/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                        <Gauge className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Car 565816 Odometer & Fuel Tracking</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                            Plate 565816
                          </span>
                        </h4>
                      </div>
                    </div>
                    {carMetrics.latestOdometer > 0 && (
                      <span className="text-[11px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/60">
                        Last: {carMetrics.latestOdometer.toLocaleString()} KM
                      </span>
                    )}
                  </div>

                  {/* KM and Fuel 2-Column Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Odometer KM Input */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-rose-400" />
                          <span>Odometer Reading (KM)</span>
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={carMetrics.latestOdometer ? String(carMetrics.latestOdometer + 500) : 'e.g. 142500'}
                          value={formOdometerKm}
                          onChange={(e) => setFormOdometerKm(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none min-h-[46px] pr-12"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-rose-400">
                          KM
                        </span>
                      </div>
                    </div>

                    {/* Fuel in Litres Input */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3.5 w-3.5 text-amber-400" />
                          <span>Fuel Quantity (Litres)</span>
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 45"
                          value={formFuelLitres}
                          onChange={(e) => setFormFuelLitres(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none min-h-[46px] pr-12"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                          L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick KM Helpers */}
                  {carMetrics.latestOdometer > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Quick Add KM:</span>
                      {[50, 100, 250, 500].map((kmStep) => (
                        <button
                          key={kmStep}
                          type="button"
                          onClick={() => {
                            const baseKm = typeof formOdometerKm === 'number' && formOdometerKm > 0
                              ? formOdometerKm
                              : carMetrics.latestOdometer;
                            setFormOdometerKm(baseKm + kmStep);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/60 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors"
                        >
                          +{kmStep} KM
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormOdometerKm(carMetrics.latestOdometer)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[11px] font-mono cursor-pointer transition-colors"
                      >
                        Set {carMetrics.latestOdometer.toLocaleString()}
                      </button>
                    </div>
                  )}

                  {/* Station / Vendor */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Petrol Station / Service Center</label>
                    <input
                      type="text"
                      placeholder="e.g. Woqod Petrol Station, Woqod AutoCare, Teyseer"
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>
              ) : modalType === 'expense' ? (
                /* Button to toggle on Car KM details if category is other */
                <button
                  type="button"
                  onClick={() => setShowCarKmFields(true)}
                  className="w-full py-2.5 px-3 bg-slate-950/60 hover:bg-slate-950 border border-dashed border-rose-800/60 rounded-2xl text-rose-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[44px]"
                >
                  <Gauge className="h-4 w-4 text-rose-400" />
                  <span>+ Add Car 565816 Odometer KM & Fuel Info</span>
                </button>
              ) : (
                /* Source Vendor for Income / Transfer */
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <label className="block text-slate-300 font-bold">
                    Source / Vendor / Account
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharq Service, Employer, CBQ Account"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                  />
                </div>
              )}

              {/* BOX 3: PAYMENT & FAMILY MEMBER */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/80">
                  2. Payer & Payment Method
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Family Member*</span>
                    </label>
                    <select
                      value={formMember}
                      onChange={(e) => setFormMember(e.target.value as FamilyMember)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                    >
                      {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((m) => (
                        <option key={m} value={m}>
                          {FAMILY_MEMBERS[m].name} ({FAMILY_MEMBERS[m].relation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      <span>Payment Method*</span>
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[46px]"
                    >
                      {PAYMENT_METHODS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BOX 4: DOCUMENT & RECEIPT ATTACHMENT */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-sky-400" />
                    <span>3. Attach Receipt / Bill (Google Drive Linked)</span>
                  </label>
                  {formAttachment && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold truncate max-w-[200px]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{formAttachment.name}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Upload Document (Photo / Bill / PDF)
                    </label>
                    <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors min-h-[46px]">
                      <Upload className="h-4 w-4 text-sky-400" />
                      <span className="truncate max-w-[160px]">
                        {formAttachment ? formAttachment.name : 'Choose photo / file...'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFormFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Google Drive File Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formDriveUrl}
                      onChange={(e) => setFormDriveUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer min-h-[44px] flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {previewAttachment && (
        <DocumentAttachmentModal
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment.attachment}
          title={previewAttachment.title}
          onSaveDriveUrl={(newUrl) => {
            if (previewAttachment.txId) {
              handleUpdateTxDriveUrl(previewAttachment.txId, newUrl);
            }
          }}
        />
      )}
    </div>
  );
};
