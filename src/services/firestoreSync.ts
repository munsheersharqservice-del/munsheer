import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth } from './firebaseAuth';
import { RoomRecord, initialRoomsData, initialMeterReadings, MeterMonthlyReading, initialMonthlyMaintenance, initialVillaMasterRentDetails, VillaMasterRentDetail, VillaExpenseItem, MonthKey } from '../data/villaDatabase';
import { PersonalTransaction } from '../data/personalFinanceData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth;
  const currentUser = currentAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface GlobalDatabaseData {
  rooms: RoomRecord[];
  transactions: PersonalTransaction[];
  meterReadings: MeterMonthlyReading[];
  villaItems: VillaExpenseItem[];
  monthlyMaintenance: Record<string, number>;
  villaMasterRentDetails: Record<string, VillaMasterRentDetail>;
  lastUpdated: string;
  updatedByDevice?: string;
  version: number;
}

let app: any = null;
let firestoreDb: Firestore | null = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const databaseId = firebaseConfig.firestoreDatabaseId || undefined;
    firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
} catch (err) {
  console.warn('Firestore initialization warning:', err);
}

export const db = firestoreDb;

// Test connection on boot as mandated by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  const testPath = 'global_database_state/connection_test';
  try {
    await getDocFromServer(doc(db, 'global_database_state', 'connection_test'));
    return true;
  } catch (error: any) {
    // If document doesn't exist, connection is still working
    if (error?.code === 'not-found' || error?.message?.includes('not found')) {
      return true;
    }
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, testPath);
    }
    console.log('Firestore connection check:', error?.message || error);
    return false;
  }
}

// Dynamic Database Document Selection & Profiles
export function getActiveDatabaseDocId(): string {
  return localStorage.getItem('app_active_database_doc') || 'munsheer_master_db';
}

export function setActiveDatabaseDocId(docId: string): void {
  const cleanId = docId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  localStorage.setItem('app_active_database_doc', cleanId || 'munsheer_master_db');
  window.dispatchEvent(new CustomEvent('app_database_doc_changed', { detail: { docId: cleanId } }));
}

export const PRESET_DATABASE_PROFILES = [
  {
    id: 'munsheer_master_db',
    name: 'Primary Live Master Database',
    badge: 'Production Master',
    description: 'Active shared database with live 2-way real-time sync across mobile phone, PC, and tablet.',
    isDefault: true,
  },
  {
    id: 'munsheer_master_backup',
    name: 'Secondary Backup & Archive DB',
    badge: 'Cloud Backup',
    description: 'Cloud backup snapshot storage for historical audit records and safety backups.',
    isDefault: false,
  },
  {
    id: 'munsheer_test_db',
    name: 'Testing Sandbox Database',
    badge: 'Sandbox / Test',
    description: 'Isolated test environment for verifying changes without affecting live production data.',
    isDefault: false,
  },
];

// Device fingerprint to identify which device made the edit
export function getDeviceId(): string {
  let id = localStorage.getItem('munsheer_device_id');
  if (!id) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefix = isMobile ? 'dev_mobile_' : 'dev_desktop_';
    id = prefix + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('munsheer_device_id', id);
  }
  return id;
}

/**
 * Sync Cloud Firestore data into local cache (localStorage)
 * and broadcast an update event so all UI components and live sheets update immediately.
 */
export function syncCloudDataToLocalStorage(data: Partial<GlobalDatabaseData>): void {
  if (!data) return;
  try {
    if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
      localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(data.rooms));
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      localStorage.setItem('personal_finance_txs_october_v3', JSON.stringify(data.transactions));
    }
    if (data.meterReadings && Array.isArray(data.meterReadings) && data.meterReadings.length > 0) {
      localStorage.setItem('villa_meter_readings_v5', JSON.stringify(data.meterReadings));
    }
    if (data.villaItems && Array.isArray(data.villaItems)) {
      localStorage.setItem('villa_items_receipts_v1', JSON.stringify(data.villaItems));
    }
    if (data.monthlyMaintenance && typeof data.monthlyMaintenance === 'object') {
      localStorage.setItem('villa_monthly_maintenance_v4', JSON.stringify(data.monthlyMaintenance));
    }
    if (data.villaMasterRentDetails && typeof data.villaMasterRentDetails === 'object') {
      localStorage.setItem('villa_master_rent_details_v4', JSON.stringify(data.villaMasterRentDetails));
    }
    if (data.lastUpdated) {
      localStorage.setItem('global_database_cloud_timestamp', data.lastUpdated);
    }
    window.dispatchEvent(new CustomEvent('app_database_updated', { detail: data }));
  } catch (err) {
    console.error('Failed to sync cloud data to localStorage:', err);
  }
}

