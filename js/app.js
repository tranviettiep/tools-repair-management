// ============================================
// App.js - Main application entry point
// ============================================

const App = {
  async init() {
    // Restore backend config
    const savedUrl = Utils.storage.get('gas_url');
    if (savedUrl) API.BASE_URL = savedUrl;
    const savedMock = Utils.storage.get('mock_mode');
    if (savedMock !== null) {
       // Tạm thời vô hiệu hóa việc đọc cấu hình Production để ép về Demo
       // API.MOCK_MODE = savedMock;
       API.MOCK_MODE = true; 
    }

    // Initialize toast
    Toast.init();

    // Check authentication
    const isLoggedIn = await Auth.init();

    // Register routes
    this.registerRoutes();

    if (isLoggedIn) {
      this.renderAppShell();
      Auth.startActivityMonitor();
    }

    // Start router
    Router.init();
  },

  registerRoutes() {
    Router.register('/login', () => this.renderLogin(), { requiresAuth: false, title: 'Đăng nhập' });
    Router.register('/dashboard', () => this.renderPage('dashboard'), { title: 'Tổng quan', permission: 'view_dashboard' });
    Router.register('/machines', () => this.renderPage('machines'), { title: 'Máy công cụ', permission: 'view_machines' });
    Router.register('/repairs', () => this.renderPage('repairs'), { title: 'Sửa chữa', permission: 'view_repairs' });
      Router.register('/external-repairs', () => this.renderPage('external-repairs'), { title: 'Sửa chữa ngoài', permission: 'view_repairs' });
    Router.register('/spare-parts', () => this.renderPage('spare-parts'), { title: 'Kho phụ tùng', permission: 'view_parts' });
    Router.register('/reports', () => this.renderPage('reports'), { title: 'Báo cáo', permission: 'view_reports' });
    Router.register('/users', () => this.renderPage('users'), { title: 'Người dùng', permission: 'manage_users' });
    Router.register('/settings', () => this.renderPage('settings'), { title: 'Cài đặt', permission: 'manage_settings' });
    Router.register('/guide', () => this.renderPage('guide'), { title: 'Hướng dẫn' });
  },

  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-bg"></div>
        <div class="login-card">
          <div class="login-logo">
            <div class="logo-icon">🔧</div>
            <h1>TOOLS REPAIR</h1>
            <p>Hệ thống quản lý sửa chữa máy công cụ</p>
          </div>
          <div class="login-error" id="login-error"></div>
          <form class="login-form" onsubmit="App.handleLogin(event)">
            <div class="form-group">
              <div class="form-input-icon">
                <span class="icon">👤</span>
                <input type="text" class="form-input" id="login-username" placeholder="Tên đăng nhập" required autofocus>
              </div>
            </div>
            <div class="form-group">
              <div class="form-input-icon">
                <span class="icon">🔒</span>
                <input type="password" class="form-input" id="login-password" placeholder="Mật khẩu" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="login-btn" onclick="Utils.addRipple(event)">
              ĐĂNG NHẬP
            </button>
          </form>
          <p style="text-align:center;margin-top:16px;color:var(--text-muted);font-size:0.8rem">
            Demo: Nhập bất kỳ username có sẵn (admin, truongpxa, ktv_binh...)
          </p>
        </div>
      </div>
    `;
  },

  async handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    if (!username) {
      errorEl.textContent = 'Vui lòng nhập tên đăng nhập';
      errorEl.classList.add('show');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    errorEl.classList.remove('show');

    const result = await Auth.login(username, password);

    if (result.success) {
      this.renderAppShell();
      Auth.startActivityMonitor();
      Router.navigate('/dashboard');
    } else {
      errorEl.textContent = result.error || 'Đăng nhập thất bại';
      errorEl.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'ĐĂNG NHẬP';
    }
  },

  renderAppShell() {
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        ${Sidebar.render()}
        <div class="main-content">
          ${Header.render()}
          <div id="page-content"></div>
        </div>
      </div>
    `;
  },

  renderPage(pageName) {
    // Ensure app shell is rendered
    if (!document.querySelector('.app-container')) {
      this.renderAppShell();
    }

    // Destroy previous charts
    if (typeof DashboardPage !== 'undefined' && DashboardPage.destroy) DashboardPage.destroy();
    if (typeof ReportsPage !== 'undefined' && ReportsPage.destroy) ReportsPage.destroy();

    // Update sidebar active state
    const path = '/' + pageName;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === path);
    });

    // Render the page
    switch (pageName) {
      case 'dashboard': DashboardPage.render(); break;
      case 'machines': MachinesPage.render(); break;
      case 'repairs': RepairsPage.render(); break;
        case 'external-repairs': ExternalRepairsPage.render(); break;
      case 'spare-parts': SparePartsPage.render(); break;
      case 'reports': ReportsPage.render(); break;
      case 'users': UsersPage.render(); break;
      case 'settings': SettingsPage.render(); break;
      case 'guide': GuidePage.render(); break;
    }

    // Close mobile sidebar after navigation
    Sidebar.closeMobile();
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
