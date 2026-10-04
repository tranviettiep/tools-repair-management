const fs = require('fs');
let content = fs.readFileSync('js/pages/spare-parts.js', 'utf8');

const uiBlockRegex = /<div style="border-top:1px solid var\(--border-color\); padding-top:12px; margin-top:4px">[\s\S]*?<input type="date" class="form-input" id="f-prop-date"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
content = content.replace(uiBlockRegex, '');

content = content.replace(
    "const dateStr = document.getElementById('f-prop-date')?.value || new Date().toISOString().split('T')[0];",
    "const dateStr = new Date().toISOString().split('T')[0];"
);
content = content.replace(
    "const dateStr = document.getElementById('f-prop-date').value;",
    "const dateStr = new Date().toISOString().split('T')[0];"
);
content = content.replace(
    "const dateObj = dateStr ? new Date(dateStr) : new Date();",
    "const dateObj = new Date();"
);
content = content.replace(
    "const exportDateFormatted = `//`;",
    "const exportDateFormatted = exDd + '/' + exMm + '/' + exYy;"
);
content = content.replace(
    "const exportDateFormatted = `//`;", // just in case it didn't match
    "const exportDateFormatted = exDd + '/' + exMm + '/' + exYy;"
);

content = content.replace(
    "needDateFmt = `\\`${parts[2]}-${parts[1]}-${parts[0]}\\``;",
    "needDateFmt = parts[2] + '-' + parts[1] + '-' + parts[0];"
);
content = content.replace(
    "needDateFmt = `${parts[2]}-${parts[1]}-${parts[0]}`;",
    "needDateFmt = parts[2] + '-' + parts[1] + '-' + parts[0];"
);
content = content.replace(
    "let needDateFmt = item.needDate || dateStr;",
    "let needDateFmt = item.needDate || '';"
);

content = content.replace(
    "doc.text(cityDate, 257, finalY + 4, { align: 'right' });",
    "doc.text(cityDate, 237, finalY + 4, { align: 'right' });"
);

fs.writeFileSync('js/pages/spare-parts.js', content, 'utf8');
console.log('Done replacement');
