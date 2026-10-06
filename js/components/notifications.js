// ============================================
// Notifications.js - Pending fault reports: bell, sidebar badge, live updates
// ============================================

const Notifications = {
  pending: [],
  _knownIds: null,      // ids already seen, so only genuinely new reports raise a toast
  _channel: null,
  _pollTimer: null,
  _refreshTimer: null,
  POLL_MS: 60000,

  start() {
    if (this._pollTimer) return;
    this.refresh();
    this._subscribe();
    // Safety net: keeps counts fresh even if Realtime is not enabled for the table
    this._pollTimer = setInterval(async () => {
      if (await this.refresh()) this._refreshOpenPage();
    }, this.POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refresh();
    });
  },

  // Returns how many reports appeared since the last check
  async refresh() {
    API.init();
    const { data, error } = await API.supabase
      .from('repairs')
      .select('id, machine_code, machine_name, department, fault_description, reported_by, reported_at')
      .eq('status', 'Báo hỏng')
      .order('reported_at', { ascending: false });
    if (error || !data) return 0;

    const isFirstLoad = this._knownIds === null;
    const fresh = isFirstLoad ? [] : data.filter(r => !this._knownIds.has(r.id));
    this._knownIds = new Set(data.map(r => r.id));
    this.pending = data;
    this._renderCounts();

    // Announce reports made by someone else (the reporter already saw their own success toast)
    const me = Auth.currentUser?.full_name;
    const others = fresh.filter(r => r.reported_by !== me);
    if (others.length === 1) {
      Toast.warning(`Báo hỏng mới: ${others[0].machine_name || others[0].machine_code}`);
    } else if (others.length > 1) {
      Toast.warning(`Có ${others.length} báo hỏng mới`);
    }
    return fresh.length;
  },

  _subscribe() {
    API.init();
    if (!API.supabase.channel) return;
    this._channel = API.supabase
      .channel('repairs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        // Several rows often change together (e.g. one external ticket); coalesce them
        clearTimeout(this._refreshTimer);
        this._refreshTimer = setTimeout(() => {
          this.refresh();
          this._refreshOpenPage();
        }, 400);
      })
      .subscribe();
  },

  // Re-load the visible list so other users' changes appear without pressing F5
  _refreshOpenPage() {
    if (document.querySelector('.modal-overlay.show')) return; // don't disturb someone mid-form
    const path = Router.getPath();
    if (path === '/repairs' && typeof RepairsPage !== 'undefined') RepairsPage.loadData();
    if (path === '/dashboard' && typeof DashboardPage !== 'undefined') DashboardPage.loadData?.();
  },

  _renderCounts() {
    const count = this.pending.length;
    Header.updateNotificationBadge(count);
    Sidebar.updateBadge('/repairs', count);
    const panel = document.getElementById('notification-panel');
    if (panel?.classList.contains('show')) panel.innerHTML = this._panelHtml();
  },

  togglePanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    const willShow = !panel.classList.contains('show');
    document.getElementById('user-dropdown')?.classList.remove('show');
    if (!willShow) {
      panel.classList.remove('show');
      return;
    }
    panel.innerHTML = this._panelHtml();
    panel.classList.add('show');

    const closeHandler = (e) => {
      if (!panel.contains(e.target) && !e.target.closest('#notification-btn')) {
        panel.classList.remove('show');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  },

  _panelHtml() {
    const items = this.pending.slice(0, 8);
    return `
      <div class="notif-header">
        <span>Đang chờ sửa</span>
        <span class="notif-count">${this.pending.length}</span>
      </div>
      ${items.length ? `
        <div class="notif-list">
          ${items.map(r => `
            <div class="notif-item" onclick="Notifications.openRepair('${Utils.escapeHtml(r.id)}')">
              <div class="notif-icon"><i data-lucide="triangle-alert"></i></div>
              <div class="notif-body">
                <div class="notif-title">${Utils.escapeHtml(r.machine_name || r.machine_code || r.id)}</div>
                ${r.fault_description ? `<div class="notif-text">${Utils.escapeHtml(Utils.truncate(r.fault_description, 60))}</div>` : ''}
                <div class="notif-meta">${Utils.escapeHtml(r.department || '')}${r.department ? ' · ' : ''}${Utils.formatRelativeTime(r.reported_at)}</div>
              </div>
            </div>`).join('')}
        </div>` : `
        <div class="notif-empty">
          <i data-lucide="circle-check"></i>
          <span>Không có máy nào đang chờ sửa</span>
        </div>`}
      <button class="notif-footer" onclick="Notifications.openAll()">Xem tất cả yêu cầu sửa chữa</button>
    `;
  },

  async openRepair(id) {
    document.getElementById('notification-panel')?.classList.remove('show');
    if (Router.getPath() !== '/repairs') {
      Router.navigate('/repairs');
      for (let i = 0; i < 40 && !RepairsPage.repairs.some(r => r.id === id); i++) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    if (!RepairsPage.repairs.some(r => r.id === id)) await RepairsPage.loadData();
    RepairsPage.showDetail(id);
  },

  openAll() {
    document.getElementById('notification-panel')?.classList.remove('show');
    Router.navigate('/repairs');
  }
};
