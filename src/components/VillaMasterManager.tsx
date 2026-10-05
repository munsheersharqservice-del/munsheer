import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Droplets,
  Search,
  Download,
  Edit3,
  Phone,
  PhoneCall,
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  X,
  Check,
  LayoutDashboard,
  BarChart3,
  Wrench,
  HelpCircle,
  Plus,
  Trash2,
  MessageSquare,
  DoorOpen,
  Paperclip,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  subscribeToGlobalDatabase,
  pushGlobalDatabaseToCloud,
  fetchGlobalDatabaseFromCloud,
} from '../services/firestoreSync';
import {
  RoomRecord,
  MONTH_KEYS,
  MonthKey,
  initialRoomsData,
  initialVillaMasterRent,
  initialVillaMasterRentDetails,
  VillaMasterRentDetail,
  RentPaymentStatus,
  initialMeterReadings,
  MeterMonthlyReading,
  initialMonthlyMaintenance,
  VILLA_METERS,
  formatCurrency,
  formatQAR,
  calculateProfit,
  calculateProfitWithoutMyRoom,
  calculateProfitWithMyRoom,
  VillaExpenseItem,
} from '../data/villaDatabase';
import { VillaMonthlyChart } from './VillaMonthlyChart';
import { VillaUtilityMeters } from './VillaUtilityMeters';
import { ElectricityModal } from './ElectricityModal';
import { VillaItemReceiptModal } from './VillaItemReceiptModal';
import { VillaTaskBar, VillaPageView } from './VillaTaskBar';
import { VillaFinancialStatement } from './VillaFinancialStatement';
import * as XLSX from 'xlsx';

interface VillaMasterManagerProps {
  onExportExcel?: () => void;
  onSyncGoogleSheet?: () => void;
  onOpenMakeNewExcel?: () => void;
  onOpenSettings?: () => void;
  onOpenDownload?: () => void;
}

