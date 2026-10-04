const fs = require('fs');
let js = fs.readFileSync('js/api.js', 'utf8');
js = js.replace(/this\._saveMockData\(\);/g, '');
fs.writeFileSync('js/api.js', js, 'utf8');
console.log('Removed _saveMockData');
