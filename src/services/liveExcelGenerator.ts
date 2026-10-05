import * as XLSX from 'xlsx';
import { SheetTable } from '../types';
import { convertRawRowsToSheetTable, uploadFileToDriveFolder, TARGET_GOOGLE_DRIVE_FOLDER_ID } from './googleSheets';
import {
  RoomRecord,
  MONTH_KEYS,
  MonthKey,
  initialRoomsData,
  initialVillaMasterRentDetails,
  VillaMasterRentDetail,
  initialMeterReadings,
  MeterMonthlyReading,
  initialMonthlyMaintenance,
  VILLA_METERS,
  calculateProfitWithoutMyRoom,
  calculateProfitWithMyRoom,
  VillaExpenseItem,
  initialMaintenanceRecords,
} from '../data/villaDatabase';
import {
  PersonalTransaction,
  INITIAL_TRANSACTIONS,
} from '../data/personalFinanceData';

/**
 * Loads the current live 12 rooms from localStorage with fallback
 */
export function getLiveRoomsData(): RoomRecord[] {
  const saved = localStorage.getItem('villa_12_rooms_data_v4') || localStorage.getItem('villa_11_rooms_data_v3');
  let rooms: RoomRecord[] = [];
  if (saved) {
    try {
      rooms = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved rooms, using initial data', e);
      rooms = [...initialRoomsData];
    }
  } else {
    rooms = [...initialRoomsData];
  }

  // Ensure Room 11 is vacant initially if legacy FARHAN is still present
  const room11 = rooms.find((r) => String(r.roomNumber) === '11' || r.id === 'room-11');
  if (room11 && room11.name === 'FARHAN') {
    rooms = rooms.map((r) =>
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

  // Ensure Room 12 "MY ROOM" (4000 QAR/mo) is present
  const hasRoom12 = rooms.some(
    (r) =>
      r.id === 'room-12' ||
      String(r.roomNumber) === '12' ||
      r.name.toUpperCase().includes('MY ROOM')
  );

  if (!hasRoom12) {
    rooms.push({
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
  }

  return rooms;
}

/**
 * Loads current live Villa Master Rent Details (paid to landlord)
 */
export function getLiveVillaRentDetails(): Record<MonthKey, VillaMasterRentDetail> {
  const saved = localStorage.getItem('villa_master_rent_details_v4');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved villa rent details', e);
    }
  }
  return initialVillaMasterRentDetails;
}

/**
 * Loads current live Utility Meter Readings (4 Kahramaa meters with bills deleted)
 */
export function getLiveMeterReadings(): MeterMonthlyReading[] {
  const saved = localStorage.getItem('villa_meter_readings_v5');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved meter readings', e);
    }
  }
  return initialMeterReadings;
}

/**
 * Loads current live Monthly Maintenance expenses
 */
export function getLiveMonthlyMaintenance(): Record<MonthKey, number> {
  const saved = localStorage.getItem('villa_monthly_maintenance_v4');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved monthly maintenance', e);
    }
  }
  return initialMonthlyMaintenance;
}

/**
 * Loads current live Villa Itemized Expenses & Receipts
 */
export function getLiveVillaItems(): VillaExpenseItem[] {
  const saved = localStorage.getItem('villa_items_receipts_v1');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved villa items', e);
    }
  }
  return [];
}

/**
 * Loads current live Personal & Family Finance Transactions (Starting October 2026 fresh)
 */
export function getLivePersonalTransactions(): PersonalTransaction[] {
  const saved = localStorage.getItem('personal_finance_txs_october_v3');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved personal transactions', e);
    }
  }
  return INITIAL_TRANSACTIONS;
}

export interface LiveWorkbookOptions {
  includeVillaMaster?: boolean;
  includeVillaReceipts?: boolean;
  includeMeters?: boolean;
  includePersonalFinance?: boolean;
  includeCarExpenses?: boolean;
  includeAuditSummary?: boolean;
  customSheets?: SheetTable[];
}

/**
 * Builds the complete multi-sheet live Excel Workbook using real-time live data
 */
