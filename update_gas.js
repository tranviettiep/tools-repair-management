const fs = require('fs');

// 1. Create ExternalRepairService.gs
const extServiceContent = `// ============================================
// ExternalRepairService.gs - External Repair CRUD
// ============================================

const ExternalRepairService = {
  getAll(filters) {
    let data = getSheetData(SHEETS.EXTERNAL_REPAIRS);
    
    // Sort by created_at descending
    data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, data: data, total: data.length };
  },

  save(body) {
    const item = body.data;
    if (item.id) {
      item.updated_at = new Date().toISOString();
      updateRow(SHEETS.EXTERNAL_REPAIRS, 'id', item.id, item);
      return { success: true, data: item };
    } else {
      item.id = 'EXT-' + Date.now();
      item.created_at = new Date().toISOString();
      item.updated_at = item.created_at;
      insertRow(SHEETS.EXTERNAL_REPAIRS, item);
      return { success: true, data: item };
    }
  },

  delete(id) {
    deleteRow(SHEETS.EXTERNAL_REPAIRS, 'id', id);
    return { success: true };
  }
};
`;
fs.writeFileSync('gas/ExternalRepairService.gs', extServiceContent, 'utf8');

// 2. Update Code.gs
let codeGs = fs.readFileSync('gas/Code.gs', 'utf8');
if (!codeGs.includes('EXTERNAL_REPAIRS:')) {
    codeGs = codeGs.replace(
        "USERS: 'users',",
        "USERS: 'users',\n  EXTERNAL_REPAIRS: 'external_repairs',"
    );
    
    codeGs = codeGs.replace(
        "[SHEETS.USERS]: ['id', 'username', 'password_hash', 'full_name', 'department', 'role', 'is_active', 'created_at'],",
        "[SHEETS.USERS]: ['id', 'username', 'password_hash', 'full_name', 'department', 'role', 'is_active', 'created_at'],\n    [SHEETS.EXTERNAL_REPAIRS]: ['id', 'status', 'items', 'created_at', 'updated_at'],"
    );

    codeGs = codeGs.replace(
        "case 'get_users': return jsonResponse(UserService.getAll());",
        "case 'get_users': return jsonResponse(UserService.getAll());\n      case 'get_external_repairs': return jsonResponse(ExternalRepairService.getAll(params));"
    );

    codeGs = codeGs.replace(
        "case 'delete_user': return jsonResponse(UserService.delete(params));",
        "case 'delete_user': return jsonResponse(UserService.delete(params));\n      case 'save_external_repair': return jsonResponse(ExternalRepairService.save(body));\n      case 'delete_external_repair': return jsonResponse(ExternalRepairService.delete(body.id));"
    );

    fs.writeFileSync('gas/Code.gs', codeGs, 'utf8');
}

console.log('Updated Google Apps Script files');
