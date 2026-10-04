const ExternalRepairsPage = {
  _repairs: [],
  _items: [],
  _editingId: null,

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="header-actions" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h2>Quản lý phiếu sửa chữa ngoài</h2>
        <div style="display:flex; gap: 16px; align-items:center;">
          <select id="ext-repair-status-filter" class="form-input" onchange="ExternalRepairsPage.filterData()">
            <option value="">Tất cả trạng thái</option>
            <option value="Đang sửa">Đang sửa</option>
            <option value="Hoàn thành">Hoàn thành</option>
          </select>
          <button class="btn btn-primary" onclick="ExternalRepairsPage.openModal()">+ Tạo phiếu mới</button>
        </div>
      </div>

      <div class="card">
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
              <tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr>
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
    let displayRepairs = this._repairs;
    
    const filterStatus = document.getElementById('ext-repair-status-filter')?.value;
    if (filterStatus) {
      displayRepairs = displayRepairs.filter(r => r.status === filterStatus);
    }
    
    if (!displayRepairs || displayRepairs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có phiếu nào</td></tr>';
      return;
    }

    tbody.innerHTML = displayRepairs.map(r => `
      <tr>
        <td style="font-weight: 500; color: var(--accent-primary);">${r.id}</td>
        <td>${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td>
          ${Utils.getStatusBadge(r.status)}
        </td>
        <td style="display: flex; gap: 8px; justify-content: flex-start;">
          <button class="btn btn-secondary btn-sm" onclick="ExternalRepairsPage.openModal('${r.id}')">Xem/Sửa</button>
          <button class="btn btn-primary btn-sm" onclick="ExternalRepairsPage.generatePDF('${r.id}')">Xuất PDF</button>
          <button class="btn btn-danger btn-sm" onclick="ExternalRepairsPage.deleteTicket('${r.id}')">Xóa</button>
        </td>
      </tr>
    `).join('');
  },

  filterData() {
    this.renderTable();
  },

  async deleteTicket(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu này?')) return;
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

    const reportedList = id ? '' : `
      <div class="form-group">
        <label>Chọn phiếu báo hỏng cần sửa ngoài <span class="required">*</span></label>
        <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-secondary);">
          ${this._reported.map(r => `
            <label style="display:block; padding:8px; border-bottom:1px solid var(--border-color); cursor:pointer;">
              <input type="checkbox" value="${r.id}" onchange="ExternalRepairsPage.toggleRepair('${r.id}', this.checked)" style="margin-right:8px">
              <strong>${Utils.escapeHtml(r.id)}</strong> - ${Utils.escapeHtml(r.machine_name)} <span class="text-muted">(${Utils.escapeHtml(r.fault_description || '')})</span>
            </label>`).join('') || '<div style="padding:10px; color:var(--text-muted)">Không có phiếu nào đang Báo hỏng</div>'}
        </div>
      </div>`;

    Modal.show({
      title: id ? 'Cập nhật phiếu sửa chữa ngoài' : 'Tạo phiếu sửa chữa ngoài',
      content: `
        ${reportedList}
        <div style="margin-bottom: 16px;">
          <button class="btn btn-secondary btn-sm" onclick="ExternalRepairsPage.addItem()">+ Thêm dòng</button>
        </div>
        <div class="table-responsive" style="max-height: 400px; overflow-y:auto;">
          <table class="table" style="width: 100%; min-width: 900px;">
            <thead>
              <tr>
                <th width="40">TT</th>
                <th width="250">Tên thiết bị / Phụ tùng</th>
                <th width="250">Tình trạng hỏng hóc</th>
                <th width="80">ĐVT</th>
                <th width="80">SL</th>
                <th>Ghi chú</th>
                <th width="50"></th>
              </tr>
            </thead>
            <tbody id="ext-repairs-items-tbody">
            </tbody>
          </table>
        </div>
      `,
      footer: `
          <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.show [data-modal-close]').click()">Hủy</button>
          <button class="btn btn-primary" onclick="ExternalRepairsPage.saveTicketAndExportPDF()">Xác nhận và xuất PDF</button>
        `,
      size: 'xl'
    });

    this.renderItems();
  },

  _syncItems() {
    const rows = document.querySelectorAll('#ext-repairs-items-tbody tr');
    this._items = Array.from(rows).map((row, idx) => {
      const inputs = row.querySelectorAll('input');
      return {
        name: inputs[0].value,
        condition: inputs[1].value,
        uom: inputs[2].value,
        qty: parseFloat(inputs[3].value) || 0,
        note: inputs[4].value,
        repair_id: this._items[idx] ? this._items[idx].repair_id : undefined
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
        name: r.machine_name + (r.machine_code ? ' (' + r.machine_code + ')' : ''),
        condition: r.fault_description || '',
        uom: 'cái', qty: 1, note: ''
      });
    } else {
      this._items = this._items.filter(it => it.repair_id !== repairId);
    }
    this.renderItems();
  },

  addItem() {
    this._items.push({
      code: '', name: '', unit: '', condition: '', uom: 'cái', qty: 1, category: '', note: ''
    });
    this.renderItems();
  },

  removeItem(index) {
    this._items.splice(index, 1);
    this.renderItems();
  },

  updateItem(index, field, value) {
    this._items[index][field] = value;
  },

  renderItems() {
    const tbody = document.getElementById('ext-repairs-items-tbody');
    if (!tbody) return;

    tbody.innerHTML = this._items.map((it, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><input type="text" class="form-input" value="${it.name || ''}" onchange="ExternalRepairsPage.updateItem(${idx}, 'name', this.value)"></td>
        <td><input type="text" class="form-input" value="${it.condition || ''}" onchange="ExternalRepairsPage.updateItem(${idx}, 'condition', this.value)"></td>
        <td><input type="text" class="form-input" value="${it.uom || ''}" onchange="ExternalRepairsPage.updateItem(${idx}, 'uom', this.value)"></td>
        <td><input type="number" class="form-input" value="${it.qty || 1}" onchange="ExternalRepairsPage.updateItem(${idx}, 'qty', this.value)" style="width:60px"></td>
        <td><input type="text" class="form-input" value="${it.note || ''}" onchange="ExternalRepairsPage.updateItem(${idx}, 'note', this.value)"></td>
        <td><button class="btn btn-danger btn-sm" onclick="ExternalRepairsPage.removeItem(${idx})">X</button></td>
      </tr>
    `).join('');
  },

  
  async saveTicketAndExportPDF() {
    const savedId = await this.saveTicket();
    if (savedId) {
      this.generatePDF(savedId);
      const closeBtn = document.querySelector('.modal-overlay.show [data-modal-close]');
      if (closeBtn) closeBtn.click();
    }
  },

  async saveTicket() {
    // Collect active input values just in case onchange hasn't fired
    this._syncItems();
    this._items = this._items.filter(it => it.name.trim() !== '');

    if (this._items.length === 0) {
      Toast.error('Vui lòng nhập ít nhất 1 thiết bị/vật tư');
      return false;
    }

    const repairIds = this._items.map(it => it.repair_id).filter(Boolean);
    if (!this._editingId && repairIds.length === 0) {
      Toast.error('Vui lòng chọn ít nhất 1 phiếu báo hỏng');
      return false;
    }

    const ticket = this._editingId ? this._repairs.find(r => r.id === this._editingId) : { status: 'Đang sửa' };
    ticket.items = JSON.stringify(this._items);

    Toast.info('Đang lưu...');
    const res = await API.request('save_external_repair', { data: ticket }, 'POST');
    if (res.success) {
      if (!this._editingId) await API.markRepairsExternal(repairIds, res.data.id);
      Toast.success('Đã lưu phiếu sửa chữa ngoài');
      this.loadData();
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
    
    const ticket = this._repairs.find(r => r.id === id);
    if (!ticket) return;

    let items = [];
    try {
      items = typeof ticket.items === 'string' ? JSON.parse(ticket.items) : ticket.items;
    } catch (e) {
      items = [];
    }

    const fs = Utils.storage.get('form_settings') || {
      city: 'Ninh Bình', creator: 'Quản trị viên', reviewer: '', head: '', approver: ''
    };

    const dateObj = new Date(ticket.created_at || Date.now());
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const dateFormatted = `${dd}/${mm}/${yy}`;

    try {
      Toast.info('Đang tạo PDF...');
      const { jsPDF: JsPDF } = window.jspdf || { jsPDF: window.jsPDF };
      // Landscape, mm
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      doc.addFileToVFS('Times-Regular.ttf', FONT_TIMES_REGULAR_B64);
      doc.addFont('Times-Regular.ttf', 'TinosFont', 'normal');
      doc.addFileToVFS('Times-Bold.ttf', FONT_TIMES_BOLD_B64);
      doc.addFont('Times-Bold.ttf', 'TinosFont', 'bold');
      
      doc.setFont('TinosFont');

      doc.autoTable({
        startY: 10,
        margin: { left: 10, right: 10 },
        theme: 'plain',
        body: [
          ['', 'CÔNG TY TNHH THẮNG LỢI', 'Mã hiệu: BM.TB.04.01\nĐơn vị đề nghị: P.Cải tiến'],
          ['', 'PHIẾU YÊU CẦU\nTHUÊ NGOÀI SỬA CHỮA', 'Số: ' + (id || '') + '\nNgày lập: ' + dateFormatted]
        ],
        columnStyles: {
          0: { cellWidth: 55, minCellHeight: 15 }, 
          1: { cellWidth: 170, halign: 'center', valign: 'middle', fontStyle: 'bold' },
          2: { cellWidth: 52, halign: 'left', valign: 'middle' } 
        },
        styles: { font: 'TinosFont', lineWidth: 0.2, lineColor: [0, 0, 0], textColor: [0, 0, 0], fontSize: 10 },
        didParseCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0) {
            data.cell.styles.valign = 'middle';
            data.cell.rowSpan = 2;
          }
          if (data.row.index === 1 && data.column.index === 1) data.cell.styles.fontSize = 12; 
          if (data.row.index === 0 && data.column.index === 1) data.cell.styles.fontSize = 12; 
        },
        didDrawCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0) {
             const logoW = 31; const logoH = 15;
             const xPos = data.cell.x + (data.cell.width - logoW) / 2;
             const yPos = data.cell.y + (data.cell.height - logoH) / 2;
             doc.addImage('data:image/jpeg;base64,' + LOGO_VICO_B64, 'JPEG', xPos, yPos, logoW, logoH);
          }
        }
      });

      const tableData = items.map((item, index) => [
        (index + 1).toString(),
        ticket.id,
        item.name || '',
        '', // Bộ phận để trống
        item.condition || '',
        item.uom || '',
        item.qty.toString(),
        '', // Phân loại để trống
        item.note || ''
      ]);

      const emptyRowsNeeded = Math.max(0, 5 - items.length);
      for(let i=0; i<emptyRowsNeeded; i++) {
        tableData.push(['','','','','','','','','']);
      }

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 5, 
        margin: { left: 10, right: 10 },
        head: [['TT', 'Mã số / Mã hiệu', 'Tên máy móc / thiết bị cần sửa', 'Bộ phận / Đơn vị', 'Tình trạng / Hư hỏng', 'ĐVT', 'Số lượng', 'Phân loại / Nhóm CP', 'Ghi chú']],
        body: tableData,
        theme: 'grid',
        headStyles: { font: 'TinosFont', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9, fontStyle: 'bold', lineWidth: 0.2, lineColor: [0, 0, 0], halign: 'center', valign: 'middle' },
        bodyStyles: { font: 'TinosFont', fontSize: 9, lineWidth: 0.2, lineColor: [0, 0, 0], textColor: [0,0,0], minCellHeight: 12, valign: 'middle' },
        styles: { cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // line_no
          1: { cellWidth: 20, halign: 'center' }, // repair_code
          2: { cellWidth: 'auto' }, // equipment_name
          3: { cellWidth: 30 }, // unit_name
          4: { cellWidth: 25 }, // condition
          5: { cellWidth: 12, halign: 'center' }, // uom_name
          6: { cellWidth: 15, halign: 'center' }, // qty
          7: { cellWidth: 25, halign: 'center' }, // category_name
          8: { cellWidth: 35 } // note
        }
      });

      let finalY = doc.lastAutoTable.finalY + 4;
      const cityDate = fs.city || '';
      doc.setFontSize(10);
      doc.setFont('TinosFont', 'bolditalic');
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

      doc.save('Phieu_Sua_Chua_Ngoai_' + ticket.id + '.pdf');
      Toast.success('Đã xuất phiếu thành công');
    } catch (e) {
      console.error(e);
      Toast.error('Lỗi khi tạo PDF: ' + e.message);
    }
  }
};
