// ============================================
// Users.js - User management page (Admin only)
// ============================================

const UsersPage = {
  users: [],

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div>
            <h2>Quản lý người dùng</h2>
            <p class="page-subtitle">Tài khoản, vai trò và quyền truy cập</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary" onclick="UsersPage.showAddModal()"><i data-lucide="plus"></i> Thêm người dùng</button>
          </div>
        </div>
        <div class="table-wrapper">
          <div id="users-table-body">
            <div class="loading-inline"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const result = await API.getUsers();
    if (result.success) {
      this.users = result.data;
      this.renderTable();
    } else {
      Toast.error('Không thể tải danh sách người dùng');
    }
  },

  renderTable() {
    const container = document.getElementById('users-table-body');
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Họ tên</th>
            <th>Vai trò</th>
            <th>Bộ phận</th>
            <th>Email</th>
            <th>Trạng thái</th>
            <th style="width:50px"></th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map(u => `
            <tr>
              <td><strong>${Utils.escapeHtml(u.username)}</strong></td>
              <td>${Utils.escapeHtml(u.full_name)}</td>
              <td>${Utils.getRoleBadge(u.role)}</td>
              <td>${Utils.escapeHtml(u.department || '—')}</td>
              <td class="text-muted">${Utils.escapeHtml(u.email || '—')}</td>
              <td>${u.is_active ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>' : '<span class="badge badge-inactive"><span class="badge-dot"></span>Inactive</span>'}</td>
              <td>
                <div class="action-menu">
                  <button class="action-menu-trigger" onclick="UsersPage.toggleActions(this)">⋮</button>
                  <div class="action-menu-dropdown">
                    <div class="action-menu-item" onclick="UsersPage.showEditModal('${u.id}')"><i data-lucide="pencil"></i> Sửa</div>
                    <div class="action-menu-item" onclick="UsersPage.toggleActive('${u.id}', ${!u.is_active})">${u.is_active ? '<i data-lucide="lock"></i> Vô hiệu hóa' : '<i data-lucide="lock-open"></i> Kích hoạt'}</div>
                    <div class="action-menu-item danger" onclick="UsersPage.deleteUser('${u.id}')"><i data-lucide="trash-2"></i> Xóa</div>
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  showAddModal() { this._showUserForm(null); },
  showEditModal(id) { this._showUserForm(this.users.find(u => u.id === id)); },

  _showUserForm(user) {
    const isEdit = !!user;
    const content = `
      <form onsubmit="return false">
        <div class="form-row">
          <div class="form-group">
            <label>Tên đăng nhập <span class="required">*</span></label>
            <input type="text" class="form-input" id="f-username" value="${Utils.escapeHtml(user?.username || '')}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} required>
          </div>
          <div class="form-group">
            <label>${isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} ${!isEdit ? '<span class="required">*</span>' : ''}</label>
            <input type="password" class="form-input" id="f-password" placeholder="${isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}" ${!isEdit ? 'required' : ''}>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Họ tên <span class="required">*</span></label>
            <input type="text" class="form-input" id="f-fullname" value="${Utils.escapeHtml(user?.full_name || '')}" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-input" id="f-email" value="${Utils.escapeHtml(user?.email || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Vai trò <span class="required">*</span></label>
            <select class="form-select" id="f-role" required>
              <option value="reporter" ${user?.role === 'reporter' ? 'selected' : ''}>Người báo hỏng</option>
              <option value="technician" ${user?.role === 'technician' ? 'selected' : ''}>Kỹ thuật viên</option>
              <option value="manager" ${user?.role === 'manager' ? 'selected' : ''}>Trưởng bộ phận</option>
              <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bộ phận</label>
            <select class="form-select" id="f-user-dept">
              <option value="">-- Tất cả --</option>
              ${['Phân xưởng A', 'Phân xưởng B', 'Phân xưởng C', 'Phân xưởng D'].map(d =>
                `<option value="${d}" ${user?.department === d ? 'selected' : ''}>${d}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Hủy</button>
      <button class="btn btn-primary" onclick="UsersPage.saveUser('${user?.id || ''}')"><i data-lucide="save"></i> ${isEdit ? 'Cập nhật' : 'Tạo mới'}</button>
    `;

    Modal.show({ title: isEdit ? '<i data-lucide="pencil"></i> Sửa người dùng' : '<i data-lucide="user"></i> Thêm người dùng', content, footer });
  },

  async saveUser(id) {
    const data = {
      username: document.getElementById('f-username').value.trim(),
      full_name: document.getElementById('f-fullname').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      role: document.getElementById('f-role').value,
      department: document.getElementById('f-user-dept').value,
    };

    const password = document.getElementById('f-password').value;
    if (password) data.password = password;

    if (!data.username || !data.full_name || !data.role) {
      Toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!id && !password) {
      Toast.warning('Vui lòng nhập mật khẩu');
      return;
    }

    const result = id ? await API.updateUser(id, data) : await API.createUser(data);
    if (result.success) {
      Toast.success(id ? 'Cập nhật thành công' : 'Tạo người dùng thành công');
      Modal.closeAll();
      await this.loadData();
    } else {
      Toast.error(result.error || 'Có lỗi xảy ra');
    }
  },

  async toggleActive(id, active) {
    const result = await API.updateUser(id, { is_active: active });
    if (result.success) {
      Toast.success(active ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
      await this.loadData();
    } else {
      Toast.error(result.error);
    }
  },

  async deleteUser(id) {
    const user = this.users.find(u => u.id === id);
    if (user?.username === 'admin') {
      Toast.error('Không thể xóa tài khoản admin');
      return;
    }

    const confirmed = await Modal.confirm({
      title: 'Xóa người dùng',
      message: `Xóa tài khoản "${user?.full_name}"?`,
      icon: '<i data-lucide="trash-2"></i>',
      confirmText: 'Xóa',
      danger: true
    });

    if (confirmed) {
      const result = await API.deleteUser(id);
      if (result.success) {
        Toast.success('Đã xóa người dùng');
        await this.loadData();
      } else {
        Toast.error(result.error);
      }
    }
  },

  toggleActions(btn) {
    document.querySelectorAll('.action-menu-dropdown.show').forEach(d => d.classList.remove('show'));
    const dropdown = btn.nextElementSibling;
    dropdown.classList.toggle('show');
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }
};
