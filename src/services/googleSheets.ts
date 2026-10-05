import { DriveFileItem, SheetTable, ColumnSchema, ColumnType } from '../types';

export async function listGoogleDriveFiles(
  accessToken: string,
  searchQuery?: string
): Promise<DriveFileItem[]> {
  const mimeQueries = [
    "mimeType = 'application/vnd.google-apps.spreadsheet'",
    "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
    "mimeType = 'text/csv'",
    "name contains '.xlsx'",
    "name contains '.csv'",
  ];

  let q = `trashed = false and (${mimeQueries.join(' or ')})`;
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('q', q);
  url.searchParams.append('fields', 'files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink)');
  url.searchParams.append('orderBy', 'modifiedTime desc');
  url.searchParams.append('pageSize', '30');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function fetchGoogleSpreadsheet(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetTable[]> {
  // 1. Get spreadsheet metadata (all sheets/tabs)
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${metaRes.status} ${errText}`);
  }

  const metaData = await metaRes.json();
  const sheets: any[] = metaData.sheets || [];
  if (sheets.length === 0) {
    throw new Error('Spreadsheet has no sheets/tabs.');
  }

  const tables: SheetTable[] = [];

  for (const sheetObj of sheets) {
    const title = sheetObj.properties.title;
    const sheetId = sheetObj.properties.sheetId;

    // Fetch values for this sheet
    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1:ZZ5000`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (valuesRes.ok) {
      const valuesData = await valuesRes.json();
      const rawRows: any[][] = valuesData.values || [];
      const table = convertRawRowsToSheetTable(String(sheetId), title, rawRows);
      tables.push(table);
    }
  }

  return tables;
}

export async function appendGoogleSheetRow(
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: any[],
  accessToken: string
) {
  const range = `${encodeURIComponent(sheetTitle)}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append row to Google Sheet: ${res.status} ${errText}`);
  }

  return await res.json();
}

export async function updateGoogleSheetCell(
  spreadsheetId: string,
  range: string,
  newValue: any,
  accessToken: string
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newValue]],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update cell: ${res.status} ${errText}`);
  }

  return await res.json();
}

export async function downloadDriveFileBuffer(
  fileId: string,
  accessToken: string
): Promise<ArrayBuffer> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download file from Drive: ${res.status} ${errText}`);
  }

  return await res.arrayBuffer();
}

export function convertRawRowsToSheetTable(
  id: string,
  name: string,
  rawRows: any[][]
): SheetTable {
  if (!rawRows || rawRows.length === 0) {
    return {
      id,
      name,
      columns: [],
      rows: [],
      rawHeaders: [],
    };
  }

  const rawHeaders = (rawRows[0] || []).map((h, idx) =>
    h !== undefined && h !== null && String(h).trim() !== '' ? String(h).trim() : `Column_${idx + 1}`
  );

  const dataRows = rawRows.slice(1);
  const formattedRows: Record<string, any>[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    // Check if row is completely empty
    if (!row || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const rowObj: Record<string, any> = {
      _rowId: `row_${r + 1}`,
      _originalIndex: r + 2, // 1-indexed row number in the spreadsheet (Row 1 is headers)
    };

    for (let c = 0; c < rawHeaders.length; c++) {
      const headerKey = rawHeaders[c];
      const cellVal = row[c] !== undefined ? row[c] : '';
      rowObj[headerKey] = cellVal;
    }

    formattedRows.push(rowObj);
  }

  // Detect column types
  const columns: ColumnSchema[] = rawHeaders.map((header) => {
    const sampleVals = formattedRows.map((r) => r[header]).filter((v) => v !== '' && v !== null && v !== undefined);
    const type = inferColumnType(header, sampleVals);
    const uniqueValuesCount = new Set(sampleVals.map((v) => String(v).trim().toLowerCase())).size;

    return {
      key: header,
      label: header,
      type,
      uniqueValues: uniqueValuesCount,
      sampleValue: sampleVals[0] !== undefined ? sampleVals[0] : '',
    };
  });

  return {
    id,
    name,
    columns,
    rows: formattedRows,
    rawHeaders,
  };
}

export function inferColumnType(columnName: string, samples: any[]): ColumnType {
  const lowerName = columnName.toLowerCase();

  if (lowerName.includes('status') || lowerName.includes('stage') || lowerName.includes('state') || lowerName.includes('priority')) {
    return 'status';
  }
  if (lowerName.includes('email') || lowerName.includes('mail')) {
    return 'email';
  }
  if (lowerName.includes('date') || lowerName.includes('time') || lowerName.includes('dob') || lowerName.includes('deadline')) {
    return 'date';
  }
  if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('salary') || lowerName.includes('revenue') || lowerName.includes('budget') || lowerName.includes('amount') || lowerName.includes('fee')) {
    return 'currency';
  }
  if (lowerName.includes('active') || lowerName.includes('verified') || lowerName.includes('enabled') || lowerName.includes('completed')) {
    return 'boolean';
  }

  if (samples.length === 0) return 'string';

  let numCount = 0;
  let boolCount = 0;
  let dateCount = 0;

  for (const s of samples.slice(0, 30)) {
    const str = String(s).trim();
    if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false' || typeof s === 'boolean') {
      boolCount++;
    } else if (!isNaN(Number(str)) && str !== '') {
      numCount++;
    } else if (isValidDate(str)) {
      dateCount++;
    }
  }

  const sampleSize = Math.min(samples.length, 30);
  if (boolCount / sampleSize > 0.8) return 'boolean';
  if (dateCount / sampleSize > 0.7) return 'date';
  if (numCount / sampleSize > 0.7) return 'number';

  return 'string';
}

function isValidDate(dateStr: string): boolean {
  if (dateStr.length < 6 || !isNaN(Number(dateStr))) return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

export const TARGET_GOOGLE_DRIVE_FOLDER_ID = '1DflkGubMRjXiMJCD970nILdICKe_QvaE';
export const TARGET_GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1DflkGubMRjXiMJCD970nILdICKe_QvaE?usp=drive_link';

/**
 * Uploads a file (Excel, JSON, image, receipt) directly into the specified Google Drive folder
 */
export async function uploadFileToDriveFolder(
  fileName: string,
  mimeType: string,
  content: Blob | string,
  accessToken: string,
  folderId: string = TARGET_GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  if (typeof content === 'string') {
    form.append('file', new Blob([content], { type: mimeType }));
  } else {
    form.append('file', content);
  }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save to Google Drive folder: ${res.status} ${errText}`);
  }

  return await res.json();
}
