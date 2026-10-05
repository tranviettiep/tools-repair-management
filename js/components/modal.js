// ============================================
// Modal.js - Reusable modal component
// ============================================

const Modal = {
  _activeModals: [],

  // Show a modal
  show({ title, content, size = '', footer = '', onClose = null, id = '' }) {
    const modalId = id || 'modal-' + Date.now();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = modalId;
    overlay.innerHTML = `
      <div class="modal ${size ? 'modal-' + size : ''}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" data-modal-close>✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger show animation
    requestAnimationFrame(() => overlay.classList.add('show'));

    // Close handlers
    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        this._activeModals = this._activeModals.filter(m => m !== modalId);
      }, 300);
      if (onClose) onClose();
    };

    overlay.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    this._activeModals.push(modalId);

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return { close, element: overlay, id: modalId };
  },

  // Confirm dialog
  confirm({ title = 'Xác nhận', message, icon = '⚠️', confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }) {
    return new Promise((resolve) => {
      const content = `
        <div class="confirm-dialog">
          <div class="confirm-dialog-icon">${icon}</div>
          <div class="confirm-dialog-title">${Utils.escapeHtml(title)}</div>
          <div class="confirm-dialog-message">${Utils.escapeHtml(message)}</div>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
      `;

      const modal = this.show({
        title: '',
        content,
        footer,
        size: 'sm'
      });

      // Hide header for confirm dialog
      modal.element.querySelector('.modal-header').style.display = 'none';

      modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
        resolve(false);
      });

      modal.element.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        modal.close();
        resolve(true);
      });
    });
  },

  // Close all modals
  closeAll() {
    document.querySelectorAll('.modal-overlay.show').forEach(overlay => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    });
    this._activeModals = [];
  }
};
