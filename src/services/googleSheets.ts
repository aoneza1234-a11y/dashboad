import { SalesRecord } from '../types';

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets(?:\/u\/[0-9]+)?\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const matchPub = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (matchPub && matchPub[1]) {
    return matchPub[1];
  }
  return trimmed;
}

export function extractGidFromUrl(input: string): string | null {
  const match = input.match(/[?&#]gid=([0-9]+)/);
  return match ? match[1] : null;
}

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: string[];
}

export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentField.trim());
      currentField = '';
      if (row.length > 0 && row.some((col) => col.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some((col) => col.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export function parseSheetValuesToRecords(
  values: any[][],
  headerRow: number = 1,
  dataStartRow: number = 2,
  dataEndRow?: number | null
): { records: SalesRecord[]; headers: string[] } {
  if (!values || values.length === 0) {
    return { records: [], headers: [] };
  }

  const headerIdx = Math.max(0, headerRow - 1);
  const rawHeaders = (values[headerIdx] || []).map((h, i) =>
    h !== undefined && h !== null && String(h).trim() !== ''
      ? String(h).trim()
      : `คอลัมน์ ${i + 1}`
  );

  const startIdx = Math.max(headerIdx + 1, dataStartRow - 1);
  const endIdx =
    dataEndRow && dataEndRow >= dataStartRow
      ? Math.min(values.length, dataEndRow)
      : values.length;

  const rawDataRows = values.slice(startIdx, endIdx);

  const parseNum = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const records: SalesRecord[] = [];

  rawDataRows.forEach((row, rowIndex) => {
    if (!row || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      return; // skip completely empty row
    }

    // Skip summary / total row
    const isSummaryRow = row.some(
      (c: any) =>
        String(c || '').includes('รวมทั้งสิ้น') ||
        String(c || '').includes('Grand Total') ||
        String(c || '').includes('Total')
    );
    if (isSummaryRow && rowIndex === rawDataRows.length - 1) {
      return;
    }

    const rec: SalesRecord = {
      id: rowIndex + 1,
      date: new Date().toISOString().slice(0, 10),
      orderId: `REC-${rowIndex + 1}`,
      product: `รายการ ${rowIndex + 1}`,
      category: 'ทั่วไป',
      region: 'กรุงเทพฯ',
      quantity: 1,
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    // Map column values dynamically
    rawHeaders.forEach((header, colIdx) => {
      const val = row[colIdx];
      rec[header] = val;

      const lowerHeader = header.toLowerCase();
      // Smart detection of common fields
      if (lowerHeader.includes('id') || lowerHeader.includes('ลำดับ') || lowerHeader === 'no') {
        rec.id = parseInt(String(val)) || rec.id;
      } else if (lowerHeader.includes('date') || lowerHeader.includes('วัน') || lowerHeader.includes('เวลา')) {
        rec.date = String(val || rec.date);
      } else if (lowerHeader.includes('order') || lowerHeader.includes('คำสั่งซื้อ') || lowerHeader.includes('เลขที่')) {
        rec.orderId = String(val || rec.orderId);
      } else if (lowerHeader.includes('product') || lowerHeader.includes('สินค้า') || lowerHeader.includes('ชื่อ') || lowerHeader.includes('item')) {
        rec.product = String(val || rec.product);
      } else if (lowerHeader.includes('cat') || lowerHeader.includes('หมวด') || lowerHeader.includes('ประเภท') || lowerHeader.includes('กลุ่ม')) {
        rec.category = String(val || rec.category);
      } else if (lowerHeader.includes('reg') || lowerHeader.includes('ภาค') || lowerHeader.includes('เขต') || lowerHeader.includes('สาขา') || lowerHeader.includes('พื้นที่')) {
        rec.region = String(val || rec.region);
      } else if (lowerHeader.includes('qty') || lowerHeader.includes('จำนวน') || lowerHeader.includes('quantity') || lowerHeader.includes('count')) {
        rec.quantity = parseNum(val) || 1;
      } else if (lowerHeader.includes('rev') || lowerHeader.includes('ยอดขาย') || lowerHeader.includes('sales') || lowerHeader.includes('ราคา') || lowerHeader.includes('income')) {
        rec.revenue = parseNum(val);
      } else if (lowerHeader.includes('cost') || lowerHeader.includes('ต้นทุน') || lowerHeader.includes('expense') || lowerHeader.includes('รายจ่าย')) {
        rec.cost = parseNum(val);
      } else if (lowerHeader.includes('profit') || lowerHeader.includes('กำไร') || lowerHeader.includes('margin')) {
        rec.profit = parseNum(val);
      }
    });

    if (rec.profit === 0 && rec.revenue > 0 && rec.cost > 0) {
      rec.profit = rec.revenue - rec.cost;
    }

    records.push(rec);
  });

  return {
    records,
    headers: rawHeaders,
  };
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<SheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // 1. Primary: Query our dedicated server-side endpoint (bypasses browser CORS completely)
  try {
    const metaRes = await fetch(`/api/sheet-metadata?id=${cleanId}`);
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      if (metaData.sheets && metaData.sheets.length > 0) {
        return {
          id: cleanId,
          title: metaData.title || 'Google Spreadsheet',
          sheets: metaData.sheets,
        };
      }
    }
  } catch (e) {
    console.warn('Local /api/sheet-metadata query failed, trying alternatives', e);
  }

  // 2. If accessToken available, call official Google Sheets API v4
  if (accessToken) {
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const sheetNames = (data.sheets || []).map(
          (s: { properties?: { title?: string } }) => s.properties?.title || 'Sheet1'
        );
        return {
          id: cleanId,
          title: data.properties?.title || 'Google Spreadsheet',
          sheets: sheetNames.length > 0 ? sheetNames : ['Sheet1'],
        };
      }
    } catch (e) {
      console.warn('Sheets API metadata failed, trying public fallback', e);
    }
  }

  // 3. Fallback: Query htmlview via public CORS proxy or direct
  const candidateUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${cleanId}/htmlview`)}`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/htmlview`,
  ];

  for (const htmlUrl of candidateUrls) {
    try {
      const res = await fetch(htmlUrl);
      if (res.ok) {
        const text = await res.text();
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
        let pageTitle = titleMatch
          ? titleMatch[1].replace(/ - Google (Sheets|สเปรดชีต)/gi, '').trim()
          : 'Google Spreadsheet';

        const tabs: string[] = [];
        const seen = new Set<string>();

        // Regex 1: JavaScript items with name and gid
        const itemRegex = /name:\s*"([^"]+)",\s*pageUrl:[^}]+gid:\s*"([^"]+)"/g;
        let match;
        while ((match = itemRegex.exec(text)) !== null) {
          const name = match[1].trim();
          if (name && !seen.has(name)) {
            seen.add(name);
            tabs.push(name);
          }
        }

        // Regex 2: Sheet button elements
        const tabRegex = /id="sheet-button-[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/gi;
        while ((match = tabRegex.exec(text)) !== null) {
          const name = match[1].trim();
          if (name && !seen.has(name)) {
            seen.add(name);
            tabs.push(name);
          }
        }

        if (tabs.length > 0) {
          return {
            id: cleanId,
            title: pageTitle,
            sheets: tabs,
          };
        }
      }
    } catch (err) {
      console.warn('Candidate htmlview metadata fallback failed for', htmlUrl, err);
    }
  }

  return {
    id: cleanId,
    title: 'Google Spreadsheet',
    sheets: ['แผ่นงานหลัก (อัตโนมัติ)', 'Sheet1'],
  };
}

export async function fetchSheetRowsWithConfig(
  spreadsheetId: string,
  sheetName: string,
  headerRow: number = 1,
  dataStartRow: number = 2,
  dataEndRow?: number | null,
  accessToken?: string | null
): Promise<{ records: SalesRecord[]; headers: string[] }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const isDefaultSheet =
    !sheetName ||
    sheetName === 'แผ่นงานหลัก (อัตโนมัติ)' ||
    sheetName === 'default' ||
    sheetName.trim() === '';

  // Strategy A: Authorized API Call
  if (accessToken) {
    try {
      const range = isDefaultSheet ? 'A1:ZZ5000' : `${encodeURIComponent(sheetName)}!A1:ZZ5000`;
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const values: any[][] = data.values || [];
        return parseSheetValuesToRecords(values, headerRow, dataStartRow, dataEndRow);
      }
    } catch (e) {
      console.warn('Google Sheets API values fetch failed, trying public CSV fallback', e);
    }
  }

  // Helper to test if raw text is HTML error rather than CSV
  const isHtmlResponse = (txt: string) => {
    const lower = txt.slice(0, 500).toLowerCase();
    return (
      lower.includes('<!doctype html') ||
      lower.includes('<html') ||
      lower.includes('accounts.google.com') ||
      lower.includes('service login')
    );
  };

  // Strategy B: Public CSV Export or GViz
  // Try 1: with sheet parameter if specified
  if (!isDefaultSheet) {
    try {
      const sheetParam = encodeURIComponent(sheetName);
      const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${sheetParam}`;
      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        if (!isHtmlResponse(csvText)) {
          const rows = parseCSV(csvText);
          if (rows.length > 0) {
            return parseSheetValuesToRecords(rows, headerRow, dataStartRow, dataEndRow);
          }
        }
      }
    } catch (err) {
      console.warn('Named sheet gviz failed, trying fallback to default sheet', err);
    }
  }

  // Try 2: Primary sheet export without &sheet parameter (always succeeds on public sheets!)
  const fallbackUrls = [
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`,
  ];

  for (const url of fallbackUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (isHtmlResponse(text)) {
          throw new Error(
            'ชีตนี้ถูกตั้งค่าเป็น "ส่วนตัว" (Restricted) กรุณาแชร์ชีตใน Google Drive เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with link can view) หรือกดเข้าสู่ระบบ Google เพื่อดึงข้อมูล'
          );
        }
        const rows = parseCSV(text);
        if (rows.length > 0) {
          return parseSheetValuesToRecords(rows, headerRow, dataStartRow, dataEndRow);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('ส่วนตัว')) {
        throw err;
      }
      console.warn('Fallback CSV fetch failed for URL:', url, err);
    }
  }

  throw new Error(
    'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบว่าแชร์ชีตเป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Public) หรือคลิกเข้าสู่ระบบ Google ด้านบน'
  );
}

export async function createQuarterlySalesSpreadsheet(
  title: string,
  sampleRecords: SalesRecord[],
  accessToken: string
): Promise<{ spreadsheetId: string; url: string }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'VISTA BI Studio - ยอดขายรายไตรมาส',
      },
      sheets: [
        {
          properties: {
            title: 'ยอดขายรายไตรมาส',
            gridProperties: {
              rowCount: 50,
              columnCount: 12,
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  const header = [
    'ลำดับ',
    'วันที่',
    'เลขที่คำสั่งซื้อ',
    'ชื่อสินค้า',
    'หมวดหมู่',
    'ภูมิภาค',
    'จำนวน',
    'ยอดขาย (บาท)',
    'ต้นทุน (บาท)',
    'กำไรขั้นต้น (บาท)',
  ];

  const rows = sampleRecords.map((r, idx) => [
    r.id,
    r.date,
    r.orderId,
    r.product,
    r.category,
    r.region,
    r.quantity,
    r.revenue,
    r.cost,
    `=H${idx + 2}-I${idx + 2}`,
  ]);

  const totalRow = [
    '',
    '',
    '',
    '',
    '',
    'รวมทั้งสิ้น',
    `=SUM(G2:G${rows.length + 1})`,
    `=SUM(H2:H${rows.length + 1})`,
    `=SUM(I2:I${rows.length + 1})`,
    `=SUM(J2:J${rows.length + 1})`,
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ยอดขายรายไตรมาส!A1:J${
      rows.length + 2
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [header, ...rows, totalRow],
      }),
    }
  );

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

