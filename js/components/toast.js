// ============================================
// Toast.js - Toast notification component
// ============================================

const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();

    const icons = {
      success: '<i data-lucide="circle-check"></i>',
      error: '<i data-lucide="circle-x"></i>',
      warning: '<i data-lucide="triangle-alert"></i>',
      info: '<i data-lucide="info"></i>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${Utils.escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()"><i data-lucide="x"></i></button>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning', 4000); },
  info(msg) { this.show(msg, 'info'); }
};
