const fs = require('fs');

let js = fs.readFileSync('js/pages/external-repairs.js', 'utf8');

const fn = `
  async saveTicketAndExportPDF() {
    const savedId = await this.saveTicket();
    if (savedId) {
      this.generatePDF(savedId);
      const closeBtn = document.querySelector('.modal-overlay.show [data-modal-close]');
      if (closeBtn) closeBtn.click();
    }
  },
`;

if (!js.includes('async saveTicketAndExportPDF()')) {
    js = js.replace('async saveTicket()', fn + '\n  async saveTicket()');
    fs.writeFileSync('js/pages/external-repairs.js', js, 'utf8');
}
console.log('Fixed external-repairs.js missing function');
