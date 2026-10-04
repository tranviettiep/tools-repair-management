const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');
if (!css.includes('.modal-xl')) {
    css = css.replace('.modal-lg { max-width: 800px; }', '.modal-lg { max-width: 800px; }\n.modal-xl { max-width: 1100px; }');
    fs.writeFileSync('css/style.css', css, 'utf8');
}

let extJs = fs.readFileSync('js/pages/external-repairs.js', 'utf8');
extJs = extJs.replace("size: 'lg'", "size: 'xl'");
extJs = extJs.replace('min-width: 800px;', 'width: 100%; min-width: 900px;');
// Also adjust column widths in external-repairs.js modal
extJs = extJs.replace('<th width="200">Tên thiết bị</th>', '<th width="250">Tên thiết bị / Phụ tùng</th>');
extJs = extJs.replace('<th width="200">Tình trạng</th>', '<th width="250">Tình trạng hỏng hóc</th>');
fs.writeFileSync('js/pages/external-repairs.js', extJs, 'utf8');

let spareJs = fs.readFileSync('js/pages/spare-parts.js', 'utf8');
spareJs = spareJs.replace("size: 'lg'", "size: 'xl'");
fs.writeFileSync('js/pages/spare-parts.js', spareJs, 'utf8');

console.log('Fixed modal width');
