const fs = require('fs');

let js = fs.readFileSync('js/pages/external-repairs.js', 'utf8');

// 1. Remove Mã hiệu, Bộ phận, Phân loại from table header
js = js.replace(
  /<th width="100">Mã hiệu<\/th>\s*<th width="150">Tên thiết bị<\/th>\s*<th width="120">Bộ phận<\/th>\s*<th width="120">Tình trạng<\/th>\s*<th width="60">ĐVT<\/th>\s*<th width="60">SL<\/th>\s*<th width="100">Phân loại<\/th>/,
  '<th width="200">Tên thiết bị</th>\n                <th width="200">Tình trạng</th>\n                <th width="80">ĐVT</th>\n                <th width="80">SL</th>'
);

// 2. Add size: 'lg' to Modal.show
js = js.replace(
  "onSave: () => this.saveTicket()",
  "onSave: () => this.saveTicket(),\n      size: 'lg'"
);

// 3. Remove inputs from renderItems
js = js.replace(
  /<td><input type="text" class="form-input" value="\${it\.code \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'code', this\.value\)"><\/td>\s*<td><input type="text" class="form-input" value="\${it\.name \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'name', this\.value\)"><\/td>\s*<td><input type="text" class="form-input" value="\${it\.unit \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'unit', this\.value\)"><\/td>\s*<td><input type="text" class="form-input" value="\${it\.condition \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'condition', this\.value\)"><\/td>\s*<td><input type="text" class="form-input" value="\${it\.uom \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'uom', this\.value\)"><\/td>\s*<td><input type="number" class="form-input" value="\${it\.qty \|\| 1}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'qty', this\.value\)" style="width:60px"><\/td>\s*<td><input type="text" class="form-input" value="\${it\.category \|\| ''}" onchange="ExternalRepairsPage\.updateItem\(\${idx}, 'category', this\.value\)"><\/td>/,
  `<td><input type="text" class="form-input" value="\${it.name || ''}" onchange="ExternalRepairsPage.updateItem(\${idx}, 'name', this.value)"></td>
        <td><input type="text" class="form-input" value="\${it.condition || ''}" onchange="ExternalRepairsPage.updateItem(\${idx}, 'condition', this.value)"></td>
        <td><input type="text" class="form-input" value="\${it.uom || ''}" onchange="ExternalRepairsPage.updateItem(\${idx}, 'uom', this.value)"></td>
        <td><input type="number" class="form-input" value="\${it.qty || 1}" onchange="ExternalRepairsPage.updateItem(\${idx}, 'qty', this.value)" style="width:60px"></td>`
);

// 4. Update saveTicket mapping
js = js.replace(
  /code: inputs\[0\]\.value,\s*name: inputs\[1\]\.value,\s*unit: inputs\[2\]\.value,\s*condition: inputs\[3\]\.value,\s*uom: inputs\[4\]\.value,\s*qty: parseFloat\(inputs\[5\]\.value\) \|\| 0,\s*category: inputs\[6\]\.value,\s*note: inputs\[7\]\.value/,
  `name: inputs[0].value,
        condition: inputs[1].value,
        uom: inputs[2].value,
        qty: parseFloat(inputs[3].value) || 0,
        note: inputs[4].value`
);

// 5. Update PDF generation to map the fields properly
// The PDF expects: 1. TT, 2. code (from ticket.id), 3. name, 4. unit (blank), 5. condition, 6. uom, 7. qty, 8. category (blank), 9. note
js = js.replace(
  /item\.code \|\| '',\s*item\.name \|\| '',\s*item\.unit \|\| '',\s*item\.condition \|\| '',\s*item\.uom \|\| '',\s*item\.qty\.toString\(\),\s*item\.category \|\| '',\s*item\.note \|\| ''/,
  `ticket.id,
        item.name || '',
        '', // Bộ phận để trống
        item.condition || '',
        item.uom || '',
        item.qty.toString(),
        '', // Phân loại để trống
        item.note || ''`
);

fs.writeFileSync('js/pages/external-repairs.js', js, 'utf8');
console.log('Updated external-repairs.js');
