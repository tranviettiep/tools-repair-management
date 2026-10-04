const fs = require('fs');

// Fix external-repairs.js
let extJs = fs.readFileSync('js/pages/external-repairs.js', 'utf8');
extJs = extJs.replace(
    "Toast.success('Đã lưu phiếu sửa chữa ngoài');\n        this.loadData();\n        return res.data.id;",
    "Toast.success('Đã lưu phiếu sửa chữa ngoài');\n        await this.loadData();\n        return res.data.id;"
);
fs.writeFileSync('js/pages/external-repairs.js', extJs, 'utf8');

// Fix spare-parts.js (Actually I already added await this.loadData() in spare-parts.js in the previous script! Let's double check)
let spJs = fs.readFileSync('js/pages/spare-parts.js', 'utf8');
if (!spJs.includes('await this.loadData();\n      return res.data.id;')) {
    spJs = spJs.replace(
        "Toast.success('Đã lưu phiếu đề xuất');\n        this.loadData();\n        return res.data.id;",
        "Toast.success('Đã lưu phiếu đề xuất');\n        await this.loadData();\n        return res.data.id;"
    );
    fs.writeFileSync('js/pages/spare-parts.js', spJs, 'utf8');
}

console.log('Fixed await loadData');
