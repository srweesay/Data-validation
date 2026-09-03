import * as XLSX from 'xlsx';
import { canonicalizeHeaders } from './validationEngine.js';

/**
 * Parses an uploaded .xlsx/.xls/.csv buffer into { headers, rows }.
 * rows is an array of plain objects keyed by header name. Cell values keep
 * their native type where possible (dates become JS Date via cellDates).
 * Headers are canonicalized (see canonicalizeHeaders in validationEngine.js)
 * so real-world spelling variants — e.g. "UniqueIdentifier" or "Paid up
 * capital" — are normalized to our standard field names before anything else
 * in the app sees them.
 */
export function parseSpreadsheet(buffer, originalName) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }
  const sheet = workbook.Sheets[firstSheetName];

  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = (matrix[0] || []).map((h) => String(h).trim());
  const { canonicalHeaders: headers } = canonicalizeHeaders(rawHeaders);

  const rows = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i];
    // Skip fully blank trailing rows.
    if (!line || line.every((cell) => cell === '' || cell === undefined || cell === null)) {
      continue;
    }
    const obj = {};
    headers.forEach((header, colIdx) => {
      let value = line[colIdx];
      if (value instanceof Date) {
        // Keep as ISO date string (yyyy-mm-dd) for consistent transport/editing.
        value = value.toISOString().slice(0, 10);
      }
      obj[header] = value === undefined ? '' : value;
    });
    rows.push(obj);
  }

  return { headers, rows, sheetName: firstSheetName, fileName: originalName };
}

/**
 * Builds a workbook buffer (.xlsx or .csv) from headers + row objects.
 */
export function buildSpreadsheet(headers, rows, format = 'xlsx') {
  const data = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ''))];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Validated Data');

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return Buffer.from(csv, 'utf-8');
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
