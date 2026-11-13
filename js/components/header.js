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
          <button class="header-search-trigger" onclick="CommandPalette.open()" id="cmd-trigger">
            <i data-lucide="search"></i>
            <span>Tìm kiếm nhanh…</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
        <div class="header-right">
          <button class="header-notification header-theme-toggle" id="theme-toggle-btn" onclick="ThemeManager.toggle()"
                  title="${ThemeManager.isDark() ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}">
            <i data-lucide="${ThemeManager.isDark() ? 'sun' : 'moon'}"></i>
          </button>
          <button class="header-notification" id="notification-btn" onclick="Notifications.togglePanel()" aria-label="Thông báo">
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
        <div class="notification-panel" id="notification-panel"></div>
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-item" onclick="Header.showProfile()">
            <i data-lucide="user"></i> Thông tin cá nhân
          </div>
          <div class="user-dropdown-item" data-install-item onclick="Pwa.install()" style="${Pwa.isInstalled() ? 'display:none' : ''}">
            <i data-lucide="smartphone"></i> Cài app lên điện thoại
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
    document.getElementById('notification-panel')?.classList.remove('show');
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
            <span class="label">Trạng thái:</span>
            <span class="value"><span class="badge badge-active"><span class="badge-dot"></span> Đang hoạt động</span></span>
          </div>
        </div>
      `,
      size: 'sm',
      footer: `
        <button class="btn btn-secondary" data-modal-close>Đóng</button>
        <button class="btn btn-secondary" id="btn-open-form-settings"><i data-lucide="pen-line"></i> Chữ ký biểu mẫu</button>
        <button class="btn btn-primary" id="btn-open-change-password"><i data-lucide="key-round"></i> Đổi mật khẩu</button>
      `
    });
    document.getElementById('btn-open-change-password').onclick = () => { Modal.closeAll(); this.showChangePassword(); };
    document.getElementById('btn-open-form-settings').onclick = () => { Modal.closeAll(); this.showFormSettings(); };
  },

  showChangePassword() {
    const modal = Modal.show({
      title: '<i data-lucide="key-round"></i> Đổi mật khẩu',
      content: `
        <form onsubmit="return false" autocomplete="off">
          <div class="form-group">
            <label>Mật khẩu hiện tại <span class="required">*</span></label>
            <input type="password" class="form-input" id="f-pw-old" autocomplete="current-password">
          </div>
          <div class="form-group">
            <label>Mật khẩu mới <span class="required">*</span></label>
            <input type="password" class="form-input" id="f-pw-new" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label>Nhập lại mật khẩu mới <span class="required">*</span></label>
            <input type="password" class="form-input" id="f-pw-confirm" autocomplete="new-password">
          </div>
        </form>
      `,
      size: 'sm',
      footer: `
        <button class="btn btn-secondary" data-modal-close>Hủy</button>
        <button class="btn btn-primary" id="btn-save-password"><i data-lucide="save"></i> Lưu mật khẩu</button>
      `
    });
    document.getElementById('btn-save-password').onclick = async () => {
      const oldPw = document.getElementById('f-pw-old').value;
      const newPw = document.getElementById('f-pw-new').value;
      const confirmPw = document.getElementById('f-pw-confirm').value;
      if (!oldPw || !newPw) { Toast.warning('Vui lòng nhập đầy đủ mật khẩu'); return; }
      if (newPw.length < 4) { Toast.warning('Mật khẩu mới phải có ít nhất 4 ký tự'); return; }
      if (newPw !== confirmPw) { Toast.warning('Mật khẩu nhập lại không khớp'); return; }
      if (newPw === oldPw) { Toast.warning('Mật khẩu mới phải khác mật khẩu hiện tại'); return; }
      const res = await API.changePassword(Auth.currentUser.id, oldPw, newPw);
      if (res.success) {
        Toast.success('Đã đổi mật khẩu thành công');
        modal.close();
      } else {
        Toast.error(res.error || 'Không đổi được mật khẩu');
      }
    };
  },

  // Personal signature / form info used when exporting proposals & external-repair PDFs.
  // Available to every account (non-admins cannot open the Settings page).
  async showFormSettings() {
    const fs = await API.getFormSettings();
    const fields = [
      ['category', 'Tên / Mã hạng mục công trình'], ['purpose', 'Mục đích sử dụng'],
      ['buyer', 'Người mua / NCC'], ['delivery', 'Vị trí giao hàng'],
      ['creator', 'Người lập phiếu'], ['receiver', 'Người nhận & kiểm tra hàng'],
      ['reviewer', 'Người xem xét'], ['head', 'Trưởng đơn vị'],
      ['approver', 'Người phê duyệt (Giám đốc)'], ['city', 'Thành phố / Địa điểm ký']
    ];
    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      rows.push(`<div class="form-row">${fields.slice(i, i + 2).map(([k, label]) => `
        <div class="form-group">
          <label>${label}</label>
          <input type="text" class="form-input" id="pfs-${k}" value="${Utils.escapeHtml(fs[k] || '')}">
        </div>`).join('')}</div>`);
    }
    const modal = Modal.show({
      title: '<i data-lucide="pen-line"></i> Chữ ký & thông tin biểu mẫu',
      content: `<p class="text-muted" style="margin-bottom:12px">Lưu riêng cho tài khoản <strong>${Utils.escapeHtml(Auth.currentUser.username)}</strong>. Để trống ô nào thì ô đó trên phiếu in sẽ để trống.</p>${rows.join('')}`,
      size: 'lg',
      footer: `
        <button class="btn btn-secondary" data-modal-close>Hủy</button>
        <button class="btn btn-primary" id="btn-save-pfs"><i data-lucide="save"></i> Lưu</button>
      `
    });
    document.getElementById('btn-save-pfs').onclick = async () => {
      const data = {};
      fields.forEach(([k]) => { data[k] = document.getElementById('pfs-' + k).value.trim(); });
      const res = await API.saveFormSettings(Auth.currentUser.username, data);
      if (res.success) {
        Toast.success('Đã lưu thông tin biểu mẫu');
        modal.close();
      } else {
        Toast.error(res.error || 'Lỗi khi lưu thông tin biểu mẫu');
      }
    };
  },

  updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }
};
