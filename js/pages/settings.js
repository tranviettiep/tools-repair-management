// ============================================
// Settings.js - System settings page (Admin only)
// ============================================

const SettingsPage = {
  config: [],

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div>
            <h2>Cài đặt hệ thống</h2>
            <p class="page-subtitle">Danh mục dùng chung, mã lỗi và thông tin biểu mẫu</p>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="wrench"></i> Loại máy công cụ</span>
            </div>
            <div id="setting-machine-types">
              <div class="loading-inline"><div class="spinner"></div></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="factory"></i> Bộ phận / Phân xưởng</span>
            </div>
            <div id="setting-departments">
              <div class="loading-inline"><div class="spinner"></div></div>
            </div>
          </div>
        </div>

        <div class="charts-grid" style="margin-top:16px">
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="package"></i> Loại phụ tùng</span>
            </div>
            <div id="setting-part-categories">
              <div class="loading-inline"><div class="spinner"></div></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="link"></i> Kết nối Backend</span>
            </div>
            <div style="padding:8px 0">
              <div class="form-group">
                <label>Trạng thái cơ sở dữ liệu</label>
                <div style="padding: 10px; background: var(--success-soft); border: 1px solid var(--success-border); border-radius: var(--radius-md); color: var(--status-success); display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.2em"><i data-lucide="circle-check"></i></span> <strong>Đã kết nối với Supabase (PostgreSQL)</strong>
                </div>
                <div class="form-hint" style="margin-top: 8px;">Hệ thống đang chạy trên cơ sở dữ liệu Supabase tốc độ cao. URL và mã API đã được bảo mật.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="charts-grid" style="margin-top:16px">
          <div class="chart-card" style="grid-column: 1 / -1">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="triangle-alert"></i> Mã lỗi theo loại máy</span>
              <div style="display:flex; gap:8px; align-items:center">
                <select class="form-select" id="fc-filter-type" onchange="SettingsPage.renderFaultCodes()"></select>
                <button class="btn btn-primary btn-sm" onclick="SettingsPage.showFaultCodeModal()" style="white-space: nowrap; flex-shrink: 0;"><i data-lucide="plus"></i> Thêm mã lỗi</button>
              </div>
            </div>
            <div id="setting-fault-codes"></div>
          </div>
        </div>

        <div class="charts-grid" style="margin-top:16px">
          <div class="chart-card" style="grid-column: 1 / -1">
            <div class="chart-card-header">
              <span class="chart-card-title"><i data-lucide="clipboard-list"></i> Thông tin biểu mẫu đề nghị vật tư</span>
              <span style="font-size:12px; color:var(--text-muted)">Lưu riêng cho từng tài khoản</span>
            </div>
            <div style="padding:8px 0">
              <div class="form-row">
                <div class="form-group">
                  <label>Tên / Mã hạng mục công trình</label>
                  <input type="text" class="form-input" id="fs-category" placeholder="VD: Sửa chữa máy công cụ">
                </div>
                <div class="form-group">
                  <label>Mục đích sử dụng</label>
                  <input type="text" class="form-input" id="fs-purpose" placeholder="VD: Sửa chữa & dự phòng">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Người mua / NCC</label>
                  <input type="text" class="form-input" id="fs-buyer" placeholder="VD: Phòng VT">
                </div>
                <div class="form-group">
                  <label>Vị trí giao hàng</label>
                  <input type="text" class="form-input" id="fs-delivery" placeholder="VD: Kho vật tư">
                </div>
              </div>
              <div style="border-top:1px solid var(--border-color); margin:12px 0 8px; padding-top:12px">
                <div style="font-weight:600; font-size:13px; margin-bottom:8px"><i data-lucide="signature"></i> Chữ ký</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Người lập phiếu</label>
                    <input type="text" class="form-input" id="fs-creator" placeholder="Họ và tên">
                  </div>
                  <div class="form-group">
                    <label>Người nhận & kiểm tra hàng</label>
                    <input type="text" class="form-input" id="fs-receiver" placeholder="Họ và tên">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Người xem xét</label>
                    <input type="text" class="form-input" id="fs-reviewer" placeholder="Họ và tên">
                  </div>
                  <div class="form-group">
                    <label>Trưởng đơn vị</label>
                    <input type="text" class="form-input" id="fs-head" placeholder="Họ và tên">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Người phê duyệt (Giám đốc)</label>
                    <input type="text" class="form-input" id="fs-approver" placeholder="Họ và tên">
                  </div>
                  <div class="form-group">
                    <label>Thành phố / Địa điểm ký</label>
                    <input type="text" class="form-input" id="fs-city" placeholder="VD: Ninh Bình">
                  </div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="SettingsPage.saveFormSettings()"><i data-lucide="save"></i> Lưu thông tin biểu mẫu</button>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
    this.loadFormSettings();
  },

  async loadData() {
    const result = await API.getConfig();
    if (result.success) {
      this.config = result.data;
      this.renderConfigLists();
    }
  },

  renderConfigLists() {
    const types = this._getConfigValue('machine_types', []);
    const depts = this._getConfigValue('departments', []);
    const cats = this._getConfigValue('part_categories', []);

    document.getElementById('setting-machine-types').innerHTML = this._renderEditableList(types, 'machine_types', 'Thêm loại máy...');
    document.getElementById('setting-departments').innerHTML = this._renderEditableList(depts, 'departments', 'Thêm bộ phận...');
    document.getElementById('setting-part-categories').innerHTML = this._renderEditableList(cats, 'part_categories', 'Thêm loại phụ tùng...');

    const filterEl = document.getElementById('fc-filter-type');
    const current = filterEl.value;
    filterEl.innerHTML = '<option value="">Tất cả loại máy</option>' +
      types.map(t => `<option value="${Utils.escapeHtml(t)}" ${t === current ? 'selected' : ''}>${Utils.escapeHtml(t)}</option>`).join('');
    this.renderFaultCodes();
  },

  renderFaultCodes() {
    const type = document.getElementById('fc-filter-type').value;
    const list = this._getConfigValue('fault_codes', []).filter(c => !type || c.machine_type === type);
    document.getElementById('setting-fault-codes').innerHTML = list.length ? `
      <table class="data-table">
        <thead><tr><th>Mã lỗi</th><th>Tên lỗi</th><th>Loại máy</th><th style="width:140px"></th></tr></thead>
        <tbody>
          ${list.map(c => `
            <tr>
              <td><strong>${Utils.escapeHtml(c.code)}</strong></td>
              <td>${Utils.escapeHtml(c.name)}</td>
              <td>${Utils.escapeHtml(c.machine_type)}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="SettingsPage.showFaultCodeModal('${c.id}')">Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="SettingsPage.deleteFaultCode('${c.id}')">Xóa</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>` : '<div class="text-muted" style="padding:12px">Chưa có mã lỗi nào</div>';
  },

  showFaultCodeModal(id = null) {
    const codes = this._getConfigValue('fault_codes', []);
    const item = id ? codes.find(c => c.id === id) : null;
    const types = this._getConfigValue('machine_types', []);
    const defaultType = item ? item.machine_type : document.getElementById('fc-filter-type').value;

    const modal = Modal.show({
      title: item ? 'Sửa mã lỗi' : 'Thêm mã lỗi',
      size: 'sm',
      content: `
        <div class="form-group">
          <label>Loại máy <span class="required">*</span></label>
          <select class="form-select" id="fc-type">
            ${types.map(t => `<option value="${Utils.escapeHtml(t)}" ${t === defaultType ? 'selected' : ''}>${Utils.escapeHtml(t)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Mã lỗi <span class="required">*</span></label>
          <input type="text" class="form-input" id="fc-code" value="${item ? Utils.escapeHtml(item.code) : ''}" placeholder="VD: E01">
        </div>
        <div class="form-group">
          <label>Tên lỗi / nguyên nhân <span class="required">*</span></label>
          <input type="text" class="form-input" id="fc-name" value="${item ? Utils.escapeHtml(item.name) : ''}" placeholder="VD: Hỏng motor">
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-modal-close>Hủy</button>
        <button class="btn btn-primary" id="btn-save-fc"><i data-lucide="save"></i> Lưu</button>`
    });

    document.getElementById('btn-save-fc').onclick = async () => {
      const machine_type = document.getElementById('fc-type').value;
      const code = document.getElementById('fc-code').value.trim();
      const name = document.getElementById('fc-name').value.trim();
      if (!machine_type || !code || !name) {
        Toast.warning('Vui lòng nhập đầy đủ thông tin');
        return;
      }
      if (codes.some(c => c.id !== id && c.machine_type === machine_type && c.code.toLowerCase() === code.toLowerCase())) {
        Toast.warning('Mã lỗi đã tồn tại cho loại máy này');
        return;
      }
      if (item) {
        Object.assign(item, { machine_type, code, name });
      } else {
        codes.push({ id: Utils.generateId('fc'), machine_type, code, name });
      }
      await API.updateConfig('fault_codes', JSON.stringify(codes));
      modal.close();
      await this.loadData();
      Toast.success('Đã lưu mã lỗi');
    };
  },

  async deleteFaultCode(id) {
    if (!(await Modal.confirm({ title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa mã lỗi này?', icon: '<i data-lucide="trash-2"></i>', confirmText: 'Xóa', danger: true }))) return;
    const codes = this._getConfigValue('fault_codes', []).filter(c => c.id !== id);
    await API.updateConfig('fault_codes', JSON.stringify(codes));
    await this.loadData();
    Toast.success('Đã xóa mã lỗi');
  },

  _getConfigValue(key, defaultValue) {
    const cfg = this.config.find(c => c.key === key);
    if (!cfg) return defaultValue;
    try { return JSON.parse(cfg.value); } catch { return defaultValue; }
  },

  _renderEditableList(items, configKey, placeholder) {
    return `
      <div style="display:flex;flex-direction:column;gap:6px;padding:8px 0">
        ${items.map((item, i) => `
          <div style="display:flex;align-items:center;gap:8px">
            <span style="flex:1;padding:6px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">${Utils.escapeHtml(item)}</span>
            <button class="btn btn-ghost btn-sm" onclick="SettingsPage.removeItem('${configKey}', ${i})" style="color:var(--status-danger);min-width:30px"><i data-lucide="x"></i></button>
          </div>
        `).join('')}
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <input type="text" class="form-input" id="new-${configKey}" placeholder="${placeholder}" style="flex:1">
          <button class="btn btn-secondary btn-sm" onclick="SettingsPage.addItem('${configKey}')"><i data-lucide="plus"></i> Thêm</button>
        </div>
      </div>
    `;
  },

  async addItem(configKey) {
    const input = document.getElementById(`new-${configKey}`);
    const value = input.value.trim();
    if (!value) return;

    const items = this._getConfigValue(configKey, []);
    if (items.includes(value)) {
      Toast.warning('Giá trị đã tồn tại');
      return;
    }

    items.push(value);
    await API.updateConfig(configKey, JSON.stringify(items));
    input.value = '';
    await this.loadData();
    Toast.success('Đã thêm');
  },

  async removeItem(configKey, index) {
    const items = this._getConfigValue(configKey, []);
    items.splice(index, 1);
    await API.updateConfig(configKey, JSON.stringify(items));
    await this.loadData();
    Toast.success('Đã xóa');
  },


  loadFormSettings() {
    const userId = Auth.currentUser?.username || 'default';
    const fs = Utils.storage.get('form_settings_' + userId, {});
    const fields = ['category','purpose','buyer','delivery','creator','receiver','reviewer','head','approver','city'];
    fields.forEach(f => {
      const el = document.getElementById('fs-' + f);
      if (el && fs[f] !== undefined) el.value = fs[f];
    });
    // Default creator to current user full name if empty
    const creatorEl = document.getElementById('fs-creator');
    if (creatorEl && !creatorEl.value) creatorEl.value = Auth.currentUser?.full_name || '';
  },

  saveFormSettings() {
    const userId = Auth.currentUser?.username || 'default';
    const fields = ['category','purpose','buyer','delivery','creator','receiver','reviewer','head','approver','city'];
    const fs = {};
    fields.forEach(f => {
      const el = document.getElementById('fs-' + f);
      if (el) fs[f] = el.value.trim();
    });
    Utils.storage.set('form_settings_' + userId, fs);
    Toast.success('Đã lưu thông tin biểu mẫu');
  },
};
