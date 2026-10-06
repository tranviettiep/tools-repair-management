// ============================================
// Mobile.js - Small-screen helpers
// ============================================

const Mobile = {
  query: window.matchMedia('(max-width: 767px)'),

  isMobile() {
    return this.query.matches;
  },

  init() {
    // Row action menus open as a bottom sheet on phones. A tap outside the sheet
    // only closes it, so the tap can't also hit a row hidden behind the backdrop.
    document.addEventListener('click', (e) => {
      const open = document.querySelector('.action-menu-dropdown.show');
      if (!open) return;
      if (open.contains(e.target)) {
        // Choosing an item should dismiss the menu (pages only close it on outside clicks)
        if (e.target.closest('.action-menu-item')) setTimeout(() => open.classList.remove('show'), 0);
        return;
      }
      if (this.isMobile() && !e.target.closest('.action-menu-trigger')) {
        e.stopPropagation();
        e.preventDefault();
        open.classList.remove('show');
      }
    }, true);
  },

  // Copy each column header onto its cells (data-label) so CSS can render rows as cards
  // on phones. Pages build tables as HTML strings, so this runs after every DOM change.
  labelTables(root = document) {
    root.querySelectorAll('table.data-table, table.table').forEach(table => {
      const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
      if (!headers.length) return;
      table.classList.add('cardify');

      table.querySelectorAll('tbody > tr:not([data-labeled])').forEach(tr => {
        tr.dataset.labeled = '';
        let titled = false;
        [...tr.children].forEach((td, i) => {
          if (td.colSpan > 1) {
            td.classList.add('cell-full');
            return;
          }
          const label = headers[i] || '';
          td.dataset.label = label;

          const hasField = td.querySelector('input:not([type="checkbox"]), select, textarea');
          if (td.querySelector('.action-menu') || (!label && td.querySelector('button'))) {
            td.classList.add('cell-corner');
          } else if (!label && td.querySelector('input[type="checkbox"]')) {
            td.classList.add('cell-check');
          } else if (td.querySelector('.btn') && !hasField) {
            td.classList.add('cell-buttons');
          } else if (hasField) {
            td.classList.add('cell-field');
          } else if (!titled) {
            td.classList.add('cell-title');
            if (label === 'TT') td.classList.add('cell-index');
            titled = true;
          }
        });
      });
    });
  }
};
