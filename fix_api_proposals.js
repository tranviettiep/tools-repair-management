const fs = require('fs');

let content = fs.readFileSync('js/api.js', 'utf8');

// The incorrect injection is everything from:
//       // Proposals
//       case 'get_proposals':
// to:
//       case 'delete_proposal': {
//         d.proposals = d.proposals.filter(r => r.id !== params.id);
//         this._saveMockData();
//         return { success: true };
//       }

const incorrectCode = `
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

// It might have spaces differently or a blank line.
// Let's just use string replace.
content = content.replace(incorrectCode, '');

// Now insert it at the CORRECT // Config location.
// The correct one is inside the switch.
const correctTarget = `
      // Config
      case 'get_config':`;

if (content.includes(correctTarget) && !content.includes("case 'get_proposals':")) {
    content = content.replace(correctTarget, incorrectCode + correctTarget);
}

fs.writeFileSync('js/api.js', content, 'utf8');
console.log('Fixed api.js');
