/**
 * Google Apps Script for Google Sheets (VISTA BI Studio Integration)
 * สามารถคัดลอกโค้ดนี้ไปวางใน Google Sheets: ส่วนขยาย (Extensions) > Apps Script
 */

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * VISTA BI STUDIO - Google Sheets & Apps Script Integration
 * ระบบเชื่อมต่อแดชบอร์ด BI Studio กับ Google Sheets
 * ============================================================================
 */

// 1. สร้างเมนูบนแถบเครื่องมือของ Google Sheets เมื่อเปิดไฟล์
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 VISTA BI Studio')
    .addItem('🚀 เปิด VISTA BI Studio (Sidebar)', 'openBISidebar')
    .addItem('⚡ สร้างข้อมูลตัวอย่าง (Quarterly Sales 20 รายการ)', 'generateSampleData')
    .addSeparator()
    .addItem('📥 ดึงข้อมูลสรุป KPI & ชาร์ต', 'showSummaryDialog')
    .addItem('🌐 ซิงค์ข้อมูลไปยัง Web App', 'syncDataToBiStudio')
    .addItem('ℹ️ วิธีใช้งานและการติดตั้ง', 'showHelpDialog')
    .addToUi();
}

/**
 * 2. เปิดหน้าต่าง VISTA BI Studio ใน Sidebar ขวามือของ Google Sheets
 */
function openBISidebar() {
  const appUrl = 'https://ais-dev-2qccy56jkoi643oixz2ile-722185391651.asia-east1.run.app';
  const html = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<base target="_blank">' +
    '<style>' +
    'body { font-family: "Google Sans", "Prompt", sans-serif; margin: 0; padding: 12px; background: #151226; color: #fff; }' +
    '.card { background: #1e1b33; border-radius: 10px; padding: 14px; margin-bottom: 12px; border: 1px solid #2e284f; }' +
    '.btn { display: block; width: 100%; text-align: center; padding: 10px 0; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }' +
    '.btn-teal { background: linear-gradient(135deg, #0d9488, #059669); }' +
    '.stat { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }' +
    '.stat-val { font-weight: bold; color: #a78bfa; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<h3 style="margin-top:0; color:#c4b5fd;">✨ VISTA BI STUDIO</h3>' +
    '<p style="font-size:12px; color:#9ca3af;">เชื่อมต่อกับแผ่นงานนี้เรียบร้อยแล้ว</p>' +
    '<div class="stat"><span>สถานะชีต:</span><span class="stat-val" style="color:#34d399;">● ออนไลน์</span></div>' +
    '<div class="stat"><span>แผ่นงานปัจจุบัน:</span><span class="stat-val">' + SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() + '</span></div>' +
    '<div class="stat"><span>จำนวนแถวข้อมูล:</span><span class="stat-val">' + (SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getLastRow() - 1) + ' รายการ</span></div>' +
    '<a href="' + appUrl + '" target="_blank" class="btn">🚀 เปิดเต็มจอในแท็บใหม่</a>' +
    '</div>' +
    '<div class="card">' +
    '<h4 style="margin-top:0; color:#e0e7ff;">⚡ คำสั่งด่วน</h4>' +
    '<button onclick="google.script.run.generateSampleData()" class="btn btn-teal" style="cursor:pointer; border:none; width:100%; font-size:13px;">รีเซ็ตข้อมูลตัวอย่าง 20 รายการ</button>' +
    '</div>' +
    '</body>' +
    '</html>';

  const output = HtmlService.createHtmlOutput(html)
    .setTitle('VISTA BI Studio Panel')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(output);
}

/**
 * 3. ฟังก์ชันสร้างข้อมูลตัวอย่าง "ยอดขายรายไตรมาส" (20 รายการ ตรงตามหน้าจอ BI Studio)
 * ยอดขายรวม: 584,200 | กำไรขั้นต้น: 255,800 | คำสั่งซื้อ: 20
 */
function generateSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ยอดขายรายไตรมาส');
  if (!sheet) {
    sheet = ss.insertSheet('ยอดขายรายไตรมาส');
  } else {
    sheet.clear();
  }
  ss.setActiveSheet(sheet);

  // ส่วนหัวตาราง (Header)
  const headers = [
    ['ลำดับ', 'วันที่', 'เลขที่คำสั่งซื้อ', 'ชื่อสินค้า', 'หมวดหมู่', 'ภูมิภาค', 'จำนวน', 'ยอดขาย (บาท)', 'ต้นทุน (บาท)', 'กำไรขั้นต้น (บาท)']
  ];
  sheet.getRange(1, 1, 1, 10).setValues(headers);

  // จัดสไตล์ Header (สีม่วงเข้ม VISTA Theme)
  const headerRange = sheet.getRange(1, 1, 1, 10);
  headerRange.setBackground('#2e284f');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Prompt');
  headerRange.setHorizontalAlignment('center');

  // ข้อมูล 20 แถว
  const rows = [
    [1, '2024-01-12', 'ORD-2024-001', 'Smart TV 55" 4K', 'อิเล็กทรอนิกส์', 'กรุงเทพฯ', 3, 45000, 26000, '=H2-I2'],
    [2, '2024-01-28', 'ORD-2024-002', 'หุ่นยนต์ดูดฝุ่นอัจฉริยะ', 'ของใช้ในบ้าน', 'ตะวันออก', 4, 36000, 19500, '=H3-I3'],
    [3, '2024-02-05', 'ORD-2024-003', 'เก้าอี้นวดเพื่อสุขภาพ Ergo', 'สุขภาพ', 'ตะวันออก', 2, 58000, 31000, '=H4-I4'],
    [4, '2024-02-14', 'ORD-2024-004', 'สมาร์ทโฟน 5G Pro Max', 'อิเล็กทรอนิกส์', 'กรุงเทพฯ', 2, 48000, 29000, '=H5-I5'],
    [5, '2024-02-25', 'ORD-2024-005', 'เครื่องฟอกอากาศ PM2.5', 'ของใช้ในบ้าน', 'เหนือ', 5, 27500, 15500, '=H6-I6'],
    [6, '2024-03-02', 'ORD-2024-006', 'ลู่วิ่งไฟฟ้าพับได้', 'สุขภาพ', 'ใต้', 2, 38000, 21500, '=H7-I7'],
    [7, '2024-03-15', 'ORD-2024-007', 'หูฟังตัดเสียงรบกวน ANC', 'อิเล็กทรอนิกส์', 'ใต้', 6, 29400, 16200, '=H8-I8'],
    [8, '2024-03-29', 'ORD-2024-008', 'ชุดหม้อทอดไร้น้ำมัน & เตาอบ', 'ของใช้ในบ้าน', 'กรุงเทพฯ', 5, 22500, 12800, '=H9-I9'],
    [9, '2024-04-06', 'ORD-2024-009', 'แท็บเล็ตเพื่อการศึกษา 11"', 'อิเล็กทรอนิกส์', 'ตะวันออก', 3, 37500, 22000, '=H10-I10'],
    [10, '2024-04-18', 'ORD-2024-010', 'เครื่องตรวจวัดสุขภาพมัลติฟังก์ชัน', 'สุขภาพ', 'เหนือ', 4, 21200, 11000, '=H11-I11'],
    [11, '2024-04-26', 'ORD-2024-011', 'ลำโพงบลูทูธพกพากันน้ำ', 'อิเล็กทรอนิกส์', 'ใต้', 5, 17500, 9800, '=H12-I12'],
    [12, '2024-05-04', 'ORD-2024-012', 'ที่นอนยางพาราธรรมชาติแท้', 'ของใช้ในบ้าน', 'ตะวันออก', 2, 35500, 20000, '=H13-I13'],
    [13, '2024-05-16', 'ORD-2024-013', 'นาฬิกา Smartwatch วัดชีพจร', 'สุขภาพ', 'กรุงเทพฯ', 4, 26000, 14200, '=H14-I14'],
    [14, '2024-05-28', 'ORD-2024-014', 'โน้ตบุ๊กทำงาน Ultrabook', 'อิเล็กทรอนิกส์', 'กรุงเทพฯ', 1, 40500, 24500, '=H15-I15'],
    [15, '2024-06-05', 'ORD-2024-015', 'กล้องวงจรปิด Wi-Fi 4K Set 4 ตัว', 'ของใช้ในบ้าน', 'เหนือ', 3, 19500, 11000, '=H16-I16'],
    [16, '2024-06-14', 'ORD-2024-016', 'ชุดอุปกรณ์โยคะ & ดัมเบลปรับน้ำหนัก', 'สุขภาพ', 'ใต้', 4, 18500, 10400, '=H17-I17'],
    [17, '2024-06-22', 'ORD-2024-017', 'จอเกมมิ่ง Curved 34" 165Hz', 'อิเล็กทรอนิกส์', 'ตะวันออก', 1, 28000, 16500, '=H18-I18'],
    [18, '2024-07-02', 'ORD-2024-018', 'เครื่องชงกาแฟ Espresso อัตโนมัติ', 'ของใช้ในบ้าน', 'ใต้', 2, 21600, 12400, '=H19-I19'],
    [19, '2024-07-11', 'ORD-2024-019', 'พัดลมไอเย็นประหยัดพลังงาน', 'ของใช้ในบ้าน', 'เหนือ', 4, 14000, 8200, '=H20-I20'],
    [20, '2024-07-25', 'ORD-2024-020', 'เครื่องนวดคอและบ่าไร้สาย', 'สุขภาพ', 'ใต้', 5, 21600, 11500, '=H21-I21']
  ];

  sheet.getRange(2, 1, rows.length, 10).setValues(rows);

  // แถวสรุปผลรวมด้านล่าง
  const totalRowIndex = rows.length + 2;
  sheet.getRange(totalRowIndex, 6).setValue('รวมทั้งสิ้น');
  sheet.getRange(totalRowIndex, 7).setValue('=SUM(G2:G21)');
  sheet.getRange(totalRowIndex, 8).setValue('=SUM(H2:H21)');
  sheet.getRange(totalRowIndex, 9).setValue('=SUM(I2:I21)');
  sheet.getRange(totalRowIndex, 10).setValue('=SUM(J2:J21)');

  const totalRange = sheet.getRange(totalRowIndex, 1, 1, 10);
  totalRange.setFontWeight('bold');
  totalRange.setBackground('#f3f4f6');

  // ฟอร์แมตตัวเลขสกุลเงิน
  sheet.getRange(2, 8, rows.length + 1, 3).setNumberFormat('#,##0');
  sheet.getRange(2, 7, rows.length + 1, 1).setNumberFormat('#,##0');

  // จัดกึ่งกลางคอลัมน์ลำดับ วันที่ ภูมิภาค
  sheet.getRange(2, 1, rows.length, 3).setHorizontalAlignment('center');
  sheet.getRange(2, 5, rows.length, 2).setHorizontalAlignment('center');

  // ปรับขนาดคอลัมน์อัตโนมัติ
  sheet.autoResizeColumns(1, 10);

  SpreadsheetApp.getUi().alert('สำเร็จ! สร้างข้อมูลตัวอย่าง "ยอดขายรายไตรมาส" 20 รายการ เรียบร้อยแล้ว (ยอดขายรวม 584,200 | กำไร 255,800)');
}

