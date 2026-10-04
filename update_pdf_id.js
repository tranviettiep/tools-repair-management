const fs = require('fs');

// 1. Update spare-parts.js
let spJs = fs.readFileSync('js/pages/spare-parts.js', 'utf8');
spJs = spJs.replace(
    "'Số:\\nNgày lập: ' + exportDateFormatted",
    "'Số: ' + (id || '') + '\\nNgày lập: ' + exportDateFormatted"
);
fs.writeFileSync('js/pages/spare-parts.js', spJs, 'utf8');

// 2. Update external-repairs.js
let extJs = fs.readFileSync('js/pages/external-repairs.js', 'utf8');
extJs = extJs.replace(
    "'Số:\\nNgày lập: ' + dateFormatted",
    "'Số: ' + (id || '') + '\\nNgày lập: ' + dateFormatted"
);
fs.writeFileSync('js/pages/external-repairs.js', extJs, 'utf8');

console.log('Updated PDF headers');
