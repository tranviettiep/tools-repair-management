const fs = require('fs');
let js = fs.readFileSync('js/pages/spare-parts.js', 'utf8');

// 1. Add proposals array to SparePartsPage object
if (!js.includes('proposals: [],')) {
    js = js.replace('transactions: [],', 'transactions: [],\n  proposals: [],');
}

// 2. Add API call to loadData
if (!js.includes('API.request(\'get_proposals\')')) {
    js = js.replace(
        'API.getPartTransactions()',
        'API.getPartTransactions(),\n      API.request(\'get_proposals\')'
    );
    js = js.replace(
        'const [partsResult, txResult] = await Promise.all',
        'const [partsResult, txResult, propResult] = await Promise.all'
    );
    js = js.replace(
        'if (txResult.success) this.transactions = txResult.data;',
        'if (txResult.success) this.transactions = txResult.data;\n    if (propResult && propResult.success) this.proposals = propResult.data;'
    );
}

// 3. Replace renderProposal with table list
const newRenderProposal = `
  renderProposal() {
    const container = document.getElementById('parts-content');
    let tbodyHtml = '<tr><td colspan="4" style="text-align:center;">Chưa có phiếu nào</td></tr>';
    
    if (this.proposals && this.proposals.length > 0) {
      tbodyHtml = this.proposals.map(r => \`
        <tr>
          <td>\${r.id}</td>
          <td>\${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
          <td>
            <select class="form-input" style="width:140px; padding:4px;" onchange="SparePartsPage.updateProposalStatus('\${r.id}', this.value)">
              <option value="Nháp" \${r.status === 'Nháp' ? 'selected' : ''}>Nháp</option>
              <option value="Đang xử lý" \${r.status === 'Đang xử lý' ? 'selected' : ''}>Đang xử lý</option>
              <option value="Hoàn thành" \${r.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
            </select>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="SparePartsPage.openProposalModal('\${r.id}')">Xem/Sửa</button>
            <button class="btn btn-primary btn-sm" onclick="SparePartsPage.generateProposalPDF('\${r.id}')">Xuất PDF</button>
            <button class="btn btn-primary btn-sm" onclick="SparePartsPage.generateProposalExcel('\${r.id}')">Xuất Excel</button>
            <button class="btn btn-danger btn-sm" onclick="SparePartsPage.deleteProposal('\${r.id}')">Xóa</button>
          </td>
        </tr>
      \`).join('');
    }

    container.innerHTML = \`
      <div class="table-wrapper">
        <div class="table-toolbar" style="justify-content: space-between;">
          <h3>Danh sách phiếu đề xuất vật tư</h3>
          <button class="btn btn-primary" onclick="SparePartsPage.openProposalModal()">+ Tạo phiếu đề xuất</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Ngày lập</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>\${tbodyHtml}</tbody>
        </table>
      </div>
    \`;
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

    const content = \`
      <div style="font-weight:600; margin-bottom:8px; font-size:13px">Danh sách vật tư đề nghị</div>
      <div id="proposal-items"></div>
      <button class="btn btn-secondary btn-sm" onclick="SparePartsPage.addProposalItem()" style="margin-bottom:16px">+ Thêm vật tư</button>
    \`;

    const footer = \`
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.show [data-modal-close]').click()">Hủy</button>
      <button class="btn btn-primary" onclick="SparePartsPage.saveProposalAndExportPDF()">Lưu và Xuất PDF</button>
    \`;

    Modal.show({
      title: id ? 'Sửa phiếu đề xuất vật tư' : 'Tạo phiếu đề xuất vật tư',
      content,
      footer,
      size: 'lg'
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
`;

// Replace renderProposal
js = js.replace(/renderProposal\(\) \{[\s\S]*?_getFormSettings/, newRenderProposal + '\n  _getFormSettings');

// Modify addProposalItem to take parameters
js = js.replace(
  'addProposalItem() {',
  'addProposalItem(pId = "", pQty = "", pDate = "") {'
);

js = js.replace(
  '<input type="number" class="p-qty form-input" placeholder="SL">',
  '<input type="number" class="p-qty form-input" placeholder="SL" value="${pQty}">'
);

js = js.replace(
  '<input type="date" class="p-date form-input">',
  '<input type="date" class="p-date form-input" value="${pDate}">'
);

js = js.replace(
  'const html = `',
  `const html = \`
    <select class="p-part-id form-input">
      <option value="">-- Chọn phụ tùng --</option>
      \${this.parts.map(p => \`<option value="\${p.id}" \${p.id === pId ? 'selected' : ''}>\${p.part_name} (\${p.part_code})</option>\`).join('')}
    </select>`
);
// Now we need to remove the original <select> from html string.
js = js.replace(
  /<select class="p-part-id form-input">[\s\S]*?<\/select>/g,
  function(match) {
    if (match.includes('-- Chọn phụ tùng --')) return match; // keep if it's the one we just added
    return ''; // remove the old one
  }
);
// Let's just fix it properly with another script if this fails.

fs.writeFileSync('js/pages/spare-parts.js', js, 'utf8');
console.log('Refactored renderProposal in spare-parts.js');