export const VillaMasterManager: React.FC<VillaMasterManagerProps> = ({
  onExportExcel,
  onOpenMakeNewExcel,
  onOpenSettings,
  onOpenDownload,
}) => {
  // State for 12 Rooms (Rooms 1-11 + Room 12 "MY ROOM")
  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    const saved = localStorage.getItem('villa_12_rooms_data_v4') || localStorage.getItem('villa_11_rooms_data_v3');
    if (saved) {
      try {
        let parsed: RoomRecord[] = JSON.parse(saved);
        
        // Ensure Room 11 is vacant initially if legacy FARHAN is still present
        const room11 = parsed.find((r) => String(r.roomNumber) === '11' || r.id === 'room-11');
        if (room11 && room11.name === 'FARHAN') {
          parsed = parsed.map((r) =>
            String(r.roomNumber) === '11' || r.id === 'room-11'
              ? {
                  ...r,
                  name: 'EMPTY (Vacant)',
                  mobNo: '',
                  advance: 0,
                  monthlyRent: 0,
                  color: '#94a3b8',
                  monthlyPayments: {
                    FEB: 0,
                    MAR: 0,
                    APRIL: 0,
                    MAY: 0,
                    JUN: 0,
                    JULY: 0,
                    AUG: 0,
                    SEP: 0,
                    OCT: 0,
                    NOV: 0,
                    DEC: 0,
                  },
                }
              : r
          );
        }

        // Ensure Room 12 "MY ROOM" (4000 QAR/mo) exists
        const hasRoom12 = parsed.some(
          (r) =>
            r.id === 'room-12' ||
            String(r.roomNumber) === '12' ||
            r.name.toUpperCase().includes('MY ROOM')
        );

        if (!hasRoom12) {
          parsed.push({
            id: 'room-12',
            roomNumber: 12,
            name: 'MY ROOM',
            mobNo: '',
            advance: 0,
            monthlyRent: 4000,
            color: '#0284c7',
            notes: 'Self-occupied Room 12 - 4000 QAR paid monthly',
            monthlyPayments: {
              FEB: 4000,
              MAR: 4000,
              APRIL: 4000,
              MAY: 4000,
              JUN: 4000,
              JULY: 4000,
              AUG: 4000,
              SEP: 4000,
              OCT: 4000,
              NOV: 4000,
              DEC: 4000,
            },
          });
        } else {
          // If Room 12 exists, ensure its monthlyRent is 4000
          parsed = parsed.map((r) => {
            if (
              r.id === 'room-12' ||
              String(r.roomNumber) === '12' ||
              r.name.toUpperCase().includes('MY ROOM')
            ) {
              const currentPayments = r.monthlyPayments || {};
              const updatedPayments: Record<string, number> = {};
              MONTH_KEYS.forEach((m) => {
                updatedPayments[m] = currentPayments[m] !== undefined && currentPayments[m] !== null ? currentPayments[m] : 4000;
              });
              return {
                ...r,
                name: r.name || 'MY ROOM',
                monthlyRent: r.monthlyRent > 0 ? r.monthlyRent : 4000,
                monthlyPayments: updatedPayments,
              };
            }
            return r;
          });
        }

        localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(parsed));
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialRoomsData;
  });

  // State for Villa Master Rent details (Amount, Paid Amount, Status: Paid | Unpaid | Partial Paid)
  const [villaRentDetails, setVillaRentDetails] = useState<Record<MonthKey, VillaMasterRentDetail>>(() => {
    const saved = localStorage.getItem('villa_master_rent_details_v4') || localStorage.getItem('villa_master_rent_details_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialVillaMasterRentDetails;
  });

  // State for 4 Kahramaa Utility Meters: 3 Electricity (148964, 148963, 48073) & 1 Water (90978)
  // All electricity and water bills deleted (zeroed) as requested by user
  const [meterReadings, setMeterReadings] = useState<MeterMonthlyReading[]>(() => {
    localStorage.removeItem('villa_meter_readings_v4');
    localStorage.removeItem('villa_meter_readings_v3');
    const saved = localStorage.getItem('villa_meter_readings_v5');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialMeterReadings;
  });

  // State for Monthly Maintenance expenses (editable by month)
  const [monthlyMaintenance, setMonthlyMaintenance] = useState<Record<MonthKey, number>>(() => {
    const saved = localStorage.getItem('villa_monthly_maintenance_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialMonthlyMaintenance;
  });

  // Navigation: 5 Distinct Viewer Pages & Task Bar requested by user:
  // 1. 'dashboard' (Executive Dashboard, Summary Card, Dual Profit & Trend Chart)
  // 2. 'master_spreadsheet' (Full 12+ Rooms Multi-Month Master Spreadsheet)
  // 3. 'rooms_directory' (Rooms & Tenants Directory - Mobile First with WhatsApp, Call & Direct Edits)
  // 4. 'utilities_expenses' (Kahramaa 3 Electricity Meters, Water & Maintenance Hub)
  // 5. 'financial_statement' (Printable / PDF Ready Statement & Audit Report)
  const [activeView, setActiveView] = useState<VillaPageView>('dashboard');

  // Active month in monthly details view
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('SEP');

  // Search filter in master table & rooms directory
  const [searchQuery, setSearchQuery] = useState('');

  // Filter for Rooms Directory page (All, Paid, Partial, Unpaid)
  const [roomsFilterStatus, setRoomsFilterStatus] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');

  // Chart Open/Close Option State (Requested by user)
  const [showCharts, setShowCharts] = useState<boolean>(true);

  // Modal State for Adding More Rooms
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomPhone, setNewRoomPhone] = useState<string>('');
  const [newRoomRent, setNewRoomRent] = useState<number>(2000);
  const [newRoomAdvance, setNewRoomAdvance] = useState<number>(0);
  const [newRoomColor, setNewRoomColor] = useState<string>('#10b981');
  const [newRoomPayCurrentMonth, setNewRoomPayCurrentMonth] = useState<boolean>(true);

  // State for Villa Items, Expenses & Receipts (with Save in Google Drive)
  const [villaItems, setVillaItems] = useState<VillaExpenseItem[]>(() => {
    const saved = localStorage.getItem('villa_items_receipts_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Cloud Firestore Sync State (Keeps the same database in all devices)
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<string>('');

  // 1. Subscribe to Cloud Firestore real-time updates across all devices
  useEffect(() => {
    const unsub = subscribeToGlobalDatabase((data) => {
      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms);
      }
      if (data.meterReadings && Array.isArray(data.meterReadings)) {
        setMeterReadings(data.meterReadings);
      }
      if (data.villaItems && Array.isArray(data.villaItems)) {
        setVillaItems(data.villaItems);
      }
      if (data.monthlyMaintenance) {
        setMonthlyMaintenance(data.monthlyMaintenance as Record<MonthKey, number>);
      }
      if (data.villaMasterRentDetails) {
        setVillaRentDetails(data.villaMasterRentDetails as Record<MonthKey, VillaMasterRentDetail>);
      }
      setLastCloudSync(new Date().toLocaleTimeString());
    });

    // Populate state from cloud if available
    fetchGlobalDatabaseFromCloud().then((cloudData) => {
      if (cloudData) {
        if (cloudData.rooms && Array.isArray(cloudData.rooms) && cloudData.rooms.length > 0) {
          setRooms(cloudData.rooms);
        }
        if (cloudData.meterReadings && Array.isArray(cloudData.meterReadings)) {
          setMeterReadings(cloudData.meterReadings);
        }
        if (cloudData.villaItems && Array.isArray(cloudData.villaItems)) {
          setVillaItems(cloudData.villaItems);
        }
        if (cloudData.monthlyMaintenance) {
          setMonthlyMaintenance(cloudData.monthlyMaintenance as Record<MonthKey, number>);
        }
        if (cloudData.villaMasterRentDetails) {
          setVillaRentDetails(cloudData.villaMasterRentDetails as Record<MonthKey, VillaMasterRentDetail>);
        }
        setLastCloudSync(new Date().toLocaleTimeString());
      }
    });

    const handleAppDatabaseUpdated = (e: any) => {
      const data = e.detail;
      if (!data) return;
      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms);
      }
      if (data.meterReadings && Array.isArray(data.meterReadings)) {
        setMeterReadings(data.meterReadings);
      }
      if (data.villaItems && Array.isArray(data.villaItems)) {
        setVillaItems(data.villaItems);
      }
      if (data.monthlyMaintenance) {
        setMonthlyMaintenance(data.monthlyMaintenance as Record<MonthKey, number>);
      }
      if (data.villaMasterRentDetails) {
        setVillaRentDetails(data.villaMasterRentDetails as Record<MonthKey, VillaMasterRentDetail>);
      }
      setLastCloudSync(new Date().toLocaleTimeString());
    };

    window.addEventListener('app_database_updated', handleAppDatabaseUpdated);

    return () => {
      unsub();
      window.removeEventListener('app_database_updated', handleAppDatabaseUpdated);
    };
  }, []);

  // 2. Keep local cache in sync with state for offline resilience
  useEffect(() => {
    localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('villa_meter_readings_v5', JSON.stringify(meterReadings));
  }, [meterReadings]);

  useEffect(() => {
    localStorage.setItem('villa_items_receipts_v1', JSON.stringify(villaItems));
  }, [villaItems]);

  useEffect(() => {
    localStorage.setItem('villa_monthly_maintenance_v4', JSON.stringify(monthlyMaintenance));
  }, [monthlyMaintenance]);

  useEffect(() => {
    localStorage.setItem('villa_master_rent_details_v4', JSON.stringify(villaRentDetails));
  }, [villaRentDetails]);

  // Handler for manual cloud sync refresh
  const handleManualCloudRefresh = async () => {
    setIsSyncingWithCloud(true);
    try {
      const cloudData = await fetchGlobalDatabaseFromCloud();
      if (cloudData) {
        if (cloudData.rooms) setRooms(cloudData.rooms);
        if (cloudData.meterReadings) setMeterReadings(cloudData.meterReadings);
        if (cloudData.villaItems) setVillaItems(cloudData.villaItems);
        if (cloudData.monthlyMaintenance) setMonthlyMaintenance(cloudData.monthlyMaintenance as Record<MonthKey, number>);
        if (cloudData.villaMasterRentDetails) setVillaRentDetails(cloudData.villaMasterRentDetails as Record<MonthKey, VillaMasterRentDetail>);
      }
      setLastCloudSync(new Date().toLocaleTimeString());
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  const [isVillaItemsModalOpen, setIsVillaItemsModalOpen] = useState(false);

  const handleAddVillaItem = (newItem: VillaExpenseItem) => {
    const nextItems = [newItem, ...villaItems];
    const nextMaintenance = {
      ...monthlyMaintenance,
      [newItem.month]: (monthlyMaintenance[newItem.month] || 0) + newItem.amount,
    };
    setVillaItems(nextItems);
    setMonthlyMaintenance(nextMaintenance);
    pushGlobalDatabaseToCloud({ villaItems: nextItems, monthlyMaintenance: nextMaintenance });
  };

  const handleDeleteVillaItem = (id: string) => {
    const nextItems = villaItems.filter((i) => i.id !== id);
    setVillaItems(nextItems);
    pushGlobalDatabaseToCloud({ villaItems: nextItems });
  };

  const handleUpdateVillaItemDriveUrl = (id: string, newDriveUrl: string) => {
    const nextItems = villaItems.map((i) =>
      i.id === id
        ? {
            ...i,
            attachment: i.attachment
              ? { ...i.attachment, driveUrl: newDriveUrl }
              : {
                  name: `${i.itemName} Receipt`,
                  driveUrl: newDriveUrl,
                  uploadedAt: new Date().toLocaleDateString('en-GB'),
                },
          }
        : i
    );
    setVillaItems(nextItems);
    pushGlobalDatabaseToCloud({ villaItems: nextItems });
  };

  // Modals state
  const [editingPayment, setEditingPayment] = useState<{
    room: RoomRecord;
    month: MonthKey;
    currentVal: number;
  } | null>(null);
  const [paymentInput, setPaymentInput] = useState<string>('');

  // Modal for editing Total Villa Rent (Paid, Unpaid, Partial Paid)
  const [editingVillaRent, setEditingVillaRent] = useState<VillaMasterRentDetail | null>(null);
  const [rentAmountInput, setRentAmountInput] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [rentStatusInput, setRentStatusInput] = useState<RentPaymentStatus>('Paid');
  const [rentNotesInput, setRentNotesInput] = useState<string>('');

  // Modal for editing Room Info (Room Number & Room Name changes)
  const [editingRoomInfo, setEditingRoomInfo] = useState<RoomRecord | null>(null);

  // Modal for editing Maintenance for a month
  const [editingMaintenanceMonth, setEditingMaintenanceMonth] = useState<MonthKey | null>(null);
  const [maintenanceInput, setMaintenanceInput] = useState<number>(0);

  // Modal for editing Electricity / Water for a month
  const [editingUtilityMonth, setEditingUtilityMonth] = useState<{
    month: MonthKey;
    type: 'Electricity' | 'Water';
  } | null>(null);
  const [utilityAmountInput, setUtilityAmountInput] = useState<number>(0);

  // Dedicated Electricity Modal state (with meter number chooser & 3 monthly bills)
  const [isElectricityModalOpen, setIsElectricityModalOpen] = useState(false);
  const [electricityModalMonth, setElectricityModalMonth] = useState<MonthKey>('SEP');
  const [electricityModalMeter, setElectricityModalMeter] = useState<string>('ALL');

  const handleOpenElectricityModal = (month: MonthKey, meterNumber?: string) => {
    setElectricityModalMonth(month);
    setElectricityModalMeter(meterNumber || 'ALL');
    setIsElectricityModalOpen(true);
  };

  const handleSaveElectricityReadings = (updatedReadings: MeterMonthlyReading[]) => {
    const copy = [...meterReadings];
    updatedReadings.forEach((updated) => {
      const idx = copy.findIndex(
        (r) => r.meterNumber === updated.meterNumber && r.month === updated.month
      );
      if (idx >= 0) {
        copy[idx] = updated;
      } else {
        copy.push(updated);
      }
    });
    setMeterReadings(copy);
    pushGlobalDatabaseToCloud({ meterReadings: copy });
  };

  // Sync rooms to localStorage
  useEffect(() => {
    localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(rooms));
  }, [rooms]);

  // Sync villaRentDetails to localStorage
  useEffect(() => {
    localStorage.setItem('villa_master_rent_details_v4', JSON.stringify(villaRentDetails));
  }, [villaRentDetails]);

  // Sync meterReadings to localStorage (v5 with deleted bills)
  useEffect(() => {
    localStorage.setItem('villa_meter_readings_v5', JSON.stringify(meterReadings));
  }, [meterReadings]);

  // Sync monthlyMaintenance to localStorage
  useEffect(() => {
    localStorage.setItem('villa_monthly_maintenance_v4', JSON.stringify(monthlyMaintenance));
  }, [monthlyMaintenance]);

  // Calculations per month: received - total rent = profit, plus electricity, water, and maintenance
  const monthlyCalculations = useMemo(() => {
    const result: Record<
      MonthKey,
      {
        totalCollected: number;
        tenantsCollected: number;
        myRoomCollected: number;
        targetRent: number;
        villaMasterRent: number;
        villaRentPaid: number;
        villaRentStatus: RentPaymentStatus;
        electricityBill: number;
        waterBill: number;
        maintenanceCost: number;
        totalExpenses: number;
        netProfit: number;
        profitWithoutMyRoom: number;
        profitWithMyRoom: number;
        paidRoomsCount: number;
        partialRoomsCount: number;
        unpaidRoomsCount: number;
      }
    > = {} as any;

    MONTH_KEYS.forEach((month) => {
      let totalCollected = 0;
      let tenantsCollected = 0;
      let myRoomCollected = 0;
      let targetRent = 0;
      let paidRoomsCount = 0;
      let partialRoomsCount = 0;
      let unpaidRoomsCount = 0;

      rooms.forEach((r) => {
        const paid = r.monthlyPayments[month] || 0;
        totalCollected += paid;

        const isMyRoom =
          r.id === 'room-12' ||
          String(r.roomNumber) === '12' ||
          r.name.toUpperCase().includes('MY ROOM');

        if (isMyRoom) {
          myRoomCollected += paid;
        } else {
          tenantsCollected += paid;
        }

        if (r.monthlyRent > 0) {
          targetRent += r.monthlyRent;
          if (paid >= r.monthlyRent) {
            paidRoomsCount++;
          } else if (paid > 0 && paid < r.monthlyRent) {
            partialRoomsCount++;
          } else {
            unpaidRoomsCount++;
          }
        }
      });

      const rentDetail = villaRentDetails[month] || {
        month,
        amount: initialVillaMasterRent[month] || 22000,
        paidAmount: initialVillaMasterRent[month] || 22000,
        status: 'Paid',
      };

      const masterRent = rentDetail.amount;

      // Electricity: 3 meters (148964, 148963, 48073)
      const elecReadings = meterReadings.filter(
        (mr) => mr.month === month && mr.meterNumber !== '90978'
      );
      const electricityBill = elecReadings.reduce(
        (sum, mr) => sum + (mr.billAmountQAR || 0),
        0
      );

      // Water: 1 meter (90978)
      const waterReading = meterReadings.find(
        (mr) => mr.month === month && mr.meterNumber === '90978'
      );
      const waterBill = waterReading?.billAmountQAR || 0;

      // Maintenance
      const maintenanceCost = monthlyMaintenance[month] || 0;

      // Formula: received - total rent = profit
      const netProfit = calculateProfit(totalCollected, masterRent);
      const profitWithoutMyRoom = calculateProfitWithoutMyRoom(tenantsCollected, masterRent);
      const profitWithMyRoom = calculateProfitWithMyRoom(totalCollected, masterRent);
      const totalExpenses = masterRent + electricityBill + waterBill + maintenanceCost;

      result[month] = {
        totalCollected,
        tenantsCollected,
        myRoomCollected,
        targetRent,
        villaMasterRent: masterRent,
        villaRentPaid: rentDetail.paidAmount,
        villaRentStatus: rentDetail.status,
        electricityBill,
        waterBill,
        maintenanceCost,
        totalExpenses,
        netProfit,
        profitWithoutMyRoom,
        profitWithMyRoom,
        paidRoomsCount,
        partialRoomsCount,
        unpaidRoomsCount,
      };
    });

    return result;
  }, [rooms, villaRentDetails, meterReadings, monthlyMaintenance]);

  // Overall Year Totals: received, my room total, landlord rent, net profit, maintenance total, utilities
  const yearlySummary = useMemo(() => {
    let yearTotalCollected = 0;
    let myRoomYearPaid = 0;
    let yearMasterRentPaid = 0;
    let totalAdvanceHeld = 0;
    let yearTotalElectricity = 0;
    let yearTotalWater = 0;
    let yearTotalMaintenance = 0;

    rooms.forEach((r) => {
      totalAdvanceHeld += r.advance || 0;
      const isMyRoom =
        r.id === 'room-12' ||
        String(r.roomNumber) === '12' ||
        r.name.toUpperCase().includes('MY ROOM');

      MONTH_KEYS.forEach((m) => {
        const payment = r.monthlyPayments[m] || 0;
        yearTotalCollected += payment;
        if (isMyRoom) {
          myRoomYearPaid += payment;
        }
      });
    });

    MONTH_KEYS.forEach((m) => {
      const detail = villaRentDetails[m];
      yearMasterRentPaid += detail ? detail.amount : (initialVillaMasterRent[m] || 0);
      yearTotalElectricity += monthlyCalculations[m]?.electricityBill || 0;
      yearTotalWater += monthlyCalculations[m]?.waterBill || 0;
      yearTotalMaintenance += monthlyMaintenance[m] || 0;
    });

    // Formula: received - total rent = profit
    const yearProfit = calculateProfit(yearTotalCollected, yearMasterRentPaid);
    const tenantsYearPaid = yearTotalCollected - myRoomYearPaid;
    const yearProfitWithoutMyRoom = calculateProfitWithoutMyRoom(tenantsYearPaid, yearMasterRentPaid);
    const yearProfitWithMyRoom = calculateProfitWithMyRoom(yearTotalCollected, yearMasterRentPaid);

    return {
      yearTotalCollected,
      myRoomYearPaid,
      tenantsYearPaid,
      yearMasterRentPaid,
      totalAdvanceHeld,
      yearProfit,
      yearProfitWithoutMyRoom,
      yearProfitWithMyRoom,
      yearTotalElectricity,
      yearTotalWater,
      yearTotalMaintenance,
      yearTotalUtilities: yearTotalElectricity + yearTotalWater,
    };
  }, [rooms, villaRentDetails, monthlyCalculations, monthlyMaintenance]);

  // Chart data prepared for VillaMonthlyChart
  const chartData = useMemo(() => {
    return MONTH_KEYS.map((m) => ({
      month: m,
      received: monthlyCalculations[m]?.totalCollected || 0,
      totalRent: monthlyCalculations[m]?.villaMasterRent || 0,
      profit: monthlyCalculations[m]?.netProfit || 0,
      rentStatus: monthlyCalculations[m]?.villaRentStatus || 'Paid',
    }));
  }, [monthlyCalculations]);

  // Handler for quick room payment edit
  const handleSavePayment = () => {
    if (!editingPayment) return;
    const newVal = Math.max(0, parseFloat(paymentInput) || 0);

    const updatedRooms = rooms.map((r) =>
      r.id === editingPayment.room.id
        ? {
            ...r,
            monthlyPayments: {
              ...r.monthlyPayments,
              [editingPayment.month]: newVal,
            },
          }
        : r
    );
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
    setEditingPayment(null);
  };

  // 1-Click quick status changer for rooms in monthly view
  const handleQuickRoomStatus = (
    roomId: string,
    month: MonthKey,
    status: 'Paid' | 'Unpaid' | 'Partial',
    customAmount?: number
  ) => {
    let amount = 0;
    const updatedRooms = rooms.map((r) => {
      if (r.id !== roomId) return r;
      if (status === 'Paid') {
        amount = r.monthlyRent;
      } else if (status === 'Unpaid') {
        amount = 0;
      } else if (status === 'Partial') {
        amount = customAmount !== undefined ? customAmount : Math.round(r.monthlyRent * 0.5);
      }
      return {
        ...r,
        monthlyPayments: {
          ...r.monthlyPayments,
          [month]: amount,
        },
      };
    });
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
  };

  // Handler for opening Edit Total Villa Rent modal
  const openEditVillaRentModal = (month: MonthKey) => {
    const current = villaRentDetails[month] || {
      month,
      amount: initialVillaMasterRent[month] || 22000,
      paidAmount: initialVillaMasterRent[month] || 22000,
      status: 'Paid',
      notes: '',
    };
    setEditingVillaRent(current);
    setRentAmountInput(current.amount);
    setPaidAmountInput(current.paidAmount);
    setRentStatusInput(current.status);
    setRentNotesInput(current.notes || '');
  };

  // Handler for saving Total Villa Rent modal
  const handleSaveVillaRent = () => {
    if (!editingVillaRent) return;
    const month = editingVillaRent.month;
    const updated: VillaMasterRentDetail = {
      month,
      amount: Number(rentAmountInput) || 0,
      paidAmount: Number(paidAmountInput) || 0,
      status: rentStatusInput,
      notes: rentNotesInput.trim(),
    };

    const nextRentDetails = {
      ...villaRentDetails,
      [month]: updated,
    };
    setVillaRentDetails(nextRentDetails);
    pushGlobalDatabaseToCloud({ villaMasterRentDetails: nextRentDetails });
    setEditingVillaRent(null);
  };

  // Handler for saving Room Profile (Room Number, Name, Rent, Advance, Phone)
  const handleSaveRoomProfile = () => {
    if (!editingRoomInfo) return;
    const updatedRooms = rooms.map((r) => (r.id === editingRoomInfo.id ? editingRoomInfo : r));
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
    setEditingRoomInfo(null);
  };

  // Handler for opening Add Room Modal
  const handleOpenAddRoomModal = () => {
    const numbers = rooms
      .map((r) => Number(r.roomNumber))
      .filter((n) => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 12;
    const nextNum = String(maxNum + 1);

    setNewRoomNumber(nextNum);
    setNewRoomName(`ROOM ${nextNum}`);
    setNewRoomPhone('');
    setNewRoomRent(2000);
    setNewRoomAdvance(0);
    setNewRoomColor('#10b981');
    setNewRoomPayCurrentMonth(true);
    setIsAddRoomModalOpen(true);
  };

  // Handler for saving a brand new room
  const handleSaveNewRoom = () => {
    if (!newRoomNumber.trim()) {
      return;
    }

    const rentNum = Math.max(0, Number(newRoomRent) || 0);
    const initialPayments: Record<string, number> = {};
    MONTH_KEYS.forEach((m) => {
      if (newRoomPayCurrentMonth && m === selectedMonth) {
        initialPayments[m] = rentNum;
      } else {
        initialPayments[m] = 0;
      }
    });

    const createdRoom: RoomRecord = {
      id: `room-${Date.now()}`,
      roomNumber: newRoomNumber.trim(),
      name: newRoomName.trim() || `ROOM ${newRoomNumber}`,
      mobNo: newRoomPhone.trim(),
      advance: Math.max(0, Number(newRoomAdvance) || 0),
      monthlyRent: rentNum,
      color: newRoomColor || '#10b981',
      monthlyPayments: initialPayments,
    };

    const updatedRooms = [...rooms, createdRoom];
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
    setIsAddRoomModalOpen(false);
  };

  // Handler for deleting a room with confirmation
  const handleDeleteRoom = (roomId: string) => {
    const r = rooms.find((x) => x.id === roomId);
    if (!r) return;
    const updatedRooms = rooms.filter((x) => x.id !== roomId);
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
    if (editingRoomInfo?.id === roomId) {
      setEditingRoomInfo(null);
    }
  };

  // Handler for 1-click quick payment status switch in Rooms Directory
  const handleQuickMarkPayment = (room: RoomRecord, month: MonthKey, status: 'FULL' | 'ZERO') => {
    let newVal = 0;
    if (status === 'FULL') {
      newVal = room.monthlyRent;
    } else {
      newVal = 0;
    }

    const updatedRooms = rooms.map((r) => {
      if (r.id === room.id) {
        return {
          ...r,
          monthlyPayments: {
            ...r.monthlyPayments,
            [month]: newVal,
          },
        };
      }
      return r;
    });
    setRooms(updatedRooms);
    pushGlobalDatabaseToCloud({ rooms: updatedRooms });
  };

  // Handler for saving Monthly Maintenance
  const handleSaveMaintenance = () => {
    if (!editingMaintenanceMonth) return;
    const newVal = Math.max(0, Number(maintenanceInput) || 0);
    const nextMaintenance = {
      ...monthlyMaintenance,
      [editingMaintenanceMonth]: newVal,
    };
    setMonthlyMaintenance(nextMaintenance);
    pushGlobalDatabaseToCloud({ monthlyMaintenance: nextMaintenance });
    setEditingMaintenanceMonth(null);
  };

  // Handler for saving quick monthly Electricity / Water bill
  const handleSaveUtilityBill = () => {
    if (!editingUtilityMonth) return;
    const { month, type } = editingUtilityMonth;
    const amount = Math.max(0, Number(utilityAmountInput) || 0);

    let nextReadings: MeterMonthlyReading[];
    if (type === 'Water') {
      nextReadings = meterReadings.map((mr) =>
        mr.month === month && mr.meterNumber === '90978'
          ? { ...mr, billAmountQAR: amount }
          : mr
      );
    } else {
      // Electricity (split across 3 meters proportionally)
      const elecMeters = ['148964', '148963', '48073'];
      const share1 = Math.round(amount * 0.36);
      const share2 = Math.round(amount * 0.34);
      const share3 = Math.max(0, amount - share1 - share2);

      nextReadings = meterReadings.map((mr) => {
        if (mr.month !== month) return mr;
        if (mr.meterNumber === '148964') return { ...mr, billAmountQAR: share1 };
        if (mr.meterNumber === '148963') return { ...mr, billAmountQAR: share2 };
        if (mr.meterNumber === '48073') return { ...mr, billAmountQAR: share3 };
        return mr;
      });
    }
    setMeterReadings(nextReadings);
    pushGlobalDatabaseToCloud({ meterReadings: nextReadings });
    setEditingUtilityMonth(null);
  };

  // Handler for deleting all electricity and water bills (reset to 0 QAR)
  const handleResetAllUtilityBills = () => {
    const reset: MeterMonthlyReading[] = MONTH_KEYS.flatMap((month) => [
      { id: `mr-${month.toLowerCase()}-1`, meterNumber: '148964', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
      { id: `mr-${month.toLowerCase()}-2`, meterNumber: '148963', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
      { id: `mr-${month.toLowerCase()}-3`, meterNumber: '48073', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
      { id: `mr-${month.toLowerCase()}-4`, meterNumber: '90978', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
    ]);
    setMeterReadings(reset);
    localStorage.setItem('villa_meter_readings_v5', JSON.stringify(reset));
    localStorage.removeItem('villa_meter_readings_v4');
    localStorage.removeItem('villa_meter_readings_v3');
    pushGlobalDatabaseToCloud({ meterReadings: reset });
  };

  // Handler for updating a meter reading
  const handleUpdateMeterReading = (updated: MeterMonthlyReading) => {
    const idx = meterReadings.findIndex(
      (r) => r.meterNumber === updated.meterNumber && r.month === updated.month
    );
    let nextReadings: MeterMonthlyReading[];
    if (idx >= 0) {
      nextReadings = [...meterReadings];
      nextReadings[idx] = updated;
    } else {
      nextReadings = [...meterReadings, updated];
    }
    setMeterReadings(nextReadings);
    pushGlobalDatabaseToCloud({ meterReadings: nextReadings });
  };

  // Export full Excel workbook
  const handleExportFullExcel = () => {
    const wb = XLSX.utils.book_new();

    const headers = [
      'ROOM',
      'NAME',
      'MOB NO',
      'ADVANCE (QAR)',
      'RENT (QAR)',
      ...MONTH_KEYS,
      'TOTAL PAID (QAR)',
    ];

    const rowsData = rooms.map((r) => {
      const rowTotalPaid = MONTH_KEYS.reduce(
        (sum, m) => sum + (r.monthlyPayments[m] || 0),
        0
      );
      return [
        r.roomNumber,
        r.name,
        r.mobNo,
        r.advance,
        r.monthlyRent,
        ...MONTH_KEYS.map((m) => r.monthlyPayments[m] || 0),
        rowTotalPaid,
      ];
    });

    const totalPaidRow = [
      'TOTAL PAID (RECEIVED)',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.totalCollected || 0),
      yearlySummary.yearTotalCollected,
    ];

    const myRoomRow = [
      '12 MY ROOM (4,000/MO)',
      '',
      '',
      '',
      '4000',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.myRoomCollected || 0),
      yearlySummary.myRoomYearPaid,
    ];

    const totalRentRow = [
      'TOTAL RENT (VILLA)',
      '',
      '',
      yearlySummary.totalAdvanceHeld,
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.villaMasterRent || 0),
      yearlySummary.yearMasterRentPaid,
    ];

    const electricityRow = [
      'ELECTRICITY (3 METERS)',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.electricityBill || 0),
      yearlySummary.yearTotalElectricity,
    ];

    const waterRow = [
      'WATER (METER 90978)',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.waterBill || 0),
      yearlySummary.yearTotalWater,
    ];

    const maintenanceRow = [
      'MAINTENANCE',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.maintenanceCost || 0),
      yearlySummary.yearTotalMaintenance,
    ];

    const profitRowWithoutMyRoom = [
      '1. NET PROFIT (WITHOUT MY ROOM)',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.profitWithoutMyRoom || 0),
      yearlySummary.yearProfitWithoutMyRoom,
    ];

    const profitRowWithMyRoom = [
      '2. NET PROFIT (WITH MY ROOM 4,000)',
      '',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalculations[m]?.profitWithMyRoom || 0),
      yearlySummary.yearProfitWithMyRoom,
    ];

    rowsData.push([]);
    rowsData.push(totalPaidRow);
    rowsData.push(myRoomRow);
    rowsData.push(totalRentRow);
    rowsData.push(electricityRow);
    rowsData.push(waterRow);
    rowsData.push(maintenanceRow);
    rowsData.push(profitRowWithoutMyRoom);
    rowsData.push(profitRowWithMyRoom);

    const wsMaster = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);
    XLSX.utils.book_append_sheet(wb, wsMaster, '12 Rooms Financial Master');

    // Utility Meters Sheet
    const meterHeaders = [
      'Meter Number',
      'Type',
      'Month',
      'Previous Reading',
      'Current Reading',
      'Units Consumed',
      'Bill Amount (QAR)',
      'Status',
    ];
    const meterRows = meterReadings.map((mr) => [
      mr.meterNumber,
      VILLA_METERS.find((m) => m.meterNumber === mr.meterNumber)?.type || 'Electricity',
      mr.month,
      mr.previousReading,
      mr.currentReading,
      mr.unitsConsumed,
      mr.billAmountQAR,
      mr.status,
    ]);
    const wsMeters = XLSX.utils.aoa_to_sheet([meterHeaders, ...meterRows]);
    XLSX.utils.book_append_sheet(wb, wsMeters, 'Kahramaa 4 Meters');

    XLSX.writeFile(wb, 'Villa_Financial_Master_12_Rooms.xlsx');
  };

  // Filtered rooms for search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        String(r.roomNumber).toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.mobNo.includes(q)
    );
  }, [rooms, searchQuery]);

  // Filtered rooms for the Rooms & Tenants Directory page (Search + Payment Status filter)
  const directoryRooms = useMemo(() => {
    return filteredRooms.filter((r) => {
      if (roomsFilterStatus === 'ALL') return true;
      const paid = r.monthlyPayments[selectedMonth] || 0;
      const target = r.monthlyRent;
      if (roomsFilterStatus === 'PAID') {
        return paid >= target && target > 0;
      }
      if (roomsFilterStatus === 'PARTIAL') {
        return paid > 0 && paid < target;
      }
      if (roomsFilterStatus === 'UNPAID') {
        return paid === 0 && target > 0;
      }
      return true;
    });
  }, [filteredRooms, roomsFilterStatus, selectedMonth]);

  return (
    <div id="villa-master-manager" className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* =========================================================================
          EXECUTIVE TASK BAR & SYSTEM NAVIGATION (Desktop + Mobile Taskbar)
         ========================================================================= */}
      <VillaTaskBar
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => setSelectedMonth(m)}
        roomsCount={rooms.length}
        totalAdvance={yearlySummary.totalAdvanceHeld}
        profitWithoutMyRoom={monthlyCalculations[selectedMonth]?.profitWithoutMyRoom || 0}
        profitWithMyRoom={monthlyCalculations[selectedMonth]?.profitWithMyRoom || 0}
        onOpenAddRoom={handleOpenAddRoomModal}
        onOpenElectricity={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
        onOpenWater={() => {
          setEditingUtilityMonth({ month: selectedMonth, type: 'Water' });
          setUtilityAmountInput(monthlyCalculations[selectedMonth]?.waterBill || 0);
        }}
        onOpenMaintenance={() => {
          setEditingMaintenanceMonth(selectedMonth);
          setMaintenanceInput(monthlyMaintenance[selectedMonth] || 0);
        }}
        onOpenVillaRent={() => openEditVillaRentModal(selectedMonth)}
        onOpenItemsModal={() => setIsVillaItemsModalOpen(true)}
        onExportExcel={handleExportFullExcel}
        onOpenMakeNewExcel={onOpenMakeNewExcel || handleExportFullExcel}
        onOpenSettings={onOpenSettings}
        onOpenDownload={onOpenDownload || handleExportFullExcel}
      />

      {/* =========================================================================
          PAGE 1: EXECUTIVE DASHBOARD TOP SUMMARY & KPI STRIP
         ========================================================================= */}
      {activeView === 'dashboard' && (
        <>
          {/* KPI HIGHLIGHT STRIP: SEPARATE TOTAL IN TOP FOR MY ROOM, TWO PROFITS, MAINTENANCE TOTAL, RENT & UTILITIES */}
          <div className="bg-slate-900/70 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {/* 1. Received Year (Total Collected) */}
              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[58px]">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider truncate">
                  Received Year
                </span>
                <div className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.yearTotalCollected)}
                </div>
              </div>

              {/* 2. Room 12 "MY ROOM" SEPARATE TOTAL IN TOP (4,000/mo) */}
              <div className="bg-sky-950/50 border border-sky-500/60 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[58px]">
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1 truncate">
                  <User className="h-3 w-3" />
                  <span>12 MY ROOM</span>
                </span>
                <div className="text-sm sm:text-base font-black text-sky-200 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.myRoomYearPaid)}
                </div>
              </div>

              {/* 3. Total Rent (Villa Lease to Landlord) */}
              <div className="bg-rose-950/40 border border-rose-600/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[58px]">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider truncate">
                  Villa Rent
                </span>
                <div className="text-sm sm:text-base font-black text-rose-300 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.yearMasterRentPaid)}
                </div>
              </div>

              {/* 4. PROFIT 1: WITHOUT MY ROOM RENT (Requested by User) */}
              <div className="bg-slate-900 border border-emerald-500/60 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[58px]">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider truncate">
                  Profit (No My Room)
                </span>
                <div className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                  {yearlySummary.yearProfitWithoutMyRoom >= 0 ? '+' : ''}
                  QAR {formatCurrency(yearlySummary.yearProfitWithoutMyRoom)}
                </div>
              </div>

              {/* 5. PROFIT 2: WITH MY ROOM RENT (Requested by User) */}
              <div className="bg-slate-900 border border-blue-500/60 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[58px]">
                <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider truncate">
                  Profit (With Room 12)
                </span>
                <div className="text-sm sm:text-base font-black text-blue-200 font-mono mt-0.5">
                  {yearlySummary.yearProfitWithMyRoom >= 0 ? '+' : ''}
                  QAR {formatCurrency(yearlySummary.yearProfitWithMyRoom)}
                </div>
              </div>

              {/* 6. MAINTENANCE TOTAL IN TOP (Requested by User) */}
              <div
                onClick={() => {
                  setEditingMaintenanceMonth(selectedMonth);
                  setMaintenanceInput(monthlyMaintenance[selectedMonth] || 0);
                }}
                className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer hover:border-purple-400 transition-colors min-h-[58px]"
                title="Edit maintenance expenses"
              >
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Wrench className="h-3 w-3 text-purple-400" />
                  <span>Maintenance</span>
                </span>
                <div className="text-sm sm:text-base font-black text-purple-200 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.yearTotalMaintenance)}
                </div>
              </div>

              {/* 7. Electricity Total (3 Meters: 148964, 148963, 48073) */}
              <div
                onClick={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
                className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-colors min-h-[58px]"
                title="Add electricity bills"
              >
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Zap className="h-3 w-3" />
                  <span>Electricity</span>
                </span>
                <div className="text-sm sm:text-base font-black text-amber-300 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.yearTotalElectricity)}
                </div>
              </div>

              {/* 8. Water Total (Meter 90978) */}
              <div
                onClick={() => {
                  setEditingUtilityMonth({ month: selectedMonth, type: 'Water' });
                  setUtilityAmountInput(monthlyCalculations[selectedMonth]?.waterBill || 0);
                }}
                className="bg-cyan-950/40 border border-cyan-600/40 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer hover:border-cyan-400 transition-colors min-h-[58px]"
                title="Edit Water bills"
              >
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Droplets className="h-3 w-3" />
                  <span>Water</span>
                </span>
                <div className="text-sm sm:text-base font-black text-cyan-300 font-mono mt-0.5">
                  QAR {formatCurrency(yearlySummary.yearTotalWater)}
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar for Villa */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVillaItemsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Item Expenses & Receipts (Google Drive)</span>
                  {villaItems.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-200 border border-emerald-400">
                      {villaItems.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>3 Electricity Meters</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingUtilityMonth({ month: selectedMonth, type: 'Water' });
                    setUtilityAmountInput(monthlyCalculations[selectedMonth]?.waterBill || 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Water Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingMaintenanceMonth(selectedMonth);
                    setMaintenanceInput(monthlyMaintenance[selectedMonth] || 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="h-3.5 w-3.5 text-purple-400" />
                  <span>Maintenance (QAR {monthlyMaintenance[selectedMonth] || 0})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddRoomModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <span>+ Add Room</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          PAGE 2: MASTER SPREADSHEET (FULL FINANCIAL MATRIX)
         ========================================================================= */}
      {activeView === 'master_spreadsheet' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden pb-20">
          {/* Page 2 Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-md flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-sky-400" />
              <span>Master Spreadsheet Matrix</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-sky-950 border border-sky-800 text-sky-300 rounded-xl text-xs font-bold font-mono">
                {rooms.length} Rooms
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search room #, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                Showing {filteredRooms.length} of {rooms.length} Rooms
              </span>
              <button
                onClick={handleOpenAddRoomModal}
                className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Room</span>
              </button>
            </div>

            {/* Quick Status Legend & Instructions */}
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Room 12 (My Room)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Paid (Full)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Unpaid</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-emerald-400 font-medium">
                💡 Click any cell to edit (Name, Rent, Advance, Phone, Payments)!
              </span>
            </div>
          </div>

          {/* Master 12-Room Spreadsheet Table */}
          <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-20">
                  <th className="py-2.5 px-3 text-left font-bold w-14 border-r border-slate-800">ROOM</th>
                  <th className="py-2.5 px-3 text-left font-bold min-w-36 border-r border-slate-800">NAME</th>
                  <th className="py-2.5 px-3 text-left font-bold min-w-28 border-r border-slate-800">MOB NO</th>
                  <th className="py-2.5 px-3 text-right font-bold w-24 border-r border-slate-800 bg-purple-950/40 text-purple-300">
                    ADVANCE (QAR)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold w-24 border-r border-slate-800 bg-emerald-950/40 text-emerald-300">
                    RENT (QAR)
                  </th>
                  {MONTH_KEYS.map((m) => (
                    <th
                      key={m}
                      className="py-2.5 px-2 text-right font-bold min-w-20 border-r border-slate-800 hover:bg-slate-800 transition-colors"
                      title={`${m} payment amount in QAR`}
                    >
                      {m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold w-28 bg-emerald-950/60 text-emerald-300 border-r border-slate-800">
                    TOTAL PAID (QAR)
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold w-20">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRooms.map((r) => {
                  const totalPaid = MONTH_KEYS.reduce(
                    (sum, m) => sum + (r.monthlyPayments[m] || 0),
                    0
                  );
                  const isVacant = String(r.roomNumber) === '11' || (r.monthlyRent === 0 && !r.name.toUpperCase().includes('MY ROOM'));
                  const isMyRoom =
                    r.id === 'room-12' ||
                    String(r.roomNumber) === '12' ||
                    r.name.toUpperCase().includes('MY ROOM');

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isMyRoom
                          ? 'bg-sky-950/25 border-l-4 border-l-sky-500'
                          : isVacant
                          ? 'bg-slate-950/70 opacity-90'
                          : ''
                      }`}
                    >
                      {/* Room Number (Click to edit room details) */}
                      <td
                        onClick={() => setEditingRoomInfo(r)}
                        className="py-2.5 px-3 font-mono font-bold text-slate-200 border-r border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors"
                        title="Click to edit Room info (Number, Name, Rent, Advance, Phone)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: isMyRoom
                                ? '#38bdf8'
                                : isVacant
                                ? '#64748b'
                                : r.color,
                            }}
                          />
                          <span>{r.roomNumber}</span>
                          <Edit3 className="h-2.5 w-2.5 text-slate-500 opacity-50 ml-auto" />
                        </div>
                      </td>

                      {/* Tenant / Room Name (Click to edit room details) */}
                      <td
                        onClick={() => setEditingRoomInfo(r)}
                        className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors"
                        title="Click to edit Room Name & details"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{r.name}</span>
                          {isMyRoom && (
                            <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-sky-900/80 text-sky-200 border border-sky-700">
                              Self (4,000)
                            </span>
                          )}
                          {isVacant && (
                            <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Vacant
                            </span>
                          )}
                          <Edit3 className="h-2.5 w-2.5 text-slate-500 opacity-50 ml-auto" />
                        </div>
                      </td>

                      {/* Mobile Number (Click to edit or WhatsApp) */}
                      <td
                        onClick={() => setEditingRoomInfo(r)}
                        className="py-2.5 px-3 font-mono text-slate-400 border-r border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors"
                        title="Click to edit Phone Number"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>{r.mobNo ? r.mobNo : <span className="text-slate-600">-</span>}</span>
                          {r.mobNo && (
                            <a
                              href={`https://wa.me/${r.mobNo.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded-sm hover:bg-emerald-950/60 transition-colors"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Advance Deposit (Click to edit) */}
                      <td
                        onClick={() => setEditingRoomInfo(r)}
                        className="py-2.5 px-3 text-right font-mono font-bold text-purple-300 bg-purple-950/10 border-r border-slate-800 cursor-pointer hover:bg-purple-950/30 transition-colors"
                        title="Click to edit Advance Deposit"
                      >
                        {r.advance > 0 ? formatCurrency(r.advance) : '-'}
                      </td>

                      {/* Standard Rent (Click to edit) */}
                      <td
                        onClick={() => setEditingRoomInfo(r)}
                        className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300 bg-emerald-950/10 border-r border-slate-800 cursor-pointer hover:bg-emerald-950/30 transition-colors"
                        title="Click to edit Monthly Rent"
                      >
                        {r.monthlyRent > 0 ? (
                          formatCurrency(r.monthlyRent)
                        ) : (
                          <span className="text-slate-500 font-normal italic text-[11px]">0</span>
                        )}
                      </td>

                      {/* Month Columns: FEB to DEC - CLEAN NUMBERS WITHOUT "QAR" PREFIX */}
                      {MONTH_KEYS.map((m) => {
                        const paid = r.monthlyPayments[m] || 0;
                        const target = r.monthlyRent;
                        const isPaid = paid >= target && target > 0;
                        const isPartial = paid > 0 && paid < target;
                        const isUnpaid = paid === 0 && target > 0;

                        return (
                          <td
                            key={m}
                            onClick={() => {
                              setEditingPayment({
                                room: r,
                                month: m,
                                currentVal: paid,
                              });
                              setPaymentInput(String(paid));
                            }}
                            className={`py-2 px-2.5 text-right font-mono border-r border-slate-800 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/50 hover:bg-slate-700/50 ${
                              isMyRoom
                                ? 'text-sky-300 font-semibold'
                                : isPartial
                                ? 'bg-amber-950/30 text-amber-300 font-bold'
                                : isUnpaid && m !== 'NOV' && m !== 'DEC'
                                ? 'bg-rose-950/20 text-rose-400'
                                : isPaid
                                ? 'text-slate-200 font-medium'
                                : 'text-slate-500'
                            }`}
                            title={`Room ${r.roomNumber} (${r.name}) - ${m}: ${paid > 0 ? formatCurrency(paid) : '0'} QAR. Click to edit`}
                          >
                            <div className="flex flex-col items-end">
                              {/* Clean number formatted without repetitive QAR text */}
                              <span>{paid > 0 ? formatCurrency(paid) : '-'}</span>
                              {isPartial && (
                                <span className="text-[9px] text-amber-400 font-sans tracking-tight">
                                  -{formatCurrency(target - paid)}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Paid */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 bg-emerald-950/30 border-r border-slate-800">
                        {formatCurrency(totalPaid)}
                      </td>

                      {/* Actions: Edit Room Details & Delete Room */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingRoomInfo(r)}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Edit Name, Rent, Advance, Phone for Room ${r.roomNumber}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {!isMyRoom && (
                            <button
                              onClick={() => handleDeleteRoom(r.id)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`Delete Room ${r.roomNumber}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Calculation Row 1: TOTAL PAID (RECEIVED) */}
                <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
                  <td colSpan={5} className="py-2.5 px-3 font-bold uppercase tracking-wider text-right border-r border-slate-800 text-slate-300">
                    TOTAL PAID (RECEIVED)
                  </td>
                  {MONTH_KEYS.map((m) => (
                    <td
                      key={m}
                      className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-400 bg-emerald-950/20 border-r border-slate-800"
                    >
                      {formatCurrency(monthlyCalculations[m]?.totalCollected || 0)}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 bg-emerald-950/50 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearTotalCollected)}
                  </td>
                  <td></td>
                </tr>

                {/* Calculation Row 2: 12 MY ROOM (SEPARATE ROW - 4,000/MONTH) */}
                <tr className="bg-sky-950/30 font-semibold border-t border-slate-800/80 text-sky-200">
                  <td colSpan={5} className="py-2 px-3 text-right font-bold uppercase border-r border-slate-800 text-sky-300">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-sky-900/80 text-sky-200 border border-sky-700">
                        Separate Total
                      </span>
                      <span>12 MY ROOM (4,000/MO)</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => (
                    <td
                      key={m}
                      className="py-2 px-2.5 text-right font-mono font-bold text-sky-300 bg-sky-950/40 border-r border-slate-800"
                    >
                      {formatCurrency(monthlyCalculations[m]?.myRoomCollected || 0)}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-mono font-black text-sky-200 bg-sky-950/60 border-r border-slate-800">
                    {formatQAR(yearlySummary.myRoomYearPaid)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-sky-400 font-mono">Self</span>
                  </td>
                </tr>

                {/* Calculation Row 3: TOTAL RENT (VILLA LEASE) */}
                <tr className="bg-slate-950/90 font-bold border-t border-slate-800 text-slate-200">
                  <td colSpan={3} className="py-2.5 px-3 text-right font-bold uppercase text-slate-300 border-r border-slate-800">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-amber-400 font-sans normal-case">(Click cell to Edit)</span>
                      <span>TOTAL RENT (VILLA)</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-purple-300 bg-purple-950/20 border-r border-slate-800">
                    {formatCurrency(yearlySummary.totalAdvanceHeld)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500 border-r border-slate-800">
                    -
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const detail = villaRentDetails[m];
                    const amount = detail ? detail.amount : (initialVillaMasterRent[m] || 0);
                    const status = detail ? detail.status : 'Paid';

                    return (
                      <td
                        key={m}
                        onClick={() => openEditVillaRentModal(m)}
                        className="py-2 px-2.5 text-right font-mono font-bold text-rose-400 bg-rose-950/20 border-r border-slate-800 cursor-pointer hover:bg-rose-900/40 hover:ring-2 hover:ring-rose-500/50 transition-all"
                        title={`Click to edit Total Rent for ${m} (Current Status: ${status})`}
                      >
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(amount)}</span>
                          <span
                            className={`text-[9px] font-sans px-1 rounded-xs tracking-tight ${
                              status === 'Paid'
                                ? 'text-emerald-400 bg-emerald-950/60'
                                : status === 'Partial Paid'
                                ? 'text-amber-400 bg-amber-950/60'
                                : 'text-rose-400 bg-rose-950/60'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-300 bg-rose-950/50 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearMasterRentPaid)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-slate-500 font-mono">Lease</span>
                  </td>
                </tr>

                {/* Calculation Row 4: ⚡ ELECTRICITY (3 METERS: 148964, 148963, 48073) */}
                <tr className="bg-amber-950/20 font-semibold border-t border-slate-800 text-amber-200">
                  <td
                    colSpan={5}
                    onClick={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
                    className="py-2 px-3 text-right font-bold uppercase border-r border-slate-800 text-amber-300 cursor-pointer hover:bg-amber-900/30"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-amber-400 font-sans normal-case">(Click to Add/Choose Meter)</span>
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span>ELECTRICITY (3 METERS)</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const elec = monthlyCalculations[m]?.electricityBill || 0;
                    return (
                      <td
                        key={m}
                        onClick={() => handleOpenElectricityModal(m, 'ALL')}
                        className="py-2 px-2.5 text-right font-mono font-bold text-amber-400 bg-amber-950/30 border-r border-slate-800 cursor-pointer hover:bg-amber-900/40 transition-colors"
                        title={`Click to add/edit 3 electricity bills for ${m} (Meters 148964, 148963, 48073)`}
                      >
                        {formatCurrency(elec)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-right font-mono font-black text-amber-300 bg-amber-950/60 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearTotalElectricity)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-amber-400 font-mono">Elec</span>
                  </td>
                </tr>

                {/* Calculation Row 5: 💧 WATER (METER 90978) */}
                <tr className="bg-cyan-950/20 font-semibold border-t border-slate-800 text-cyan-200">
                  <td colSpan={5} className="py-2 px-3 text-right font-bold uppercase border-r border-slate-800 text-cyan-300">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-cyan-400 font-sans normal-case">(Click cell to Edit)</span>
                      <Droplets className="h-3 w-3 text-cyan-400" />
                      <span>WATER (METER 90978)</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const water = monthlyCalculations[m]?.waterBill || 0;
                    return (
                      <td
                        key={m}
                        onClick={() => {
                          setEditingUtilityMonth({ month: m, type: 'Water' });
                          setUtilityAmountInput(water);
                        }}
                        className="py-2 px-2.5 text-right font-mono font-bold text-cyan-400 bg-cyan-950/30 border-r border-slate-800 cursor-pointer hover:bg-cyan-900/40 transition-colors"
                        title={`Click to edit Water bill for ${m} (Meter 90978)`}
                      >
                        {formatCurrency(water)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-right font-mono font-black text-cyan-300 bg-cyan-950/60 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearTotalWater)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-cyan-400 font-mono">Water</span>
                  </td>
                </tr>

                {/* Calculation Row 6: 🛠️ MAINTENANCE */}
                <tr className="bg-purple-950/20 font-semibold border-t border-slate-800 text-purple-200">
                  <td colSpan={5} className="py-2 px-3 text-right font-bold uppercase border-r border-slate-800 text-purple-300">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-purple-400 font-sans normal-case">(Click cell to Edit)</span>
                      <Wrench className="h-3 w-3 text-purple-400" />
                      <span>MAINTENANCE</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const maint = monthlyMaintenance[m] || 0;
                    return (
                      <td
                        key={m}
                        onClick={() => {
                          setEditingMaintenanceMonth(m);
                          setMaintenanceInput(maint);
                        }}
                        className="py-2 px-2.5 text-right font-mono font-bold text-purple-400 bg-purple-950/30 border-r border-slate-800 cursor-pointer hover:bg-purple-900/40 transition-colors"
                        title={`Click to edit maintenance expense for ${m}`}
                      >
                        {maint > 0 ? formatCurrency(maint) : '0'}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-right font-mono font-black text-purple-300 bg-purple-950/60 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearTotalMaintenance)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-purple-400 font-mono">Maint</span>
                  </td>
                </tr>

                {/* Calculation Row 7: PROFIT 1: WITHOUT MY ROOM RENT */}
                <tr className="bg-emerald-950/20 font-black border-t-2 border-slate-700 text-slate-100">
                  <td colSpan={5} className="py-2.5 px-3 font-black uppercase tracking-wider text-right border-r border-slate-800">
                    <div className="flex items-center justify-end gap-2">
                      <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-900/70 text-emerald-200 border border-emerald-700/60 normal-case">
                        Formula: Tenants - Total Rent = Profit
                      </span>
                      <span className="text-emerald-300">1. PROFIT (WITHOUT MY ROOM)</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const profit1 = monthlyCalculations[m]?.profitWithoutMyRoom || 0;
                    return (
                      <td
                        key={m}
                        className={`py-2.5 px-2.5 text-right font-mono font-bold border-r border-slate-800 ${
                          profit1 >= 0 ? 'text-emerald-300 bg-emerald-950/40' : 'text-rose-300 bg-rose-950/40'
                        }`}
                      >
                        {formatCurrency(profit1)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 bg-emerald-950/70 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearProfitWithoutMyRoom)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-emerald-400 font-mono">No My Room</span>
                  </td>
                </tr>

                {/* Calculation Row 8: PROFIT 2: WITH MY ROOM RENT (4,000/MO) */}
                <tr className="bg-blue-950/20 font-black border-t border-slate-800 text-slate-100">
                  <td colSpan={5} className="py-2.5 px-3 font-black uppercase tracking-wider text-right border-r border-slate-800">
                    <div className="flex items-center justify-end gap-2">
                      <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-blue-900/70 text-blue-200 border border-blue-700/60 normal-case">
                        Formula: Total Received - Total Rent = Profit
                      </span>
                      <span className="text-blue-300">2. PROFIT (WITH MY ROOM 4,000)</span>
                    </div>
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const profit2 = monthlyCalculations[m]?.profitWithMyRoom || 0;
                    return (
                      <td
                        key={m}
                        className={`py-2.5 px-2.5 text-right font-mono font-bold border-r border-slate-800 ${
                          profit2 >= 0 ? 'text-blue-200 bg-blue-950/40' : 'text-rose-300 bg-rose-950/40'
                        }`}
                      >
                        {formatCurrency(profit2)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-blue-200 bg-blue-950/70 border-r border-slate-800">
                    {formatQAR(yearlySummary.yearProfitWithMyRoom)}
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] text-blue-400 font-mono">Inc My Room</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 1: EXECUTIVE DASHBOARD & SUMMARY
         ========================================================================= */}
      {activeView === 'dashboard' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6 pb-24">
          {/* Page 1 Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-emerald-400" />
              <span>Executive Dashboard</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Cloud Sync Status Badge (Cross-Device Sync) */}
              <button
                type="button"
                onClick={handleManualCloudRefresh}
                disabled={isSyncingWithCloud}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`All devices share the same live database via Cloud Firestore. Last sync: ${lastCloudSync || 'Active'}. Click to refresh.`}
              >
                <span className={`h-2 w-2 rounded-full bg-emerald-400 ${isSyncingWithCloud ? 'animate-ping' : 'animate-pulse'}`} />
                <span className="hidden xs:inline">Live Cloud Sync</span>
                <span className="xs:hidden">Sync</span>
                {isSyncingWithCloud ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
              </button>

              {/* Open / Close Chart Button (Requested by user) */}
              <button
                type="button"
                onClick={() => setShowCharts((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  showCharts
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
                    : 'bg-slate-950 text-purple-300 border-slate-700 hover:text-white hover:border-purple-500/60'
                }`}
                title={showCharts ? 'Close Financial Chart to save screen space' : 'Open Financial Chart'}
              >
                <BarChart3 className="h-4 w-4" />
                <span>{showCharts ? 'Close Chart ▲' : 'Open Chart 📊'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVillaItemsModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all"
              >
                <Paperclip className="h-4 w-4" />
                <span>+ Villa Items & Receipts</span>
                {villaItems.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-white font-mono">
                    {villaItems.length}
                  </span>
                )}
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-300">
                Month: <strong className="text-emerald-400 font-mono">{selectedMonth} 2026</strong>
              </span>
            </div>
          </div>

          {/* 1. Visual Financial Chart with Open and Close Option */}
          {showCharts ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Monthly Performance Curve (Collections vs Master Rent vs Profit)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCharts(false)}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <span>Close Chart ▲</span>
                </button>
              </div>
              <VillaMonthlyChart
                data={chartData}
                selectedMonth={selectedMonth}
                onSelectMonth={(m) => setSelectedMonth(m)}
              />
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 min-w-0">
                <BarChart3 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="truncate">
                  <strong>Financial Charts are Closed</strong> • Click Open Chart to view full 11-month performance curve
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCharts(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Open Chart 📊</span>
              </button>
            </div>
          )}

          {/* 2. Month Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {MONTH_KEYS.map((m) => {
              const active = selectedMonth === m;
              const profit = monthlyCalculations[m]?.netProfit || 0;
              const rentStatus = monthlyCalculations[m]?.villaRentStatus || 'Paid';

              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-105 border border-emerald-400'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{m}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      active
                        ? 'bg-emerald-700 text-emerald-100'
                        : profit >= 0
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {formatCurrency(monthlyCalculations[m]?.totalCollected || 0)}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      rentStatus === 'Paid'
                        ? 'bg-emerald-400'
                        : rentStatus === 'Partial Paid'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* 3. Selected Month Financial Overview Cards (Including Utilities & Maintenance) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Received */}
            <div className="bg-slate-900 border border-emerald-600/30 rounded-2xl p-3.5 shadow-lg">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                {selectedMonth} Received
              </span>
              <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                {formatQAR(monthlyCalculations[selectedMonth]?.totalCollected || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tenants + Room 12
              </div>
            </div>

            {/* Room 12 Share in this month */}
            <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-3.5 shadow-lg">
              <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>12 MY ROOM ({selectedMonth})</span>
              </span>
              <div className="text-xl font-black text-sky-200 font-mono mt-1">
                {formatQAR(monthlyCalculations[selectedMonth]?.myRoomCollected || 0)}
              </div>
              <div className="text-[11px] text-sky-400 mt-1">
                4,000 QAR paid monthly
              </div>
            </div>

            {/* Total Rent (Villa Lease) */}
            <div className="bg-slate-900 border border-rose-600/30 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    {selectedMonth} Villa Rent
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      monthlyCalculations[selectedMonth]?.villaRentStatus === 'Paid'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : monthlyCalculations[selectedMonth]?.villaRentStatus === 'Partial Paid'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {monthlyCalculations[selectedMonth]?.villaRentStatus}
                  </span>
                </div>
                <div className="text-xl font-black text-rose-300 font-mono mt-1">
                  {formatQAR(monthlyCalculations[selectedMonth]?.villaMasterRent || 0)}
                </div>
              </div>
              <button
                onClick={() => openEditVillaRentModal(selectedMonth)}
                className="mt-2 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
              >
                <Edit3 className="h-3 w-3 text-rose-400" />
                <span>Edit Rent</span>
              </button>
            </div>

            {/* Electricity in this month (3 meters) */}
            <div className="bg-slate-900 border border-amber-600/30 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{selectedMonth} Electricity</span>
                </span>
                <div className="text-xl font-black text-amber-300 font-mono mt-1">
                  {formatQAR(monthlyCalculations[selectedMonth]?.electricityBill || 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  3 Meters: 148964, 148963, 48073
                </div>
              </div>
              <button
                onClick={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
                className="mt-2 py-1 px-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors border border-amber-800 cursor-pointer"
              >
                <Edit3 className="h-3 w-3 text-amber-400" />
                <span>Add 3 Bills / Choose Meter</span>
              </button>
            </div>

            {/* Water in this month (meter 90978) */}
            <div className="bg-slate-900 border border-cyan-600/30 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  <span>{selectedMonth} Water</span>
                </span>
                <div className="text-xl font-black text-cyan-300 font-mono mt-1">
                  {formatQAR(monthlyCalculations[selectedMonth]?.waterBill || 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Meter 90978 bill
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingUtilityMonth({ month: selectedMonth, type: 'Water' });
                  setUtilityAmountInput(monthlyCalculations[selectedMonth]?.waterBill || 0);
                }}
                className="mt-2 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
              >
                <Edit3 className="h-3 w-3 text-cyan-400" />
                <span>Edit Bill</span>
              </button>
            </div>

            {/* Profit 1: Without My Room Rent */}
            <div className="bg-linear-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                    1. Profit (No Room 12)
                  </span>
                  <span className="text-[9px] px-1 rounded-xs bg-emerald-900 text-emerald-200 font-bold">
                    Pure
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                  {formatQAR(monthlyCalculations[selectedMonth]?.profitWithoutMyRoom || 0)}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
                  Tenants - Villa Rent
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>Pure Landlord Margin</span>
              </div>
            </div>

            {/* Profit 2: With My Room Rent (4,000/mo) */}
            <div className="bg-linear-to-br from-blue-950/80 to-slate-900 border border-blue-500/50 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                    2. Profit (With Room 12)
                  </span>
                  <span className="text-[9px] px-1 rounded-xs bg-blue-900 text-blue-200 font-bold">
                    +4,000
                  </span>
                </div>
                <div className="text-xl font-black text-blue-200 font-mono mt-1">
                  {formatQAR(monthlyCalculations[selectedMonth]?.profitWithMyRoom || 0)}
                </div>
                <div className="text-[10px] text-blue-300/80 mt-1 font-mono">
                  Total Received - Villa Rent
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-300 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>Total Cash Remaining</span>
              </div>
            </div>
          </div>

          {/* 4. Room Payment Status Tracker with 1-Click Status Toggles (Paid, Partial, Unpaid) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Room Payments for {selectedMonth}</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({monthlyCalculations[selectedMonth]?.paidRoomsCount} Paid,{' '}
                    {monthlyCalculations[selectedMonth]?.partialRoomsCount} Partial,{' '}
                    {monthlyCalculations[selectedMonth]?.unpaidRoomsCount} Unpaid)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click Paid, Partial, or Unpaid buttons to immediately update each room's payment
                </p>
              </div>

              <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                Total Month Collected: <strong className="text-emerald-400">{formatQAR(monthlyCalculations[selectedMonth]?.totalCollected || 0)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((r) => {
                const paid = r.monthlyPayments[selectedMonth] || 0;
                const target = r.monthlyRent;
                const isVacant = String(r.roomNumber) === '11' || (target === 0 && !r.name.toUpperCase().includes('MY ROOM'));
                const isMyRoom =
                  r.id === 'room-12' ||
                  String(r.roomNumber) === '12' ||
                  r.name.toUpperCase().includes('MY ROOM');
                const isPaid = paid >= target && target > 0;
                const isPartial = paid > 0 && paid < target;
                const isUnpaid = paid === 0 && target > 0;

                return (
                  <div
                    key={r.id}
                    className={`bg-slate-950 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                      isMyRoom
                        ? 'border-sky-500/50 shadow-md shadow-sky-950/30'
                        : isVacant
                        ? 'border-slate-800 opacity-80'
                        : isPaid
                        ? 'border-emerald-600/30 hover:border-emerald-500/60'
                        : isPartial
                        ? 'border-amber-600/30 hover:border-amber-500/60'
                        : 'border-rose-600/30 hover:border-rose-500/60'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: isMyRoom
                                ? '#38bdf8'
                                : isVacant
                                ? '#64748b'
                                : r.color,
                            }}
                          />
                          <span className="font-bold text-white text-sm">Room {r.roomNumber}</span>
                          <span className="text-xs font-semibold text-slate-300">&bull; {r.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isMyRoom
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : isVacant
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : isPaid
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isPartial
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {isMyRoom ? 'My Room' : isVacant ? 'Vacant' : isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
                        </span>
                      </div>

                      {/* Phone & Target */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                        <span>{r.mobNo ? `Mob: ${r.mobNo}` : isMyRoom ? 'Self' : 'No phone'}</span>
                        <span>Rent: {formatQAR(target)}</span>
                      </div>

                      {/* Paid Amount */}
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400">Paid in {selectedMonth}:</span>
                        <div className="text-right">
                          <span
                            className={`text-base font-mono font-black ${
                              isMyRoom
                                ? 'text-sky-300'
                                : isVacant
                                ? 'text-slate-500'
                                : isPaid
                                ? 'text-emerald-400'
                                : isPartial
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatQAR(paid)}
                          </span>
                          {isPartial && (
                            <span className="text-[10px] text-amber-400 block font-mono">
                              Due: -{formatQAR(target - paid)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick 1-Click Status Toggles */}
                    {!isVacant ? (
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleQuickRoomStatus(r.id, selectedMonth, 'Paid')}
                          className={`py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-emerald-950'
                          }`}
                        >
                          Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPayment({
                              room: r,
                              month: selectedMonth,
                              currentVal: paid,
                            });
                            setPaymentInput(String(paid > 0 ? paid : Math.round(target * 0.5)));
                          }}
                          className={`py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isPartial
                              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                              : 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-amber-950'
                          }`}
                        >
                          Partial...
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRoomStatus(r.id, selectedMonth, 'Unpaid')}
                          className={`py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isUnpaid
                              ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                              : 'bg-slate-900 text-rose-400 border-slate-800 hover:bg-rose-950'
                          }`}
                        >
                          Unpaid
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1.5 text-xs text-slate-500 italic bg-slate-900/40 rounded-lg">
                        Room 11 is vacant (0 QAR rent)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. 4 Kahramaa Utility Meters Section: 3 Electricity & 1 Water */}
          <VillaUtilityMeters
            selectedMonth={selectedMonth}
            readings={meterReadings}
            onUpdateReading={handleUpdateMeterReading}
          />
        </div>
      )}

      {/* =========================================================================
          PAGE 3: ROOMS & TENANTS DIRECTORY (MOBILE FIRST VIEWER)
         ========================================================================= */}
      {activeView === 'rooms_directory' && (
        <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-y-auto space-y-4 pb-20">
          {/* Page 3 Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span>Rooms & Tenants</span>
            </h2>
            <button
              onClick={handleOpenAddRoomModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Room</span>
            </button>
          </div>

          {/* Month Selector Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
              Active Month:
            </span>
            <div className="flex items-center gap-1.5">
              {MONTH_KEYS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedMonth === m
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Rooms</span>
              <div className="text-lg font-black text-white mt-0.5">{rooms.length} Rooms</div>
            </div>
            <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3">
              <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">Total Advance Held</span>
              <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
                QAR {formatCurrency(rooms.reduce((s, r) => s + (r.advance || 0), 0))}
              </div>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">{selectedMonth} Target Rent</span>
              <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                QAR {formatCurrency(rooms.reduce((s, r) => s + (r.monthlyRent || 0), 0))}
              </div>
            </div>
            <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-3">
              <span className="text-[10px] text-sky-300 uppercase tracking-wider font-bold">{selectedMonth} Collected</span>
              <div className="text-lg font-black text-sky-300 font-mono mt-0.5">
                QAR {formatCurrency(monthlyCalculations[selectedMonth]?.totalCollected || 0)}
              </div>
            </div>
          </div>

          {/* Search, Status Filters & "+ Add Room" Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, room number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Tabs (Desktop/Tablet) */}
              <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setRoomsFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    roomsFilterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({rooms.length})
                </button>
                <button
                  onClick={() => setRoomsFilterStatus('PAID')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    roomsFilterStatus === 'PAID' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
                  }`}
                >
                  Paid ({monthlyCalculations[selectedMonth]?.paidRoomsCount})
                </button>
                <button
                  onClick={() => setRoomsFilterStatus('PARTIAL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    roomsFilterStatus === 'PARTIAL' ? 'bg-amber-600 text-white' : 'text-amber-400'
                  }`}
                >
                  Partial ({monthlyCalculations[selectedMonth]?.partialRoomsCount})
                </button>
                <button
                  onClick={() => setRoomsFilterStatus('UNPAID')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    roomsFilterStatus === 'UNPAID' ? 'bg-rose-600 text-white' : 'text-rose-400'
                  }`}
                >
                  Unpaid ({monthlyCalculations[selectedMonth]?.unpaidRoomsCount})
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenAddRoomModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add More Room</span>
            </button>
          </div>

          {/* Status Filters for Mobile Screen */}
          <div className="flex md:hidden items-center justify-between gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold overflow-x-auto">
            <button
              onClick={() => setRoomsFilterStatus('ALL')}
              className={`flex-1 py-1 px-2 rounded-lg text-center cursor-pointer ${
                roomsFilterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoomsFilterStatus('PAID')}
              className={`flex-1 py-1 px-2 rounded-lg text-center cursor-pointer ${
                roomsFilterStatus === 'PAID' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
              }`}
            >
              Paid ({monthlyCalculations[selectedMonth]?.paidRoomsCount})
            </button>
            <button
              onClick={() => setRoomsFilterStatus('PARTIAL')}
              className={`flex-1 py-1 px-2 rounded-lg text-center cursor-pointer ${
                roomsFilterStatus === 'PARTIAL' ? 'bg-amber-600 text-white' : 'text-amber-400'
              }`}
            >
              Partial ({monthlyCalculations[selectedMonth]?.partialRoomsCount})
            </button>
            <button
              onClick={() => setRoomsFilterStatus('UNPAID')}
              className={`flex-1 py-1 px-2 rounded-lg text-center cursor-pointer ${
                roomsFilterStatus === 'UNPAID' ? 'bg-rose-600 text-white' : 'text-rose-400'
              }`}
            >
              Unpaid ({monthlyCalculations[selectedMonth]?.unpaidRoomsCount})
            </button>
          </div>

          {/* Mobile-First Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {directoryRooms.map((r) => {
              const paid = r.monthlyPayments[selectedMonth] || 0;
              const target = r.monthlyRent;
              const isVacant = String(r.roomNumber) === '11' || (target === 0 && !r.name.toUpperCase().includes('MY ROOM'));
              const isMyRoom =
                r.id === 'room-12' ||
                String(r.roomNumber) === '12' ||
                r.name.toUpperCase().includes('MY ROOM');
              const isPaid = paid >= target && target > 0;
              const isPartial = paid > 0 && paid < target;
              const isUnpaid = paid === 0 && target > 0;
              const cleanPhone = r.mobNo ? r.mobNo.replace(/[^0-9]/g, '') : '';

              return (
                <div
                  key={r.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all ${
                    isMyRoom
                      ? 'border-sky-500/60 bg-sky-950/15 ring-1 ring-sky-500/40'
                      : isPaid
                      ? 'border-emerald-600/40'
                      : isPartial
                      ? 'border-amber-600/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header: Room Number, Name, Badges & Quick Action */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-mono font-black text-sm text-white shadow-md shrink-0"
                          style={{ backgroundColor: isMyRoom ? '#0284c7' : r.color || '#10b981' }}
                        >
                          {r.roomNumber}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                            <span>{r.name}</span>
                            {isMyRoom && (
                              <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-sky-900 text-sky-200 border border-sky-700">
                                12 MY ROOM (4,000)
                              </span>
                            )}
                            {isVacant && (
                              <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Vacant
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Room #{r.roomNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingRoomInfo(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Room Name, Rent, Advance, Phone, Number"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {!isMyRoom && (
                          <button
                            onClick={() => handleDeleteRoom(r.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contact & Phone row with 1-tap WhatsApp and Call buttons */}
                    <div className="py-2.5 flex items-center justify-between text-xs border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{r.mobNo || <span className="text-slate-500 italic">No phone added</span>}</span>
                      </div>

                      {cleanPhone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <PhoneCall className="h-3 w-3 text-sky-400" />
                            <span>Call</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Rent & Advance Info */}
                    <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-slate-800/80 text-xs">
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">Monthly Rent</span>
                        <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                          {r.monthlyRent > 0 ? formatQAR(r.monthlyRent) : '0 QAR'}
                        </div>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-purple-300 uppercase font-bold block">Advance Deposit</span>
                        <div className="text-sm font-black text-purple-300 font-mono mt-0.5">
                          {r.advance > 0 ? formatQAR(r.advance) : '0 QAR'}
                        </div>
                      </div>
                    </div>

                    {/* Active Month Payment Status Card */}
                    <div className="mt-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">
                          {selectedMonth} Payment:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isPartial
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {isPaid ? '✓ Paid' : isPartial ? '⚠ Partial' : '✗ Unpaid'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between font-mono">
                        <div className="text-base font-black text-white">
                          {formatQAR(paid)}
                        </div>
                        {isPartial && (
                          <div className="text-[11px] text-amber-400">
                            Due: {formatQAR(target - paid)}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Quick Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleQuickMarkPayment(r, selectedMonth, 'FULL')}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-emerald-950'
                          }`}
                        >
                          ✓ Full Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPayment({
                              room: r,
                              month: selectedMonth,
                              currentVal: paid,
                            });
                            setPaymentInput(String(paid > 0 ? paid : Math.round(target * 0.5)));
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isPartial
                              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                              : 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-amber-950'
                          }`}
                        >
                          Custom...
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkPayment(r, selectedMonth, 'ZERO')}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isUnpaid
                              ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                              : 'bg-slate-900 text-rose-400 border-slate-800 hover:bg-rose-950'
                          }`}
                        >
                          Zero (0)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 11-Month Payment Mini Dots Timeline */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
                    {MONTH_KEYS.map((m) => {
                      const mPaid = r.monthlyPayments[m] || 0;
                      const mPaidFull = mPaid >= target && target > 0;
                      const mPartial = mPaid > 0 && mPaid < target;

                      return (
                        <div
                          key={m}
                          onClick={() => {
                            setSelectedMonth(m);
                            setEditingPayment({
                              room: r,
                              month: m,
                              currentVal: mPaid,
                            });
                            setPaymentInput(String(mPaid));
                          }}
                          className="flex flex-col items-center cursor-pointer p-0.5 group"
                          title={`${m}: ${formatCurrency(mPaid)} QAR`}
                        >
                          <span className="text-[9px] text-slate-400 font-mono">{m[0]}</span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full mt-0.5 transition-transform group-hover:scale-125 ${
                              mPaidFull
                                ? 'bg-emerald-500'
                                : mPartial
                                ? 'bg-amber-500'
                                : 'bg-rose-950 border border-rose-800'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 4: UTILITIES & EXPENSES HUB (3 ELECTRICITY METERS, WATER & MAINTENANCE)
         ========================================================================= */}
      {activeView === 'utilities_expenses' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6 pb-20">
          {/* Top Utilities Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span>Kahramaa Utilities & Maintenance</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAllUtilityBills}
                className="px-3.5 py-2 bg-slate-950 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete all utility bills and reset meters to 0 QAR"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete All Bills (0 QAR)</span>
              </button>

              <button
                onClick={() => handleOpenElectricityModal(selectedMonth, 'ALL')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-950/50 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>⚡ Open 3-Meter Electricity Modal</span>
              </button>
            </div>
          </div>

          {/* 4 Kahramaa Utility Meters Section: 3 Electricity & 1 Water */}
          <VillaUtilityMeters
            selectedMonth={selectedMonth}
            readings={meterReadings}
            onUpdateReading={handleUpdateMeterReading}
          />
        </div>
      )}

      {/* =========================================================================
          PAGE 5: FINANCIAL STATEMENT & AUDIT REPORTS (Printable / PDF Ready)
         ========================================================================= */}
      {activeView === 'financial_statement' && (
        <VillaFinancialStatement
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
          monthlyCalculations={monthlyCalculations}
          yearlySummary={yearlySummary}
          rooms={rooms}
          onExportExcel={handleExportFullExcel}
        />
      )}

      {/* =========================================================================
          MODAL 1: EDIT TOTAL VILLA RENT (Paid, Unpaid, Partial Paid)
         ========================================================================= */}
      {editingVillaRent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-rose-400" />
                  <span>Edit Total Villa Rent ({editingVillaRent.month})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Villa master lease rent paid to landlord
                </span>
              </div>
              <button
                onClick={() => setEditingVillaRent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rent Amount */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Agreed Master Rent (QAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={rentAmountInput || ''}
                    onChange={(e) => setRentAmountInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Status Picker: Paid, Unpaid, Partial Paid */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Payment Status to Landlord
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRentStatusInput('Paid');
                      setPaidAmountInput(rentAmountInput);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      rentStatusInput === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-emerald-400 border-slate-800 hover:bg-emerald-950/40'
                    }`}
                  >
                    Paid (Full)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRentStatusInput('Partial Paid');
                      setPaidAmountInput(Math.round(rentAmountInput * 0.5));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      rentStatusInput === 'Partial Paid'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-amber-950/40'
                    }`}
                  >
                    Partial Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRentStatusInput('Unpaid');
                      setPaidAmountInput(0);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      rentStatusInput === 'Unpaid'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-950 text-rose-400 border-slate-800 hover:bg-rose-950/40'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              {/* Actual Paid Amount */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Amount Actually Paid to Landlord (QAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={paidAmountInput || ''}
                    onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                {rentStatusInput === 'Partial Paid' && (
                  <span className="text-[11px] text-amber-400 mt-1 block font-mono">
                    Remaining Balance: {formatQAR(Math.max(0, rentAmountInput - paidAmountInput))}
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Payment Notes / Landlord Cheque No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Landlord Cheque #847291 / Bank Transfer"
                  value={rentNotesInput}
                  onChange={(e) => setRentNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Calculated profit preview */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {editingVillaRent.month} Net Profit with this rent:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatQAR(
                    (monthlyCalculations[editingVillaRent.month]?.totalCollected || 0) -
                      rentAmountInput
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingVillaRent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVillaRent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Total Rent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT ROOM PAYMENT (Paid, Partial, Unpaid)
         ========================================================================= */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Room {editingPayment.room.roomNumber} Payment</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {editingPayment.month}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Tenant: {editingPayment.room.name} &bull; Rent: {formatQAR(editingPayment.room.monthlyRent)}
                </span>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Payment for {editingPayment.month} (QAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={paymentInput}
                    onChange={(e) => setPaymentInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    placeholder="Enter amount in QAR"
                    autoFocus
                  />
                </div>
              </div>

              {/* 1-Click shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentInput(String(editingPayment.room.monthlyRent))}
                  className="py-1.5 px-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Full ({formatCurrency(editingPayment.room.monthlyRent)})
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentInput(String(Math.round(editingPayment.room.monthlyRent * 0.5)))
                  }
                  className="py-1.5 px-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Half ({formatCurrency(Math.round(editingPayment.room.monthlyRent * 0.5))})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentInput('0')}
                  className="py-1.5 px-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Zero (0)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT ROOM INFO (ROOM NAME & ROOM NUMBER CHANGE OPTION)
         ========================================================================= */}
      {editingRoomInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-400" />
                <span>Edit Room Info (Number & Name)</span>
              </h3>
              <button
                onClick={() => setEditingRoomInfo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* 1. ROOM NUMBER & ROOM NAME (Requested by User) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-1">
                  <label className="text-xs text-emerald-300 block mb-1 font-bold">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={editingRoomInfo.roomNumber}
                    onChange={(e) =>
                      setEditingRoomInfo({
                        ...editingRoomInfo,
                        roomNumber: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-emerald-600/60 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-hidden focus:border-emerald-400"
                    placeholder="e.g. 12"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-slate-300 block mb-1 font-bold">
                    Room / Tenant Name
                  </label>
                  <input
                    type="text"
                    value={editingRoomInfo.name}
                    onChange={(e) =>
                      setEditingRoomInfo({ ...editingRoomInfo, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                    placeholder="e.g. MY ROOM or Tenant Name"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editingRoomInfo.mobNo}
                  onChange={(e) =>
                    setEditingRoomInfo({ ...editingRoomInfo, mobNo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  placeholder="e.g. 33145678"
                />
              </div>

              {/* Financials: Advance & Monthly Rent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 block mb-1 font-semibold">
                    Advance Deposit (QAR)
                  </label>
                  <input
                    type="number"
                    value={editingRoomInfo.advance}
                    onChange={(e) =>
                      setEditingRoomInfo({
                        ...editingRoomInfo,
                        advance: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-purple-800/60 rounded-xl px-3 py-2 text-sm text-purple-200 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-emerald-300 block mb-1 font-semibold">
                    Monthly Rent (QAR)
                  </label>
                  <input
                    type="number"
                    value={editingRoomInfo.monthlyRent}
                    onChange={(e) =>
                      setEditingRoomInfo({
                        ...editingRoomInfo,
                        monthlyRent: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm text-emerald-200 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomInfo({
                      ...editingRoomInfo,
                      name: 'MY ROOM',
                      monthlyRent: 4000,
                      color: '#0284c7',
                    });
                  }}
                  className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg text-[11px] font-semibold hover:bg-sky-900 cursor-pointer"
                >
                  Set as MY ROOM (4,000 QAR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomInfo({
                      ...editingRoomInfo,
                      name: 'EMPTY (Vacant)',
                      mobNo: '',
                      advance: 0,
                      monthlyRent: 0,
                      color: '#94a3b8',
                    });
                  }}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Mark Vacant (0 QAR)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingRoomInfo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoomProfile}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT MAINTENANCE FOR A MONTH
         ========================================================================= */}
      {editingMaintenanceMonth && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-400" />
                  <span>Maintenance for {editingMaintenanceMonth}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total maintenance shows in top strip
                </span>
              </div>
              <button
                onClick={() => setEditingMaintenanceMonth(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Maintenance Expense Amount (QAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={maintenanceInput || ''}
                    onChange={(e) => setMaintenanceInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-800/60 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-purple-500"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceInput(0)}
                  className="py-1 px-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
                >
                  0 QAR
                </button>
                <button
                  type="button"
                  onClick={() => setMaintenanceInput(350)}
                  className="py-1 px-2 bg-purple-950/60 text-purple-300 border border-purple-800 rounded-lg text-xs hover:bg-purple-900/60 cursor-pointer"
                >
                  350 QAR
                </button>
                <button
                  type="button"
                  onClick={() => setMaintenanceInput(750)}
                  className="py-1 px-2 bg-purple-950/60 text-purple-300 border border-purple-800 rounded-lg text-xs hover:bg-purple-900/60 cursor-pointer"
                >
                  750 QAR
                </button>
              </div>
            </div>

            {/* Quick button to itemize parts & attach receipts with Google Drive */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingMaintenanceMonth(null);
                  setIsVillaItemsModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Itemize Parts / Reason & Attach Receipts (Save in Drive)...</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingMaintenanceMonth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMaintenance}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: EDIT ELECTRICITY / WATER BILL FOR A MONTH
         ========================================================================= */}
      {editingUtilityMonth && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {editingUtilityMonth.type === 'Electricity' ? (
                    <Zap className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Droplets className="h-4 w-4 text-cyan-400" />
                  )}
                  <span>
                    {editingUtilityMonth.month} {editingUtilityMonth.type} Bill
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  {editingUtilityMonth.type === 'Electricity'
                    ? '3 Kahramaa Meters (148964, 148963, 48073)'
                    : 'Kahramaa Water Meter (90978)'}
                </span>
              </div>
              <button
                onClick={() => setEditingUtilityMonth(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Total Bill Amount for {editingUtilityMonth.month} (QAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                    QAR
                  </span>
                  <input
                    type="number"
                    value={utilityAmountInput || ''}
                    onChange={(e) => setUtilityAmountInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-13 pr-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setEditingUtilityMonth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUtilityBill}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: DEDICATED 3-METER ELECTRICITY MODAL (Choose Meter Number & Add Bills)
         ========================================================================= */}
      <ElectricityModal
        isOpen={isElectricityModalOpen}
        onClose={() => setIsElectricityModalOpen(false)}
        month={electricityModalMonth}
        onMonthChange={(m: MonthKey) => setElectricityModalMonth(m)}
        readings={meterReadings}
        onSaveReadings={handleSaveElectricityReadings}
        defaultMeterNumber={electricityModalMeter}
      />

      {/* =========================================================================
          MODAL 7: ADD NEW ROOM MODAL
         ========================================================================= */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <span>Add More Room to Villa</span>
              </h3>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Room Number & Room Name */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-1">
                  <label className="text-xs text-emerald-300 block mb-1 font-bold">
                    Room #
                  </label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-600/60 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-hidden focus:border-emerald-400"
                    placeholder="e.g. 13"
                    autoFocus
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-slate-300 block mb-1 font-bold">
                    Room / Tenant Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                    placeholder="e.g. ROOM 13 or Tenant Name"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={newRoomPhone}
                  onChange={(e) => setNewRoomPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  placeholder="e.g. 33145678 or +974..."
                />
              </div>

              {/* Advance Deposit & Monthly Rent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 block mb-1 font-semibold">
                    Advance Deposit (QAR)
                  </label>
                  <input
                    type="number"
                    value={newRoomAdvance || ''}
                    onChange={(e) => setNewRoomAdvance(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-purple-800/60 rounded-xl px-3 py-2 text-sm text-purple-200 font-mono focus:outline-hidden focus:border-purple-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs text-emerald-300 block mb-1 font-semibold">
                    Monthly Rent (QAR)
                  </label>
                  <input
                    type="number"
                    value={newRoomRent || ''}
                    onChange={(e) => setNewRoomRent(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm text-emerald-200 font-mono focus:outline-hidden focus:border-emerald-500"
                    placeholder="2000"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Quick Rent Presets:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setNewRoomRent(1800)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    1,800 QAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomRent(2000)}
                    className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-mono font-bold cursor-pointer"
                  >
                    2,000 QAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomRent(2500)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    2,500 QAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomRent(4000)}
                    className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    4,000 QAR (My Room)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoomRent(0);
                      setNewRoomAdvance(0);
                    }}
                    className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-xs cursor-pointer"
                  >
                    Vacant (0)
                  </button>
                </div>
              </div>

              {/* Payment for Current Month */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Initial {selectedMonth} Payment
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mark room rent as already collected for {selectedMonth}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newRoomPayCurrentMonth}
                  onChange={(e) => setNewRoomPayCurrentMonth(e.target.checked)}
                  className="h-4 w-4 rounded-md accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewRoom}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Room to Villa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: VILLA ITEMS & RECEIPTS (ITEM NAME, REASON, ATTACHMENT, SAVE IN GOOGLE DRIVE) */}
      <VillaItemReceiptModal
        isOpen={isVillaItemsModalOpen}
        onClose={() => setIsVillaItemsModalOpen(false)}
        selectedMonth={selectedMonth}
        items={villaItems}
        onAddItem={handleAddVillaItem}
        onDeleteItem={handleDeleteVillaItem}
        onUpdateDriveUrl={handleUpdateVillaItemDriveUrl}
      />
    </div>
  );
};