/**
 * Returns connection and metadata for the live cloud database
 */
export function getCloudDatabaseInfo() {
  return {
    isConfigured: !!db,
    projectId: firebaseConfig?.projectId || 'dark-clock-kdpg',
    databaseId: firebaseConfig?.firestoreDatabaseId || '(default)',
    documentId: getActiveDatabaseDocId(),
    deviceId: getDeviceId(),
    lastUpdated: localStorage.getItem('global_database_cloud_timestamp') || 'Just now',
  };
}

/**
 * Subscribe to real-time Cloud Firestore updates.
 * Every device connected will immediately receive all changes made by any other device.
 */
export function subscribeToGlobalDatabase(
  onData: (data: GlobalDatabaseData) => void,
  onError?: (err: any) => void
): () => void {
  if (!db) {
    console.warn('Firestore not initialized, relying on local storage.');
    return () => {};
  }

  const docId = getActiveDatabaseDocId();
  const docPath = `global_database_state/${docId}`;
  const docRef = doc(db, 'global_database_state', docId);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.data() as GlobalDatabaseData;
        if (rawData && rawData.lastUpdated) {
          syncCloudDataToLocalStorage(rawData);
          onData(rawData);
        }
      }
    },
    (error) => {
      console.error('Firestore snapshot sync error:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Fetch the latest database state from Firestore server and cache locally
 */
export async function fetchGlobalDatabaseFromCloud(): Promise<GlobalDatabaseData | null> {
  if (!db) return null;
  const docId = getActiveDatabaseDocId();
  const docPath = `global_database_state/${docId}`;
  const docRef = doc(db, 'global_database_state', docId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as GlobalDatabaseData;
      syncCloudDataToLocalStorage(data);
      return data;
    }
    return null;
  } catch (e: any) {
    console.error('Failed to fetch from Firestore:', e);
    if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(e, OperationType.GET, docPath);
    }
    return null;
  }
}

/**
 * Push full database update to Cloud Firestore so all other devices receive it in real-time
 */
export async function pushGlobalDatabaseToCloud(
  partial: Partial<GlobalDatabaseData>
): Promise<void> {
  // 1. Immediately cache locally for zero-latency UI updates
  syncCloudDataToLocalStorage(partial);

  if (!db) return;
  const docId = getActiveDatabaseDocId();
  const docPath = `global_database_state/${docId}`;
  const docRef = doc(db, 'global_database_state', docId);
  try {
    const payload: Record<string, any> = {
      ...partial,
      lastUpdated: new Date().toISOString(),
      updatedByDevice: getDeviceId(),
    };
    await setDoc(docRef, payload, { merge: true });
    window.dispatchEvent(new CustomEvent('app_database_cloud_pushed', { detail: payload }));
  } catch (e: any) {
    console.error('Failed to push to Cloud Firestore:', e);
    if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }
}

/**
 * Push all local data currently in this browser to the Cloud Firestore database
 */
export async function pushEntireLocalDatabaseToCloud(): Promise<boolean> {
  if (!db) return false;
  try {
    const rooms = JSON.parse(localStorage.getItem('villa_12_rooms_data_v4') || '[]');
    const transactions = JSON.parse(localStorage.getItem('personal_finance_txs_october_v3') || '[]');
    const meterReadings = JSON.parse(localStorage.getItem('villa_meter_readings_v5') || '[]');
    const villaItems = JSON.parse(localStorage.getItem('villa_items_receipts_v1') || '[]');
    const monthlyMaintenance = JSON.parse(localStorage.getItem('villa_monthly_maintenance_v4') || '{}');
    const villaMasterRentDetails = JSON.parse(localStorage.getItem('villa_master_rent_details_v4') || '{}');

    await pushGlobalDatabaseToCloud({
      ...(rooms.length > 0 ? { rooms } : {}),
      ...(transactions.length > 0 ? { transactions } : {}),
      ...(meterReadings.length > 0 ? { meterReadings } : {}),
      ...(villaItems.length > 0 ? { villaItems } : {}),
      ...(Object.keys(monthlyMaintenance).length > 0 ? { monthlyMaintenance } : {}),
      ...(Object.keys(villaMasterRentDetails).length > 0 ? { villaMasterRentDetails } : {}),
    });
    return true;
  } catch (e) {
    console.error('Error pushing full local DB to cloud:', e);
    return false;
  }
}