export function buildLiveExcelWorkbook(options: LiveWorkbookOptions = {}): XLSX.WorkBook {
  const {
    includeVillaMaster = true,
    includeVillaReceipts = true,
    includeMeters = true,
    includePersonalFinance = true,
    includeCarExpenses = true,
    includeAuditSummary = true,
    customSheets = [],
  } = options;

  const wb = XLSX.utils.book_new();

  // Load all live data sources
  const rooms = getLiveRoomsData();
  const rentDetails = getLiveVillaRentDetails();
  const meterReadings = getLiveMeterReadings();
  const monthlyMaintenance = getLiveMonthlyMaintenance();
  const villaItems = getLiveVillaItems();
  const personalTxs = getLivePersonalTransactions();

  // Compute monthly calculations for summary rows
  const monthlyCalcs: Record<
    MonthKey,
    {
      totalCollected: number;
      tenantsCollected: number;
      myRoomCollected: number;
      masterRent: number;
      electricityBill: number;
      waterBill: number;
      maintenanceCost: number;
      totalExpenses: number;
      profitWithoutMyRoom: number;
      profitWithMyRoom: number;
    }
  > = {} as any;

  let yearTotalCollected = 0;
  let yearTenantsCollected = 0;
  let yearMyRoomCollected = 0;
  let yearMasterRent = 0;
  let yearElectricity = 0;
  let yearWater = 0;
  let yearMaintenance = 0;
  let totalAdvanceHeld = 0;

  rooms.forEach((r) => {
    totalAdvanceHeld += r.advance || 0;
  });

  MONTH_KEYS.forEach((m) => {
    let monthTotal = 0;
    let monthTenants = 0;
    let monthMyRoom = 0;

    rooms.forEach((r) => {
      const p = r.monthlyPayments[m] || 0;
      monthTotal += p;
      const isMyRoom =
        r.id === 'room-12' ||
        String(r.roomNumber) === '12' ||
        r.name.toUpperCase().includes('MY ROOM');
      if (isMyRoom) {
        monthMyRoom += p;
      } else {
        monthTenants += p;
      }
    });

    const mRent = rentDetails[m]?.amount ?? 17000;
    const elecBill = meterReadings
      .filter((mr) => mr.month === m && ['148964', '148963', '48073'].includes(mr.meterNumber))
      .reduce((sum, mr) => sum + (mr.billAmountQAR || 0), 0);
    const waterBill = meterReadings
      .filter((mr) => mr.month === m && mr.meterNumber === '90978')
      .reduce((sum, mr) => sum + (mr.billAmountQAR || 0), 0);
    const maintCost = monthlyMaintenance[m] || 0;
    const totalExpenses = mRent + elecBill + waterBill + maintCost;
    const profitWithoutMyRoom = calculateProfitWithoutMyRoom(monthTenants, mRent);
    const profitWithMyRoom = calculateProfitWithMyRoom(monthTotal, mRent);

    monthlyCalcs[m] = {
      totalCollected: monthTotal,
      tenantsCollected: monthTenants,
      myRoomCollected: monthMyRoom,
      masterRent: mRent,
      electricityBill: elecBill,
      waterBill: waterBill,
      maintenanceCost: maintCost,
      totalExpenses,
      profitWithoutMyRoom,
      profitWithMyRoom,
    };

    yearTotalCollected += monthTotal;
    yearTenantsCollected += monthTenants;
    yearMyRoomCollected += monthMyRoom;
    yearMasterRent += mRent;
    yearElectricity += elecBill;
    yearWater += waterBill;
    yearMaintenance += maintCost;
  });

  const yearTotalExpenses = yearMasterRent + yearElectricity + yearWater + yearMaintenance;
  const yearProfitWithoutMyRoom = yearTenantsCollected - yearMasterRent;
  const yearProfitWithMyRoom = yearTotalCollected - yearMasterRent;

  // -------------------------------------------------------------
  // TAB 1: 12 ROOMS RENT MASTER SHEET
  // -------------------------------------------------------------
  if (includeVillaMaster) {
    const masterHeaders = [
      'ROOM',
      'TENANT NAME',
      'MOBILE NO',
      'ADVANCE (QAR)',
      'MONTHLY RENT (QAR)',
      ...MONTH_KEYS,
      'TOTAL PAID (QAR)',
      'BALANCE DUE (QAR)',
      'PAYMENT STATUS',
    ];

    const masterRows: any[][] = [];

    rooms.forEach((r) => {
      let rowTotalPaid = 0;
      let rowExpected = 0;

      MONTH_KEYS.forEach((m) => {
        const paid = r.monthlyPayments[m] || 0;
        rowTotalPaid += paid;
        if (paid > 0 || r.monthlyRent > 0) {
          rowExpected += r.monthlyRent;
        }
      });

      const balanceDue = Math.max(0, rowExpected - rowTotalPaid);
      let status = 'PAID IN FULL';
      if (r.monthlyRent === 0) {
        status = 'EMPTY / VACANT';
      } else if (balanceDue > 0 && rowTotalPaid > 0) {
        status = 'PARTIAL / PENDING';
      } else if (rowTotalPaid === 0 && rowExpected > 0) {
        status = 'UNPAID / OVERDUE';
      }

      masterRows.push([
        r.roomNumber,
        r.name,
        r.mobNo || '',
        r.advance || 0,
        r.monthlyRent || 0,
        ...MONTH_KEYS.map((m) => r.monthlyPayments[m] || 0),
        rowTotalPaid,
        balanceDue,
        status,
      ]);
    });

    // Summary Blank Separator
    masterRows.push([]);

    // Executive Calculation Rows
    masterRows.push([
      'TOTAL RECEIVED (COLLECTIONS)',
      'All 12 Rooms Combined',
      '',
      totalAdvanceHeld,
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].totalCollected),
      yearTotalCollected,
      0,
      'LIVE REVENUE',
    ]);

    masterRows.push([
      '12. MY ROOM CONTRIBUTION',
      'Self-Occupied (4,000 QAR/mo)',
      '',
      0,
      4000,
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].myRoomCollected),
      yearMyRoomCollected,
      0,
      'MY ROOM',
    ]);

    masterRows.push([
      'TENANTS ONLY COLLECTIONS',
      'Excluding My Room 12',
      '',
      totalAdvanceHeld,
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].tenantsCollected),
      yearTenantsCollected,
      0,
      'TENANT RENT',
    ]);

    masterRows.push([
      'TOTAL VILLA RENT (LANDLORD CONTRACT)',
      'Master Rent Paid to Landlord',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].masterRent),
      yearMasterRent,
      0,
      'LANDLORD RENT',
    ]);

    masterRows.push([
      'ELECTRICITY (3 METERS: 148964, 148963, 48073)',
      'Kahramaa Electricity Bills',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].electricityBill),
      yearElectricity,
      0,
      'UTILITIES',
    ]);

    masterRows.push([
      'WATER (METER 90978)',
      'Kahramaa Water Bills',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].waterBill),
      yearWater,
      0,
      'UTILITIES',
    ]);

    masterRows.push([
      'MAINTENANCE EXPENSES',
      'Repairs, Plumbing, AC & Paint',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].maintenanceCost),
      yearMaintenance,
      0,
      'MAINTENANCE',
    ]);

    masterRows.push([
      'TOTAL VILLA EXPENSES',
      'Landlord Rent + Utilities + Maintenance',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].totalExpenses),
      yearTotalExpenses,
      0,
      'ALL EXPENSES',
    ]);

    masterRows.push([
      '1. NET PROFIT (WITHOUT MY ROOM)',
      'Formula: Tenants Received - Landlord Rent',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].profitWithoutMyRoom),
      yearProfitWithoutMyRoom,
      0,
      'PROFIT 1',
    ]);

    masterRows.push([
      '2. NET PROFIT (WITH MY ROOM 4,000)',
      'Formula: Total Received - Landlord Rent',
      '',
      '',
      '',
      ...MONTH_KEYS.map((m) => monthlyCalcs[m].profitWithMyRoom),
      yearProfitWithMyRoom,
      0,
      'PROFIT 2',
    ]);

    const wsMaster = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterRows]);
    // Set column widths
    wsMaster['!cols'] = [
      { wch: 10 }, // ROOM
      { wch: 22 }, // NAME
      { wch: 14 }, // MOB NO
      { wch: 16 }, // ADVANCE
      { wch: 18 }, // RENT
      ...MONTH_KEYS.map(() => ({ wch: 10 })),
      { wch: 18 }, // TOTAL PAID
      { wch: 18 }, // BALANCE DUE
      { wch: 20 }, // STATUS
    ];
    XLSX.utils.book_append_sheet(wb, wsMaster, '12_Rooms_Rent_Master');
  }

  // -------------------------------------------------------------
  // TAB 2: VILLA EXPENSES & RECEIPTS
  // -------------------------------------------------------------
  if (includeVillaReceipts) {
    const expenseHeaders = [
      'Record ID',
      'Month',
      'Date',
      'Item Name',
      'Category',
      'Reason / Description',
      'Contractor',
      'Amount (QAR)',
      'Receipt Attachment Status',
      'Google Drive URL',
    ];

    const expenseRows: any[][] = [];

    // Add itemized items
    villaItems.forEach((item) => {
      expenseRows.push([
        item.id,
        item.month,
        item.date,
        item.itemName,
        item.category,
        item.reason,
        '',
        item.amount,
        item.attachment ? `Attached: ${item.attachment.name}` : 'No receipt',
        item.attachment?.driveUrl || '',
      ]);
    });

    // Add initial maintenance records if villaItems is empty or as supplement
    if (expenseRows.length === 0) {
      initialMaintenanceRecords.forEach((rec) => {
        expenseRows.push([
          rec.id,
          rec.month,
          rec.date,
          rec.description,
          rec.category,
          rec.roomNumber === 'Villa General' ? 'Villa General' : `Room ${rec.roomNumber}`,
          rec.contractor,
          rec.amount,
          'Logged',
          '',
        ]);
      });
    }

    const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
    wsExpenses['!cols'] = [
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 28 },
      { wch: 18 },
      { wch: 32 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Villa_Expenses_&_Receipts');
  }

  // -------------------------------------------------------------
  // TAB 3: KAHRAMAA 4 UTILITY METERS
  // -------------------------------------------------------------
  if (includeMeters) {
    const meterHeaders = [
      'Meter Number',
      'Type',
      'Meter Label / Purpose',
      'Month',
      'Previous Reading',
      'Current Reading',
      'Units Consumed (kWh/m³)',
      'Bill Amount (QAR)',
      'Payment Status',
    ];

    const meterRows = meterReadings.map((mr) => {
      const def = VILLA_METERS.find((m) => m.meterNumber === mr.meterNumber);
      return [
        mr.meterNumber,
        def?.type || 'Electricity',
        def?.label || '',
        mr.month,
        mr.previousReading,
        mr.currentReading,
        mr.unitsConsumed,
        mr.billAmountQAR,
        mr.status,
      ];
    });

    const wsMeters = XLSX.utils.aoa_to_sheet([meterHeaders, ...meterRows]);
    wsMeters['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 28 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMeters, 'Kahramaa_4_Utility_Meters');
  }

  // -------------------------------------------------------------
  // TAB 4: PERSONAL & FAMILY FINANCE
  // -------------------------------------------------------------
  if (includePersonalFinance) {
    const personalHeaders = [
      'Transaction ID',
      'Date',
      'Month',
      'Year',
      'Description / Purpose',
      'Category',
      'Family Member',
      'Type (Income / Expense / Transfer)',
      'Payment Method',
      'Amount (QAR)',
      'Source / Notes',
    ];

    const personalRows = personalTxs.map((tx) => [
      tx.id,
      tx.date,
      tx.month,
      tx.year,
      tx.reason || tx.source || tx.category,
      tx.category,
      tx.member,
      tx.type.toUpperCase(),
      tx.paymentMethod,
      tx.amount,
      tx.notes || tx.source || '',
    ]);

    const wsPersonal = XLSX.utils.aoa_to_sheet([personalHeaders, ...personalRows]);
    wsPersonal['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPersonal, 'Personal_&_Family_Finance');
  }

  // -------------------------------------------------------------
  // TAB 5: CAR 565816 EXPENSES
  // -------------------------------------------------------------
  if (includeCarExpenses) {
    const carHeaders = [
      'Date',
      'Month',
      'Expense Type / Reason',
      'Odometer (KM)',
      'Fuel (Litres)',
      'Family Member',
      'Payment Method',
      'Amount (QAR)',
      'Notes',
    ];

    const carRows = personalTxs
      .filter((tx) => {
        const cat = String(tx.category).toLowerCase();
        const reason = String(tx.reason || '').toLowerCase();
        const notes = String(tx.notes || '').toLowerCase();
        return (
          cat.includes('car') ||
          cat.includes('petrol') ||
          reason.includes('car') ||
          reason.includes('565816') ||
          reason.includes('petrol') ||
          reason.includes('fuel') ||
          notes.includes('car') ||
          notes.includes('565816')
        );
      })
      .map((tx) => [
        tx.date,
        tx.month,
        tx.reason || tx.category,
        tx.odometerKm !== undefined && tx.odometerKm !== null ? `${tx.odometerKm} KM` : '',
        tx.fuelLitres !== undefined && tx.fuelLitres !== null ? `${tx.fuelLitres} L` : '',
        tx.member,
        tx.paymentMethod,
        tx.amount,
        tx.notes || 'Car 565816',
      ]);

    const wsCar = XLSX.utils.aoa_to_sheet([carHeaders, ...carRows]);
    wsCar['!cols'] = [
      { wch: 14 },
      { wch: 10 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCar, 'Car_565816_Expenses');
  }

  // -------------------------------------------------------------
  // TAB 6: EXECUTIVE FINANCIAL AUDIT & KPIS
  // -------------------------------------------------------------
  if (includeAuditSummary) {
    const summaryHeaders = ['Financial Indicator / KPI', 'Value / Status', 'Unit / Currency', 'Description'];
    const summaryRows: any[][] = [
      ['Report Generated At', new Date().toLocaleString(), 'Timestamp', 'Live Excel Snapshot'],
      ['Total Villa Rooms Configured', rooms.length, 'Rooms', 'Rooms 1-11 plus Room 12 MY ROOM'],
      ['Total Active Tenants Advance Held', totalAdvanceHeld, 'QAR', 'Deposits held from tenants'],
      ['Year Total Rent Received (All 12 Rooms)', yearTotalCollected, 'QAR', 'Tenants collections + Room 12'],
      ['Room 12 MY ROOM Contribution', yearMyRoomCollected, 'QAR', '4,000 QAR/mo self occupied room'],
      ['Tenants Only Collections', yearTenantsCollected, 'QAR', 'Excluding Room 12'],
      ['Landlord Contract Rent Paid', yearMasterRent, 'QAR', 'Total master rent paid to villa landlord'],
      ['Total Kahramaa Electricity Paid (3 Meters)', yearElectricity, 'QAR', 'Meters 148964, 148963, 48073'],
      ['Total Kahramaa Water Paid (Meter 90978)', yearWater, 'QAR', 'Meter 90978'],
      ['Total Maintenance & Repair Expenses', yearMaintenance, 'QAR', 'Plumbing, AC service, electrical'],
      ['Total Villa Operating Expenses', yearTotalExpenses, 'QAR', 'Landlord rent + Utilities + Maintenance'],
      ['1. Net Villa Profit (Without My Room)', yearProfitWithoutMyRoom, 'QAR', 'Tenants collections - Landlord rent'],
      ['2. Net Villa Profit (With My Room 4,000)', yearProfitWithMyRoom, 'QAR', 'All collections - Landlord rent'],
      ['Personal Finance Total Income', personalTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), 'QAR', 'Salary, side income, profits'],
      ['Personal Finance Total Expenses', personalTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), 'QAR', 'Family expenses, living, school fees'],
      ['Target Google Drive Folder', TARGET_GOOGLE_DRIVE_FOLDER_ID, 'Drive ID', 'Direct backup folder ID'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    wsSummary['!cols'] = [
      { wch: 38 },
      { wch: 25 },
      { wch: 16 },
      { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Financial_Summary');
  }

  // Append any custom user created sheets
  if (customSheets && customSheets.length > 0) {
    customSheets.forEach((sheet) => {
      const headers = sheet.rawHeaders;
      const rows = sheet.rows.map((r) => headers.map((h) => r[h] ?? ''));
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel 31 char sheet limit
    });
  }

  return wb;
}

/**
 * Downloads the full Live Excel Workbook directly to user's computer/device
 */
export function exportLiveExcelFile(
  fileName: string = 'MUNSHEER_FINANCIAL_LIVE_DATA_2026.xlsx',
  options: LiveWorkbookOptions = {}
): { fileName: string; blob: Blob } {
  const safeName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  const wb = buildLiveExcelWorkbook(options);

  // Generate binary output
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName: safeName, blob };
}

/**
 * Uploads the generated Live Excel Workbook directly to the user's Google Drive folder
 */
export async function uploadLiveExcelToDrive(
  accessToken: string,
  fileName: string = `MUNSHEER_LIVE_EXCEL_${new Date().toISOString().slice(0, 10)}.xlsx`,
  options: LiveWorkbookOptions = {}
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const safeName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  const wb = buildLiveExcelWorkbook(options);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return await uploadFileToDriveFolder(
    safeName,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    blob,
    accessToken,
    TARGET_GOOGLE_DRIVE_FOLDER_ID
  );
}

/**
 * Generates the fresh clean October 2026 Database Workbook
 * with personal finance tracker cleared for October,
 * electricity and water bills deleted (zeroed),
 * and active 12 rooms master rent ledger.
 */
export function buildOctoberDatabaseWorkbook(): XLSX.WorkBook {
  return buildLiveExcelWorkbook({
    includeVillaMaster: true,
    includeVillaReceipts: true,
    includeMeters: true,
    includePersonalFinance: true,
    includeCarExpenses: true,
    includeAuditSummary: true,
  });
}

/**
 * Uploads the clean October 2026 Database Sheet directly to Google Drive folder
 */
export async function uploadOctoberDatabaseToDrive(
  accessToken: string,
  fileName: string = 'MUNSHEER_DATABASE_STARTING_OCTOBER_2026.xlsx'
): Promise<{ id: string; name: string; webViewLink?: string }> {
  return await uploadLiveExcelToDrive(accessToken, fileName, {
    includeVillaMaster: true,
    includeVillaReceipts: true,
    includeMeters: true,
    includePersonalFinance: true,
    includeCarExpenses: true,
    includeAuditSummary: true,
  });
}

/**
 * Converts all live datasets into an array of SheetTable objects
 * so the application's TableView Grid, Cards, and Database Views immediately display the live sheets!
 */
export function getLiveSheetTables(options: LiveWorkbookOptions = {}): SheetTable[] {
  const wb = buildLiveExcelWorkbook(options);
  const tables: SheetTable[] = [];

  for (let i = 0; i < wb.SheetNames.length; i++) {
    const sheetName = wb.SheetNames[i];
    const worksheet = wb.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (rawRows.length > 0) {
      const table = convertRawRowsToSheetTable(`live_sheet_${i}`, sheetName, rawRows);
      tables.push(table);
    }
  }

  return tables;
}

/**
 * Creates a brand new custom sheet table with user specified columns
 */
export function createCustomSheetTable(
  sheetName: string,
  headers: string[],
  initialRows: any[][] = []
): SheetTable {
  const safeHeaders = headers.length > 0 ? headers : ['Item', 'Amount', 'Date', 'Notes'];
  const allRows = [safeHeaders, ...initialRows];
  return convertRawRowsToSheetTable(`custom_${Date.now()}`, sheetName || 'New Sheet', allRows);
}
