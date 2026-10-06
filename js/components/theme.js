// ============================================
// Theme.js - Light / dark mode (ArchitectUI)
// ============================================
// Choice is stored as 'app_theme' ('light' | 'dark'); with no saved choice the phone/PC setting is used.
// index.html applies the saved theme before the CSS paints, so pages never flash white.

const ThemeManager = {
  current: 'light',

  init() {
    const saved = Utils.storage.get('app_theme');
    const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    this.current = saved === 'dark' || saved === 'light' ? saved : (media && media.matches ? 'dark' : 'light');
    this.apply();

    // Follow the system setting until the user picks a theme
    media?.addEventListener('change', (e) => {
      if (Utils.storage.get('app_theme')) return;
      this.current = e.matches ? 'dark' : 'light';
      this.apply();
      this.refreshCharts();
    });
  },

  isDark() {
    return this.current === 'dark';
  },

  toggle() {
    this.current = this.isDark() ? 'light' : 'dark';
    Utils.storage.set('app_theme', this.current);
    this.apply();
    this.refreshCharts();
  },

  apply() {
    const dark = this.isDark();
    document.documentElement.setAttribute('data-theme', this.current);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1f232a' : '#fafbfc');

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}"></i>`;
      btn.title = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
    }

    Object.assign(Utils.chartTheme, dark
      ? { primary: '#6e8ff0', primaryHover: '#8aa6f5', grid: 'rgba(255, 255, 255, 0.08)', tick: '#949ca6', legend: '#ced4da', surface: '#22262e' }
      : { primary: '#3f6ad8', primaryHover: '#2955c8', grid: '#e9ecef', tick: '#6c757d', legend: '#495057', surface: '#ffffff' });
    if (typeof Chart !== 'undefined') Chart.defaults.color = Utils.chartTheme.tick;
  },

  // Chart.js draws on canvas, so colours only change when the charts are drawn again
  refreshCharts() {
    const path = Router.getPath();
    if (path === '/dashboard') DashboardPage.render();
    else if (path === '/reports') ReportsPage.render();
  }
};
