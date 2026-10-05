// ============================================
// Sidebar.js - Sidebar navigation component
// ============================================

const Sidebar = {
  isCollapsed: false,

  render() {
    const role = Auth.currentUser?.role || 'reporter';

    const navItems = [
      { section: 'CHÍNH', items: [
        { icon: '<i data-lucide="layout-dashboard"></i>', label: 'Tổng quan', route: '/dashboard', permission: 'view_dashboard' },
        { icon: '<i data-lucide="wrench"></i>', label: 'Máy công cụ', route: '/machines', permission: 'view_machines' },
        { icon: '<i data-lucide="clipboard-list"></i>', label: 'Sửa chữa', route: '/repairs', permission: 'view_repairs', badge: this._getPendingCount() },
        { icon: '<i data-lucide="truck"></i>', label: 'Sửa chữa ngoài', route: '/external-repairs', permission: 'view_repairs' },
      ]},
      { section: 'KHO', items: [
        { icon: '<i data-lucide="package"></i>', label: 'Phụ tùng', route: '/spare-parts', permission: 'view_parts' },
      ]},
      { section: 'PHÂN TÍCH', items: [
        { icon: '<i data-lucide="chart-line"></i>', label: 'Báo cáo', route: '/reports', permission: 'view_reports' },
      ]},
      { section: 'HỆ THỐNG', items: [
        { icon: '<i data-lucide="users"></i>', label: 'Người dùng', route: '/users', permission: 'manage_users' },
        { icon: '<i data-lucide="settings"></i>', label: 'Cài đặt', route: '/settings', permission: 'manage_settings' },
        { icon: '<i data-lucide="book-open"></i>', label: 'Hướng dẫn', route: '/guide', permission: 'view_machines' },
      ]},
    ];

    const savedState = Utils.storage.get('sidebar_collapsed');
    this.isCollapsed = savedState === true;

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
          ${navItems.map(section => {
            const visibleItems = section.items.filter(item => Auth.can(item.permission));
            if (visibleItems.length === 0) return '';
            return `
              <div class="nav-section-title">${section.section}</div>
              ${visibleItems.map(item => `
                <div class="nav-item ${Router.getPath() === item.route ? 'active' : ''}"
                     data-route="${item.route}"
                     onclick="Router.navigate('${item.route}')">
                  <span class="nav-icon">${item.icon}</span>
                  <span class="nav-label">${item.label}</span>
                  ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
                </div>
              `).join('')}
            `;
          }).join('')}
        </nav>
        <div class="sidebar-toggle" onclick="Sidebar.toggle()">
          <span id="sidebar-toggle-icon">${this._toggleIcon()}</span>
        </div>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="Sidebar.closeMobile()"></div>
    `;
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
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
  },

  _getPendingCount() {
    // This will be updated dynamically
    return '';
  },

  updateBadge(route, count) {
    const item = document.querySelector(`.nav-item[data-route="${route}"] .nav-badge`);
    if (item) {
      item.textContent = count;
      item.style.display = count > 0 ? '' : 'none';
    }
  }
};
