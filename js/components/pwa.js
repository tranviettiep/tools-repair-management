// ============================================
// Pwa.js - Install the app to the home screen
// ============================================

const Pwa = {
  deferredPrompt: null,   // Chrome/Edge/Android install prompt, captured for our own button
  HINT_KEY: 'pwa_hint_dismissed',

  init() {
    const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    if ('serviceWorker' in navigator && secure) {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker:', err));
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.dismissHint();
      Toast.success('Đã cài ứng dụng lên thiết bị');
      this.updateUi();
    });
  },

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },

  isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  },

  // Small banner on phones the first few times, until installed or dismissed
  hintHtml() {
    if (this.isInstalled() || !Mobile.isMobile() || Utils.storage.get(this.HINT_KEY)) return '';
    return `
      <div class="install-hint" id="install-hint">
        <img src="icons/icon-192.png" alt="" class="install-hint-icon">
        <div class="install-hint-text">
          <strong>Cài app Sửa chữa VICO</strong>
          <span>Mở nhanh từ màn hình chính</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Pwa.install()">Cài đặt</button>
        <button class="install-hint-close" onclick="Pwa.dismissHint()" aria-label="Đóng"><i data-lucide="x"></i></button>
      </div>`;
  },

  dismissHint() {
    Utils.storage.set(this.HINT_KEY, true);
    document.getElementById('install-hint')?.remove();
  },

  updateUi() {
    document.querySelectorAll('[data-install-item]').forEach(el => {
      el.style.display = this.isInstalled() ? 'none' : '';
    });
  },

  async install() {
    document.getElementById('user-dropdown')?.classList.remove('show');
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      if (outcome === 'accepted') this.dismissHint();
      return;
    }
    this.showInstructions();
  },

  // Browsers without an install prompt (iPhone Safari) or when it isn't available yet
  showInstructions() {
    const steps = this.isIos()
      ? [
          'Mở trang này bằng <strong>Safari</strong>',
          'Bấm nút <strong>Chia sẻ</strong> <i data-lucide="share"></i> ở thanh dưới cùng',
          'Chọn <strong>Thêm vào MH chính</strong> (Add to Home Screen)',
          'Bấm <strong>Thêm</strong>, biểu tượng VICO sẽ xuất hiện trên màn hình chính',
        ]
      : [
          'Mở trang này bằng <strong>Chrome</strong> (hoặc Edge)',
          'Bấm nút menu <i data-lucide="ellipsis-vertical"></i> ở góc trên bên phải',
          'Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>',
          'Xác nhận <strong>Cài đặt</strong>, biểu tượng VICO sẽ xuất hiện trên màn hình chính',
        ];
    Modal.show({
      title: '<i data-lucide="smartphone"></i> Cài app lên điện thoại',
      content: `
        <ol class="install-steps">
          ${steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
        <p class="form-hint">Sau khi cài, mở app từ biểu tượng VICO mà không cần gõ địa chỉ web. Dữ liệu vẫn luôn là mới nhất.</p>
      `,
      footer: '<button class="btn btn-primary" data-modal-close>Đã hiểu</button>',
      size: 'sm'
    });
  }
};
