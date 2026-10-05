export type ColumnType = 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'email' | 'status';

export interface ColumnSchema {
  key: string;
  label: string;
  type: ColumnType;
  uniqueValues?: number;
  sampleValue?: string | number | boolean;
}

export interface SheetTable {
  id: string;
  name: string;
  columns: ColumnSchema[];
  rows: Record<string, any>[];
  rawHeaders: string[];
}

export interface DatabaseSource {
  type: 'local_file' | 'google_sheet' | 'sample';
  fileName: string;
  fileId?: string; // Google Drive / Sheets ID
  sheetId?: number; // Google Sheet tab ID
  lastModified?: string;
  sheets: SheetTable[];
  activeSheetIndex: number;
  readOnly?: boolean;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ColorTheme = 'emerald' | 'sapphire' | 'amber' | 'obsidian';
