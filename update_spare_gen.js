const fs = require('fs');
let js = fs.readFileSync('js/pages/spare-parts.js', 'utf8');

// Update generateProposalPDF to accept id and use ticket items
js = js.replace(
  'async generateProposalPDF() {',
  'async generateProposalPDF(id) {'
);
js = js.replace(
  `const items = this._collectProposalItems();\n    if (!items) return;`,
  `let items = [];
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
    }`
);

// Do the same for Excel
js = js.replace(
  'async generateProposalExcel() {',
  'async generateProposalExcel(id) {'
);
js = js.replace(
  `const items = this._collectProposalItems();\n    if (!items) return;`,
  `let items = [];
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
    }`
);

fs.writeFileSync('js/pages/spare-parts.js', js, 'utf8');
console.log('Updated generate functions in spare-parts.js');
