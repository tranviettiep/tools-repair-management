const fs = require('fs');

// 1. Create ProposalService.gs
const proposalServiceContent = `// ============================================
// ProposalService.gs - Spare Part Proposal CRUD
// ============================================

const ProposalService = {
  getAll(filters) {
    let data = getSheetData(SHEETS.PROPOSALS);
    data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, data: data, total: data.length };
  },

  save(body) {
    const item = body.data;
    if (item.id) {
      item.updated_at = new Date().toISOString();
      updateRow(SHEETS.PROPOSALS, 'id', item.id, item);
      return { success: true, data: item };
    } else {
      const data = getSheetData(SHEETS.PROPOSALS);
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const thisYearItems = data.filter(r => r.id && r.id.startsWith('PDX-' + yy + '-'));
      const seq = thisYearItems.length + 1;
      item.id = 'PDX-' + yy + '-' + String(seq).padStart(4, '0');
      item.created_at = new Date().toISOString();
      item.updated_at = item.created_at;
      insertRow(SHEETS.PROPOSALS, item);
      return { success: true, data: item };
    }
  },

  delete(id) {
    deleteRow(SHEETS.PROPOSALS, 'id', id);
    return { success: true };
  }
};
`;
fs.writeFileSync('gas/ProposalService.gs', proposalServiceContent, 'utf8');

// 2. Update Code.gs
let codeGs = fs.readFileSync('gas/Code.gs', 'utf8');
if (!codeGs.includes('PROPOSALS:')) {
    codeGs = codeGs.replace(
        "EXTERNAL_REPAIRS: 'external_repairs',",
        "EXTERNAL_REPAIRS: 'external_repairs',\n  PROPOSALS: 'proposals',"
    );
    
    codeGs = codeGs.replace(
        "[SHEETS.EXTERNAL_REPAIRS]: ['id', 'status', 'items', 'created_at', 'updated_at'],",
        "[SHEETS.EXTERNAL_REPAIRS]: ['id', 'status', 'items', 'created_at', 'updated_at'],\n    [SHEETS.PROPOSALS]: ['id', 'status', 'items', 'created_at', 'updated_at'],"
    );

    codeGs = codeGs.replace(
        "case 'get_external_repairs': return jsonResponse(ExternalRepairService.getAll(params));",
        "case 'get_external_repairs': return jsonResponse(ExternalRepairService.getAll(params));\n      case 'get_proposals': return jsonResponse(ProposalService.getAll(params));"
    );

    codeGs = codeGs.replace(
        "case 'delete_external_repair': return jsonResponse(ExternalRepairService.delete(body.id));",
        "case 'delete_external_repair': return jsonResponse(ExternalRepairService.delete(body.id));\n      case 'save_proposal': return jsonResponse(ProposalService.save(body));\n      case 'delete_proposal': return jsonResponse(ProposalService.delete(body.id));"
    );

    fs.writeFileSync('gas/Code.gs', codeGs, 'utf8');
}

console.log('Updated GAS files for Proposals');