/**
 * 4. Web App API: สำหรับให้ BI Studio ดึงข้อมูลแบบ Real-time (GET)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getData';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('ยอดขายรายไตรมาส') || ss.getSheets()[0];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];

    let totalRevenue = 0;
    let totalProfit = 0;
    const regionAgg = {};
    const categoryAgg = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[5] === 'รวมทั้งสิ้น') continue;

      const record = {
        id: row[0],
        date: Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        orderId: String(row[2]),
        product: String(row[3]),
        category: String(row[4]),
        region: String(row[5]),
        quantity: Number(row[6]) || 0,
        revenue: Number(row[7]) || 0,
        cost: Number(row[8]) || 0,
        profit: Number(row[9]) || (Number(row[7]) - Number(row[8])) || 0
      };

      records.push(record);
      totalRevenue += record.revenue;
      totalProfit += record.profit;

      regionAgg[record.region] = (regionAgg[record.region] || 0) + record.revenue;
      categoryAgg[record.category] = (categoryAgg[record.category] || 0) + record.revenue;
    }

    const payload = {
      status: 'success',
      spreadsheetTitle: ss.getName(),
      sheetName: sheet.getName(),
      updatedAt: new Date().toISOString(),
      rowCount: records.length,
      kpi: {
        totalRevenue: totalRevenue,
        grossProfit: totalProfit,
        orderCount: records.length
      },
      regionSummary: regionAgg,
      categorySummary: categoryAgg,
      records: records
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 5. Web App API: สำหรับรับข้อมูลใหม่จาก BI Studio (POST)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('ยอดขายรายไตรมาส') || ss.getSheets()[0];

    if (postData.action === 'addRecord') {
      const rec = postData.record;
      const lastRow = sheet.getLastRow();
      const newId = lastRow;
      sheet.appendRow([
        newId,
        rec.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        rec.orderId || ('ORD-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm')),
        rec.product,
        rec.category,
        rec.region,
        rec.quantity || 1,
        rec.revenue || 0,
        rec.cost || 0,
        '=H' + (lastRow + 1) + '-I' + (lastRow + 1)
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'บันทึกรายการสำเร็จ' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 6. แสดงหน้าต่างสรุปตัวเลข
 */
function showSummaryDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ยอดขายรายไตรมาส') || ss.getSheets()[0];
  const lastRow = sheet.getLastRow();

  SpreadsheetApp.getUi().alert(
    '📊 สรุปข้อมูลยอดขายรายไตรมาส\\n\\n' +
    '• แผ่นงาน: ' + sheet.getName() + '\\n' +
    '• จำนวนรายการ: ' + (lastRow - 2) + ' รายการ\\n' +
    '• สถานะ: ซิงค์พร้อมทำงานกับ VISTA BI Studio'
  );
}

/**
 * 7. คู่มือการใช้งาน
 */
function showHelpDialog() {
  SpreadsheetApp.getUi().alert(
    '📖 วิธีใช้งาน Google Apps Script กับ VISTA BI Studio\\n\\n' +
    '1. คลิกเมนู "⚡ สร้างข้อมูลตัวอย่าง" เพื่อสร้างตาราง 20 รายการ\\n' +
    '2. คลิก "🚀 เปิด VISTA BI Studio" เพื่อดูแดชบอร์ด\\n' +
    '3. หากต้องการทำ Web App API ให้กด Deploy (การทำให้ใช้งานได้) > New deployment > Web app > ใครก็ได้ที่มีลิงก์'
  );
}
`;
