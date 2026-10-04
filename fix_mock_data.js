const fs = require('fs');

let content = fs.readFileSync('js/api.js', 'utf8');

// The line is: this._mockData = { machines, repairs, parts, transactions, users, config };
// Change it to include external_repairs and proposals
const target = 'this._mockData = { machines, repairs, parts, transactions, users, config };';
if (content.includes(target)) {
    const replacement = 'this._mockData = { machines, repairs, parts, transactions, users, config, external_repairs: [], proposals: [] };';
    content = content.replace(target, replacement);
    fs.writeFileSync('js/api.js', content, 'utf8');
}

console.log('Fixed missing mock data arrays');
