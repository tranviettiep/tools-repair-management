const fs = require('fs');

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('js/pages/external-repairs.js')) {
    indexHtml = indexHtml.replace(
        '<script src="js/pages/repairs.js"></script>',
        '<script src="js/pages/repairs.js"></script>\n  <script src="js/pages/external-repairs.js"></script>'
    );
    fs.writeFileSync('index.html', indexHtml, 'utf8');
}

// 2. Update js/app.js
let appJs = fs.readFileSync('js/app.js', 'utf8');
if (!appJs.includes('/external-repairs')) {
    appJs = appJs.replace(
        "Router.register('/repairs', () => this.renderPage('repairs'), { title: 'Sửa chữa', permission: 'view_repairs' });",
        "Router.register('/repairs', () => this.renderPage('repairs'), { title: 'Sửa chữa', permission: 'view_repairs' });\n      Router.register('/external-repairs', () => this.renderPage('external-repairs'), { title: 'Sửa chữa ngoài', permission: 'view_repairs' });"
    );
    appJs = appJs.replace(
        "case 'repairs': RepairsPage.render(); break;",
        "case 'repairs': RepairsPage.render(); break;\n        case 'external-repairs': ExternalRepairsPage.render(); break;"
    );
    fs.writeFileSync('js/app.js', appJs, 'utf8');
}

// 3. Update js/components/sidebar.js
let sidebarJs = fs.readFileSync('js/components/sidebar.js', 'utf8');
if (!sidebarJs.includes('/external-repairs')) {
    const sidebarItem = `          { path: '/external-repairs', icon: '🚐', title: 'Sửa chữa ngoài', permission: 'view_repairs' },`;
    sidebarJs = sidebarJs.replace(
        "{ path: '/repairs', icon: '🔧', title: 'Sửa chữa', permission: 'view_repairs' },",
        "{ path: '/repairs', icon: '🔧', title: 'Sửa chữa', permission: 'view_repairs' },\n" + sidebarItem
    );
    fs.writeFileSync('js/components/sidebar.js', sidebarJs, 'utf8');
}

console.log('Updated index.html, app.js, and sidebar.js');
