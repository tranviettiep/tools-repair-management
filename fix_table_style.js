const fs = require('fs');

// Update external-repairs.js
let extJs = fs.readFileSync('js/pages/external-repairs.js', 'utf8');

// Change table class
extJs = extJs.replace(
    '<div class="table-responsive">\n            <table class="table">',
    '<div class="table-wrapper">\n            <table class="data-table">'
);
// Add gap to buttons
extJs = extJs.replace(
    '<td>\n            <button class="btn btn-secondary btn-sm"',
    '<td style="display: flex; gap: 8px;">\n            <button class="btn btn-secondary btn-sm"'
);

// We can also add some style to the ID to make it stand out
extJs = extJs.replace(
    '<td>${r.id}</td>',
    '<td style="font-weight: 500; color: var(--accent-primary);">${r.id}</td>'
);
fs.writeFileSync('js/pages/external-repairs.js', extJs, 'utf8');

// Update spare-parts.js (since it has the same layout for proposals)
let spJs = fs.readFileSync('js/pages/spare-parts.js', 'utf8');
spJs = spJs.replace(
    '<td>\n            <button class="btn btn-secondary btn-sm"',
    '<td style="display: flex; gap: 8px;">\n            <button class="btn btn-secondary btn-sm"'
);
spJs = spJs.replace(
    '<td>${r.id}</td>',
    '<td style="font-weight: 500; color: var(--accent-primary);">${r.id}</td>'
);
fs.writeFileSync('js/pages/spare-parts.js', spJs, 'utf8');

console.log('Fixed table styling');
