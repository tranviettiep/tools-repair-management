// ============================================
// Utils.js - Shared utility functions
// ============================================

const Utils = {
  // Generate unique ID
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  },

  // Generate repair request ID (SC-YYYYMMDD-NNN)
  generateRepairId(sequence) {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    return `SC-${dateStr}-${String(sequence).padStart(3, '0')}`;
  },

  // Format date to Vietnamese format
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  },

  // Format datetime
  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  // Format relative time (e.g., "2 phút trước")
  formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return Utils.formatDate(dateStr);
  },

  // Format currency (VND)
  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  },

  // Format number with separator
  formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
  },

  // Debounce function
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Escape HTML to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Truncate text
  truncate(str, maxLen = 50) {
    if (!str || str.length <= maxLen) return str || '';
    return str.substring(0, maxLen) + '...';
  },

  // Get status badge HTML
  getStatusBadge(status) {
    const map = {
      'Hoạt động': { class: 'badge-active', label: 'Hoạt động' },
      'Đang sửa': { class: 'badge-repairing', label: 'Đang sửa' },
      'Hỏng': { class: 'badge-broken', label: 'Hỏng' },
      'Ngừng sử dụng': { class: 'badge-inactive', label: 'Ngừng SD' },
      'Báo hỏng': { class: 'badge-reported', label: 'Báo hỏng' },
      'Tiếp nhận': { class: 'badge-received', label: 'Tiếp nhận' },
      'Đang sửa chữa': { class: 'badge-in-progress', label: 'Đang sửa' },
      'Hoàn thành': { class: 'badge-completed', label: 'Hoàn thành' },
      'Sửa ngoài': { class: 'badge-in-progress', label: 'Sửa ngoài' },
      'Đã về': { class: 'badge-returned', label: 'Đã về' },
      'Đã sửa': { class: 'badge-completed', label: 'Đã sửa' },
    };
    const info = map[status] || { class: 'badge-inactive', label: status || '—' };
    return `<span class="badge ${info.class}"><span class="badge-dot"></span>${Utils.escapeHtml(info.label)}</span>`;
  },

  // Get priority badge HTML
  getPriorityBadge(priority) {
    const map = {
      'Khẩn cấp': { class: 'badge-urgent', icon: '🔴' },
      'Bình thường': { class: 'badge-normal', icon: '🟡' },
      'Thấp': { class: 'badge-low', icon: '🟢' },
    };
    const info = map[priority] || { class: 'badge-normal', icon: '⚪' };
    return `<span class="badge ${info.class}">${info.icon} ${Utils.escapeHtml(priority || '—')}</span>`;
  },

  // Get role badge HTML
  getRoleBadge(role) {
    const map = {
      'admin': { class: 'badge-admin', label: 'Admin' },
      'manager': { class: 'badge-manager', label: 'Trưởng BP' },
      'technician': { class: 'badge-technician', label: 'Kỹ thuật viên' },
      'reporter': { class: 'badge-reporter', label: 'Người báo hỏng' },
    };
    const info = map[role] || { class: 'badge-inactive', label: role || '—' };
    return `<span class="badge ${info.class}">${Utils.escapeHtml(info.label)}</span>`;
  },

  // Simple SHA256 hash (for password - using SubtleCrypto)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // LocalStorage helpers with JSON support
  storage: {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    clear() {
      localStorage.clear();
    }
  },

  // Cache with TTL
  cache: {
    get(key) {
      const cached = Utils.storage.get(`cache_${key}`);
      if (!cached) return null;
      if (Date.now() > cached.expiry) {
        Utils.storage.remove(`cache_${key}`);
        return null;
      }
      return cached.data;
    },
    set(key, data, ttlMs = 5 * 60 * 1000) {
      Utils.storage.set(`cache_${key}`, {
        data,
        expiry: Date.now() + ttlMs
      });
    },
    clear(key) {
      if (key) {
        Utils.storage.remove(`cache_${key}`);
      } else {
        Object.keys(localStorage)
          .filter(k => k.startsWith('cache_'))
          .forEach(k => localStorage.removeItem(k));
      }
    }
  },

  // Animate counting number
  animateCount(element, targetValue, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const diff = targetValue - start;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      element.textContent = Math.round(start + diff * eased);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  },

  // Add ripple effect to button
  addRipple(event) {
    const btn = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  },

  // Download file (for export)
  downloadFile(data, filename, mimeType = 'application/octet-stream') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Parse CSV
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
  }
};
