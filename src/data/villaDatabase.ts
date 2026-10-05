import { SheetTable } from '../types';
import { convertRawRowsToSheetTable } from '../services/googleSheets';

export interface RoomRecord {
  id: string;
  roomNumber: number | string;
  name: string;
  mobNo: string;
  advance: number;
  monthlyRent: number;
  monthlyPayments: Record<string, number>; // e.g. { 'FEB': 2550, 'MAR': 2550, ... }
  color: string;
  notes?: string;
}

export interface MaintenanceExpense {
  id: string;
  month: string;
  date: string;
  roomNumber?: number | string; // 1-11 or "Villa General"
  category: 'AC Service' | 'Plumbing' | 'Electrical' | 'Carpentry' | 'Painting' | 'Electricity Bill' | 'Water Bill' | 'General Repair';
  description: string;
  contractor: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Scheduled';
}

export interface VillaExpenseItem {
  id: string;
  month: MonthKey;
  date: string;
  itemName: string; // Item Name
  reason: string; // Reason
  amount: number;
  category: 'Maintenance' | 'Plumbing' | 'AC Service' | 'Electrical' | 'Landlord Rent' | 'Utility' | 'Other';
  notes?: string;
  attachment?: {
    name: string;
    size?: number;
    type?: string;
    dataUrl?: string;
    driveUrl?: string;
    uploadedAt: string;
  };
}

