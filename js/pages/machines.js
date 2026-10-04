// ============================================
// Machines.js - Machine management page
// ============================================

const MachinesPage = {
  machines: [],
  filteredMachines: [],
  currentPage: 1,
  pageSize: 50,
  filters: { search: '', machine_type: '', department: '', status: '' },

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>🔧 Máy công cụ</h2>
          <div class="page-header-actions">
            ${Auth.can('create_machine') ? '<button class="btn btn-primary" onclick="MachinesPage.showAddModal()">+ Thêm máy mới</button>' : ''}
          </div>
        </div>

        <div class="table-wrapper">
          <div class="table-toolbar">
            <div class="table-search">
              <span class="search-icon">🔍</span>
              <input type="text" placeholder="Tìm theo mã máy, tên máy..."
                     id="machine-search" oninput="MachinesPage.onSearch(this.value)">
            </div>
            <div class="table-filters">
              <select id="filter-type" onchange="MachinesPage.onFilter()">
                <option value="">Tất cả loại máy</option>
                <option value="Máy mài tay">Máy mài tay</option>
                <option value="Máy mài góc">Máy mài góc</option>
                <option value="Máy đục tay">Máy đục tay</option>
                <option value="Máy khoan tay">Máy khoan tay</option>
                <option value="Máy cắt">Máy cắt</option>
              </select>
              <select id="filter-dept" onchange="MachinesPage.onFilter()">
                <option value="">Tất cả bộ phận</option>
                <option value="Phân xưởng A">Phân xưởng A</option>
                <option value="Phân xưởng B">Phân xưởng B</option>
                <option value="Phân xưởng C">Phân xưởng C</option>
                <option value="Phân xưởng D">Phân xưởng D</option>
              </select>
              <select id="filter-status" onchange="MachinesPage.onFilter()">
                <option value="">Tất cả trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Báo hỏng">Báo hỏng</option>
                <option value="Sửa ngoài">Sửa ngoài</option>
                <option value="Đã về">Đã về</option>
                <option value="Đã sửa">Đã sửa</option>
                <option value="Ngừng sử dụng">Ngừng sử dụng</option>
              </select>
            </div>
          </div>

          <div id="machines-table-body">
            <div class="loading-inline"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const result = await API.getMachines();
    if (result.success) {
      this.machines = result.data;
      this.applyFilters();
    } else {
      Toast.error('Không thể tải danh sách máy');
    }
  },

  onSearch: Utils.debounce(function(value) {
    MachinesPage.filters.search = value;
    MachinesPage.currentPage = 1;
    MachinesPage.applyFilters();
  }, 300),

  onFilter() {
    this.filters.machine_type = document.getElementById('filter-type').value;
    this.filters.department = document.getElementById('filter-dept').value;
    this.filters.status = document.getElementById('filter-status').value;
    this.currentPage = 1;
    this.applyFilters();
  },

  applyFilters() {
    let result = [...this.machines];

    if (this.filters.search) {
      const s = this.filters.search.toLowerCase();
      result = result.filter(m =>
        m.machine_code.toLowerCase().includes(s) ||
        m.machine_name.toLowerCase().includes(s)
      );
    }
    if (this.filters.machine_type) result = result.filter(m => m.machine_type === this.filters.machine_type);
    if (this.filters.department) result = result.filter(m => m.department === this.filters.department);
    if (this.filters.status) result = result.filter(m => m.status === this.filters.status);

    // Department filter for non-admin
    if (!Auth.isAdmin() && Auth.currentUser?.department) {
      result = result.filter(m => m.department === Auth.currentUser.department);
    }

    this.filteredMachines = result;
    this.renderTable();
  },

  renderTable() {
    const container = document.getElementById('machines-table-body');
    const total = this.filteredMachines.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);
    const pageData = this.filteredMachines.slice(start, end);
    const totalPages = Math.ceil(total / this.pageSize);

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔧</div>
          <div class="empty-state-title">Không tìm thấy máy nào</div>
          <div class="empty-state-desc">Thử thay đổi bộ lọc hoặc thêm máy mới</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px"><input type="checkbox" class="table-checkbox" onchange="MachinesPage.toggleAll(this.checked)"></th>
            <th>Mã máy</th>
            <th>Tên máy</th>
            <th>Loại máy</th>
            <th>Bộ phận</th>
            <th>Vị trí</th>
            <th>Trạng thái</th>
            <th style="width:50px"></th>
          </tr>
        </thead>
        <tbody>
          ${pageData.map(m => `
            <tr data-id="${m.id}">
              <td><input type="checkbox" class="table-checkbox row-checkbox" value="${m.id}"></td>
              <td><strong style="color:var(--accent-secondary)">${Utils.escapeHtml(m.machine_code)}</strong></td>
              <td>${Utils.escapeHtml(m.machine_name)}</td>
              <td>${Utils.escapeHtml(m.machine_type)}</td>
              <td>${Utils.escapeHtml(m.department)}</td>
              <td class="text-muted">${Utils.escapeHtml(m.location)}</td>
              <td>${Utils.getStatusBadge(m.status)}</td>
              <td>
                <div class="action-menu">
                  <button class="action-menu-trigger" onclick="MachinesPage.toggleActions(this)">⋮</button>
                  <div class="action-menu-dropdown">
                    <div class="action-menu-item" onclick="MachinesPage.showDetail('${m.id}')">👁 Xem chi tiết</div>
                    ${Auth.can('edit_machine') ? `<div class="action-menu-item" onclick="MachinesPage.showEditModal('${m.id}')">✏️ Sửa</div>` : ''}
                    ${Auth.can('create_repair') ? `<div class="action-menu-item" onclick="MachinesPage.reportFault('${m.id}')">🔔 Báo hỏng</div>` : ''}
                    ${Auth.can('delete_machine') ? `<div class="action-menu-item danger" onclick="MachinesPage.deleteMachine('${m.id}')">🗑 Xóa</div>` : ''}
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="table-pagination">
        <span class="pagination-info">Hiển thị ${start + 1}-${end} / ${total} máy</span>
        <div class="pagination-controls">
          <button class="pagination-btn" onclick="MachinesPage.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>
          <button class="pagination-btn" onclick="MachinesPage.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
          ${this._renderPageNumbers(totalPages)}
          <button class="pagination-btn" onclick="MachinesPage.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>
          <button class="pagination-btn" onclick="MachinesPage.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>»</button>
        </div>
      </div>
    `;
  },

  _renderPageNumbers(totalPages) {
    let pages = [];
    const current = this.currentPage;
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(totalPages, current + delta); i++) {
      pages.push(i);
    }
    return pages.map(p =>
      `<button class="pagination-btn ${p === current ? 'active' : ''}" onclick="MachinesPage.goToPage(${p})">${p}</button>`
    ).join('');
  },

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredMachines.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderTable();
  },

  toggleAll(checked) {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
  },

  toggleActions(btn) {
    // Close all others
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
  },

  showAddModal() {
    this._showMachineForm(null);
  },

  showEditModal(id) {
    const machine = this.machines.find(m => m.id === id);
    if (machine) this._showMachineForm(machine);
  },

  _showMachineForm(machine) {
    const isEdit = !!machine;
    const title = isEdit ? '✏️ Sửa thông tin máy' : '🔧 Thêm máy mới';

    let content = '';
    if (isEdit) {
      content = `
      <form id="machine-form" onsubmit="return false">
        <div class="form-row machine-entry">
          <div class="form-group">
            <label>Mã máy <span class="required">*</span></label>
            <input type="text" class="form-input f-machine-code" value="${Utils.escapeHtml(machine.machine_code)}" required>
          </div>
          <div class="form-group">
            <label>Tên máy <span class="required">*</span></label>
            <input type="text" class="form-input f-machine-name" value="${Utils.escapeHtml(machine.machine_name)}" required>
          </div>
        </div>
        <div class="form-row machine-entry">
          <div class="form-group">
            <label>Loại máy <span class="required">*</span></label>
            <select class="form-select f-machine-type" required>
              ${['Máy mài tay', 'Máy mài góc', 'Máy đục tay', 'Máy khoan tay', 'Máy cắt'].map(t => `<option value="${t}" ${machine.machine_type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Bộ phận <span class="required">*</span></label>
            <select class="form-select f-department" required>
              ${['Phân xưởng A', 'Phân xưởng B', 'Phân xưởng C', 'Phân xưởng D'].map(d => `<option value="${d}" ${machine.department === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Vị trí</label>
            <input type="text" class="form-input" id="f-location" value="${Utils.escapeHtml(machine.location || '')}">
          </div>
          <div class="form-group">
            <label>Trạng thái</label>
            <select class="form-select" id="f-status">
              ${['Hoạt động', 'Báo hỏng', 'Sửa ngoài', 'Đã về', 'Đã sửa', 'Ngừng sử dụng'].map(s => `<option value="${s}" ${machine.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Ghi chú</label>
          <textarea class="form-textarea" id="f-notes" rows="3">${Utils.escapeHtml(machine.notes || '')}</textarea>
        </div>
      </form>
      `;
    } else {
      content = `
      <form id="machine-form" onsubmit="return false">
        <div id="machine-entries"></div>
        <button class="btn btn-secondary btn-sm" onclick="MachinesPage.addMachineRow()" style="margin-top:10px">+ Thêm thiết bị</button>
      </form>
      `;
    }

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Hủy</button>
      <button class="btn btn-primary" onclick="MachinesPage.saveMachine('${machine?.id || ''}')">💾 ${isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
    `;

    Modal.show({ title, content, footer, size: isEdit ? 'md' : 'lg' });
    if (!isEdit) this.addMachineRow();
  },

  addMachineRow() {
    const container = document.getElementById('machine-entries');
    const row = document.createElement('div');
    row.className = 'machine-entry';
    row.style.cssText = 'padding:16px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:12px; display:flex; flex-wrap:wrap; gap:12px; position:relative; background:var(--bg-secondary)';
    row.innerHTML = `
      <div style="flex:1; min-width:180px">
        <label style="font-size:12px; color:var(--text-muted); margin-bottom:4px; display:block">Mã máy *</label>
        <input type="text" class="form-input f-machine-code" required>
      </div>
      <div style="flex:1; min-width:180px">
        <label style="font-size:12px; color:var(--text-muted); margin-bottom:4px; display:block">Tên máy *</label>
        <input type="text" class="form-input f-machine-name" required>
      </div>
      <div style="flex:1; min-width:150px">
        <label style="font-size:12px; color:var(--text-muted); margin-bottom:4px; display:block">Loại máy *</label>
        <select class="form-select f-machine-type" required>
          <option value="">-- Chọn --</option>
          ${['Máy mài tay', 'Máy mài góc', 'Máy đục tay', 'Máy khoan tay', 'Máy cắt'].map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div style="flex:1; min-width:150px">
        <label style="font-size:12px; color:var(--text-muted); margin-bottom:4px; display:block">Bộ phận *</label>
        <select class="form-select f-department" required>
          <option value="">-- Chọn --</option>
          ${['Phân xưởng A', 'Phân xưởng B', 'Phân xưởng C', 'Phân xưởng D'].map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-ghost" onclick="this.parentElement.remove()" style="color:var(--status-danger); position:absolute; top:-10px; right:-10px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:50%; width:24px; height:24px; padding:0; display:flex; align-items:center; justify-content:center; font-size:12px">✕</button>
    `;
    container.appendChild(row);
  },

  async saveMachine(id) {
    const isEdit = !!id;

    if (isEdit) {
      const data = {
        machine_code: document.querySelector('.f-machine-code').value.trim(),
        machine_name: document.querySelector('.f-machine-name').value.trim(),
        machine_type: document.querySelector('.f-machine-type').value,
        department: document.querySelector('.f-department').value,
        location: document.getElementById('f-location').value.trim(),
        status: document.getElementById('f-status').value,
        notes: document.getElementById('f-notes').value.trim(),
      };
      if (!data.machine_code || !data.machine_name) {
        Toast.warning('Vui lòng điền đủ mã và tên máy');
        return;
      }
      const result = await API.updateMachine(id, data);
      if (result.success) {
        Toast.success('Cập nhật thành công');
        Modal.closeAll();
        await this.loadData();
      } else {
        Toast.error(result.error);
      }
    } else {
      const entries = document.querySelectorAll('.machine-entry');
      if (entries.length === 0) return;

      let valid = true;
      let dataList = [];
      entries.forEach(entry => {
        const data = {
          machine_code: entry.querySelector('.f-machine-code').value.trim(),
          machine_name: entry.querySelector('.f-machine-name').value.trim(),
          machine_type: entry.querySelector('.f-machine-type').value,
          department: entry.querySelector('.f-department').value,
          location: '',
          status: 'Hoạt động',
          notes: ''
        };
        if (!data.machine_code || !data.machine_name || !data.machine_type || !data.department) valid = false;
        dataList.push(data);
      });

      if (!valid) {
        Toast.warning('Vui lòng điền đầy đủ thông tin cho tất cả các máy');
        return;
      }

      Toast.info('Đang thêm thiết bị...');
      let successCount = 0;
      for (const data of dataList) {
        const result = await API.createMachine(data);
        if (result.success) successCount++;
      }
      Toast.success(`Đã thêm ${successCount}/${dataList.length} máy mới`);
      Modal.closeAll();
      await this.loadData();
    }
  },

  async deleteMachine(id) {
    const machine = this.machines.find(m => m.id === id);
    const confirmed = await Modal.confirm({
      title: 'Xóa máy công cụ',
      message: `Bạn có chắc muốn xóa "${machine?.machine_name}"? Hành động này không thể hoàn tác.`,
      icon: '🗑️',
      confirmText: 'Xóa',
      danger: true
    });

    if (confirmed) {
      const result = await API.deleteMachine(id);
      if (result.success) {
        Toast.success('Đã xóa máy thành công');
        await this.loadData();
      } else {
        Toast.error(result.error || 'Có lỗi xảy ra');
      }
    }
  },

  showDetail(id) {
    const m = this.machines.find(m => m.id === id);
    if (!m) return;

    Modal.show({
      title: `🔧 ${Utils.escapeHtml(m.machine_name)}`,
      content: `
        <div class="info-card">
          <div class="info-row"><span class="label">Mã máy:</span><span class="value">${Utils.escapeHtml(m.machine_code)}</span></div>
          <div class="info-row"><span class="label">Loại máy:</span><span class="value">${Utils.escapeHtml(m.machine_type)}</span></div>
          <div class="info-row"><span class="label">Bộ phận:</span><span class="value">${Utils.escapeHtml(m.department)}</span></div>
          <div class="info-row"><span class="label">Vị trí:</span><span class="value">${Utils.escapeHtml(m.location || '—')}</span></div>
          <div class="info-row"><span class="label">Trạng thái:</span><span class="value">${Utils.getStatusBadge(m.status)}</span></div>
          <div class="info-row"><span class="label">Ghi chú:</span><span class="value">${Utils.escapeHtml(m.notes || '—')}</span></div>
          <div class="info-row"><span class="label">Ngày tạo:</span><span class="value">${Utils.formatDate(m.created_at)}</span></div>
          <div class="info-row"><span class="label">Cập nhật:</span><span class="value">${Utils.formatDateTime(m.updated_at)}</span></div>
        </div>
      `,
      size: 'sm'
    });
  },

  reportFault(id) {
    const machine = this.machines.find(m => m.id === id);
    if (machine) {
      // Switch to repairs page with pre-filled machine
      Utils.storage.set('prefill_repair', { machine_id: machine.id, machine_code: machine.machine_code, machine_name: machine.machine_name, department: machine.department });
      Router.navigate('/repairs');
      setTimeout(() => RepairsPage.showAddModal(), 500);
    }
  }
};
