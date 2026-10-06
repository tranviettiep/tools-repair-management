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

    CommandPalette.init();

    // Initialize toast
    Toast.init();

    Mobile.init();
    Pwa.init();
    this.initDomEnhancers();
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      Chart.defaults.color = Utils.chartTheme.tick;
    }

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

  // Pages render markup as strings, so post-process the DOM whenever it changes:
  // convert <i data-lucide> tags to SVG icons and label table cells for the mobile card layout.
  initDomEnhancers() {
    // Observer callbacks run before paint, so icons never flash empty.
    // Both steps skip work that is already done, so the follow-up callback they trigger stops.
    const enhance = () => {
      this.decoratePageHeader();
      if (typeof lucide !== 'undefined' && document.querySelector('i[data-lucide]')) lucide.createIcons();
      Mobile.labelTables();
    };
    enhance();
    new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  },

  // ArchitectUI page title block: large icon box left of the page heading
  pageIcons: {
    '/dashboard': ['layout-dashboard', 'primary'],
    '/machines': ['wrench', 'info'],
    '/repairs': ['clipboard-list', 'danger'],
    '/external-repairs': ['truck', 'warning'],
    '/spare-parts': ['package', 'success'],
    '/reports': ['chart-line', 'alternate'],
    '/users': ['users', 'primary'],
    '/settings': ['settings', 'dark'],
    '/guide': ['book-open', 'info'],
  },

  decoratePageHeader() {
    const header = document.querySelector('.page-content > .page-header:not(.has-icon)');
    const titleBox = header?.firstElementChild;
    const icon = this.pageIcons[Router.getPath()];
    if (!titleBox || !icon) return;
    header.classList.add('has-icon');
    titleBox.insertAdjacentHTML('afterbegin',
      `<div class="page-title-icon tone-${icon[1]}"><i data-lucide="${icon[0]}"></i></div>`);
  },

  // Floating "Báo hỏng" button on phones: the repair form needs the machine list loaded by the Repairs page
  async quickReport() {
    if (Router.getPath() !== '/repairs') {
      Router.navigate('/repairs');
      for (let i = 0; i < 40 && !RepairsPage.machines.length; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
    } else if (!RepairsPage.machines.length) {
      await RepairsPage.loadData();
    }
    RepairsPage.showAddModal();
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
            <img class="logo-img" src="template/LOGO%20VICO.jpg" alt="VICO">
            <h1>Quản lý sửa chữa máy công cụ</h1>
            <p>Đăng nhập để tiếp tục</p>
          </div>
          <div class="login-error" id="login-error"></div>
          <form class="login-form" onsubmit="App.handleLogin(event)">
            <div class="form-group">
              <div class="form-input-icon">
                <span class="icon"><i data-lucide="user"></i></span>
                <input type="text" class="form-input" id="login-username" placeholder="Tên đăng nhập" required autofocus>
              </div>
            </div>
            <div class="form-group">
              <div class="form-input-icon">
                <span class="icon"><i data-lucide="lock"></i></span>
                <input type="password" class="form-input" id="login-password" placeholder="Mật khẩu" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="login-btn" onclick="Utils.addRipple(event)">
              Đăng nhập
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
      btn.textContent = 'Đăng nhập';
    }
  },

  renderAppShell() {
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        ${Sidebar.render()}
        <div class="main-content">
          ${Header.render()}
          ${Pwa.hintHtml()}
          <div id="page-content"></div>
        </div>
      </div>
      ${Auth.can('create_repair') ? `
        <button class="fab" onclick="App.quickReport()" aria-label="Báo hỏng máy">
          <i data-lucide="plus"></i><span>Báo hỏng</span>
        </button>` : ''}
    `;
    Notifications.start();
  },

  renderPage(pageName) {
    // Ensure app shell is rendered
    if (!document.querySelector('.app-container')) {
      this.renderAppShell();
    }

    // Destroy previous charts
    if (typeof DashboardPage !== 'undefined' && DashboardPage.destroy) DashboardPage.destroy();
    if (typeof ReportsPage !== 'undefined' && ReportsPage.destroy) ReportsPage.destroy();

    Sidebar.syncActive();

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
