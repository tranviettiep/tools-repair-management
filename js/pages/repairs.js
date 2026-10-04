// ============================================
// Repairs.js - Repair request management page
// ============================================

const RepairsPage = {
  repairs: [],
  machines: [],
  filteredRepairs: [],
  currentPage: 1,
  pageSize: 50,
  viewMode: 'table', // 'table' or 'kanban'
  filters: { search: '', status: '', department: '' },

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>📋 Yêu cầu sửa chữa</h2>
          <div class="page-header-actions">
            <div class="view-toggle">
              <button class="view-toggle-btn ${this.viewMode === 'table' ? 'active' : ''}" onclick="RepairsPage.setView('table')">📊 Bảng</button>
              <button class="view-toggle-btn ${this.viewMode === 'kanban' ? 'active' : ''}" onclick="RepairsPage.setView('kanban')">📌 Kanban</button>
            </div>
            ${Auth.can('create_repair') ? '<button class="btn btn-primary" onclick="RepairsPage.showAddModal()">+ Báo hỏng</button>' : ''}
          </div>
        </div>

        <div id="repairs-toolbar">
          <div class="table-wrapper" style="border-bottom:none;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
            <div class="table-toolbar">
              <div class="table-search">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Tìm mã yêu cầu, tên máy, mô tả..."
                       id="repair-search" oninput="RepairsPage.onSearch(this.value)">
              </div>
              <div class="table-filters">
                <select id="filter-repair-status" onchange="RepairsPage.onFilter()">
                  <option value="">Tất cả trạng thái</option>
                  <option value="Báo hỏng">Báo hỏng</option>
                  <option value="Sửa ngoài">Sửa ngoài</option>
                  <option value="Đã về">Đã về</option>
                  <option value="Đã sửa">Đã sửa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div id="repairs-content">
          <div class="loading-inline"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const [repairResult, machineResult] = await Promise.all([
      API.getRepairs(),
      API.getMachines()
    ]);

    if (repairResult.success) this.repairs = repairResult.data;
    if (machineResult.success) this.machines = machineResult.data;

    this.applyFilters();

    // Check for prefilled repair from machine page
    const prefill = Utils.storage.get('prefill_repair');
    if (prefill) {
      Utils.storage.remove('prefill_repair');
    }
  },

  setView(mode) {
    this.viewMode = mode;
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(mode === 'table' ? 'Bảng' : 'Kanban'));
    });
    this.applyFilters();
  },

  onSearch: Utils.debounce(function(value) {
    RepairsPage.filters.search = value;
    RepairsPage.currentPage = 1;
    RepairsPage.applyFilters();
  }, 300),

  onFilter() {
    this.filters.status = document.getElementById('filter-repair-status').value;
    this.currentPage = 1;
    this.applyFilters();
  },

  applyFilters() {
    let result = [...this.repairs];

    if (this.filters.search) {
      const s = this.filters.search.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(s) ||
        r.machine_name.toLowerCase().includes(s) ||
        r.fault_description.toLowerCase().includes(s)
      );
    }
    if (this.filters.status) result = result.filter(r => r.status === this.filters.status);

    // Department filter for manager/reporter
    if (Auth.currentUser?.role === 'manager' && Auth.currentUser.department) {
      result = result.filter(r => r.department === Auth.currentUser.department);
    }
    if (Auth.currentUser?.role === 'reporter' && Auth.currentUser.department) {
      result = result.filter(r => r.department === Auth.currentUser.department);
    }

    this.filteredRepairs = result;

    if (this.viewMode === 'kanban') {
      this.renderKanban();
    } else {
      this.renderTable();
    }
  },

  renderTable() {
    const container = document.getElementById('repairs-content');
    const total = this.filteredRepairs.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);
    const pageData = this.filteredRepairs.slice(start, end);
    const totalPages = Math.ceil(total / this.pageSize);

    if (total === 0) {
      container.innerHTML = `
        <div class="table-wrapper" style="border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg)">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">Không có yêu cầu sửa chữa nào</div>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper" style="border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg)">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã YC</th>
              <th>Máy</th>
              <th>Bộ phận</th>
              <th>Mô tả lỗi</th>
              <th>Trạng thái</th>
              <th>KTV</th>
              <th>Ngày báo</th>
              <th style="width:50px"></th>
            </tr>
          </thead>
          <tbody>
            ${pageData.map(r => `
              <tr data-id="${r.id}">
                <td><strong style="color:var(--accent-secondary)">${Utils.escapeHtml(r.id)}</strong></td>
                <td>${Utils.escapeHtml(r.machine_name)}</td>
                <td>${Utils.escapeHtml(r.department)}</td>
                <td title="${Utils.escapeHtml(r.fault_description)}">${Utils.truncate(r.fault_description, 40)}</td>
                <td>${Utils.getStatusBadge(r.status)}</td>
                <td>${Utils.escapeHtml(r.technician || '—')}</td>
                <td class="text-muted">${Utils.formatDate(r.reported_at)}</td>
                <td>
                  <div class="action-menu">
                    <button class="action-menu-trigger" onclick="RepairsPage.toggleActions(this)">⋮</button>
                    <div class="action-menu-dropdown">
                      <div class="action-menu-item" onclick="RepairsPage.showDetail('${r.id}')">👁 Chi tiết</div>
                      ${r.status === 'Sửa ngoài' && Auth.can('complete_repair') ? `<div class="action-menu-item" onclick="RepairsPage.markReturned('${r.id}')">🔙 Đã về</div>` : ''}
                      ${r.status !== 'Đã sửa' && Auth.can('complete_repair') ? `<div class="action-menu-item" onclick="RepairsPage.showCompleteModal('${r.id}')">✅ Đã sửa</div>` : ''}
                    </div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="table-pagination">
          <span class="pagination-info">Hiển thị ${start + 1}-${end} / ${total} yêu cầu</span>
          <div class="pagination-controls">
            <button class="pagination-btn" onclick="RepairsPage.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
            ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + Math.max(1, this.currentPage - 2);
              if (p > totalPages) return '';
              return `<button class="pagination-btn ${p === this.currentPage ? 'active' : ''}" onclick="RepairsPage.goToPage(${p})">${p}</button>`;
            }).join('')}
            <button class="pagination-btn" onclick="RepairsPage.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>
          </div>
        </div>
      </div>
    `;
  },

  renderKanban() {
    const container = document.getElementById('repairs-content');
    const columns = [
      { status: 'Báo hỏng', icon: '📨', color: 'var(--status-danger)' },
      { status: 'Sửa ngoài', icon: '🚚', color: 'var(--status-warning)' },
      { status: 'Đã về', icon: '🔙', color: '#0984e3' },
      { status: 'Đã sửa', icon: '✅', color: 'var(--status-success)' },
    ];

    container.innerHTML = `
      <div class="kanban-board">
        ${columns.map(col => {
          const items = this.filteredRepairs.filter(r => r.status === col.status);
          return `
            <div class="kanban-column">
              <div class="kanban-column-header">
                <span class="kanban-column-title">
                  <span>${col.icon}</span> ${col.status}
                </span>
                <span class="kanban-column-count">${items.length}</span>
              </div>
              <div class="kanban-column-body">
                ${items.slice(0, 20).map(r => `
                  <div class="kanban-card" onclick="RepairsPage.showDetail('${r.id}')">
                    <div class="kanban-card-header">
                      <span class="kanban-card-id">${Utils.escapeHtml(r.id)}</span>
                    </div>
                    <div class="kanban-card-machine">${Utils.escapeHtml(r.machine_name)}</div>
                    <div class="kanban-card-desc">${Utils.escapeHtml(r.fault_description)}</div>
                    <div class="kanban-card-footer">
                      <span>${r.technician ? '👤 ' + Utils.escapeHtml(r.technician) : ''}</span>
                      <span>${Utils.formatRelativeTime(r.reported_at)}</span>
                    </div>
                  </div>
                `).join('')}
                ${items.length === 0 ? '<div class="empty-state" style="padding:20px"><div class="text-muted">Không có yêu cầu</div></div>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredRepairs.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderTable();
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
  },

  showAddModal() {
    const prefill = Utils.storage.get('prefill_repair');
    
    // Create checkbox list instead of select
    const machineCheckboxes = this.machines
      .filter(m => m.status !== 'Ngừng sử dụng')
      .map(m => `
        <label style="display:block; padding:8px; border-bottom:1px solid var(--border-color); cursor:pointer;">
          <input type="checkbox" class="machine-select-cb" value="${m.id}" ${prefill?.machine_id === m.id ? 'checked' : ''} style="margin-right:8px">
          <strong>${Utils.escapeHtml(m.machine_code)}</strong> - ${Utils.escapeHtml(m.machine_name)} <span class="text-muted">(${Utils.escapeHtml(m.department)})</span>
        </label>
      `).join('');

    const content = `
      <form id="repair-form" onsubmit="return false">
        <div class="form-group">
          <label>Chọn máy công cụ (có thể chọn nhiều) <span class="required">*</span></label>
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary);">
            ${machineCheckboxes || '<div style="padding:10px; color:var(--text-muted)">Không có máy công cụ khả dụng</div>'}
          </div>
        </div>
        <div class="form-group">
          <label>Thiết bị khác (ngoài danh mục máy công cụ)</label>
          <div id="other-devices"></div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="RepairsPage.addOtherDevice()">+ Thiết bị khác</button>
        </div>
        <div class="form-group">
          <label>Mô tả lỗi/hỏng hóc</label>
          <textarea class="form-textarea" id="f-fault-desc" rows="4" placeholder="Mô tả tình trạng (không bắt buộc)..."></textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Hủy</button>
      <button class="btn btn-primary" onclick="RepairsPage.submitRepair()">📨 Gửi báo hỏng</button>
    `;

    Modal.show({ title: '🔔 Báo hỏng máy công cụ', content, footer });
    if (prefill) Utils.storage.remove('prefill_repair');
  },

  addOtherDevice() {
    document.getElementById('other-devices').insertAdjacentHTML('beforeend', `
      <div class="other-device-row" style="display:flex; gap:8px; margin-bottom:8px;">
        <input type="text" class="form-input od-name" placeholder="Tên thiết bị" style="flex:2">
        <input type="text" class="form-input od-code" placeholder="Mã thiết bị" style="flex:1">
        <input type="text" class="form-input od-dept" placeholder="Bộ phận" style="flex:1">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
      </div>`);
  },

  async submitRepair() {
    const selectedCbs = document.querySelectorAll('.machine-select-cb:checked');
    const faultDesc = document.getElementById('f-fault-desc').value.trim();
    const otherDevices = Array.from(document.querySelectorAll('.other-device-row'))
      .map(row => ({
        name: row.querySelector('.od-name').value.trim(),
        code: row.querySelector('.od-code').value.trim(),
        department: row.querySelector('.od-dept').value.trim()
      }))
      .filter(d => d.name);

    if (selectedCbs.length === 0 && otherDevices.length === 0) {
      Toast.warning('Vui lòng chọn hoặc nhập ít nhất một thiết bị');
      return;
    }

    Toast.info('Đang gửi yêu cầu...');
    let successCount = 0;
    
    for (const cb of selectedCbs) {
      const machineId = cb.value;
      const machine = this.machines.find(m => m.id === machineId);
      if (!machine) continue;
      
      const data = {
        machine_id: machineId,
        machine_code: machine.machine_code,
        machine_name: machine.machine_name,
        department: machine.department,
        fault_description: faultDesc || 'Không có mô tả',
        priority: 'Bình thường', // Default backend priority
        reported_by: Auth.currentUser.full_name,
      };

      const result = await API.createRepair(data);
      if (result.success) successCount++;
    }

    for (const dev of otherDevices) {
      const result = await API.createRepair({
        machine_id: '',
        machine_code: dev.code,
        machine_name: dev.name,
        department: dev.department,
        fault_description: faultDesc || 'Không có mô tả',
        priority: 'Bình thường',
        reported_by: Auth.currentUser.full_name,
      });
      if (result.success) successCount++;
    }

    if (successCount > 0) {
      Toast.success(`Đã báo hỏng thành công ${successCount} thiết bị`);
      Modal.closeAll();
      await this.loadData();
    } else {
      Toast.error('Có lỗi xảy ra, không thể gửi yêu cầu');
    }
  },

  _parseFaultCodes(configResult) {
    if (!configResult.success) return [];
    const cfg = configResult.data.find(c => c.key === 'fault_codes');
    if (!cfg) return [];
    try { return JSON.parse(cfg.value); } catch { return []; }
  },

  async markReturned(id) {
    if (!confirm('Xác nhận thiết bị đã được trả về từ đơn vị sửa chữa ngoài?')) return;
    
    Toast.info('Đang cập nhật trạng thái...');
    const result = await API.markRepairReturned(id);
    if (result.success) {
      Toast.success('Đã cập nhật trạng thái thành Đã về');
      await this.loadData();
    } else {
      Toast.error(result.error || 'Lỗi cập nhật');
    }
  },

  async showCompleteModal(id) {
    const repair = this.repairs.find(r => r.id === id);
    if (!repair) return;

    const [partsResult, configResult] = await Promise.all([API.getParts(), API.getConfig()]);
    this._parts = partsResult.success ? partsResult.data : [];
    const allCodes = this._parseFaultCodes(configResult);
    // Máy trong danh mục: lọc mã lỗi theo loại máy. Thiết bị khác: hiện toàn bộ mã lỗi.
    const machine = this.machines.find(m => m.id === repair.machine_id);
    this._faultCodes = machine ? allCodes.filter(c => c.machine_type === machine.machine_type) : allCodes;

    const faultCodeList = this._faultCodes.map(c => `
      <label style="display:block; padding:8px; border-bottom:1px solid var(--border-color); cursor:pointer;">
        <input type="checkbox" class="fc-cb" value="${c.id}" style="margin-right:8px">
        <strong>${Utils.escapeHtml(c.code)}</strong> - ${Utils.escapeHtml(c.name)}
      </label>
    `).join('');

    const content = `
      <form onsubmit="return false">
        <div class="form-group">
          <label>Nguyên nhân hỏng (mã lỗi) <span class="required">*</span></label>
          <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-secondary);">
            ${faultCodeList || '<div style="padding:10px; color:var(--text-muted)">Chưa có mã lỗi cho loại máy này. Vui lòng thêm trong Cài đặt.</div>'}
          </div>
        </div>
        <div class="form-group">
          <label>Vật tư tiêu hao</label>
          <div id="cp-parts"></div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="RepairsPage.addPartRow()">+ Thêm vật tư</button>
        </div>
        <div class="form-group">
          <label>Ghi chú sửa chữa</label>
          <textarea class="form-textarea" id="f-repair-notes" rows="3" placeholder="Mô tả công việc đã thực hiện...">${Utils.escapeHtml(repair.repair_notes || '')}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Hủy</button>
      <button class="btn btn-success" id="btn-complete-repair">✅ Xác nhận đã sửa</button>
    `;

    const modal = Modal.show({ title: `✅ Đã sửa - ${Utils.escapeHtml(repair.id)}`, content, footer });

    document.getElementById('btn-complete-repair').onclick = async () => {
      const faultCodes = Array.from(document.querySelectorAll('.fc-cb:checked'))
        .map(cb => this._faultCodes.find(c => c.id === cb.value))
        .filter(Boolean)
        .map(c => ({ id: c.id, code: c.code, name: c.name }));

      if (faultCodes.length === 0) {
        Toast.warning('Vui lòng chọn nguyên nhân hỏng (mã lỗi)');
        return;
      }

      // Gộp các dòng trùng vật tư để kiểm tra tồn kho chính xác
      const merged = {};
      document.querySelectorAll('.part-row').forEach(row => {
        const partId = row.querySelector('.cp-part').value;
        const qty = parseFloat(row.querySelector('.cp-qty').value) || 0;
        if (partId && qty > 0) merged[partId] = (merged[partId] || 0) + qty;
      });
      const partsUsed = Object.entries(merged).map(([part_id, quantity]) => {
        const p = this._parts.find(p => p.id === part_id);
        return { part_id, part_code: p.part_code, part_name: p.part_name, unit: p.unit, quantity };
      });

      const result = await API.completeRepair(id, {
        repair_notes: document.getElementById('f-repair-notes').value.trim(),
        fault_codes: JSON.stringify(faultCodes),
        parts_used: JSON.stringify(partsUsed),
        completed_by: Auth.currentUser.full_name
      });

      if (result.success) {
        Toast.success('Đã chuyển sang trạng thái Đã sửa');
        modal.close();
        await this.loadData();
      } else {
        Toast.error(result.error);
      }
    };
  },

  addPartRow() {
    const options = this._parts.map(p =>
      `<option value="${p.id}">${Utils.escapeHtml(p.part_code)} - ${Utils.escapeHtml(p.part_name)} (Tồn: ${p.quantity} ${Utils.escapeHtml(p.unit || '')})</option>`
    ).join('');
    document.getElementById('cp-parts').insertAdjacentHTML('beforeend', `
      <div class="part-row" style="display:flex; gap:8px; margin-bottom:8px;">
        <select class="form-select cp-part" style="flex:3">
          <option value="">-- Chọn vật tư --</option>
          ${options}
        </select>
        <input type="number" class="form-input cp-qty" value="1" min="1" style="flex:1">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
      </div>`);
  },

  showDetail(id) {
    const r = this.repairs.find(r => r.id === id);
    if (!r) return;

    const steps = ['Báo hỏng', 'Sửa ngoài', 'Đã về', 'Đã sửa'];
    const parseList = v => { try { return typeof v === 'string' ? JSON.parse(v || '[]') : (v || []); } catch { return []; } };
    const faultCodes = parseList(r.fault_codes);
    const partsUsed = parseList(r.parts_used);
    const currentIdx = steps.indexOf(r.status);

    const content = `
      <!-- Progress Steps -->
      <div class="progress-steps">
        ${steps.map((step, i) => `
          ${i > 0 ? `<div class="progress-step-line" style="${i <= currentIdx ? 'background:var(--status-success)' : ''}"></div>` : ''}
          <div class="progress-step ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'active' : ''}">
            <div class="progress-step-circle">
              ${i < currentIdx ? '✓' : i + 1}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:24px;padding:0 10px">
        ${steps.map(s => `<span style="font-size:0.75rem;color:var(--text-muted)">${s}</span>`).join('')}
      </div>

      <!-- Info -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-title">🔧 Thông tin máy</div>
          <div class="info-row"><span class="label">Máy:</span><span class="value">${Utils.escapeHtml(r.machine_name)}</span></div>
          <div class="info-row"><span class="label">Mã máy:</span><span class="value">${Utils.escapeHtml(r.machine_code)}</span></div>
          <div class="info-row"><span class="label">Bộ phận:</span><span class="value">${Utils.escapeHtml(r.department)}</span></div>
        </div>
        <div class="info-card">
          <div class="info-card-title">📋 Thông tin sửa chữa</div>
          <div class="info-row"><span class="label">KTV:</span><span class="value">${Utils.escapeHtml(r.technician || '—')}</span></div>
          <div class="info-row"><span class="label">Kết thúc:</span><span class="value">${Utils.formatDateTime(r.repair_end)}</span></div>
          <div class="info-row"><span class="label">Chi phí:</span><span class="value fw-600">${Utils.formatCurrency(r.total_cost)}</span></div>
        </div>
      </div>

      <div class="info-card mb-md">
        <div class="info-card-title">📝 Mô tả lỗi</div>
        <p style="color:var(--text-secondary)">${Utils.escapeHtml(r.fault_description)}</p>
      </div>

      ${faultCodes.length ? `
        <div class="info-card mb-md">
          <div class="info-card-title">⚠️ Nguyên nhân hỏng</div>
          <p style="color:var(--text-secondary)">${faultCodes.map(c => Utils.escapeHtml(c.code + ' - ' + c.name)).join('<br>')}</p>
        </div>
      ` : ''}

      ${partsUsed.length ? `
        <div class="info-card mb-md">
          <div class="info-card-title">🔩 Vật tư tiêu hao</div>
          <p style="color:var(--text-secondary)">${partsUsed.map(p => Utils.escapeHtml(p.part_code + ' - ' + p.part_name) + ' × ' + p.quantity + ' ' + Utils.escapeHtml(p.unit || '')).join('<br>')}</p>
        </div>
      ` : ''}

      ${r.repair_notes ? `
        <div class="info-card mb-md">
          <div class="info-card-title">🔧 Ghi chú sửa chữa</div>
          <p style="color:var(--text-secondary)">${Utils.escapeHtml(r.repair_notes)}</p>
        </div>
      ` : ''}

      <div class="info-card">
        <div class="info-card-title">📅 Lịch sử</div>
        <div class="info-row"><span class="label">Báo hỏng bởi:</span><span class="value">${Utils.escapeHtml(r.reported_by)} — ${Utils.formatDateTime(r.reported_at)}</span></div>
        ${r.completed_by ? `<div class="info-row"><span class="label">Đã sửa bởi:</span><span class="value">${Utils.escapeHtml(r.completed_by)} — ${Utils.formatDateTime(r.completed_at)}</span></div>` : ''}
      </div>
    `;

    // Action buttons based on status
    let footer = '';
    if (r.status === 'Sửa ngoài' && Auth.can('complete_repair')) {
      footer += `<button class="btn btn-primary" onclick="Modal.closeAll(); RepairsPage.markReturned('${r.id}')">🔙 Đã về</button>`;
    }
    if (r.status !== 'Đã sửa' && Auth.can('complete_repair')) {
      footer += `<button class="btn btn-success" onclick="Modal.closeAll(); RepairsPage.showCompleteModal('${r.id}')">✅ Đã sửa</button>`;
    }

    Modal.show({
      title: `📋 ${Utils.escapeHtml(r.id)}`,
      content,
      footer: footer ? `<button class="btn btn-secondary" data-modal-close>Đóng</button>${footer}` : '',
      size: 'lg'
    });
  }
};
