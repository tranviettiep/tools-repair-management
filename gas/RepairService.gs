// ============================================
// RepairService.gs - Repair request CRUD & workflow
// ============================================

const RepairService = {
  getAll(filters) {
    let data = getSheetData(SHEETS.REPAIRS);

    if (filters.status) data = data.filter(r => r.status === filters.status);
    if (filters.priority) data = data.filter(r => r.priority === filters.priority);
    if (filters.department) data = data.filter(r => r.department === filters.department);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(r =>
        (r.id || '').toLowerCase().includes(s) ||
        (r.machine_name || '').toLowerCase().includes(s) ||
        (r.fault_description || '').toLowerCase().includes(s)
      );
    }

    // Sort by reported_at descending
    data.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));

    return { success: true, data: data, total: data.length };
  },

  getById(id) {
    const data = getSheetData(SHEETS.REPAIRS);
    const repair = data.find(r => r.id === id);
    return repair
      ? { success: true, data: repair }
      : { success: false, error: 'Không tìm thấy yêu cầu' };
  },

  create(body) {
    // Generate sequential ID
    const data = getSheetData(SHEETS.REPAIRS);
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const todayRepairs = data.filter(r => r.id && r.id.includes(dateStr));
    const seq = todayRepairs.length + 1;
    const repairId = 'SC-' + dateStr + '-' + String(seq).padStart(3, '0');

    const repair = {
      id: repairId,
      machine_id: body.machine_id || '',
      machine_code: body.machine_code || '',
      machine_name: body.machine_name || '',
      department: body.department || '',
      fault_description: body.fault_description || '',
      priority: body.priority || 'Bình thường',
      status: 'Báo hỏng',
      reported_by: body.reported_by || '',
      reported_at: new Date().toISOString(),
      received_by: '',
      received_at: '',
      technician: '',
      repair_start: '',
      repair_end: '',
      repair_notes: '',
      fault_codes: '[]',
      parts_used: '[]',
      total_cost: 0,
      completed_by: '',
      completed_at: ''
    };

    appendRow(SHEETS.REPAIRS, repair);

    // Update machine status to 'Báo hỏng'
    if (body.machine_id) {
      updateRow(SHEETS.MACHINES, body.machine_id, { status: 'Báo hỏng', updated_at: new Date().toISOString() });
    }

    return { success: true, data: repair };
  },

  markExternal(body) {
    const ids = JSON.parse(body.repair_ids || '[]');
    const now = new Date().toISOString();
    const repairs = getSheetData(SHEETS.REPAIRS);
    ids.forEach(id => {
      const repair = repairs.find(r => r.id === id);
      if (!repair) return;
      updateRow(SHEETS.REPAIRS, id, { status: 'Sửa ngoài' });
      if (repair.machine_id) {
        updateRow(SHEETS.MACHINES, repair.machine_id, { status: 'Sửa ngoài', updated_at: now });
      }
    });
    return { success: true };
  },

  complete(id, body) {
    const now = new Date().toISOString();
    const faultCodes = JSON.parse(body.fault_codes || '[]');
    const partsUsed = JSON.parse(body.parts_used || '[]');

    if (faultCodes.length === 0) {
      return { success: false, error: 'Vui lòng chọn nguyên nhân hỏng (mã lỗi)' };
    }

    // Validate stock before deducting anything
    const parts = getSheetData(SHEETS.PARTS);
    for (const pu of partsUsed) {
      const part = parts.find(p => p.id === pu.part_id);
      if (!part) return { success: false, error: 'Không tìm thấy phụ tùng ' + (pu.part_name || '') };
      if (Number(part.quantity) < Number(pu.quantity)) {
        return { success: false, error: 'Tồn kho không đủ: ' + part.part_name };
      }
    }

    let cost = 0;
    for (const pu of partsUsed) {
      const part = parts.find(p => p.id === pu.part_id);
      cost += Number(pu.quantity) * (Number(part.unit_price) || 0);
      const res = SparePartService.exportPart({
        part_id: pu.part_id,
        quantity: pu.quantity,
        repair_request_id: id,
        performed_by: body.completed_by || '',
        notes: 'Vật tư tiêu hao sửa chữa'
      });
      if (!res.success) return res;
    }

    const data = {
      status: 'Đã sửa',
      repair_end: now,
      technician: body.completed_by || '',
      completed_by: body.completed_by || '',
      completed_at: now,
      repair_notes: body.repair_notes || '',
      fault_codes: JSON.stringify(faultCodes),
      parts_used: JSON.stringify(partsUsed),
      total_cost: cost
    };

    // Update machine status to 'Đã sửa'
    const repairs = getSheetData(SHEETS.REPAIRS);
    const repair = repairs.find(r => r.id === id);
    if (repair && repair.machine_id) {
      updateRow(SHEETS.MACHINES, repair.machine_id, { status: 'Đã sửa', updated_at: now });
    }

    const updated = updateRow(SHEETS.REPAIRS, id, data);
    
    // Check if this triggers external repair completion
    if (typeof ExternalRepairService !== 'undefined') {
      ExternalRepairService.checkAndUpdateStatusByRepairId(id);
    }
    
    return updated
      ? { success: true, data: { id, ...data } }
      : { success: false, error: 'Không tìm thấy yêu cầu' };
  },

  markReturned(id) {
    const now = new Date().toISOString();
    const repairs = getSheetData(SHEETS.REPAIRS);
    const repair = repairs.find(r => r.id === id);
    if (!repair) return { success: false, error: 'Không tìm thấy yêu cầu' };

    const updated = updateRow(SHEETS.REPAIRS, id, { status: 'Đã về', updated_at: now });
    if (repair.machine_id) {
      updateRow(SHEETS.MACHINES, repair.machine_id, { status: 'Đã về', updated_at: now });
    }
    
    // Check if this triggers external repair completion
    if (typeof ExternalRepairService !== 'undefined') {
      ExternalRepairService.checkAndUpdateStatusByRepairId(id);
    }
    
    return updated ? { success: true } : { success: false, error: 'Lỗi cập nhật' };
  },

  update(id, body) {
    const data = {};
    ['fault_description', 'priority', 'status', 'technician', 'repair_notes', 'parts_used', 'total_cost'].forEach(key => {
      if (body[key] !== undefined) data[key] = body[key];
    });

    const updated = updateRow(SHEETS.REPAIRS, id, data);
    return updated
      ? { success: true, data: { id, ...data } }
      : { success: false, error: 'Không tìm thấy yêu cầu' };
  }
};
