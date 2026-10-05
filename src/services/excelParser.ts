import * as XLSX from 'xlsx';
import { SheetTable } from '../types';
import { convertRawRowsToSheetTable } from './googleSheets';

export async function parseExcelFile(file: File): Promise<SheetTable[]> {
  const buffer = await file.arrayBuffer();
  return parseExcelBuffer(buffer);
}

export function parseExcelBuffer(buffer: ArrayBuffer): SheetTable[] {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const tables: SheetTable[] = [];

  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const worksheet = workbook.Sheets[sheetName];

    // Read sheet as array of arrays (header: 1)
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false, // returns formatted strings for clean display
    });

    if (rawRows.length > 0) {
      const table = convertRawRowsToSheetTable(`sheet_${i}`, sheetName, rawRows);
      tables.push(table);
    }
  }

  return tables;
}

export function exportTableToExcel(table: SheetTable, fileName: string) {
  const headers = table.rawHeaders;
  const rows = table.rows.map((row) => {
    return headers.map((h) => row[h] ?? '');
  });

  const aoa = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, table.name || 'Sheet1');

  const safeFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, safeFileName);
}

export function exportTableToCsv(table: SheetTable, fileName: string) {
  const headers = table.rawHeaders;
  const rows = table.rows.map((row) => {
    return headers.map((h) => {
      const cell = String(row[h] ?? '');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
