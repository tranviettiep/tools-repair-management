const fs = require('fs');

// 1. Update api.js
let apiJs = fs.readFileSync('js/api.js', 'utf8');
const oldMockIdGeneration = `item.id = 'EXT-' + Date.now();`;
const newMockIdGeneration = `
          const today = new Date();
          const yy = String(today.getFullYear()).slice(-2);
          const thisYearItems = d.external_repairs.filter(r => r.id && r.id.startsWith('SCCC-' + yy + '-'));
          const seq = thisYearItems.length + 1;
          item.id = 'SCCC-' + yy + '-' + String(seq).padStart(4, '0');
`;
apiJs = apiJs.replace(oldMockIdGeneration, newMockIdGeneration);
fs.writeFileSync('js/api.js', apiJs, 'utf8');

// 2. Update ExternalRepairService.gs
let extGs = fs.readFileSync('gas/ExternalRepairService.gs', 'utf8');
const oldGsIdGeneration = `item.id = 'EXT-' + Date.now();`;
const newGsIdGeneration = `
      const data = getSheetData(SHEETS.EXTERNAL_REPAIRS);
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const thisYearItems = data.filter(r => r.id && r.id.startsWith('SCCC-' + yy + '-'));
      const seq = thisYearItems.length + 1;
      item.id = 'SCCC-' + yy + '-' + String(seq).padStart(4, '0');
`;
extGs = extGs.replace(oldGsIdGeneration, newGsIdGeneration);
fs.writeFileSync('gas/ExternalRepairService.gs', extGs, 'utf8');

console.log('Updated ID generation');
