const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const version = Date.now();

// Replace all .js" and .css" with .js?v=version" and .css?v=version"
// But only if they don't already have a query param
html = html.replace(/\.js"/g, `.js?v=${version}"`);
html = html.replace(/\.css"/g, `.css?v=${version}"`);
// Clean up if it matched twice (e.g. .js?v=123?v=456)
html = html.replace(/\.js\?v=\d+\?v=\d+"/g, `.js?v=${version}"`);
html = html.replace(/\.css\?v=\d+\?v=\d+"/g, `.css?v=${version}"`);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Added cache buster to index.html');
