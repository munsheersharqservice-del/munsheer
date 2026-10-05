export type FamilyMember = 'munsheer' | 'rubeena' | 'aifa' | 'ahlam' | 'house_maid';

export interface FamilyMemberInfo {
  id: FamilyMember;
  name: string;
  relation: string;
  avatarColor: string;
  badgeColor: string;
}

export const FAMILY_MEMBERS: Record<FamilyMember, FamilyMemberInfo> = {
  munsheer: {
    id: 'munsheer',
    name: 'Munsheer',
    relation: 'Self / Father',
    avatarColor: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  },
  rubeena: {
    id: 'rubeena',
    name: 'Rubeena',
    relation: 'Spouse / Mother',
    avatarColor: 'from-pink-500 to-rose-600',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-700',
  },
  aifa: {
    id: 'aifa',
    name: 'Aifa',
    relation: 'Daughter',
    avatarColor: 'from-purple-500 to-indigo-600',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-700',
  },
  ahlam: {
    id: 'ahlam',
    name: 'Ahlam',
    relation: 'Daughter',
    avatarColor: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
  },
  house_maid: {
    id: 'house_maid',
    name: 'House Maid',
    relation: 'Household Staff',
    avatarColor: 'from-yellow-500 to-amber-600',
    badgeColor: 'bg-yellow-950 text-yellow-300 border-yellow-700',
  },
};

export type PaymentMethod = 'cbq' | 'credit_card' | 'cash';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'cbq', label: 'CBQ (Commercial Bank of Qatar)', icon: 'Building' },
  { id: 'credit_card', label: 'Credit Card', icon: 'CreditCard' },
  { id: 'cash', label: 'Cash', icon: 'Banknote' },
];

export type IncomeCategory =
  | 'salary'
  | 'villa_profit'
  | 'rubi_salary'
  | 'loan'
  | 'other_income';

export const INCOME_CATEGORIES: { id: IncomeCategory; label: string; defaultSource?: string }[] = [
  { id: 'salary', label: 'Salary (Munsheer)', defaultSource: 'Company Payroll' },
  { id: 'villa_profit', label: 'Villa Profit', defaultSource: 'Villa 12 Rooms Master Lease' },
  { id: 'rubi_salary', label: 'Rubi Salary (Rubeena)', defaultSource: 'Employment / Service' },
  { id: 'loan', label: 'Loan / Loan Repayment Received', defaultSource: 'Personal / Bank Loan' },
  { id: 'other_income', label: 'Other Income', defaultSource: 'Freelance / Consulting' },
];

export const GOOGLE_DRIVE_DATA_FOLDER = {
  id: '1DflkGubMRjXiMJCD970nILdICKe_QvaE',
  url: 'https://drive.google.com/drive/folders/1DflkGubMRjXiMJCD970nILdICKe_QvaE?usp=drive_link',
};

export interface VehicleInfo {
  plateNumber: string;
  name: string;
  tag: string;
}

export const USER_VEHICLE: VehicleInfo = {
  plateNumber: '565816',
  name: 'Car 565816',
  tag: 'Qatar Private Vehicle',
};

export type ExpenseCategory =
  | 'food'
  | 'grocery'
  | 'maid_salary'
  | 'school_fees'
  | 'madrasa_fees'
  | 'dress'
  | 'car_565816_petrol'
  | 'car_565816_maintenance'
  | 'car_565816_insurance'
  | 'car_565816_wash'
  | 'car_565816_fines'
  | 'car_petrol'
  | 'car_maintenance'
  | 'hospital'
  | 'entertainment'
  | 'villa_maintenance'
  | 'miscellaneous'
  | 'other_expense';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; group: string }[] = [
  { id: 'car_565816_petrol', label: 'Car 565816 - Petrol (Woqod)', group: 'Car 565816' },
  { id: 'car_565816_maintenance', label: 'Car 565816 - Service & Maintenance', group: 'Car 565816' },
  { id: 'car_565816_insurance', label: 'Car 565816 - Insurance & Istimara', group: 'Car 565816' },
  { id: 'car_565816_wash', label: 'Car 565816 - Car Wash & Cleaning', group: 'Car 565816' },
  { id: 'car_565816_fines', label: 'Car 565816 - Fines & Parking', group: 'Car 565816' },
  { id: 'food', label: 'Food & Dining', group: 'Living' },
  { id: 'grocery', label: 'Grocery & Supermarket', group: 'Living' },
  { id: 'maid_salary', label: 'House Maid Salary', group: 'Household Staff' },
  { id: 'school_fees', label: 'School Fees', group: 'Education' },
  { id: 'madrasa_fees', label: 'Madrasa Fees', group: 'Education' },
  { id: 'dress', label: 'Dress & Clothes', group: 'Personal' },
  { id: 'car_petrol', label: 'Other Transport - Petrol', group: 'Transport' },
  { id: 'car_maintenance', label: 'Other Transport - Maintenance', group: 'Transport' },
  { id: 'hospital', label: 'Hospital & Medical', group: 'Health' },
  { id: 'entertainment', label: 'Entertainment & Outings', group: 'Lifestyle' },
  { id: 'villa_maintenance', label: 'Maintenance for Villa', group: 'Property' },
  { id: 'miscellaneous', label: 'Miscellaneous', group: 'General' },
  { id: 'other_expense', label: 'Other Custom Expense', group: 'General' },
];

