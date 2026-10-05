// ============================================
// Header.js - App header component
// ============================================

const Header = {
  render() {
    const user = Auth.currentUser;
    const initials = user ? user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';
    const roleLabels = {
      admin: 'Quản trị viên',
      manager: 'Trưởng bộ phận',
      technician: 'Kỹ thuật viên',
      reporter: 'Người báo hỏng'
    };

    return `
      <header class="app-header" id="app-header">
        <div class="header-left">
          <button class="header-toggle" onclick="Sidebar.openMobile()" id="header-toggle">
            <i data-lucide="menu"></i>
          </button>
          <h1 class="header-title" id="header-title">Tổng quan</h1>
        </div>
        <div class="header-right">
          <button class="header-notification" id="notification-btn" onclick="Header.toggleNotifications()">
            <i data-lucide="bell"></i>
            <span class="badge" id="notification-badge" style="display:none">0</span>
          </button>
          <div class="header-user" onclick="Header.toggleUserMenu()">
            <div class="avatar">${initials}</div>
            <div class="user-info">
              <div class="user-name">${Utils.escapeHtml(user?.full_name || '')}</div>
              <div class="user-role">${roleLabels[user?.role] || ''}</div>
            </div>
          </div>
        </div>
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-item" onclick="Header.showProfile()">
            <i data-lucide="user"></i> Thông tin cá nhân
          </div>
          <div class="user-dropdown-divider"></div>
          <div class="user-dropdown-item" onclick="Auth.logout()">
            <i data-lucide="log-out"></i> Đăng xuất
          </div>
        </div>
      </header>
    `;
  },

  toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');

    // Close on click outside
    if (dropdown.classList.contains('show')) {
      const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && !e.target.closest('.header-user')) {
          dropdown.classList.remove('show');
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }
  },

  toggleNotifications() {
    Toast.info('Không có thông báo mới');
  },

  showProfile() {
    const user = Auth.currentUser;
    const roleLabels = {
      admin: 'Quản trị viên',
      manager: 'Trưởng bộ phận',
      technician: 'Kỹ thuật viên',
      reporter: 'Người báo hỏng'
    };

    Modal.show({
      title: '<i data-lucide="user"></i> Thông tin cá nhân',
      content: `
        <div class="info-card">
          <div class="info-row">
            <span class="label">Họ tên:</span>
            <span class="value">${Utils.escapeHtml(user.full_name)}</span>
          </div>
          <div class="info-row">
            <span class="label">Tên đăng nhập:</span>
            <span class="value">${Utils.escapeHtml(user.username)}</span>
          </div>
          <div class="info-row">
            <span class="label">Vai trò:</span>
            <span class="value">${roleLabels[user.role] || user.role}</span>
          </div>
          <div class="info-row">
            <span class="label">Bộ phận:</span>
            <span class="value">${Utils.escapeHtml(user.department || 'Tất cả')}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${Utils.escapeHtml(user.email || '—')}</span>
          </div>
        </div>
      `,
      size: 'sm'
    });

    document.getElementById('user-dropdown').classList.remove('show');
  },

  updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }
};
