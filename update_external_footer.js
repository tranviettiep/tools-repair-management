const fs = require('fs');
let js = fs.readFileSync('js/pages/external-repairs.js', 'utf8');

js = js.replace(
  /onSave: \(\) => this\.saveTicket\(\),/,
  `footer: \`
          <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.show [data-modal-close]').click()">Hủy</button>
          <button class="btn btn-primary" onclick="ExternalRepairsPage.saveTicketAndExportPDF()">Xác nhận và xuất PDF</button>
        \`,`
);

js = js.replace(
  /return true;\n    } else {/,
  `return res.data.id;\n    } else {`
);

const saveTicketAndExportPDF = `
  async saveTicketAndExportPDF() {
    const savedId = await this.saveTicket();
    if (savedId) {
      this.generatePDF(savedId);
      const closeBtn = document.querySelector('.modal-overlay.show [data-modal-close]');
      if (closeBtn) closeBtn.click();
    }
  },
`;

if (!js.includes('saveTicketAndExportPDF')) {
  js = js.replace('async saveTicket()', saveTicketAndExportPDF + '\n  async saveTicket()');
}

fs.writeFileSync('js/pages/external-repairs.js', js, 'utf8');
console.log('Updated external-repairs.js');