export type TransferCategory =
  | 'transfer_to_saving'
  | 'transfer_to_india'
  | 'invested_in_trading';

export const TRANSFER_CATEGORIES: { id: TransferCategory; label: string; description: string }[] = [
  { id: 'transfer_to_saving', label: 'Transfer to Saving', description: 'Emergency fund & Fixed Deposits' },
  { id: 'transfer_to_india', label: 'Transfer to India', description: 'Remittance / Family in India (INR)' },
  { id: 'invested_in_trading', label: 'Invested in Trading', description: 'Stock Market / Trading / Portfolio' },
];

export interface DocumentAttachment {
  name: string;
  size?: number; // Size in bytes
  type?: string; // MIME type or extension
  dataUrl?: string; // Base64 or local URL preview
  driveUrl?: string; // Google Drive link or Drive ID
  uploadedAt: string; // ISO date string
}

export interface PersonalTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: IncomeCategory | ExpenseCategory | TransferCategory | string;
  amount: number;
  currency: 'QAR';
  date: string; // YYYY-MM-DD
  month: string; // JAN, FEB, MAR, OCT, etc.
  year: number;
  member: FamilyMember;
  paymentMethod: PaymentMethod;
  source?: string; // Required for income (source of funds)
  reason?: string; // Required for income & expenses (purpose / reason)
  notes?: string;
  odometerKm?: number; // Car 565816 KM mileage reading
  fuelLitres?: number; // Fuel quantity in Litres
  attachment?: DocumentAttachment;
}

export const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APRIL', 'MAY', 'JUN',
  'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// Live October 2026 transactions matching shared Cloud Firestore database
export const INITIAL_TRANSACTIONS: PersonalTransaction[] = [
  {
    id: 'tx-1790860869299',
    type: 'expense',
    category: 'madrasa_fees',
    amount: 500,
    currency: 'QAR',
    date: '2026-10-01',
    month: 'OCT',
    year: 2026,
    member: 'aifa',
    paymentMethod: 'cash',
    source: 'Fees apri mấy Jun july exam',
    reason: 'Family grocery & provisions',
  },
  {
    id: 'tx-1790860770760',
    type: 'expense',
    category: 'other_expense',
    amount: 17,
    currency: 'QAR',
    date: '2026-10-01',
    month: 'OCT',
    year: 2026,
    member: 'munsheer',
    paymentMethod: 'credit_card',
    source: 'Room 3 cleaning',
    reason: 'Family grocery & provisions',
  },
  {
    id: 'tx-1790860707167',
    type: 'expense',
    category: 'other_expense',
    amount: 13,
    currency: 'QAR',
    date: '2026-10-01',
    month: 'OCT',
    year: 2026,
    member: 'munsheer',
    paymentMethod: 'cbq',
    source: 'Room 3 cleaning',
    reason: 'Family grocery & provisions',
  },
  {
    id: 'tx-1790860510734',
    type: 'expense',
    category: 'grocery',
    amount: 7,
    currency: 'QAR',
    date: '2026-10-01',
    month: 'OCT',
    year: 2026,
    member: 'aifa',
    paymentMethod: 'cash',
    source: 'Shakes',
    reason: 'Family grocery & provisions',
  },
];

