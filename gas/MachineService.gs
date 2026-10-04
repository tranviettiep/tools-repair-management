// ============================================
// MachineService.gs - Machine CRUD
// ============================================

const MachineService = {
  getAll(filters) {
    let data = getSheetData(SHEETS.MACHINES);

    if (filters.machine_type) data = data.filter(m => m.machine_type === filters.machine_type);
    if (filters.department) data = data.filter(m => m.department === filters.department);
    if (filters.status) data = data.filter(m => m.status === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(m =>
        (m.machine_code || '').toLowerCase().includes(s) ||
        (m.machine_name || '').toLowerCase().includes(s)
      );
    }

    return { success: true, data: data, total: data.length };
  },

  getById(id) {
    const data = getSheetData(SHEETS.MACHINES);
    const machine = data.find(m => m.id === id);
    return machine
      ? { success: true, data: machine }
      : { success: false, error: 'Không tìm thấy máy' };
  },

  create(body) {
    const now = new Date().toISOString();
    const machine = {
      id: generateId('m'),
      machine_code: body.machine_code || '',
      machine_name: body.machine_name || '',
      machine_type: body.machine_type || '',
      department: body.department || '',
      location: body.location || '',
      status: body.status || 'Hoạt động',
      notes: body.notes || '',
      created_at: now,
      updated_at: now
    };

    appendRow(SHEETS.MACHINES, machine);
    return { success: true, data: machine };
  },

  update(id, body) {
    const data = {
      machine_code: body.machine_code,
      machine_name: body.machine_name,
      machine_type: body.machine_type,
      department: body.department,
      location: body.location,
      status: body.status,
      notes: body.notes,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(data).forEach(k => { if (data[k] === undefined) delete data[k]; });

    const updated = updateRow(SHEETS.MACHINES, id, data);
    return updated
      ? { success: true, data: { id, ...data } }
      : { success: false, error: 'Không tìm thấy máy' };
  },

  remove(id) {
    const deleted = deleteRow(SHEETS.MACHINES, id);
    return deleted
      ? { success: true }
      : { success: false, error: 'Không tìm thấy máy' };
  }
};
