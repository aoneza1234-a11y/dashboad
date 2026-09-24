import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';

export interface ParseResult {
  fileName: string;
  records: SalesRecord[];
  columns: string[];
  totalRows: number;
}

export function parseCsvText(text: string, fileName: string = 'data.csv'): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { fileName, records: [], columns: [], totalRows: 0 };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvRow(headerLine);

  const records: SalesRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    const rowObj: any = { id: i };

    headers.forEach((header, idx) => {
      const rawVal = values[idx] !== undefined ? values[idx].trim() : '';
      // Detect numbers
      if (rawVal !== '' && !isNaN(Number(rawVal)) && !rawVal.startsWith('0') && rawVal.length < 15) {
        rowObj[header] = Number(rawVal);
      } else {
        rowObj[header] = rawVal;
      }
    });

    // Provide standard fallbacks if columns match common names
    if (!rowObj.revenue && rowObj.ยอดขาย) rowObj.revenue = rowObj.ยอดขาย;
    if (!rowObj.profit && rowObj.กำไร) rowObj.profit = rowObj.กำไร;
    if (!rowObj.quantity && rowObj.จำนวน) rowObj.quantity = rowObj.จำนวน;
    if (!rowObj.category && rowObj.หมวดหมู่) rowObj.category = rowObj.หมวดหมู่;
    if (!rowObj.region && rowObj.ภูมิภาค) rowObj.region = rowObj.ภูมิภาค;
    if (!rowObj.product && rowObj.สินค้า) rowObj.product = rowObj.สินค้า;
    if (!rowObj.date && rowObj.วันที่) rowObj.date = rowObj.วันที่;

    records.push(rowObj as SalesRecord);
  }

  return {
    fileName,
    records,
    columns: headers,
    totalRows: records.length,
  };
}

function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"' || char === "'") {
      if (inQuotes && row[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function parseExcelOrCsvFile(file: File): Promise<ParseResult> {
  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = await file.text();
    return parseCsvText(text, fileName);
  }

  // Parse Excel (.xlsx, .xls)
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

  if (jsonData.length === 0) {
    return { fileName, records: [], columns: [], totalRows: 0 };
  }

  const columns = Object.keys(jsonData[0]);
  const records: SalesRecord[] = jsonData.map((row, idx) => {
    const rec: any = { id: idx + 1, ...row };
    // Normalize aliases
    if (rec.revenue === undefined && rec['ยอดขาย'] !== undefined) rec.revenue = Number(rec['ยอดขาย']) || 0;
    if (rec.profit === undefined && rec['กำไร'] !== undefined) rec.profit = Number(rec['กำไร']) || 0;
    if (rec.quantity === undefined && rec['จำนวน'] !== undefined) rec.quantity = Number(rec['จำนวน']) || 0;
    if (!rec.category && rec['หมวดหมู่']) rec.category = String(rec['หมวดหมู่']);
    if (!rec.region && rec['ภูมิภาค']) rec.region = String(rec['ภูมิภาค']);
    if (!rec.product && rec['สินค้า']) rec.product = String(rec['สินค้า']);
    if (!rec.date && rec['วันที่']) rec.date = String(rec['วันที่']);
    return rec as SalesRecord;
  });

  return {
    fileName,
    records,
    columns,
    totalRows: records.length,
  };
}