/**
 * Bootstraps and ensures the global database connection on any device.
 * If data exists in the cloud, it populates localStorage immediately.
 */
export async function initializeGlobalDatabase(): Promise<GlobalDatabaseData | null> {
  if (!db) return null;
  const docId = getActiveDatabaseDocId();
  const docPath = `global_database_state/${docId}`;
  try {
    const cloudData = await fetchGlobalDatabaseFromCloud();
    if (cloudData) {
      console.log('Connected to shared Cloud Firestore database doc:', docId);
      return cloudData;
    } else {
      // Document does not exist yet: seed with base data once
      console.log(`Seeding initial baseline to Cloud Firestore for doc: ${docId}...`);
      const seedData: GlobalDatabaseData = {
        rooms: initialRoomsData,
        transactions: [],
        meterReadings: initialMeterReadings,
        villaItems: [],
        monthlyMaintenance: initialMonthlyMaintenance as any,
        villaMasterRentDetails: initialVillaMasterRentDetails,
        lastUpdated: new Date().toISOString(),
        updatedByDevice: getDeviceId(),
        version: 1,
      };
      const docRef = doc(db, 'global_database_state', docId);
      await setDoc(docRef, seedData);
      syncCloudDataToLocalStorage(seedData);
      return seedData;
    }
  } catch (err: any) {
    console.error('Failed to initialize global database from cloud:', err);
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
    return null;
  }
}

/**
 * Helper to reliably parse numeric values from user input in cells (handles commas, QAR, $, spaces)
 */
export function cleanNumeric(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).trim();
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Two-way live sync: Takes an in-grid cell edit from any spreadsheet tab,
 * updates the respective underlying data model (Room, Transaction, Car KM, Meter, Villa Items, Landlord Rent),
 * saves to localStorage and immediately synchronizes to Cloud Firestore!
 */
