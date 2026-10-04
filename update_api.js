const fs = require('fs');
let content = fs.readFileSync('js/api.js', 'utf8');

// Add empty array to mock data
if (!content.includes('external_repairs: []')) {
    content = content.replace(
        "sessions: []",
        "sessions: [],\n      external_repairs: []"
    );
}

// Add cases for mock external repairs
const mockCases = `
      // External Repairs
      case 'get_external_repairs':
        return { success: true, data: d.external_repairs };
      case 'save_external_repair': {
        const item = params.data;
        if (item.id) {
          const index = d.external_repairs.findIndex(r => r.id === item.id);
          if (index !== -1) {
            item.updated_at = new Date().toISOString();
            d.external_repairs[index] = item;
          }
        } else {
          item.id = 'EXT-' + Date.now();
          item.created_at = new Date().toISOString();
          item.updated_at = item.created_at;
          d.external_repairs.push(item);
        }
        this._saveMockData();
        return { success: true, data: item };
      }
      case 'delete_external_repair': {
        d.external_repairs = d.external_repairs.filter(r => r.id !== params.id);
        this._saveMockData();
        return { success: true };
      }
`;

if (!content.includes('case \'get_external_repairs\':')) {
    content = content.replace(
        "// Config",
        mockCases + "\n      // Config"
    );
}

fs.writeFileSync('js/api.js', content, 'utf8');
console.log('Updated api.js');
