// ============================================
// Auth.js - Authentication & session management
// ============================================

const Auth = {
  currentUser: null,
  SESSION_KEY: 'trm_session',
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours

  // Initialize - check existing session
  async init() {
    const session = Utils.storage.get(this.SESSION_KEY);
    if (!session) return false;

    // Check expiry
    if (Date.now() > session.expiry) {
      this.clearSession();
      return false;
    }

    // Verify token with server
    const result = await API.verifyToken();
    if (result.success) {
      this.currentUser = session.user;
      this._updateActivity();
      return true;
    }

    this.clearSession();
    return false;
  },

  // Login
  async login(username, password) {
    const result = await API.login(username, password);
    if (result.success) {
      this.currentUser = result.data.user;
      Utils.storage.set(this.SESSION_KEY, {
        token: result.data.token,
        user: result.data.user,
        expiry: Date.now() + this.SESSION_TIMEOUT,
        lastActivity: Date.now()
      });
      Utils.storage.set('auth_token', result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  // Logout
  async logout() {
    await API.logout();
    this.clearSession();
    this.currentUser = null;
    window.location.hash = '#/login';
    window.location.reload();
  },

  // Clear session
  clearSession() {
    Utils.storage.remove(this.SESSION_KEY);
    Utils.storage.remove('auth_token');
    Utils.cache.clear();
    this.currentUser = null;
  },

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  },

  // Check role permission
  hasRole(roles) {
    if (!this.currentUser) return false;
    if (typeof roles === 'string') roles = [roles];
    return roles.includes(this.currentUser.role);
  },

  // Check if admin
  isAdmin() {
    return this.hasRole('admin');
  },

  // Check if manager or admin
  isManagerOrAdmin() {
    return this.hasRole(['admin', 'manager']);
  },

  // Check if user can access specific department data
  canAccessDepartment(department) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    if (this.currentUser.role === 'technician') return true;
    return this.currentUser.department === department || !department;
  },

  // Permission check for specific actions
  can(permission) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role;

    const permissions = {
      // Dashboard
      'view_dashboard': ['admin', 'manager', 'technician'],

      // Machines
      'view_machines': ['admin', 'manager', 'technician', 'reporter'],
      'create_machine': ['admin'],
      'edit_machine': ['admin'],
      'delete_machine': ['admin'],

      // Repairs
      'view_repairs': ['admin', 'manager', 'technician', 'reporter'],
      'create_repair': ['admin', 'manager', 'technician', 'reporter'],
      'receive_repair': ['admin', 'manager'],
      'assign_technician': ['admin', 'manager'],
      'update_repair': ['admin', 'technician'],
      'complete_repair': ['admin', 'manager', 'technician'],

      // Spare parts
      'view_parts': ['admin', 'technician'],
      'manage_parts': ['admin', 'technician'],
      'import_parts': ['admin', 'technician'],
      'export_parts': ['admin', 'technician'],

      // Reports
      'view_reports': ['admin', 'manager'],
      'export_reports': ['admin', 'manager'],

      // Users
      'manage_users': ['admin'],

      // Settings
      'manage_settings': ['admin'],
    };

    const allowedRoles = permissions[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
  },

  // Update last activity timestamp
  _updateActivity() {
    const session = Utils.storage.get(this.SESSION_KEY);
    if (session) {
      session.lastActivity = Date.now();
      session.expiry = Date.now() + this.SESSION_TIMEOUT;
      Utils.storage.set(this.SESSION_KEY, session);
    }
  },

  // Start activity monitoring
  startActivityMonitor() {
    // Update activity on user interaction
    const updateActivity = Utils.debounce(() => this._updateActivity(), 60000);
    document.addEventListener('click', updateActivity);
    document.addEventListener('keydown', updateActivity);

    // Check session expiry every minute
    setInterval(() => {
      if (!this.isLoggedIn()) return;
      const session = Utils.storage.get(this.SESSION_KEY);
      if (!session || Date.now() > session.expiry) {
        this.clearSession();
        Toast.show('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
        setTimeout(() => {
          window.location.hash = '#/login';
          window.location.reload();
        }, 2000);
      }
    }, 60000);
  }
};
