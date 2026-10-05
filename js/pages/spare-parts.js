// ============================================
// SpareParts.js - Spare parts management page
// ============================================

const SparePartsPage = {
  parts: [],
  transactions: [],
  proposals: [],
  supplierLinks: [],
  filteredParts: [],
  activeTab: 'list', // 'list', 'import', 'history'

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>📦 Kho phụ tùng</h2>
          <div class="page-header-actions">
            <button class="btn btn-secondary" onclick="SparePartsPage.showSupplierLinksModal()">🔗 Link NCC</button>
            ${Auth.can('manage_parts') ? '<button class="btn btn-primary" onclick="SparePartsPage.showAddModal()">+ Thêm phụ tùng</button>' : ''}
          </div>
        </div>

        <div class="tabs">
          <button class="tab active" onclick="SparePartsPage.switchTab('list')">📦 Danh sách</button>
          <button class="tab" onclick="SparePartsPage.switchTab('import')">📥 Nhập/Xuất kho</button>
          <button class="tab" onclick="SparePartsPage.switchTab('proposal')">📝 Đề xuất vật tư</button>
          <button class="tab" onclick="SparePartsPage.switchTab('history')">📋 Lịch sử</button>
        </div>

        <div id="low-stock-alert"></div>
        <div id="parts-content">
          <div class="loading-inline"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const [partsResult, txResult, propResult, configResult] = await Promise.all([
      API.getParts(),
      API.getPartTransactions(),
      API.request('get_proposals'),
      API.getConfig()
    ]);

    if (partsResult.success) this.parts = partsResult.data;
    if (txResult.success) this.transactions = txResult.data;
    if (propResult && propResult.success) this.proposals = propResult.data;
    if (configResult && configResult.success) {
      const supplierLinkConf = configResult.data.find(c => c.key === 'supplier_links');
      if (supplierLinkConf && supplierLinkConf.value) {
        try {
          this.supplierLinks = JSON.parse(supplierLinkConf.value);
        } catch(e) {
          this.supplierLinks = [];
        }
      }
    }

    this.renderLowStockAlert();
    this.renderContent();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab').forEach((t, i) => {
      t.classList.toggle('active', ['list', 'import', 'proposal', 'history'][i] === tab);
    });
    this.renderContent();
  },

  renderLowStockAlert() {
    const lowStock = this.parts.filter(p => p.quantity <= p.min_quantity);
    const container = document.getElementById('low-stock-alert');
    if (lowStock.length > 0) {
      container.innerHTML = `
        <div class="low-stock-warning">
          ⚠️ <strong>${lowStock.length} phụ tùng</strong> dưới mức tồn kho tối thiểu:
          ${lowStock.map(p => `<span class="badge badge-urgent">${Utils.escapeHtml(p.part_name)} (${p.quantity}/${p.min_quantity})</span>`).join(' ')}
        </div>
      `;
    } else {
      container.innerHTML = '';
    }
  },

  renderContent() {
    switch (this.activeTab) {
      case 'list': this.renderList(); break;
      case 'import': this.renderImportExport(); break;
      case 'proposal': this.renderProposal(); break;
      case 'history': this.renderHistory(); break;
    }
  },

  renderList() {
    const container = document.getElementById('parts-content');
    container.innerHTML = `
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="table-search">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Tìm phụ tùng..." id="parts-search" oninput="SparePartsPage.onSearch(this.value)">
          </div>
          <div class="table-filters">
            <select id="filter-category" onchange="SparePartsPage.onFilterCategory()">
              <option value="">Tất cả loại</option>
              ${[...new Set(this.parts.map(p => p.category))].map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select id="filter-stock" onchange="SparePartsPage.onFilterStock()">
              <option value="">Tất cả</option>
              <option value="low">⚠️ Sắp hết hàng</option>
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã PT</th>
              <th>Tên phụ tùng</th>
              <th>Loại</th>
              <th>Tồn kho</th>
              <th>Tối thiểu</th>
              <th>Đơn giá</th>
              <th>NCC</th>
              <th style="width:50px"></th>
            </tr>
          </thead>
          <tbody id="parts-table-body">
            ${this._renderPartRows(this.parts)}
          </tbody>
        </table>
      </div>
    `;
  },

  _filterParts() {
    let result = [...this.parts];
    const search = document.getElementById('parts-search')?.value?.toLowerCase() || '';
    const category = document.getElementById('filter-category')?.value || '';
    const stock = document.getElementById('filter-stock')?.value || '';

    if (search) result = result.filter(p => p.part_code.toLowerCase().includes(search) || p.part_name.toLowerCase().includes(search));
    if (category) result = result.filter(p => p.category === category);
    if (stock === 'low') result = result.filter(p => p.quantity <= p.min_quantity);

    return result;
  },

  _renderPartRows(parts) {
    if (parts.length === 0) return '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-title">Không tìm thấy phụ tùng</div></div></td></tr>';

    return parts.map(p => {
      const isLow = p.quantity <= p.min_quantity;
      return `
        <tr>
          <td><strong style="color:var(--accent-secondary)">${Utils.escapeHtml(p.part_code)}</strong></td>
          <td>${Utils.escapeHtml(p.part_name)}</td>
          <td>${Utils.escapeHtml(p.category)}</td>
          <td><span class="${isLow ? 'quantity-warning' : ''}">${p.quantity} ${Utils.escapeHtml(p.unit)}</span>${isLow ? ' ⚠️' : ''}</td>
          <td class="text-muted">${p.min_quantity} ${Utils.escapeHtml(p.unit)}</td>
          <td>${Utils.formatCurrency(p.unit_price)}</td>
          <td class="text-muted">${Utils.escapeHtml(p.supplier || '—')}</td>
          <td>
            <div class="action-menu">
              <button class="action-menu-trigger" onclick="SparePartsPage.toggleActions(this)">⋮</button>
              <div class="action-menu-dropdown">
                ${Auth.can('manage_parts') ? `<div class="action-menu-item" onclick="SparePartsPage.showEditModal('${p.id}')">✏️ Sửa</div>` : ''}
                ${Auth.can('import_parts') ? `<div class="action-menu-item" onclick="SparePartsPage.showImportModal('${p.id}')">📥 Nhập kho</div>` : ''}
                ${Auth.can('export_parts') ? `<div class="action-menu-item" onclick="SparePartsPage.showExportModal('${p.id}')">📤 Xuất kho</div>` : ''}
                ${Auth.can('manage_parts') ? `<div class="action-menu-item danger" onclick="SparePartsPage.deletePart('${p.id}')">🗑 Xóa</div>` : ''}
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  onSearch: Utils.debounce(function() {
    const body = document.getElementById('parts-table-body');
    if (body) body.innerHTML = SparePartsPage._renderPartRows(SparePartsPage._filterParts());
  }, 300),

  onFilterCategory() { this.onSearch(); },
  onFilterStock() { this.onSearch(); },

  renderImportExport() {
    const container = document.getElementById('parts-content');
    container.innerHTML = `
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-header">
            <span class="chart-card-title">📥 Nhập kho</span>
          </div>
          <form onsubmit="return false">
            <div class="form-group">
              <label>Phụ tùng <span class="required">*</span></label>
              <select class="form-select" id="f-import-part">
                <option value="">-- Chọn phụ tùng --</option>
                ${this.parts.map(p => `<option value="${p.id}">${p.part_code} - ${p.part_name} (Tồn: ${p.quantity})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Số lượng <span class="required">*</span></label>
              <input type="number" class="form-input" id="f-import-qty" min="1" value="1">
            </div>
            <div class="form-group">
              <label>Ghi chú</label>
              <input type="text" class="form-input" id="f-import-notes" placeholder="Lý do nhập kho...">
            </div>
            <button class="btn btn-primary" onclick="SparePartsPage.doImport()">📥 Nhập kho</button>
          </form>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <span class="chart-card-title">📤 Xuất kho</span>
          </div>
          <form onsubmit="return false">
            <div class="form-group">
              <label>Phụ tùng <span class="required">*</span></label>
              <select class="form-select" id="f-export-part">
                <option value="">-- Chọn phụ tùng --</option>
                ${this.parts.map(p => `<option value="${p.id}">${p.part_code} - ${p.part_name} (Tồn: ${p.quantity})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Số lượng <span class="required">*</span></label>
              <input type="number" class="form-input" id="f-export-qty" min="1" value="1">
            </div>
            <div class="form-group">
              <label>Mã yêu cầu sửa chữa</label>
              <input type="text" class="form-input" id="f-export-repair-id" placeholder="VD: SC-20261002-001">
            </div>
            <div class="form-group">
              <label>Ghi chú</label>
              <input type="text" class="form-input" id="f-export-notes" placeholder="Lý do xuất kho...">
            </div>
            <button class="btn btn-primary" onclick="SparePartsPage.doExport()">📤 Xuất kho</button>
          </form>
        </div>
    </div>
      </div>
    `;
  },

  
  renderProposal() {
    const container = document.getElementById('parts-content');
    let tbodyHtml = '<tr><td colspan="4" style="text-align:center;">Chưa có phiếu nào</td></tr>';
    
    if (this.proposals && this.proposals.length > 0) {
      tbodyHtml = this.proposals.map(r => `
        <tr>
          <td style="font-weight: 500; color: var(--accent-primary);">${r.id}</td>
          <td>${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
          <td>
            <select class="form-input" style="width:140px; padding:4px;" onchange="SparePartsPage.updateProposalStatus('${r.id}', this.value)">
              <option value="Nháp" ${r.status === 'Nháp' ? 'selected' : ''}>Nháp</option>
              <option value="Đang xử lý" ${r.status === 'Đang xử lý' ? 'selected' : ''}>Đang xử lý</option>
              <option value="Hoàn thành" ${r.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
            </select>
          </td>
          <td style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="SparePartsPage.openProposalModal('${r.id}')">Xem/Sửa</button>
            <button class="btn btn-primary btn-sm" onclick="SparePartsPage.generateProposalPDF('${r.id}')">Xuất PDF</button>
            <button class="btn btn-primary btn-sm" onclick="SparePartsPage.generateProposalExcel('${r.id}')">Xuất Excel</button>
            <button class="btn btn-danger btn-sm" onclick="SparePartsPage.deleteProposal('${r.id}')">Xóa</button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <div class="table-toolbar" style="justify-content: space-between;">
          <h3>Danh sách phiếu đề xuất vật tư</h3>
          <button class="btn btn-primary" onclick="SparePartsPage.openProposalModal()">+ Tạo phiếu đề xuất</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th width="20%">Mã phiếu</th>
              <th width="20%">Ngày lập</th>
              <th width="25%">Trạng thái</th>
              <th width="35%">Thao tác</th>
            </tr>
          </thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>
    `;
  },
  
  async updateProposalStatus(id, newStatus) {
    const ticket = this.proposals.find(r => r.id === id);
    if (!ticket) return;
    ticket.status = newStatus;
    const res = await API.request('save_proposal', { data: ticket }, 'POST');
    if (res.success) {
      Toast.success('Đã cập nhật trạng thái');
      this.loadData();
    }
  },

  async deleteProposal(id) {
    if (!confirm('Xóa phiếu đề xuất này?')) return;
    const res = await API.request('delete_proposal', { id }, 'POST');
    if (res.success) {
      Toast.success('Đã xóa');
      this.loadData();
    }
  },

  openProposalModal(id = null) {
    this._editingProposalId = id;
    let initialHtml = '';
    
    if (id) {
      const ticket = this.proposals.find(r => r.id === id);
      let items = [];
      try { items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items; } catch(e){}
      
      if (items.length > 0) {
        // Render items to initialHtml somehow... 
        // Actually it's easier to just call addProposalItem multiple times after modal is shown
      }
    }

    const content = `
      <div style="font-weight:600; margin-bottom:8px; font-size:13px">Danh sách vật tư đề nghị</div>
      <div id="proposal-items"></div>
      <button class="btn btn-secondary btn-sm" onclick="SparePartsPage.addProposalItem()" style="margin-bottom:16px">+ Thêm vật tư</button>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.show [data-modal-close]').click()">Hủy</button>
      <button class="btn btn-primary" onclick="SparePartsPage.saveProposalAndExportPDF()">Lưu và Xuất PDF</button>
    `;

    Modal.show({
      title: id ? 'Sửa phiếu đề xuất vật tư' : 'Tạo phiếu đề xuất vật tư',
      content,
      footer,
      size: 'xl'
    });

    if (id) {
      const ticket = this.proposals.find(r => r.id === id);
      let items = [];
      try { items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items; } catch(e){}
      items.forEach(it => this.addProposalItem(it.part_id, it.qty, it.needDate));
    } else {
      this.addProposalItem();
    }
  },

  async saveProposalAndExportPDF() {
    const savedId = await this.saveProposal();
    if (savedId) {
      this.generateProposalPDF(savedId);
      const closeBtn = document.querySelector('.modal-overlay.show [data-modal-close]');
      if (closeBtn) closeBtn.click();
    }
  },

  async saveProposal() {
    const items = this._collectProposalItems();
    if (items.length === 0) {
      Toast.warning('Vui lòng thêm ít nhất 1 vật tư hợp lệ!');
      return false;
    }
    
    const ticket = this._editingProposalId ? this.proposals.find(r => r.id === this._editingProposalId) : { status: 'Nháp' };
    ticket.items = JSON.stringify(items);
    
    Toast.info('Đang lưu...');
    const res = await API.request('save_proposal', { data: ticket }, 'POST');
    if (res.success) {
      Toast.success('Đã lưu phiếu đề xuất');
      await this.loadData();
      return res.data.id;
    } else {
      Toast.error('Lỗi khi lưu');
      return false;
    }
  },

  _getFormSettings() {
    const userId = Auth.currentUser?.username || 'default';
    return Utils.storage.get('form_settings_' + userId, {
      category: 'Sửa chữa máy công cụ',
      purpose: 'Sửa chữa & dự phòng',
      buyer: 'Phòng VT',
      delivery: '',
      creator: Auth.currentUser?.full_name || '',
      receiver: '',
      reviewer: '',
      head: '',
      approver: '',
      city: 'Ninh Bình'
    });
  },

  addProposalItem(pId = "", pQty = "", pDate = "") {
    const container = document.getElementById('proposal-items');
    if (!container.querySelector('.proposal-header')) {
      const header = document.createElement('div');
      header.className = 'proposal-header';
      header.style.cssText = 'display:grid; grid-template-columns:3fr 80px 80px 130px 90px 36px; gap:6px; margin-bottom:4px; padding:0 2px';
      header.innerHTML = '<span style="font-size:11px;color:var(--text-muted);font-weight:600">Vật tư</span>'
        + '<span style="font-size:11px;color:var(--text-muted);font-weight:600">SL yêu cầu</span>'
        + '<span style="font-size:11px;color:var(--text-muted);font-weight:600">SL tồn kho</span>'
        + '<span style="font-size:11px;color:var(--text-muted);font-weight:600">Ngày cần có</span>'
        + '<span style="font-size:11px;color:var(--text-muted);font-weight:600">YC chào giá</span>'
        + '<span></span>';
      container.appendChild(header);
    }
    const row = document.createElement('div');
    row.className = 'proposal-entry';
    row.style.cssText = 'display:grid; grid-template-columns:3fr 80px 80px 130px 90px 36px; gap:6px; margin-bottom:6px; align-items:center';
    const today = new Date().toISOString().split('T')[0];
    const partOptions = this.parts.map(p =>
      `<option value="${p.id}" data-name="${p.part_name}" data-unit="${p.unit}" data-code="${p.part_code}" data-stock="${p.quantity}">${p.part_code} - ${p.part_name} (Tồn: ${p.quantity})</option>`
    ).join('');
    row.innerHTML = `
      <select class="form-select p-part-id" required>
        <option value="">-- Chọn vật tư --</option>
        ${partOptions}
      </select>
      <input type="number" class="form-input p-part-qty" min="1" value="1" required>
      <input type="number" class="form-input p-part-stock" min="0" value="0">
      <input type="date" class="form-input p-part-need-date" value="${today}">
      <select class="form-select p-part-price-req">
        <option value="">Không</option>
        <option value="x">Có</option>
      </select>
      <button class="btn btn-ghost" onclick="this.closest('.proposal-entry').remove()" style="color:var(--status-danger);padding:0;height:36px;width:36px">✕</button>
    `;
    row.querySelector('.p-part-id').addEventListener('change', function() {
      const opt = this.options[this.selectedIndex];
      if (opt.dataset.stock !== undefined) {
        this.closest('.proposal-entry').querySelector('.p-part-stock').value = opt.dataset.stock;
      }
    });
    container.appendChild(row);
  },

  _collectProposalItems() {
    const entries = document.querySelectorAll('.proposal-entry');
    if (entries.length === 0) { Toast.warning('Vui lòng thêm ít nhất một vật tư'); return null; }
    const items = [];
    let valid = true;
    entries.forEach(entry => {
      const select = entry.querySelector('.p-part-id');
      const qtyEl = entry.querySelector('.p-part-qty');
      if (!select || !select.value || !qtyEl || !qtyEl.value) { valid = false; return; }
      const opt = select.options[select.selectedIndex];
      items.push({
        code: opt.dataset.code || '',
        name: opt.dataset.name || '',
        unit: opt.dataset.unit || '',
        qty: parseInt(qtyEl.value) || 1,
        stock: parseInt(entry.querySelector('.p-part-stock')?.value || 0),
        needDate: entry.querySelector('.p-part-need-date')?.value || '',
        priceReq: entry.querySelector('.p-part-price-req')?.value || ''
      });
    });
    if (!valid || items.length === 0) { Toast.warning('Vui lòng chọn vật tư và số lượng hợp lệ cho tất cả các dòng'); return null; }
    return items;
  },

  async generateProposalPDF(id) {
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      Toast.warning('Thư viện jsPDF chưa sẵn sàng. Vui lòng tải lại trang.');
      return;
    }
    let items = [];
    if (id) {
      const ticket = this.proposals.find(r => r.id === id);
      if (!ticket) return;
      items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items;
    } else {
      items = this._collectProposalItems();
    }
    if (!items || items.length === 0) {
      Toast.warning('Phiếu không có vật tư');
      return;
    }

    const fs = this._getFormSettings();
    const dateStr = new Date().toISOString().split('T')[0];
    const dateObj = new Date();
    
    // Ngày xuất phiếu (Ngày lập)
    const exportDateObj = new Date();
    const exDd = String(exportDateObj.getDate()).padStart(2, '0');
    const exMm = String(exportDateObj.getMonth() + 1).padStart(2, '0');
    const exYy = String(exportDateObj.getFullYear()).slice(-2);
    const exportDateFormatted = exDd + '/' + exMm + '/' + exYy;

    try {
      Toast.info('Đang tạo PDF...');
      const { jsPDF: JsPDF } = window.jspdf || { jsPDF: window.jsPDF };
      const doc = new JsPDF({ orientation: 'landscape' });
      
      doc.addFileToVFS('Times-Regular.ttf', FONT_TIMES_REGULAR_B64);
      doc.addFont('Times-Regular.ttf', 'TinosFont', 'normal');
      doc.addFileToVFS('Times-Bold.ttf', FONT_TIMES_BOLD_B64);
      doc.addFont('Times-Bold.ttf', 'TinosFont', 'bold');
      
      // Thêm phông in nghiêng và in đậm nghiêng (nếu cần thiết, jsPDF có thể tự mô phỏng nghiêng, 
      // nhưng tốt nhất là khai báo). Ở đây ta dùng TinosFont bolditalic. 
      // Tuy nhiên ta chưa nhúng font italic. Thay vào đó ta sẽ set fontStyle 'bolditalic'. 
      // jsPDF có thể vẽ nghiêng nhân tạo nếu không có font italic.
      
      doc.setFont('TinosFont');

      // Vẽ Header bằng bảng
      doc.autoTable({
        startY: 10,
        margin: { left: 10, right: 10 },
        theme: 'plain',
        body: [
          ['', 'CÔNG TY TNHH THẮNG LỢI', 'Mã hiệu: BM.KHVT.04.01\nĐơn vị đề nghị: P.Cải tiến'],
          ['', 'PHIẾU\nĐỀ NGHỊ CẤP VẬT TƯ', 'Số: ' + (id || '') + '\nNgày lập: ' + exportDateFormatted]
        ],
        columnStyles: {
          0: { cellWidth: 55, minCellHeight: 15 }, 
          1: { cellWidth: 170, halign: 'center', valign: 'middle', fontStyle: 'bold' },
          2: { cellWidth: 52, halign: 'left', valign: 'middle' } 
        },
        styles: {
          font: 'TinosFont',
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fontSize: 10
        },
        didParseCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0) {
            data.cell.styles.valign = 'middle';
            data.cell.rowSpan = 2;
          }
          if (data.row.index === 1 && data.column.index === 1) {
            data.cell.styles.fontSize = 12; 
          }
          if (data.row.index === 0 && data.column.index === 1) {
            data.cell.styles.fontSize = 12; 
          }
        },
        didDrawCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0) {
             const logoW = 31;
             const logoH = 15;
             const xPos = data.cell.x + (data.cell.width - logoW) / 2;
             const yPos = data.cell.y + (data.cell.height - logoH) / 2;
             doc.addImage('data:image/jpeg;base64,' + LOGO_VICO_B64, 'JPEG', xPos, yPos, logoW, logoH);
          }
        }
      });

      const tableData = items.map((item, index) => {
        let needDateFmt = item.needDate || '';
        if (needDateFmt && needDateFmt.includes('-')) {
            const parts = needDateFmt.split('-');
            if (parts.length === 3) {
                needDateFmt = parts[2] + '-' + parts[1] + '-' + parts[0];
            }
        }
        return [
          (index + 1).toString(),
          item.name + (item.code ? ' (' + item.code + ')' : ''),
          item.unit,
          '',
          item.qty.toString(),
          item.stock !== undefined ? item.stock.toString() : '',
          needDateFmt,
          fs.category,
          '',
          fs.purpose,
          fs.delivery,
          fs.receiver,
          fs.buyer,
          item.priceReq || ''
        ];
      });

      const emptyRowsNeeded = Math.max(0, 5 - items.length);
      for(let i=0; i<emptyRowsNeeded; i++) {
        tableData.push(['','','','','','','','','','','','','','']);
      }

      doc.autoTable({
        startY: doc.lastAutoTable.finalY, 
        margin: { left: 10, right: 10 },
        head: [
          [
            { content: 'TT', rowSpan: 2 },
            { content: 'Tên vật tư', rowSpan: 2 },
            { content: 'ĐVT', rowSpan: 2 },
            { content: 'Nhóm\nVT', rowSpan: 2 },
            { content: 'Số lượng', colSpan: 2 },
            { content: 'Ngày\ncần có', rowSpan: 2 },
            { content: 'Mã/Tên hạng mục', rowSpan: 2 },
            { content: 'Nhóm\nchi phí', rowSpan: 2 },
            { content: 'Mục đích sử dụng', rowSpan: 2 },
            { content: 'Vị trí\ngiao', rowSpan: 2 },
            { content: 'Nhận &\nKtra', rowSpan: 2 },
            { content: 'Người mua\n/NCC', rowSpan: 2 },
            { content: 'Yêu cầu\nchào giá', rowSpan: 2 }
          ],
          ['Yêu cầu', 'Tồn kho']
        ],
        body: tableData,
        theme: 'grid',
        headStyles: { font: 'TinosFont', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', lineWidth: 0.2, lineColor: [0, 0, 0], halign: 'center', valign: 'middle' },
        bodyStyles: { font: 'TinosFont', fontSize: 8, lineWidth: 0.2, lineColor: [0, 0, 0], textColor: [0,0,0], minCellHeight: 16, valign: 'middle' },
        styles: { cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 'auto' }, 
          2: { cellWidth: 10, halign: 'center' },
          3: { cellWidth: 11, halign: 'center' },
          4: { cellWidth: 13, halign: 'center' },
          5: { cellWidth: 13, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 'auto' }, 
          8: { cellWidth: 14 },
          9: { cellWidth: 'auto' }, 
          10: { cellWidth: 15 },
          11: { cellWidth: 18 },
          12: { cellWidth: 18 },
          13: { cellWidth: 16 }
        }
      });

      let finalY = doc.lastAutoTable.finalY + 4;
      const cityDate = fs.city || '';
      doc.setFontSize(10);
      doc.setFont('TinosFont', 'bolditalic');
      // Dịch sang trái 60px (~20 đơn vị của jsPDF, 287-10 = 277, -20 = 257)
      doc.text(cityDate, 237, finalY + 4, { align: 'right' });

      finalY += 14;
      doc.setFontSize(10);
      doc.setFont('TinosFont', 'bold');
      doc.text('NGƯỜI LẬP', 45, finalY, { align: 'center' });
      doc.text('XEM XÉT', 115, finalY, { align: 'center' });
      doc.text('TRƯỞNG ĐƠN VỊ', 185, finalY, { align: 'center' });
      doc.text('PHÊ DUYỆT', 250, finalY, { align: 'center' });
      
      finalY += 25;
      doc.text(fs.creator || '', 45, finalY, { align: 'center' });
      doc.text(fs.reviewer || '', 115, finalY, { align: 'center' });
      doc.text(fs.head || '', 185, finalY, { align: 'center' });
      doc.text(fs.approver || '', 250, finalY, { align: 'center' });

      doc.save('De_nghi_cap_vat_tu_' + Date.now() + '.pdf');
      Toast.success('Đã xuất phiếu đề nghị vật tư thành công');
    } catch (e) {
      console.error(e);
      Toast.error('Lỗi khi tạo PDF: ' + e.message);
    }
  },
  async generateProposalExcel(id) {
    if (typeof ExcelJS === 'undefined') {
      Toast.warning('Thư viện ExcelJS chưa sẵn sàng. Vui lòng tải lại trang.');
      return;
    }
    const items = this._collectProposalItems();
    if (!items) return;

    const fs = this._getFormSettings();
    const dateStr = new Date().toISOString().split('T')[0];
    const dateObj = new Date(dateStr);

    try {
      Toast.info('Đang tải mẫu Excel gốc...', 3000);
      
      function base64ToArrayBuffer(base64) {
          const binaryString = window.atob(base64);
          const binaryLen = binaryString.length;
          const bytes = new Uint8Array(binaryLen);
          for (let i = 0; i < binaryLen; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
      }
      const arrayBuffer = base64ToArrayBuffer(PROPOSAL_TEMPLATE_B64);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);

      // Điền thông tin ngày lập
      worksheet.getCell('L3').value = `Ngày lập: ${dateObj.getDate()} tháng ${dateObj.getMonth() + 1} năm ${dateObj.getFullYear()}`;

      // Xử lý chèn thêm dòng nếu số lượng vật tư > 5
      if (items.length > 5) {
        // duplicateRow(startRow, count, insert)
        // Dòng 7 là dòng data đầu tiên trong template.
        worksheet.duplicateRow(7, items.length - 5, true);
      }

      // Điền data vật tư bắt đầu từ dòng 7
      let currentRow = 7;
      items.forEach((item, idx) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = idx + 1; // TT
        row.getCell(2).value = item.name + (item.code ? ` (${item.code})` : ''); // Tên vật tư
        row.getCell(3).value = item.unit; // ĐVT
        // Bỏ qua cột 4 (Nhóm VT)
        row.getCell(5).value = item.qty; // SL yêu cầu
        row.getCell(6).value = item.stock !== undefined ? item.stock : ''; // SL Tồn kho
        row.getCell(7).value = item.needDate || dateStr; // Ngày cần có
        row.getCell(8).value = fs.category; // Mã/Tên hạng mục
        // Bỏ qua cột 9 (Nhóm chi phí)
        row.getCell(10).value = fs.purpose; // Mục đích
        row.getCell(11).value = fs.delivery; // Vị trí giao
        row.getCell(12).value = fs.receiver; // Nhận và Ktra
        row.getCell(13).value = fs.buyer; // Người mua
        row.getCell(14).value = item.priceReq || ''; // YC Chào giá
        currentRow++;
      });

      // Xác định dòng của Thành phố & Chữ ký sau khi đã chèn thêm (nếu có)
      const offset = Math.max(0, items.length - 5);
      const cityRowIdx = 12 + offset;
      const sigRowIdx = 13 + offset;

      // Điền thành phố và ngày
      const cityDateText = `${fs.city}, ngày ${dateObj.getDate()} tháng ${dateObj.getMonth() + 1} năm ${dateObj.getFullYear()}`;
      worksheet.getCell(`J${cityRowIdx}`).value = cityDateText;

      // Điền chữ ký (do merge cell trong template)
      worksheet.getCell(`A${sigRowIdx}`).value = `NGƯỜI LẬP\n\n\n\n\n${fs.creator}`;
      worksheet.getCell(`C${sigRowIdx}`).value = `XEM XÉT\n\n\n\n\n${fs.reviewer}`;
      worksheet.getCell(`H${sigRowIdx}`).value = `TRƯỞNG ĐƠN VỊ\n\n\n\n\n${fs.head}`;
      worksheet.getCell(`K${sigRowIdx}`).value = `PHÊ DUYỆT\n\n\n\n\n${fs.approver}`;

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `De_nghi_cap_vat_tu_${Date.now()}.xlsx`);

      Toast.success('Đã xuất file Excel theo chuẩn template công ty!');
    } catch (e) {
      console.error(e);
      Toast.error('Lỗi khi tạo Excel: ' + e.message);
    }
  },


  renderHistory() {
    const container = document.getElementById('parts-content');
    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Loại</th>
              <th>Phụ tùng</th>
              <th>Số lượng</th>
              <th>Mã SC</th>
              <th>Người thực hiện</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${this.transactions.length === 0 ? '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Chưa có giao dịch nào</div></div></td></tr>' : ''}
            ${this.transactions.map(t => `
              <tr>
                <td class="text-muted">${Utils.formatDateTime(t.performed_at)}</td>
                <td><span class="badge ${t.type === 'Nhập kho' ? 'badge-active' : 'badge-broken'}">${t.type === 'Nhập kho' ? '📥' : '📤'} ${t.type}</span></td>
                <td>${Utils.escapeHtml(t.part_name)}</td>
                <td class="fw-600">${t.quantity}</td>
                <td>${t.repair_request_id ? `<span style="color:var(--accent-secondary)">${Utils.escapeHtml(t.repair_request_id)}</span>` : '—'}</td>
                <td>${Utils.escapeHtml(t.performed_by)}</td>
                <td class="text-muted">${Utils.escapeHtml(t.notes || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async doImport() {
    const partId = document.getElementById('f-import-part').value;
    const qty = parseInt(document.getElementById('f-import-qty').value);
    const notes = document.getElementById('f-import-notes').value;

    if (!partId || !qty || qty <= 0) {
      Toast.warning('Vui lòng chọn phụ tùng và số lượng');
      return;
    }

    const result = await API.importPart(partId, qty, notes);
    if (result.success) {
      Toast.success('Nhập kho thành công');
      await this.loadData();
      this.switchTab('import');
    } else {
      Toast.error(result.error);
    }
  },

  async doExport() {
    const partId = document.getElementById('f-export-part').value;
    const qty = parseInt(document.getElementById('f-export-qty').value);
    const repairId = document.getElementById('f-export-repair-id').value;
    const notes = document.getElementById('f-export-notes').value;

    if (!partId || !qty || qty <= 0) {
      Toast.warning('Vui lòng chọn phụ tùng và số lượng');
      return;
    }

    const result = await API.exportPart(partId, qty, repairId, notes);
    if (result.success) {
      Toast.success('Xuất kho thành công');
      await this.loadData();
      this.switchTab('import');
    } else {
      Toast.error(result.error);
    }
  },

  showAddModal() { this._showPartForm(null); },
  showEditModal(id) { this._showPartForm(this.parts.find(p => p.id === id)); },

  _showPartForm(part) {
    const isEdit = !!part;
    const content = `
      <form onsubmit="return false">
        <div class="form-row">
          <div class="form-group">
            <label>Mã phụ tùng <span class="required">*</span></label>
            <input type="text" class="form-input" id="f-part-code" value="${Utils.escapeHtml(part?.part_code || '')}" required>
          </div>
          <div class="form-group">
            <label>Tên phụ tùng <span class="required">*</span></label>
            <input type="text" class="form-input" id="f-part-name" value="${Utils.escapeHtml(part?.part_name || '')}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Loại</label>
            <select class="form-select" id="f-part-category">
              ${['Điện', 'Cơ khí', 'Mài', 'Đục', 'Cắt', 'Khoan', 'Bôi trơn'].map(c => `<option value="${c}" ${part?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Đơn vị tính</label>
            <input type="text" class="form-input" id="f-part-unit" value="${Utils.escapeHtml(part?.unit || 'cái')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Số lượng tồn</label>
            <input type="number" class="form-input" id="f-part-qty" value="${part?.quantity || 0}" min="0">
          </div>
          <div class="form-group">
            <label>Tồn tối thiểu</label>
            <input type="number" class="form-input" id="f-part-min" value="${part?.min_quantity || 0}" min="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Đơn giá (₫)</label>
            <input type="number" class="form-input" id="f-part-price" value="${part?.unit_price || 0}" min="0" step="1000">
          </div>
          <div class="form-group">
            <label>Nhà cung cấp</label>
            <input type="text" class="form-input" id="f-part-supplier" value="${Utils.escapeHtml(part?.supplier || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Ghi chú</label>
          <textarea class="form-textarea" id="f-part-notes" rows="2">${Utils.escapeHtml(part?.notes || '')}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Hủy</button>
      <button class="btn btn-primary" onclick="SparePartsPage.savePart('${part?.id || ''}')">💾 ${isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
    `;

    Modal.show({ title: isEdit ? '✏️ Sửa phụ tùng' : '📦 Thêm phụ tùng', content, footer });
  },

  async savePart(id) {
    const data = {
      part_code: document.getElementById('f-part-code').value.trim(),
      part_name: document.getElementById('f-part-name').value.trim(),
      category: document.getElementById('f-part-category').value,
      unit: document.getElementById('f-part-unit').value.trim(),
      quantity: parseInt(document.getElementById('f-part-qty').value) || 0,
      min_quantity: parseInt(document.getElementById('f-part-min').value) || 0,
      unit_price: parseInt(document.getElementById('f-part-price').value) || 0,
      supplier: document.getElementById('f-part-supplier').value.trim(),
      notes: document.getElementById('f-part-notes').value.trim(),
    };

    if (!data.part_code || !data.part_name) {
      Toast.warning('Vui lòng điền mã và tên phụ tùng');
      return;
    }

    const result = id ? await API.updatePart(id, data) : await API.createPart(data);
    if (result.success) {
      Toast.success(id ? 'Cập nhật thành công' : 'Thêm phụ tùng thành công');
      Modal.closeAll();
      await this.loadData();
    } else {
      Toast.error(result.error);
    }
  },

  async deletePart(id) {
    const part = this.parts.find(p => p.id === id);
    const confirmed = await Modal.confirm({
      title: 'Xóa phụ tùng',
      message: `Xóa "${part?.part_name}"? Hành động này không thể hoàn tác.`,
      icon: '🗑️',
      confirmText: 'Xóa',
      danger: true
    });
    if (confirmed) {
      const result = await API.deletePart(id);
      if (result.success) {
        Toast.success('Đã xóa phụ tùng');
        await this.loadData();
      } else {
        Toast.error(result.error);
      }
    }
  },

  showImportModal(partId) {
    this.switchTab('import');
    setTimeout(() => {
      const el = document.getElementById('f-import-part');
      if (el) el.value = partId;
    }, 100);
  },

  showExportModal(partId) {
    this.switchTab('import');
    setTimeout(() => {
      const el = document.getElementById('f-export-part');
      if (el) el.value = partId;
    }, 100);
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

  showSupplierLinksModal() {
    Modal.show({
      title: '🔗 Link Nhà Cung Cấp',
      content: `
        <div class="form-group" style="display:flex; gap:8px;">
          <input type="text" class="form-input" id="supplier-name" placeholder="Tên nhà cung cấp">
          <input type="text" class="form-input" id="supplier-url" placeholder="https://..." style="flex:2">
          <button class="btn btn-primary" onclick="SparePartsPage.addSupplierLink()">Thêm</button>
        </div>
        <div class="table-wrapper" style="max-height: 400px; overflow-y: auto; margin-top: 16px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên nhà cung cấp</th>
                <th>Link</th>
                <th style="width:100px;text-align:right;">Thao tác</th>
              </tr>
            </thead>
            <tbody id="supplier-links-body">
              ${this.renderSupplierLinksList()}
            </tbody>
          </table>
        </div>
      `,
      hideActions: true
    });
  },

  renderSupplierLinksList() {
    if (!this.supplierLinks || this.supplierLinks.length === 0) {
      return '<tr><td colspan="3" class="text-center text-muted">Chưa có link nào.</td></tr>';
    }
    return this.supplierLinks.map((link, idx) => `
      <tr>
        <td>${Utils.escapeHtml(link.name)}</td>
        <td><a href="${Utils.escapeHtml(link.url)}" target="_blank" style="color:var(--primary-color)">Truy cập ↗</a></td>
        <td style="text-align:right;">
          <button class="btn btn-sm btn-secondary" onclick="SparePartsPage.editSupplierLink(${idx})" style="padding: 4px 8px;">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="SparePartsPage.deleteSupplierLink(${idx})" style="padding: 4px 8px;">🗑️</button>
        </td>
      </tr>
    `).join('');
  },

  async addSupplierLink() {
    const nameInput = document.getElementById('supplier-name');
    const urlInput = document.getElementById('supplier-url');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    
    if (!name || !url) {
      Toast.warning('Vui lòng nhập tên và link nhà cung cấp');
      return;
    }
    
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    this.supplierLinks.push({ name, url });
    await this.saveSupplierLinks();
    
    nameInput.value = '';
    urlInput.value = '';
    document.getElementById('supplier-links-body').innerHTML = this.renderSupplierLinksList();
  },

  async editSupplierLink(idx) {
    const link = this.supplierLinks[idx];
    const newName = prompt('Nhập tên nhà cung cấp mới:', link.name);
    if (newName === null) return;
    
    let newUrl = prompt('Nhập link mới:', link.url);
    if (newUrl === null) return;
    
    if (newName.trim() === '' || newUrl.trim() === '') {
      Toast.warning('Tên và link không được để trống');
      return;
    }

    if (!/^https?:\/\//i.test(newUrl)) {
      newUrl = 'https://' + newUrl;
    }

    this.supplierLinks[idx] = { name: newName.trim(), url: newUrl.trim() };
    await this.saveSupplierLinks();
    document.getElementById('supplier-links-body').innerHTML = this.renderSupplierLinksList();
  },

  async deleteSupplierLink(idx) {
    if (confirm('Xóa link nhà cung cấp này?')) {
      this.supplierLinks.splice(idx, 1);
      await this.saveSupplierLinks();
      document.getElementById('supplier-links-body').innerHTML = this.renderSupplierLinksList();
    }
  },

  async saveSupplierLinks() {
    const result = await API.updateConfig('supplier_links', JSON.stringify(this.supplierLinks));
    if (result.success) {
      Toast.success('Đã lưu danh sách link');
    } else {
      Toast.error('Lỗi khi lưu link: ' + result.error);
    }
  }
};