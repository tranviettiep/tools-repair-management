// ============================================
// Code.gs - Google Apps Script Entry Point
// Deploy as Web App
// ============================================

// Spreadsheet ID - Replace with your actual spreadsheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Sheet names
const SHEETS = {
  MACHINES: 'machines',
  REPAIRS: 'repair_requests',
  PARTS: 'spare_parts',
  TRANSACTIONS: 'parts_transactions',
  USERS: 'users',
  EXTERNAL_REPAIRS: 'external_repairs',
  PROPOSALS: 'proposals',
  CONFIG: 'config',
  SESSIONS: 'sessions'
};

// ── Web App Entry Points ──

function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const token = params.token;

  // CORS headers handled via ContentService

  try {
    // Verify auth for protected actions
    if (action !== 'login' && action !== 'verify_token') {
      const authResult = AuthService.verifyToken(token);
      if (!authResult.success) {
        return jsonResponse({ success: false, error: 'Phiên đăng nhập hết hạn' });
      }
    }

    switch (action) {
      // Machines
      case 'get_machines': return jsonResponse(MachineService.getAll(params));
      case 'get_machine': return jsonResponse(MachineService.getById(params.id));

      // Repairs
      case 'get_repairs': return jsonResponse(RepairService.getAll(params));
      case 'get_repair': return jsonResponse(RepairService.getById(params.id));

      // Spare Parts
      case 'get_parts': return jsonResponse(SparePartService.getAll(params));
      case 'get_part_transactions': return jsonResponse(SparePartService.getTransactions(params));

      // Reports
      case 'get_dashboard_stats': return jsonResponse(ReportService.getDashboardStats());
      case 'get_repair_report': return jsonResponse(ReportService.getRepairReport(params));
      case 'get_cost_report': return jsonResponse(ReportService.getCostReport(params));
      case 'get_frequency_report': return jsonResponse(ReportService.getFrequencyReport(params));

      // Users
      case 'get_users': return jsonResponse(UserService.getAll());
      case 'get_external_repairs': return jsonResponse(ExternalRepairService.getAll(params));
      case 'get_proposals': return jsonResponse(ProposalService.getAll(params));

      // Config
      case 'get_config': return jsonResponse(getConfig());

      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request body' });
  }

  const action = body.action;
  const token = body.token;

  try {
    // Auth actions don't need token
    if (action === 'login') {
      return jsonResponse(AuthService.login(body.username, body.password_hash));
    }
    if (action === 'verify_token') {
      return jsonResponse(AuthService.verifyToken(token));
    }
    if (action === 'logout') {
      return jsonResponse(AuthService.logout(token));
    }

    // Verify token for all other actions
    const authResult = AuthService.verifyToken(token);
    if (!authResult.success) {
      return jsonResponse({ success: false, error: 'Phiên đăng nhập hết hạn' });
    }

    switch (action) {
      // Machines
      case 'create_machine': return jsonResponse(MachineService.create(body));
      case 'update_machine': return jsonResponse(MachineService.update(body.id, body));
      case 'delete_machine': return jsonResponse(MachineService.remove(body.id));

      // Repairs
      case 'create_repair': return jsonResponse(RepairService.create(body));
      case 'mark_repairs_external': return jsonResponse(RepairService.markExternal(body));
      case 'mark_repair_returned': return jsonResponse(RepairService.markReturned(body.id));
      case 'complete_repair': return jsonResponse(RepairService.complete(body.id, body));
      case 'update_repair': return jsonResponse(RepairService.update(body.id, body));

      // Spare Parts
      case 'create_part': return jsonResponse(SparePartService.create(body));
      case 'update_part': return jsonResponse(SparePartService.update(body.id, body));
      case 'delete_part': return jsonResponse(SparePartService.remove(body.id));
      case 'import_part': return jsonResponse(SparePartService.importPart(body));
      case 'export_part': return jsonResponse(SparePartService.exportPart(body));

      // Users
      case 'create_user': return jsonResponse(UserService.create(body));
      case 'update_user': return jsonResponse(UserService.update(body.id, body));
      case 'delete_user': return jsonResponse(UserService.remove(body.id));

      // External Repairs
      case 'save_external_repair': return jsonResponse(ExternalRepairService.save(body));
      case 'delete_external_repair': return jsonResponse(ExternalRepairService.delete(body.id));

      // Config
      case 'update_config': return jsonResponse(updateConfig(body.key, body.value));

      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Helpers ──

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}

function updateRow(sheetName, id, data) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idCol] === id) {
      headers.forEach((h, j) => {
        if (data[h] !== undefined && h !== 'id') {
          sheet.getRange(i + 1, j + 1).setValue(data[h]);
        }
      });
      return true;
    }
  }
  return false;
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');

  for (let i = allData.length - 1; i >= 1; i--) {
    if (allData[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId(prefix) {
  return prefix + '-' + new Date().getTime().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

// ── Config ──

function getConfig() {
  const data = getSheetData(SHEETS.CONFIG);
  return { success: true, data: data };
}

function updateConfig(key, value) {
  const sheet = getSheet(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true };
    }
  }

  // Key not found, add new
  sheet.appendRow([key, value, '']);
  return { success: true };
}

// ── Setup Function (run once) ──

function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create sheets with headers
  const sheetsConfig = {
    [SHEETS.MACHINES]: ['id', 'machine_code', 'machine_name', 'machine_type', 'department', 'location', 'status', 'notes', 'created_at', 'updated_at'],
    [SHEETS.REPAIRS]: ['id', 'machine_id', 'machine_code', 'machine_name', 'department', 'fault_description', 'priority', 'status', 'reported_by', 'reported_at', 'received_by', 'received_at', 'technician', 'repair_start', 'repair_end', 'repair_notes', 'fault_codes', 'parts_used', 'total_cost', 'completed_by', 'completed_at'],
    [SHEETS.PARTS]: ['id', 'part_code', 'part_name', 'category', 'unit', 'quantity', 'min_quantity', 'unit_price', 'supplier', 'notes', 'created_at', 'updated_at'],
    [SHEETS.TRANSACTIONS]: ['id', 'part_id', 'part_name', 'type', 'quantity', 'repair_request_id', 'performed_by', 'performed_at', 'notes'],
    [SHEETS.USERS]: ['id', 'username', 'password_hash', 'full_name', 'role', 'department', 'email', 'is_active', 'created_at'],
    [SHEETS.CONFIG]: ['key', 'value', 'description'],
    [SHEETS.SESSIONS]: ['token', 'user_id', 'created_at', 'expires_at']
  };

  Object.entries(sheetsConfig).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  });

  // Add default admin user
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet.getLastRow() <= 1) {
    // Default password: admin123 (SHA256)
    const adminHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    usersSheet.appendRow(['u-1', 'admin', adminHash, 'Quản trị viên', 'admin', '', 'admin@company.com', true, new Date().toISOString()]);
  }

  // Add default config
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  if (configSheet.getLastRow() <= 1) {
    configSheet.appendRow(['machine_types', '["Máy mài tay","Máy mài góc","Máy đục tay","Máy khoan tay","Máy cắt"]', 'Danh sách loại máy']);
    configSheet.appendRow(['departments', '["Phân xưởng A","Phân xưởng B","Phân xưởng C","Phân xưởng D"]', 'Danh sách bộ phận']);
    configSheet.appendRow(['part_categories', '["Điện","Cơ khí","Mài","Đục","Cắt","Khoan","Bôi trơn"]', 'Danh sách loại phụ tùng']);
    configSheet.appendRow(['fault_codes', '[]', 'Danh sách mã lỗi theo loại máy']);
  }

  Logger.log('Setup completed successfully!');
}
