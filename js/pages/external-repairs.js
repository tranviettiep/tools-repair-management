const ExternalRepairsPage = {
  _repairs: [],
  _items: [],
  _editingId: null,

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div>
            <h2>Sửa chữa ngoài</h2>
            <p class="page-subtitle">Quản lý phiếu gửi thiết bị đi sửa chữa tại đơn vị bên ngoài</p>
          </div>
          <div class="page-header-actions">
            <select id="ext-repair-status-filter" class="form-select" style="width:auto" onchange="ExternalRepairsPage.filterData()">
              <option value="">Tất cả trạng thái</option>
              <option value="Đang sửa">Đang sửa</option>
              <option value="Hoàn thành">Hoàn thành</option>
            </select>
            <button class="btn btn-primary" onclick="ExternalRepairsPage.openModal()"><i data-lucide="plus"></i> Tạo phiếu mới</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 20%;">Mã phiếu</th>
                <th style="width: 20%;">Ngày lập</th>
                <th style="width: 25%;">Trạng thái</th>
                <th style="width: 35%;">Thao tác</th>
              </tr>
            </thead>
            <tbody id="external-repairs-tbody">
              <tr><td colspan="4"><div class="loading-inline"><div class="spinner"></div></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      const res = await API.request('get_external_repairs');
      if (res.success) {
        this._repairs = res.data;
        this.renderTable();
      } else {
        Toast.error(res.error || 'Lỗi khi tải dữ liệu');
      }
    } catch (e) {
      Toast.error('Lỗi kết nối');
    }
  },

  renderTable() {
    const tbody = document.getElementById('external-repairs-tbody');
    if (!tbody) return;
    let displayRepairs = this._repairs;
    
    const filterStatus = document.getElementById('ext-repair-status-filter')?.value;
    if (filterStatus) {
      displayRepairs = displayRepairs.filter(r => r.status === filterStatus);
    }
    
    if (!displayRepairs || displayRepairs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon"><i data-lucide="truck"></i></div><div class="empty-state-title">Chưa có phiếu nào</div><div class="empty-state-desc">Tạo phiếu mới từ các yêu cầu đang ở trạng thái Báo hỏng</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = displayRepairs.map(r => `
      <tr>
        <td><span class="cell-id">${Utils.escapeHtml(r.id)}</span></td>
        <td>${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td>
          ${Utils.getStatusBadge(r.status)}
        </td>
        <td><div class="cell-actions">
          <button class="btn btn-secondary btn-sm" onclick="ExternalRepairsPage.openModal('${r.id}')"><i data-lucide="pencil"></i> Xem/Sửa</button>
          <button class="btn btn-primary btn-sm" onclick="ExternalRepairsPage.generatePDF('${r.id}')"><i data-lucide="file-down"></i> Xuất PDF</button>
          <button class="btn btn-danger btn-sm" onclick="ExternalRepairsPage.deleteTicket('${r.id}')"><i data-lucide="trash-2"></i> Xóa</button>
        </div></td>
      </tr>
    `).join('');
  },

  filterData() {
    this.renderTable();
  },

  async deleteTicket(id) {
    if (!(await Modal.confirm({ title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác.', icon: '<i data-lucide="trash-2"></i>', confirmText: 'Xóa', danger: true }))) return;
    const res = await API.request('delete_external_repair', { id }, 'POST');
    if (res.success) {
      Toast.success('Đã xóa phiếu');
      this.loadData();
    } else {
      Toast.error('Lỗi khi xóa');
    }
  },

  async openModal(id = null) {
    this._editingId = id;
    this._items = [];
    this._reported = [];

    if (id) {
      const ticket = this._repairs.find(r => r.id === id);
      if (ticket && ticket.items) {
        try {
          this._items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items;
        } catch(e) { this._items = []; }
      }
    } else {
      const res = await API.getRepairs({ status: 'Báo hỏng' });
      this._reported = res.success ? res.data : [];
    }
    this._items = (this._items || []).map(it => ({ ...it }));

    // Suggest repair vendors already used on earlier tickets
    const vendors = [...new Set(this._repairs.flatMap(t => {
      try { return (typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || [])).map(it => it.vendor).filter(Boolean); }
      catch { return []; }
    }))];

    const reportedList = id ? '' : `
      <div class="form-group">
        <label>Chọn phiếu báo hỏng cần sửa ngoài <span class="required">*</span></label>
        <div class="check-list">
          ${this._reported.map(r => `
            <label class="check-list-item">
              <input type="checkbox" value="${r.id}" onchange="ExternalRepairsPage.toggleRepair('${r.id}', this.checked)">
              <strong>${Utils.escapeHtml(r.id)}</strong> - ${Utils.escapeHtml(r.machine_name)} <span class="text-muted">(${Utils.escapeHtml(r.fault_description || '')})</span>
            </label>`).join('') || '<div class="check-list-empty">Không có phiếu nào đang Báo hỏng</div>'}
        </div>
      </div>`;

    Modal.show({
      title: id ? 'Cập nhật phiếu đề nghị thuê ngoài sửa chữa' : 'Tạo phiếu đề nghị thuê ngoài sửa chữa',
      content: `
        ${reportedList}
        <datalist id="dl-ext-vendors">${vendors.map(v => `<option value="${Utils.escapeHtml(v)}"></option>`).join('')}</datalist>
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Đơn vị sửa chữa (điền nhanh cho tất cả dòng)</label>
          <div style="display:flex; gap:8px; max-width:480px">
            <input type="text" class="form-input" id="ext-vendor-all" list="dl-ext-vendors" placeholder="VD: Tâm Toản">
            <button type="button" class="btn btn-secondary btn-sm" onclick="ExternalRepairsPage.applyVendorAll()">Áp dụng</button>
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <button class="btn btn-secondary btn-sm" onclick="ExternalRepairsPage.addItem()"><i data-lucide="plus"></i> Thêm dòng</button>
        </div>
        <div class="table-scroll">
          <table class="data-table data-table-compact" style="min-width: 1100px;">
            <thead>
              <tr>
                <th width="36">TT</th>
                <th width="110">Mã sửa chữa</th>
                <th width="200">Tên thiết bị</th>
                <th width="140">Đơn vị</th>
                <th width="170">Tình trạng</th>
                <th width="70">ĐVT</th>
                <th width="70">SL</th>
                <th width="120">Nhóm chi phí</th>
                <th width="70" style="text-align:center">YC báo giá</th>
                <th>Ghi chú</th>
                <th width="44"></th>
              </tr>
            </thead>
            <tbody id="ext-repairs-items-tbody">
            </tbody>
          </table>
        </div>
      `,
      footer: `
          <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.show [data-modal-close]').click()">Hủy</button>
          <button class="btn btn-primary" onclick="ExternalRepairsPage.saveTicketAndExportPDF()"><i data-lucide="file-down"></i> Xác nhận và xuất PDF</button>
        `,
      size: 'xl'
    });

    this.renderItems();
  },

  _todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // dd/mm/yyyy without leading zeros on day/month, like the company form (9/11/2026)
  _fmtDate(value) {
    if (!value) return '';
    let d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(value);
    }
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  },

  _syncItems() {
    const rows = document.querySelectorAll('#ext-repairs-items-tbody tr');
    this._items = Array.from(rows).map((row, idx) => {
      const prev = this._items[idx] || {};
      const val = (cls) => row.querySelector('.' + cls)?.value ?? '';
      return {
        ...prev,
        repair_code: val('ei-code'),
        name: val('ei-name'),
        vendor: val('ei-vendor'),
        condition: val('ei-condition'),
        uom: val('ei-uom'),
        qty: parseFloat(val('ei-qty')) || 0,
        cost_group: val('ei-cost'),
        quote_req: !!row.querySelector('.ei-quote')?.checked,
        note: val('ei-note')
      };
    });
  },

  toggleRepair(repairId, checked) {
    this._syncItems();
    if (checked) {
      const r = this._reported.find(r => r.id === repairId);
      if (!r) return;
      this._items.push({
        repair_id: r.id,
        repair_code: r.id,
        department: r.department || '',
        cost_group: r.department || '',
        vendor: document.getElementById('ext-vendor-all')?.value.trim() || '',
        name: r.machine_name + (r.machine_code ? ' (' + r.machine_code + ')' : ''),
        condition: r.fault_description || '',
        uom: 'cái', qty: 1, quote_req: false, note: ''
      });
    } else {
      this._items = this._items.filter(it => it.repair_id !== repairId);
    }
    this.renderItems();
  },

  applyVendorAll() {
    const v = document.getElementById('ext-vendor-all')?.value.trim() || '';
    this._syncItems();
    this._items.forEach(it => { it.vendor = v; });
    this.renderItems();
  },

  addItem() {
    this._syncItems();
    this._items.push({
      repair_code: '', name: '', vendor: document.getElementById('ext-vendor-all')?.value.trim() || '',
      condition: '', uom: 'cái', qty: 1, cost_group: '', quote_req: false, note: ''
    });
    this.renderItems();
  },

  removeItem(index) {
    this._syncItems();
    this._items.splice(index, 1);
    this.renderItems();
  },

  updateItem(index, field, value) {
    this._items[index][field] = value;
  },

  renderItems() {
    const tbody = document.getElementById('ext-repairs-items-tbody');
    if (!tbody) return;
    const esc = (v) => Utils.escapeHtml(v == null ? '' : String(v));

    tbody.innerHTML = this._items.map((it, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><input type="text" class="form-input ei-code" value="${esc(it.repair_code ?? it.repair_id ?? '')}"></td>
        <td><input type="text" class="form-input ei-name" value="${esc(it.name)}"></td>
        <td><input type="text" class="form-input ei-vendor" list="dl-ext-vendors" value="${esc(it.vendor)}" placeholder="Đơn vị sửa"></td>
        <td><input type="text" class="form-input ei-condition" value="${esc(it.condition)}"></td>
        <td><input type="text" class="form-input ei-uom" value="${esc(it.uom)}"></td>
        <td><input type="number" class="form-input ei-qty" value="${it.qty || 1}" min="0" style="width:60px"></td>
        <td><input type="text" class="form-input ei-cost" value="${esc(it.cost_group ?? it.department ?? '')}"></td>
        <td style="text-align:center"><input type="checkbox" class="ei-quote" ${it.quote_req ? 'checked' : ''}></td>
        <td><input type="text" class="form-input ei-note" value="${esc(it.note)}"></td>
        <td><button type="button" class="btn btn-ghost entry-remove" onclick="ExternalRepairsPage.removeItem(${idx})" title="Xóa dòng"><i data-lucide="x"></i></button></td>
      </tr>
    `).join('');
  },

  async saveTicketAndExportPDF() {
    const savedId = await this.saveTicket();
    if (savedId) {
      await this.generatePDF(savedId);
      const closeBtn = document.querySelector('.modal-overlay.show [data-modal-close]');
      if (closeBtn) closeBtn.click();
    }
  },

  async saveTicket() {
    // Collect active input values just in case onchange hasn't fired
    this._syncItems();
    this._items = this._items.filter(it => (it.name || '').trim() !== '');

    if (this._items.length === 0) {
      Toast.error('Vui lòng nhập ít nhất 1 thiết bị/vật tư');
      return false;
    }

    const repairIds = this._items.map(it => it.repair_id).filter(Boolean);
    if (!this._editingId && repairIds.length === 0) {
      Toast.error('Vui lòng chọn ít nhất 1 phiếu báo hỏng');
      return false;
    }

    const ticket = this._editingId ? { ...this._repairs.find(r => r.id === this._editingId) } : { status: 'Đang sửa' };
    ticket.items = JSON.stringify(this._items);

    Toast.info('Đang lưu...');
    const res = await API.request('save_external_repair', { data: ticket }, 'POST');
    if (res.success) {
      if (!this._editingId) await API.markRepairsExternal(repairIds, res.data.id);
      Toast.success('Đã lưu phiếu sửa chữa ngoài');
      await this.loadData();
      return res.data.id;
    } else {
      Toast.error('Lỗi khi lưu');
      return false;
    }
  },

  async generatePDF(id) {
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      Toast.warning('Thư viện jsPDF chưa sẵn sàng.');
      return;
    }

    let ticket = this._repairs.find(r => r.id === id);
    if (!ticket) {
      await this.loadData();
      ticket = this._repairs.find(r => r.id === id);
    }
    if (!ticket) return;

    let items = [];
    try {
      items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items;
    } catch (e) {
      items = [];
    }
    items = items || [];

    // Older tickets: take the cost group (department) from the linked fault report
    const missingDeptIds = items.filter(it => it.repair_id && !it.cost_group && !it.department).map(it => it.repair_id);
    if (missingDeptIds.length) {
      try {
        API.init();
        const { data: linked } = await API.supabase.from('repairs').select('id, department').in('id', missingDeptIds);
        items = items.map(it => {
          if (it.cost_group || it.department || !it.repair_id) return it;
          const r = (linked || []).find(x => x.id === it.repair_id);
          return r ? { ...it, department: r.department || '' } : it;
        });
      } catch (e) { /* column stays empty */ }
    }

    const fs = await API.getFormSettings();

    try {
      await Utils.loadTemplateData();
    } catch (e) {
      Toast.error(e.message);
      return;
    }

    const createdText = this._fmtDate(ticket.created_at || new Date().toISOString());

    try {
      Toast.info('Đang tạo PDF...');
      const { jsPDF: JsPDF } = window.jspdf || { jsPDF: window.jsPDF };
      // Landscape A4, mm
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.addFileToVFS('Times-Regular.ttf', FONT_TIMES_REGULAR_B64);
      doc.addFont('Times-Regular.ttf', 'TinosFont', 'normal');
      doc.addFileToVFS('Times-Bold.ttf', FONT_TIMES_BOLD_B64);
      doc.addFont('Times-Bold.ttf', 'TinosFont', 'bold');
      doc.addFont('Times-Bold.ttf', 'TinosFont', 'bolditalic');
      doc.setFont('TinosFont');

      const MARGIN = 10;
      const PAGE_W = 297;
      const lineStyle = { lineWidth: 0.2, lineColor: [0, 0, 0], textColor: [0, 0, 0] };

      // ── Header: logo | company name / form title | 4 info lines ──
      doc.autoTable({
        startY: 10,
        margin: { left: MARGIN, right: MARGIN },
        theme: 'plain',
        body: [
          [
            { content: '', rowSpan: 4 },
            { content: 'CÔNG TY TNHH THẮNG LỢI', rowSpan: 2, styles: { fontStyle: 'bold', fontSize: 12 } },
            'Mã hiệu :  BM.TB.04.01'
          ],
          ['Đơn vị đề nghị:  Phòng Thiết bị'],
          [
            { content: 'PHIẾU ĐỀ NGHỊ THUÊ NGOÀI SỬA CHỮA', rowSpan: 2, styles: { fontStyle: 'bold', fontSize: 12 } },
            'Số phiếu:  ' + (ticket.id || '')
          ],
          ['Ngày lập :  ' + createdText]
        ],
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 184, halign: 'center', valign: 'middle' },
          2: { cellWidth: 55, halign: 'left', valign: 'middle' }
        },
        styles: { font: 'TinosFont', fontSize: 9.5, cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, minCellHeight: 7.5, ...lineStyle },
        didDrawCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0) {
            const logoW = 28;
            const logoH = 13.5;
            const xPos = data.cell.x + (data.cell.width - logoW) / 2;
            const yPos = data.cell.y + (data.cell.height - logoH) / 2;
            doc.addImage('data:image/jpeg;base64,' + LOGO_VICO_B64, 'JPEG', xPos, yPos, logoW, logoH);
          }
        }
      });

      // Empty band under the header (as on the company form)
      const bandY = doc.lastAutoTable.finalY;
      const bandH = 12;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN, bandY, PAGE_W - MARGIN * 2, bandH);

      // ── Item table ──
      const tableData = items.map((item, index) => [
        String(index + 1),
        item.repair_code || item.repair_id || '',
        item.name || '',
        item.vendor || '',
        item.condition || '',
        item.uom || '',
        item.qty != null && item.qty !== '' ? String(item.qty) : '',
        item.category || '',
        item.cost_group || item.department || '',
        item.quote_req ? 'X' : '',
        '',
        '',
        item.note || ''
      ]);

      doc.autoTable({
        startY: bandY + bandH,
        margin: { left: MARGIN, right: MARGIN },
        head: [['STT', 'Mã Sửa chữa', 'Tên thiết bị', 'Đơn vị', 'Tình trạng', 'Đơn vị tính', 'Số lượng', 'Mã/Tên hạng mục', 'Nhóm chi phí', 'Yêu cầu báo giá', 'Ngày ra cổng', 'Ngày ra cổng', 'Ghi chú']],
        body: tableData,
        theme: 'grid',
        headStyles: { font: 'TinosFont', fillColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', ...lineStyle },
        bodyStyles: { font: 'TinosFont', fontSize: 9, minCellHeight: 13, valign: 'middle', halign: 'center', ...lineStyle },
        styles: { cellPadding: 1.2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 },
          4: { cellWidth: 24 },
          5: { cellWidth: 13 },
          6: { cellWidth: 14 },
          7: { cellWidth: 21 },
          8: { cellWidth: 19 },
          9: { cellWidth: 15, fontStyle: 'bold', fontSize: 11 },
          10: { cellWidth: 15 },
          11: { cellWidth: 15 },
          12: { cellWidth: 32, halign: 'left' }
        }
      });

      // ── "Ngày" + signatures: Người lập | Trưởng đơn vị | Giám đốc sản xuất ──
      let finalY = doc.lastAutoTable.finalY + 8;
      if (finalY > 165) { doc.addPage(); finalY = 20; }

      doc.setFontSize(10);
      doc.setFont('TinosFont', 'bolditalic');
      doc.text('Ngày', 196, finalY, { align: 'right' });

      finalY += 9;
      const cols = [50, 135, 230];
      doc.setFontSize(10);
      doc.setFont('TinosFont', 'bold');
      doc.text('Người lập', cols[0], finalY, { align: 'center' });
      doc.text('Trưởng đơn vị', cols[1], finalY, { align: 'center' });
      doc.text('Giám đốc sản xuất', cols[2], finalY, { align: 'center' });

      finalY += 26;
      doc.text(fs.creator || '', cols[0], finalY, { align: 'center' });
      doc.text(fs.head || '', cols[1], finalY, { align: 'center' });
      doc.text(fs.approver || '', cols[2], finalY, { align: 'center' });

      doc.save('Phieu_Sua_Chua_Ngoai_' + ticket.id + '.pdf');
      Toast.success('Đã xuất phiếu thành công');
    } catch (e) {
      console.error(e);
      Toast.error('Lỗi khi tạo PDF: ' + e.message);
    }
  }
};