export async function syncSheetCellToGlobalState(
  sheetName: string,
  targetRow: Record<string, any>,
  colKey: string,
  newValue: any
): Promise<void> {
  const normSheet = sheetName.toLowerCase();
  const normCol = colKey.toUpperCase().trim();

  // 1. Room Matrix Tab (12 Rooms Rent Master)
  if (normSheet.includes('room') || normSheet.includes('12_rooms') || normSheet.includes('rent_master')) {
    const rawRoom = targetRow['ROOM'] ?? targetRow['Room'] ?? targetRow['roomNumber'] ?? targetRow['Room Number'] ?? '';
    const rawRoomStr = String(rawRoom).trim();
    const roomDigits = rawRoomStr.replace(/[^0-9]/g, '');
    const tenantName = String(targetRow['TENANT NAME'] ?? targetRow['name'] ?? targetRow['Tenant Name'] ?? '').trim().toLowerCase();

    const saved = localStorage.getItem('villa_12_rooms_data_v4') || localStorage.getItem('villa_11_rooms_data_v3');
    let rooms: RoomRecord[] = saved ? JSON.parse(saved) : [...initialRoomsData];

    // Try matching room by number, digits, tenant name, or row index
    let roomIndex = rooms.findIndex((r) => {
      if (String(r.roomNumber).trim() === rawRoomStr) return true;
      if (roomDigits && String(r.roomNumber).replace(/[^0-9]/g, '') === roomDigits) return true;
      return false;
    });

    if (roomIndex < 0 && tenantName && !tenantName.includes('collection') && !tenantName.includes('landlord')) {
      roomIndex = rooms.findIndex((r) => r.name && r.name.trim().toLowerCase() === tenantName);
    }

    if (roomIndex < 0 && targetRow._originalIndex && targetRow._originalIndex >= 2 && targetRow._originalIndex <= rooms.length + 1) {
      roomIndex = targetRow._originalIndex - 2;
    }

    const monthCols = ['FEB', 'MAR', 'APRIL', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    if (roomIndex >= 0) {
      const r = { ...rooms[roomIndex] };

      if (monthCols.includes(normCol)) {
        r.monthlyPayments = {
          ...r.monthlyPayments,
          [normCol]: cleanNumeric(newValue),
        };
      } else if (normCol.includes('RENT')) {
        r.monthlyRent = cleanNumeric(newValue);
      } else if (normCol.includes('ADVANCE')) {
        r.advance = cleanNumeric(newValue);
      } else if (normCol.includes('TENANT') || normCol.includes('NAME')) {
        r.name = String(newValue).trim();
      } else if (normCol.includes('MOBILE') || normCol.includes('PHONE') || normCol.includes('MOB')) {
        r.mobNo = String(newValue).trim();
      } else if (normCol === 'ROOM') {
        r.roomNumber = String(newValue).trim();
      }

      rooms[roomIndex] = r;
      localStorage.setItem('villa_12_rooms_data_v4', JSON.stringify(rooms));
      await pushGlobalDatabaseToCloud({ rooms });
      return;
    }

    // Check if user edited a summary row at the bottom of 12_Rooms_Rent_Master
    if (rawRoomStr.toUpperCase().includes('LANDLORD') || rawRoomStr.toUpperCase().includes('TOTAL VILLA RENT')) {
      if (monthCols.includes(normCol)) {
        const savedRent = localStorage.getItem('villa_master_rent_details_v4');
        const rentDetails: Record<MonthKey, VillaMasterRentDetail> = savedRent ? JSON.parse(savedRent) : { ...initialVillaMasterRentDetails };
        const m = normCol as MonthKey;
        const val = cleanNumeric(newValue);
        rentDetails[m] = {
          month: m,
          amount: val,
          paidAmount: val,
          status: 'Paid',
        };
        localStorage.setItem('villa_master_rent_details_v4', JSON.stringify(rentDetails));
        await pushGlobalDatabaseToCloud({ villaMasterRentDetails: rentDetails });
        return;
      }
    }

    if (rawRoomStr.toUpperCase().includes('MAINTENANCE')) {
      if (monthCols.includes(normCol)) {
        const savedMaint = localStorage.getItem('villa_monthly_maintenance_v4');
        const monthlyMaint: Record<MonthKey, number> = savedMaint ? JSON.parse(savedMaint) : { ...initialMonthlyMaintenance };
        const m = normCol as MonthKey;
        monthlyMaint[m] = cleanNumeric(newValue);
        localStorage.setItem('villa_monthly_maintenance_v4', JSON.stringify(monthlyMaint));
        await pushGlobalDatabaseToCloud({ monthlyMaintenance: monthlyMaint });
        return;
      }
    }
  }

  // 2. Villa Expenses & Receipts Tab
  else if (normSheet.includes('expense') || normSheet.includes('receipt')) {
    const saved = localStorage.getItem('villa_items_receipts_v1');
    let items: VillaExpenseItem[] = saved ? JSON.parse(saved) : [];
    const itemId = targetRow['Record ID'] || targetRow['id'] || targetRow['_rowId'];

    let itemIdx = items.findIndex((i) => i.id === itemId);
    if (itemIdx < 0 && targetRow['Item Name']) {
      itemIdx = items.findIndex((i) => i.itemName === targetRow['Item Name'] && i.month === targetRow['Month']);
    }

    if (itemIdx >= 0) {
      const it = { ...items[itemIdx] };
      const col = colKey.toLowerCase();
      if (col.includes('amount')) {
        it.amount = cleanNumeric(newValue);
      } else if (col.includes('item') || col.includes('name')) {
        it.itemName = String(newValue);
      } else if (col.includes('reason') || col.includes('description')) {
        it.reason = String(newValue);
      } else if (col.includes('category')) {
        it.category = String(newValue) as any;
      } else if (col.includes('month')) {
        it.month = String(newValue).toUpperCase() as MonthKey;
      } else if (col.includes('date')) {
        it.date = String(newValue);
      } else if (col.includes('drive') || col.includes('url')) {
        it.attachment = {
          name: `${it.itemName} Receipt`,
          driveUrl: String(newValue),
          uploadedAt: new Date().toLocaleDateString('en-GB'),
        };
      }
      items[itemIdx] = it;
      localStorage.setItem('villa_items_receipts_v1', JSON.stringify(items));
      await pushGlobalDatabaseToCloud({ villaItems: items });
      return;
    }
  }

  // 3. Personal Finance or Car 565816 Expenses Tab
  else if (normSheet.includes('personal') || normSheet.includes('car')) {
    const txId = targetRow['Transaction ID'] || targetRow['ID'] || targetRow['id'] || targetRow['_rowId'];
    const saved = localStorage.getItem('personal_finance_txs_october_v3');
    let txs: PersonalTransaction[] = saved ? JSON.parse(saved) : [];

    let txIndex = txs.findIndex((t) => t.id === txId);
    if (txIndex < 0 && targetRow['Date']) {
      txIndex = txs.findIndex((t) => t.date === targetRow['Date'] && String(t.reason || t.category) === String(targetRow['Expense Type / Reason'] || targetRow['Description / Purpose']));
    }

    if (txIndex >= 0) {
      const tx = { ...txs[txIndex] };
      const normC = colKey.toLowerCase();

      if (normC.includes('amount')) {
        tx.amount = cleanNumeric(newValue);
      } else if (normC.includes('odometer') || normC.includes('km')) {
        const cleaned = cleanNumeric(newValue);
        tx.odometerKm = cleaned > 0 ? cleaned : undefined;
      } else if (normC.includes('fuel') || normC.includes('litre')) {
        const cleaned = cleanNumeric(newValue);
        tx.fuelLitres = cleaned > 0 ? cleaned : undefined;
      } else if (normC.includes('reason') || normC.includes('purpose') || normC.includes('description') || normC.includes('type / reason')) {
        tx.reason = String(newValue);
      } else if (normC.includes('category')) {
        tx.category = String(newValue);
      } else if (normC.includes('date')) {
        tx.date = String(newValue);
      } else if (normC.includes('notes') || normC.includes('station')) {
        tx.notes = String(newValue);
      }

      txs[txIndex] = tx;
      localStorage.setItem('personal_finance_txs_october_v3', JSON.stringify(txs));
      await pushGlobalDatabaseToCloud({ transactions: txs });
      return;
    }
  }

  // 4. Kahramaa Meters Tab
  else if (normSheet.includes('meter') || normSheet.includes('utility')) {
    const meterNum = targetRow['Meter Number'] || targetRow['meterNumber'];
    const month = targetRow['Month'] || targetRow['month'];

    if (meterNum && month) {
      const saved = localStorage.getItem('villa_meter_readings_v5') || localStorage.getItem('villa_meter_readings_v4');
      let readings: MeterMonthlyReading[] = saved ? JSON.parse(saved) : [...initialMeterReadings];
      const rIdx = readings.findIndex((m) => m.meterNumber === String(meterNum) && m.month === String(month));

      if (rIdx >= 0) {
        const r = { ...readings[rIdx] };
        const normC = colKey.toLowerCase();

        if (normC.includes('bill') || normC.includes('amount')) {
          r.billAmountQAR = cleanNumeric(newValue);
        } else if (normC.includes('current')) {
          r.currentReading = cleanNumeric(newValue);
          r.unitsConsumed = Math.max(0, r.currentReading - r.previousReading);
        } else if (normC.includes('previous')) {
          r.previousReading = cleanNumeric(newValue);
          r.unitsConsumed = Math.max(0, r.currentReading - r.previousReading);
        } else if (normC.includes('status')) {
          r.status = String(newValue) as any;
        }

        readings[rIdx] = r;
        localStorage.setItem('villa_meter_readings_v5', JSON.stringify(readings));
        await pushGlobalDatabaseToCloud({ meterReadings: readings });
        return;
      }
    }
  }
}