export const MONTH_KEYS = [
  'FEB',
  'MAR',
  'APRIL',
  'MAY',
  'JUN',
  'JULY',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

// Exact 11 Rooms from User's Excel Sheet
export const initialRoomsData: RoomRecord[] = [
  {
    id: 'room-1',
    roomNumber: 1,
    name: 'SHAKEEB',
    mobNo: '30013381',
    advance: 1250,
    monthlyRent: 2550,
    color: '#eab308', // Yellow
    monthlyPayments: {
      FEB: 2550,
      MAR: 2550,
      APRIL: 2550,
      MAY: 2550,
      JUN: 2550,
      JULY: 2550,
      AUG: 2550,
      SEP: 2550,
      OCT: 2550,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-2',
    roomNumber: 2,
    name: 'SAFEER',
    mobNo: '66801779',
    advance: 0,
    monthlyRent: 1800,
    color: '#f97316', // Orange
    monthlyPayments: {
      FEB: 1800,
      MAR: 1800,
      APRIL: 1800,
      MAY: 1800,
      JUN: 1800,
      JULY: 1800,
      AUG: 1800,
      SEP: 1800,
      OCT: 1800,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-3',
    roomNumber: 3,
    name: 'TENANT 3',
    mobNo: '50192834',
    advance: 500,
    monthlyRent: 2400,
    color: '#22c55e', // Green
    monthlyPayments: {
      FEB: 2500,
      MAR: 2500,
      APRIL: 2500,
      MAY: 2400,
      JUN: 2400,
      JULY: 2400,
      AUG: 2400,
      SEP: 2400,
      OCT: 2400,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-4',
    roomNumber: 4,
    name: 'ANAS',
    mobNo: '77220553',
    advance: 500,
    monthlyRent: 2800,
    color: '#fb923c', // Peach
    monthlyPayments: {
      FEB: 2800,
      MAR: 2800,
      APRIL: 2800,
      MAY: 2800,
      JUN: 2800,
      JULY: 2800,
      AUG: 2800,
      SEP: 2800,
      OCT: 2800,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-5',
    roomNumber: 5,
    name: 'MAHMOOD',
    mobNo: '31303420',
    advance: 0,
    monthlyRent: 2800,
    color: '#38bdf8', // Sky blue
    monthlyPayments: {
      FEB: 2800,
      MAR: 2800,
      APRIL: 2800,
      MAY: 2800,
      JUN: 2800,
      JULY: 2800,
      AUG: 2800,
      SEP: 2800,
      OCT: 1200,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-6',
    roomNumber: 6,
    name: 'TENANT 6',
    mobNo: '70441920',
    advance: 1000,
    monthlyRent: 2000,
    color: '#60a5fa', // Light blue
    monthlyPayments: {
      FEB: 2500,
      MAR: 2500,
      APRIL: 2400,
      MAY: 1500,
      JUN: 2300,
      JULY: 0,
      AUG: 2000,
      SEP: 2000,
      OCT: 2000,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-7',
    roomNumber: 7,
    name: 'TENANT 7',
    mobNo: '33918204',
    advance: 0,
    monthlyRent: 3500,
    color: '#93c5fd', // Ice blue
    monthlyPayments: {
      FEB: 4500,
      MAR: 4500,
      APRIL: 3500,
      MAY: 3500,
      JUN: 3500,
      JULY: 3500,
      AUG: 3500,
      SEP: 3500,
      OCT: 3500,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-8',
    roomNumber: 8,
    name: 'AJMAL',
    mobNo: '33317047',
    advance: 2000,
    monthlyRent: 2700,
    color: '#d946ef', // Magenta/Pink
    monthlyPayments: {
      FEB: 2700,
      MAR: 2700,
      APRIL: 2700,
      MAY: 2700,
      JUN: 2700,
      JULY: 2700,
      AUG: 2700,
      SEP: 2700,
      OCT: 2700,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-9',
    roomNumber: 9,
    name: 'NAJEEB',
    mobNo: '55322506',
    advance: 500,
    monthlyRent: 2600,
    color: '#a3e635', // Lime
    monthlyPayments: {
      FEB: 2700,
      MAR: 2700,
      APRIL: 2700,
      MAY: 2700,
      JUN: 2700,
      JULY: 2700,
      AUG: 2700,
      SEP: 2600,
      OCT: 2600,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-10',
    roomNumber: 10,
    name: 'KUNJAVA',
    mobNo: '66129844',
    advance: 0,
    monthlyRent: 1000,
    color: '#fde047', // Pale yellow
    monthlyPayments: {
      FEB: 0,
      MAR: 0,
      APRIL: 0,
      MAY: 0,
      JUN: 0,
      JULY: 1000,
      AUG: 1000,
      SEP: 1000,
      OCT: 1000,
      NOV: 0,
      DEC: 0,
    },
  },
  {
    id: 'room-11',
    roomNumber: 11,
    name: 'EMPTY (Vacant)',
    mobNo: '',
    advance: 0,
    monthlyRent: 0,
    color: '#94a3b8', // Muted slate for vacant room
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
  },
  {
    id: 'room-12',
    roomNumber: 12,
    name: 'MY ROOM',
    mobNo: '',
    advance: 0,
    monthlyRent: 4000,
    color: '#0284c7', // Sky cyan for self / My Room
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
  },
];

// Villa Master Lease Rent (Rent paid to Landlord by Month)
export const initialVillaMasterRent: Record<string, number> = {
  FEB: 22000,
  MAR: 24000,
  APRIL: 24000,
  MAY: 24000,
  JUN: 24000,
  JULY: 24000,
  AUG: 22000,
  SEP: 22000,
  OCT: 22000,
  NOV: 22000,
  DEC: 22000,
};

// Payment status for Total Villa Master Rent paid to landlord
export type RentPaymentStatus = 'Paid' | 'Unpaid' | 'Partial Paid';

export interface VillaMasterRentDetail {
  month: MonthKey;
  amount: number; // Master rent agreed with landlord (QAR)
  paidAmount: number; // Actual amount paid to landlord (QAR)
  status: RentPaymentStatus;
  notes?: string;
}

export const initialVillaMasterRentDetails: Record<MonthKey, VillaMasterRentDetail> = {
  FEB: { month: 'FEB', amount: 22000, paidAmount: 22000, status: 'Paid', notes: 'Paid via Landlord Cheque' },
  MAR: { month: 'MAR', amount: 24000, paidAmount: 24000, status: 'Paid', notes: 'Paid in Full' },
  APRIL: { month: 'APRIL', amount: 24000, paidAmount: 24000, status: 'Paid', notes: 'Paid in Full' },
  MAY: { month: 'MAY', amount: 24000, paidAmount: 24000, status: 'Paid', notes: 'Paid in Full' },
  JUN: { month: 'JUN', amount: 24000, paidAmount: 24000, status: 'Paid', notes: 'Paid in Full' },
  JULY: { month: 'JULY', amount: 24000, paidAmount: 24000, status: 'Paid', notes: 'Paid in Full' },
  AUG: { month: 'AUG', amount: 22000, paidAmount: 22000, status: 'Paid', notes: 'Paid in Full' },
  SEP: { month: 'SEP', amount: 22000, paidAmount: 22000, status: 'Paid', notes: 'Paid in Full' },
  OCT: { month: 'OCT', amount: 22000, paidAmount: 11000, status: 'Partial Paid', notes: 'Partial payment made, balance due' },
  NOV: { month: 'NOV', amount: 22000, paidAmount: 0, status: 'Unpaid', notes: 'Upcoming' },
  DEC: { month: 'DEC', amount: 22000, paidAmount: 0, status: 'Unpaid', notes: 'Upcoming' },
};

// 4 Exact Kahramaa Utility Meters: 3 Electricity & 1 Water
// Electricity: 148964, 148963, 48073 | Water: 90978
export interface UtilityMeter {
  meterNumber: string;
  type: 'Electricity' | 'Water';
  label: string;
  badgeColor: string;
}

export const VILLA_METERS: UtilityMeter[] = [
  { meterNumber: '148964', type: 'Electricity', label: 'Electricity Meter 1', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { meterNumber: '148963', type: 'Electricity', label: 'Electricity Meter 2', badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { meterNumber: '48073', type: 'Electricity', label: 'Electricity Meter 3', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { meterNumber: '90978', type: 'Water', label: 'Water Meter', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

export interface MeterMonthlyReading {
  id: string;
  meterNumber: string;
  month: MonthKey;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  billAmountQAR: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  invoiceNo?: string;
}

export const initialMeterReadings: MeterMonthlyReading[] = MONTH_KEYS.flatMap((month) => [
  { id: `mr-${month.toLowerCase()}-1`, meterNumber: '148964', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
  { id: `mr-${month.toLowerCase()}-2`, meterNumber: '148963', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
  { id: `mr-${month.toLowerCase()}-3`, meterNumber: '48073', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
  { id: `mr-${month.toLowerCase()}-4`, meterNumber: '90978', month, previousReading: 0, currentReading: 0, unitsConsumed: 0, billAmountQAR: 0, status: 'Unpaid' },
]);

// Initial Monthly Maintenance record (editable by month)
export const initialMonthlyMaintenance: Record<MonthKey, number> = {
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
};

// My Room valuation credit per month
export const initialMyRoomCredit: Record<string, number> = {
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
};

// Initial Maintenance Records - Zeroed out as requested ("maintanance make zero")
export const initialMaintenanceRecords: MaintenanceExpense[] = [];

// Core calculation: received - total rent = profit
export function calculateProfit(received: number, totalRent: number): number {
  return (received || 0) - (totalRent || 0);
}

// Profit 1: Without My Room Rent (Tenants Collections - Villa Master Rent)
export function calculateProfitWithoutMyRoom(tenantsReceived: number, totalRent: number): number {
  return (tenantsReceived || 0) - (totalRent || 0);
}

// Profit 2: With My Room Rent ((Tenants Collections + My Room Rent) - Villa Master Rent)
export function calculateProfitWithMyRoom(totalReceived: number, totalRent: number): number {
  return (totalReceived || 0) - (totalRent || 0);
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return '0';
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatQAR(amount: number | null | undefined, hideZero = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'QAR 0';
  if (amount === 0) return hideZero ? '-' : 'QAR 0';
  const isNeg = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return isNeg ? `-QAR ${absFormatted}` : `QAR ${absFormatted}`;
}

export function parseNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).replace(/[\$,QARqarQRqrر\.ق]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function calculateProfitAndExpenses(
  rentVal: any,
  maintVal: any,
  elecVal: any,
  waterVal: any
): { totalExpenses: number; totalProfit: number; profitMargin: number } {
  const rent = parseNumber(rentVal);
  const maint = parseNumber(maintVal);
  const elec = parseNumber(elecVal);
  const water = parseNumber(waterVal);

  const totalExpenses = maint + elec + water;
  const totalProfit = rent - totalExpenses;
  const profitMargin = rent > 0 ? (totalProfit / rent) * 100 : 0;

  return { totalExpenses, totalProfit, profitMargin };
}

// Convert Rooms Data to Master SheetTable matching the exact Excel screenshot!
export function generateMasterSheetTable(rooms: RoomRecord[]): SheetTable {
  const headers = [
    'ROOM',
    'NAME',
    'MOB NO',
    'ADVANCE',
    'RENT',
    'FEB',
    'MAR',
    'APRIL',
    'MAY',
    'JUN',
    'JULY',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
    'TOTAL PAID',
    'BALANCE DUE',
  ];

  const rawRows = [headers];

  rooms.forEach((r) => {
    let totalPaid = 0;
    let expectedPaid = 0;

    MONTH_KEYS.forEach((m) => {
      const paid = r.monthlyPayments[m] || 0;
      totalPaid += paid;
      if (paid > 0 || r.monthlyRent > 0) {
        // active month
        expectedPaid += r.monthlyRent;
      }
    });

    const balanceDue = Math.max(0, expectedPaid - totalPaid);

    rawRows.push([
      String(r.roomNumber),
      r.name || '',
      r.mobNo || '',
      r.advance > 0 ? String(r.advance) : '',
      String(r.monthlyRent),
      String(r.monthlyPayments['FEB'] || 0),
      String(r.monthlyPayments['MAR'] || 0),
      String(r.monthlyPayments['APRIL'] || 0),
      String(r.monthlyPayments['MAY'] || 0),
      String(r.monthlyPayments['JUN'] || 0),
      String(r.monthlyPayments['JULY'] || 0),
      String(r.monthlyPayments['AUG'] || 0),
      String(r.monthlyPayments['SEP'] || 0),
      String(r.monthlyPayments['OCT'] || 0),
      String(r.monthlyPayments['NOV'] || 0),
      String(r.monthlyPayments['DEC'] || 0),
      String(totalPaid),
      balanceDue > 0 ? String(balanceDue) : '0',
    ]);
  });

  return convertRawRowsToSheetTable('master_rooms_sheet', '11 Rooms Rent Master Sheet', rawRows);
}

export function generateMaintenanceSheetTable(records: MaintenanceExpense[]): SheetTable {
  const headers = ['Record ID', 'Month', 'Date', 'Room / Area', 'Category', 'Description', 'Contractor', 'Amount', 'Status'];
  const rawRows = [headers];

  records.forEach((rec) => {
    rawRows.push([
      rec.id,
      rec.month,
      rec.date,
      rec.roomNumber === 'Villa General' ? 'Villa General' : `Room ${rec.roomNumber}`,
      rec.category,
      rec.description,
      rec.contractor,
      String(rec.amount),
      rec.status,
    ]);
  });

  return convertRawRowsToSheetTable('maintenance_table', 'Maintenance & Utility Expenses', rawRows);
}

export const villaTables: SheetTable[] = [
  generateMasterSheetTable(initialRoomsData),
  generateMaintenanceSheetTable(initialMaintenanceRecords),
];
