// ============================================
// UserService.gs - User management
// ============================================

const UserService = {
  getAll() {
    const data = getSheetData(SHEETS.USERS);
    // Remove password hashes from response
    const safe = data.map(u => {
      const copy = { ...u };
      delete copy.password_hash;
      return copy;
    });
    return { success: true, data: safe };
  },

  create(body) {
    // Check duplicate username
    const existing = getSheetData(SHEETS.USERS);
    if (existing.find(u => u.username === body.username)) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại' };
    }

    const user = {
      id: generateId('u'),
      username: body.username || '',
      password_hash: body.password_hash || '',
      full_name: body.full_name || '',
      role: body.role || 'reporter',
      department: body.department || '',
      email: body.email || '',
      is_active: true,
      created_at: new Date().toISOString()
    };

    appendRow(SHEETS.USERS, user);

    const safe = { ...user };
    delete safe.password_hash;
    return { success: true, data: safe };
  },

  update(id, body) {
    const data = {};
    ['full_name', 'role', 'department', 'email', 'is_active'].forEach(key => {
      if (body[key] !== undefined) data[key] = body[key];
    });

    // Only update password if provided
    if (body.password_hash) {
      data.password_hash = body.password_hash;
    }

    const updated = updateRow(SHEETS.USERS, id, data);
    if (!updated) return { success: false, error: 'Không tìm thấy người dùng' };

    delete data.password_hash;
    return { success: true, data: { id, ...data } };
  },

  remove(id) {
    // Prevent deleting admin
    const users = getSheetData(SHEETS.USERS);
    const user = users.find(u => u.id === id);
    if (user && user.username === 'admin') {
      return { success: false, error: 'Không thể xóa tài khoản admin' };
    }

    const deleted = deleteRow(SHEETS.USERS, id);
    return deleted
      ? { success: true }
      : { success: false, error: 'Không tìm thấy người dùng' };
  }
};
