// ============================================
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
      updateRow(SHEETS.EXTERNAL_REPAIRS, item.id, item);

      if (item.status === 'Hoàn thành' && item.items) {
        try {
          const itemsArr = JSON.parse(item.items);
          const repairIds = itemsArr.map(it => it.repair_id).filter(Boolean);
          const repairs = getSheetData(SHEETS.REPAIRS);
          const now = new Date().toISOString();
          repairIds.forEach(rId => {
            const repair = repairs.find(r => r.id === rId);
            if (repair && repair.machine_id) {
               updateRow(SHEETS.MACHINES, repair.machine_id, { status: 'Đã về', updated_at: now });
               updateRow(SHEETS.REPAIRS, rId, { status: 'Đã về' });
            }
          });
        } catch(e) {}
      }

      return { success: true, data: item };
    } else {
      const data = getSheetData(SHEETS.EXTERNAL_REPAIRS);
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const thisYearItems = data.filter(r => r.id && r.id.startsWith('SCCC-' + yy + '-'));
      const seq = thisYearItems.length + 1;
      item.id = 'SCCC-' + yy + '-' + String(seq).padStart(4, '0');

      item.created_at = new Date().toISOString();
      item.updated_at = item.created_at;
      appendRow(SHEETS.EXTERNAL_REPAIRS, item);
      return { success: true, data: item };
    }
  },

  delete(id) {
    deleteRow(SHEETS.EXTERNAL_REPAIRS, id);
    return { success: true };
  },

  checkAndUpdateStatusByRepairId(repairId) {
    const extRepairs = getSheetData(SHEETS.EXTERNAL_REPAIRS);
    const allRepairs = getSheetData(SHEETS.REPAIRS);
    
    for (const ext of extRepairs) {
      if (!ext.items || !ext.items.includes(repairId)) continue;
      
      try {
        const items = JSON.parse(ext.items);
        const hasThisRepair = items.some(it => it.repair_id === repairId);
        if (!hasThisRepair) continue;
        
        let allCompleted = true;
        for (const item of items) {
          if (!item.repair_id) continue;
          const r = allRepairs.find(rep => rep.id === item.repair_id);
          if (r && r.status !== 'Đã về' && r.status !== 'Đã sửa') {
            allCompleted = false;
            break;
          }
        }
        
        const newStatus = allCompleted ? 'Hoàn thành' : 'Đang sửa';
        if (ext.status !== newStatus) {
          updateRow(SHEETS.EXTERNAL_REPAIRS, ext.id, { 
            status: newStatus, 
            updated_at: new Date().toISOString() 
          });
        }
      } catch (e) {}
    }
  }
};
