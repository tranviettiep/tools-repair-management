// ============================================
// SparePartService.gs - Spare parts CRUD & inventory
// ============================================

const SparePartService = {
  getAll(filters) {
    let data = getSheetData(SHEETS.PARTS);

    if (filters.category) data = data.filter(p => p.category === filters.category);
    if (filters.low_stock === 'true') data = data.filter(p => Number(p.quantity) <= Number(p.min_quantity));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(p =>
        (p.part_code || '').toLowerCase().includes(s) ||
        (p.part_name || '').toLowerCase().includes(s)
      );
    }

    return { success: true, data: data, total: data.length };
  },

  create(body) {
    const now = new Date().toISOString();
    const part = {
      id: generateId('pt'),
      part_code: body.part_code || '',
      part_name: body.part_name || '',
      category: body.category || '',
      unit: body.unit || 'cái',
      quantity: Number(body.quantity) || 0,
      min_quantity: Number(body.min_quantity) || 0,
      unit_price: Number(body.unit_price) || 0,
      supplier: body.supplier || '',
      notes: body.notes || '',
      created_at: now,
      updated_at: now
    };

    appendRow(SHEETS.PARTS, part);
    return { success: true, data: part };
  },

  update(id, body) {
    const data = {};
    ['part_code', 'part_name', 'category', 'unit', 'quantity', 'min_quantity', 'unit_price', 'supplier', 'notes'].forEach(key => {
      if (body[key] !== undefined) data[key] = body[key];
    });
    data.updated_at = new Date().toISOString();

    const updated = updateRow(SHEETS.PARTS, id, data);
    return updated
      ? { success: true, data: { id, ...data } }
      : { success: false, error: 'Không tìm thấy phụ tùng' };
  },

  remove(id) {
    const deleted = deleteRow(SHEETS.PARTS, id);
    return deleted
      ? { success: true }
      : { success: false, error: 'Không tìm thấy phụ tùng' };
  },

  importPart(body) {
    const parts = getSheetData(SHEETS.PARTS);
    const part = parts.find(p => p.id === body.part_id);

    if (!part) return { success: false, error: 'Không tìm thấy phụ tùng' };

    const qty = Number(body.quantity);
    if (qty <= 0) return { success: false, error: 'Số lượng phải lớn hơn 0' };

    // Update quantity
    const newQty = Number(part.quantity) + qty;
    updateRow(SHEETS.PARTS, body.part_id, { quantity: newQty, updated_at: new Date().toISOString() });

    // Log transaction
    const tx = {
      id: generateId('tx'),
      part_id: body.part_id,
      part_name: part.part_name,
      type: 'Nhập kho',
      quantity: qty,
      repair_request_id: '',
      performed_by: body.performed_by || '',
      performed_at: new Date().toISOString(),
      notes: body.notes || ''
    };
    appendRow(SHEETS.TRANSACTIONS, tx);

    return { success: true, data: { ...part, quantity: newQty } };
  },

  exportPart(body) {
    const parts = getSheetData(SHEETS.PARTS);
    const part = parts.find(p => p.id === body.part_id);

    if (!part) return { success: false, error: 'Không tìm thấy phụ tùng' };

    const qty = Number(body.quantity);
    if (qty <= 0) return { success: false, error: 'Số lượng phải lớn hơn 0' };
    if (Number(part.quantity) < qty) return { success: false, error: 'Số lượng tồn kho không đủ' };

    // Update quantity
    const newQty = Number(part.quantity) - qty;
    updateRow(SHEETS.PARTS, body.part_id, { quantity: newQty, updated_at: new Date().toISOString() });

    // Log transaction
    const tx = {
      id: generateId('tx'),
      part_id: body.part_id,
      part_name: part.part_name,
      type: 'Xuất kho',
      quantity: qty,
      repair_request_id: body.repair_request_id || '',
      performed_by: body.performed_by || '',
      performed_at: new Date().toISOString(),
      notes: body.notes || ''
    };
    appendRow(SHEETS.TRANSACTIONS, tx);

    return { success: true, data: { ...part, quantity: newQty } };
  },

  getTransactions(filters) {
    let data = getSheetData(SHEETS.TRANSACTIONS);

    if (filters.part_id) data = data.filter(t => t.part_id === filters.part_id);
    if (filters.type) data = data.filter(t => t.type === filters.type);

    data.sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));

    return { success: true, data: data, total: data.length };
  }
};
