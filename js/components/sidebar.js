// ============================================
// Sidebar.js - Sidebar navigation component (ArchitectUI vertical menu with submenus)
// ============================================

const Sidebar = {
  isCollapsed: false,

  // Item: { icon, label, route, permission, tab?, badge? }
  // Group: { icon, label, key, children: [items] } - opens a submenu
  _menu() {
    return [
      { section: 'CHÍNH', items: [
        { icon: 'layout-dashboard', label: 'Tổng quan', route: '/dashboard', permission: 'view_dashboard' },
        { icon: 'wrench', label: 'Máy công cụ', route: '/machines', permission: 'view_machines' },
        { icon: 'clipboard-list', label: 'Sửa chữa', key: 'repairs', badge: '/repairs', children: [
          { label: 'Yêu cầu sửa chữa', route: '/repairs', permission: 'view_repairs', badge: '/repairs' },
          { label: 'Sửa chữa ngoài', route: '/external-repairs', permission: 'view_repairs' },
        ]},
      ]},
      { section: 'KHO', items: [
        { icon: 'package', label: 'Kho phụ tùng', key: 'parts', children: [
          { label: 'Danh sách phụ tùng', route: '/spare-parts', tab: 'list', permission: 'view_parts' },
          { label: 'Nhập / Xuất kho', route: '/spare-parts', tab: 'import', permission: 'view_parts' },
          { label: 'Đề xuất vật tư', route: '/spare-parts', tab: 'proposal', permission: 'view_parts' },
          { label: 'Lịch sử kho', route: '/spare-parts', tab: 'history', permission: 'view_parts' },
        ]},
      ]},
      { section: 'PHÂN TÍCH', items: [
        { icon: 'chart-line', label: 'Báo cáo', route: '/reports', permission: 'view_reports' },
      ]},
      { section: 'HỆ THỐNG', items: [
        { icon: 'users', label: 'Người dùng', route: '/users', permission: 'manage_users' },
        { icon: 'settings', label: 'Cài đặt', route: '/settings', permission: 'manage_settings' },
        { icon: 'book-open', label: 'Hướng dẫn', route: '/guide', permission: 'view_machines' },
      ]},
    ];
  },

  render() {
    this.isCollapsed = Utils.storage.get('sidebar_collapsed') === true;
    const openGroups = Utils.storage.get('sidebar_open_groups') || ['repairs', 'parts'];

    const badge = (route) => route ? `<span class="nav-badge" data-badge="${route}" style="display:none"></span>` : '';

    const renderItem = (item) => `
      <div class="nav-item" data-route="${item.route}" title="${item.label}"
           onclick="Sidebar.go('${item.route}')">
        <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
        <span class="nav-label">${item.label}</span>
        ${badge(item.badge)}
      </div>`;

    const renderGroup = (group) => {
      const children = group.children.filter(c => Auth.can(c.permission));
      if (children.length === 0) return '';
      return `
        <div class="nav-group ${openGroups.includes(group.key) ? 'open' : ''}" data-group="${group.key}">
          <div class="nav-item nav-parent" title="${group.label}" onclick="Sidebar.toggleGroup('${group.key}')">
            <span class="nav-icon"><i data-lucide="${group.icon}"></i></span>
            <span class="nav-label">${group.label}</span>
            ${badge(group.badge)}
            <span class="nav-caret"><i data-lucide="chevron-right"></i></span>
          </div>
          <div class="nav-submenu">
            ${children.map(c => `
              <div class="nav-subitem" data-route="${c.route}" ${c.tab ? `data-tab="${c.tab}"` : ''}
                   onclick="Sidebar.go('${c.route}'${c.tab ? `, '${c.tab}'` : ''})">
                <span class="nav-label">${c.label}</span>
                ${badge(c.badge)}
              </div>`).join('')}
          </div>
        </div>`;
    };

    return `
      <aside class="sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <img class="logo-img" src="template/LOGO%20VICO.jpg" alt="VICO">
            <span class="logo-text">
              <span class="logo-title">Quản lý sửa chữa</span>
              <span class="logo-subtitle">Máy công cụ</span>
            </span>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${this._menu().map(section => {
            const html = section.items.map(item => {
              if (item.children) return renderGroup(item);
              return Auth.can(item.permission) ? renderItem(item) : '';
            }).join('');
            return html.trim() ? `<div class="nav-section-title">${section.section}</div>${html}` : '';
          }).join('')}
        </nav>
        <div class="sidebar-toggle" onclick="Sidebar.toggle()">
          <span id="sidebar-toggle-icon">${this._toggleIcon()}</span>
        </div>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="Sidebar.closeMobile()"></div>
    `;
  },

  // Navigate to a page; spare-part submenu items also pick the tab
  go(route, tab) {
    if (tab && typeof SparePartsPage !== 'undefined') {
      SparePartsPage.activeTab = tab;
      if (Router.getPath() === route) SparePartsPage.switchTab(tab);
    }
    if (Router.getPath() !== route) Router.navigate(route);
    this.syncActive();
    this.closeMobile();
  },

  // Icon-only sidebar has no room for a submenu: the parent opens its first page instead
  _isIconOnly() {
    const w = window.innerWidth;
    return w >= 768 && (this.isCollapsed || w <= 991);
  },

  toggleGroup(key) {
    const group = document.querySelector(`.nav-group[data-group="${key}"]`);
    if (!group) return;

    if (this._isIconOnly()) {
      group.querySelector('.nav-subitem')?.click();
      return;
    }

    group.classList.toggle('open');
    const open = [...document.querySelectorAll('.nav-group.open')].map(g => g.dataset.group);
    Utils.storage.set('sidebar_open_groups', open);
  },

  // Highlight the current page (and tab) and its parent group
  syncActive() {
    const path = Router.getPath();
    const tab = path === '/spare-parts' && typeof SparePartsPage !== 'undefined' ? SparePartsPage.activeTab : null;

    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === path);
    });
    document.querySelectorAll('.nav-subitem').forEach(el => {
      const match = el.dataset.route === path && (!el.dataset.tab || el.dataset.tab === tab);
      el.classList.toggle('active', match);
    });
    document.querySelectorAll('.nav-group').forEach(g => {
      const hasActive = !!g.querySelector('.nav-subitem.active');
      g.classList.toggle('has-active', hasActive);
      if (hasActive) g.classList.add('open');
    });
  },

  toggle() {
    const sidebar = document.getElementById('sidebar');
    this.isCollapsed = !this.isCollapsed;
    sidebar.classList.toggle('collapsed', this.isCollapsed);
    Utils.storage.set('sidebar_collapsed', this.isCollapsed);
    document.getElementById('sidebar-toggle-icon').innerHTML = this._toggleIcon();
  },

  _toggleIcon() {
    return `<i data-lucide="${this.isCollapsed ? 'panel-left-open' : 'panel-left-close'}"></i>`;
  },

  openMobile() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('show');
  },

  closeMobile() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar?.classList.remove('mobile-open');
    backdrop?.classList.remove('show');
  },

  updateBadge(route, count) {
    document.querySelectorAll(`[data-badge="${route}"]`).forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }
};
