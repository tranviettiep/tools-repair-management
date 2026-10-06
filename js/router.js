// ============================================
// Router.js - Hash-based SPA routing
// ============================================

const Router = {
  routes: {},
  currentRoute: null,
  currentPage: null,

  // Register a route
  register(path, handler, options = {}) {
    this.routes[path] = { handler, ...options };
  },

  // Initialize router
  init() {
    window.addEventListener('hashchange', () => this._onHashChange());
    this._onHashChange();
  },

  // Navigate to a path
  navigate(path) {
    window.location.hash = '#' + path;
  },

  // Get current path
  getPath() {
    return window.location.hash.slice(1) || '/dashboard';
  },

  // Handle hash change
  _onHashChange() {
    const path = this.getPath();
    const route = this.routes[path];

    if (!route) {
      // Default redirect
      if (Auth.isLoggedIn()) {
        this.navigate('/dashboard');
      } else {
        this.navigate('/login');
      }
      return;
    }

    // Auth check
    if (route.requiresAuth !== false && !Auth.isLoggedIn()) {
      this.navigate('/login');
      return;
    }

    // Already logged in, trying to access login page
    if (path === '/login' && Auth.isLoggedIn()) {
      this.navigate('/dashboard');
      return;
    }

    // Permission check
    if (route.permission && !Auth.can(route.permission)) {
      Toast.show('Bạn không có quyền truy cập trang này', 'error');
      this.navigate('/dashboard');
      return;
    }

    this.currentRoute = path;

    // Update header title
    if (route.title) {
      const headerTitle = document.querySelector('.header-title');
      if (headerTitle) headerTitle.textContent = route.title;
    }

    // Update sidebar active
    if (typeof Sidebar !== 'undefined') Sidebar.syncActive();

    // Render page
    route.handler();
  }
};
