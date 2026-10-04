// ============================================
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
