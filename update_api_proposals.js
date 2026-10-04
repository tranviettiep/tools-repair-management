const fs = require('fs');

let apiJs = fs.readFileSync('js/api.js', 'utf8');

// 1. Add mock array
if (!apiJs.includes('proposals: []')) {
    apiJs = apiJs.replace(
        "external_repairs: []",
        "external_repairs: [],\n      proposals: []"
    );
}

// 2. Add API endpoints
const proposalCases = `
      // Proposals
      case 'get_proposals':
        return { success: true, data: d.proposals };
      case 'save_proposal': {
        const item = params.data;
        if (item.id) {
          const index = d.proposals.findIndex(r => r.id === item.id);
          if (index !== -1) {
            item.updated_at = new Date().toISOString();
            d.proposals[index] = item;
          }
        } else {
          const today = new Date();
          const yy = String(today.getFullYear()).slice(-2);
          const thisYearItems = d.proposals.filter(r => r.id && r.id.startsWith('PDX-' + yy + '-'));
          const seq = thisYearItems.length + 1;
          item.id = 'PDX-' + yy + '-' + String(seq).padStart(4, '0');
          item.created_at = new Date().toISOString();
          item.updated_at = item.created_at;
          d.proposals.push(item);
        }
        this._saveMockData();
        return { success: true, data: item };
      }
      case 'delete_proposal': {
        d.proposals = d.proposals.filter(r => r.id !== params.id);
        this._saveMockData();
        return { success: true };
      }
`;

if (!apiJs.includes("case 'get_proposals':")) {
    apiJs = apiJs.replace(
        "// Config",
        proposalCases + "\n      // Config"
    );
}

fs.writeFileSync('js/api.js', apiJs, 'utf8');
console.log('Updated api.js');
