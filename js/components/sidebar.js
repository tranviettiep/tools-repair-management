// ============================================
// Sidebar.js - Sidebar navigation component
// ============================================

const Sidebar = {
  isCollapsed: false,

  render() {
    const role = Auth.currentUser?.role || 'reporter';

    const navItems = [
      { section: 'CHÍNH', items: [
        { icon: '📊', label: 'Tổng quan', route: '/dashboard', permission: 'view_dashboard' },
        { icon: '🔧', label: 'Máy công cụ', route: '/machines', permission: 'view_machines' },
        { icon: '📋', label: 'Sửa chữa', route: '/repairs', permission: 'view_repairs', badge: this._getPendingCount() },
        { icon: '🚐', label: 'Sửa chữa ngoài', route: '/external-repairs', permission: 'view_repairs' },
      ]},
      { section: 'KHO', items: [
        { icon: '📦', label: 'Phụ tùng', route: '/spare-parts', permission: 'view_parts' },
      ]},
      { section: 'PHÂN TÍCH', items: [
        { icon: '📈', label: 'Báo cáo', route: '/reports', permission: 'view_reports' },
      ]},
      { section: 'HỆ THỐNG', items: [
        { icon: '👥', label: 'Người dùng', route: '/users', permission: 'manage_users' },
        { icon: '⚙️', label: 'Cài đặt', route: '/settings', permission: 'manage_settings' },
      ]},
    ];

    const savedState = Utils.storage.get('sidebar_collapsed');
    this.isCollapsed = savedState === true;

    return `
      <aside class="sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">🔧</div>
            <span class="logo-text">TRM System</span>
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
          <span id="sidebar-toggle-icon">${this.isCollapsed ? '▶' : '◀'}</span>
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
    document.getElementById('sidebar-toggle-icon').textContent = this.isCollapsed ? '▶' : '◀';
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
