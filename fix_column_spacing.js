const fs = require('fs');

// Fix external-repairs.js
let extJs = fs.readFileSync('js/pages/external-repairs.js', 'utf8');
extJs = extJs.replace(
    '<th>Mã phiếu</th>\n                  <th>Ngày lập</th>\n                  <th>Trạng thái</th>\n                  <th>Thao tác</th>',
    '<th width="20%">Mã phiếu</th>\n                  <th width="20%">Ngày lập</th>\n                  <th width="25%">Trạng thái</th>\n                  <th width="35%">Thao tác</th>'
);
fs.writeFileSync('js/pages/external-repairs.js', extJs, 'utf8');

// Fix spare-parts.js
let spJs = fs.readFileSync('js/pages/spare-parts.js', 'utf8');
spJs = spJs.replace(
    '<th>Mã phiếu</th>\n              <th>Ngày lập</th>\n              <th>Trạng thái</th>\n              <th>Thao tác</th>',
    '<th width="20%">Mã phiếu</th>\n              <th width="20%">Ngày lập</th>\n              <th width="25%">Trạng thái</th>\n              <th width="35%">Thao tác</th>'
);
fs.writeFileSync('js/pages/spare-parts.js', spJs, 'utf8');

// Also increase padding in style.css for data-table
let css = fs.readFileSync('css/style.css', 'utf8');
css = css.replace(
    '.data-table th {\n    padding: 12px 16px;',
    '.data-table th {\n    padding: 16px 24px;'
);
css = css.replace(
    '.data-table td {\n    padding: 12px 16px;',
    '.data-table td {\n    padding: 16px 24px;'
);
fs.writeFileSync('css/style.css', css, 'utf8');

console.log('Fixed column spacing');
