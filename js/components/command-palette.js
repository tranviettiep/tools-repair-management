// ============================================
// CommandPalette.js - Quick Search & Action Palette (Ctrl+K)
// ============================================

const CommandPalette = {
  isOpen: false,
  selectedIndex: 0,
  flatItems: [],
  dataCache: {
    machines: null,
    repairs: null,
    parts: null,
    lastFetch: 0
  },

  init() {
    this.render();
    this.bindGlobalKeys();
  },

  render() {
    if (document.getElementById('command-overlay')) return;

    const el = document.createElement('div');
    el.className = 'command-overlay';
    el.id = 'command-overlay';
    el.onclick = (e) => {
      if (e.target === el) this.close();
    };

    el.innerHTML = `
      <div class="command-palette" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh">
        <div class="command-input-wrap">
          <i data-lucide="search"></i>
          <input type="text"
                 class="command-input"
                 id="command-input"
                 placeholder="Tìm trang, chức năng, máy móc, phiếu SC, phụ tùng..."
                 autocomplete="off"
                 spellcheck="false">
          <kbd onclick="CommandPalette.close()" style="cursor:pointer" title="Đóng">ESC</kbd>
        </div>
        <div class="command-results" id="command-results"></div>
      </div>
    `;

    document.body.appendChild(el);

    const input = document.getElementById('command-input');
    input.addEventListener('input', () => this.handleInput());
    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
  },

  bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Close on Escape if open
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  async open() {
    this.render();
    const overlay = document.getElementById('command-overlay');
    const input = document.getElementById('command-input');
    if (!overlay || !input) return;

    this.isOpen = true;
    overlay.classList.add('show');
    input.value = '';
    this.selectedIndex = 0;

    // Load static items immediately
    this.updateResults('');

    // Focus input
    setTimeout(() => {
      input.focus();
      if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [overlay] });
    }, 50);

    // Warm cache in background
    this.warmCache();
  },

  close() {
    const overlay = document.getElementById('command-overlay');
    if (!overlay) return;

    this.isOpen = false;
    overlay.classList.remove('show');
    const input = document.getElementById('command-input');
    if (input) input.blur();
  },

  async warmCache() {
    const now = Date.now();
    if (now - this.dataCache.lastFetch < 30000 && this.dataCache.machines) return;

    try {
      if (typeof API !== 'undefined') {
        const [mRes, rRes, pRes] = await Promise.allSettled([
          API.getMachines(),
          API.getRepairs({ limit: 100 }),
          API.getParts()
        ]);

        if (mRes.status === 'fulfilled' && mRes.value?.success) {
          this.dataCache.machines = mRes.value.data || [];
        }
        if (rRes.status === 'fulfilled' && rRes.value?.success) {
          this.dataCache.repairs = rRes.value.data || [];
        }
        if (pRes.status === 'fulfilled' && pRes.value?.success) {
          this.dataCache.parts = pRes.value.data || [];
        }
        this.dataCache.lastFetch = now;
        if (this.isOpen) this.updateResults(document.getElementById('command-input')?.value || '');
      }
    } catch (e) {
      console.warn('CommandPalette cache warming failed:', e);
    }
  },

  // Lowercase and strip Vietnamese accents so "may tien" finds "Máy tiện"
  normalize(text) {
    return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  },

  matches(q, ...fields) {
    return fields.some(f => f && this.normalize(f).includes(q));
  },

  // Data pages load asynchronously: go to the page, wait until the record is in memory, then open it
  async openWhenReady(route, isReady, open) {
    if (Router.getPath() !== route) {
      Router.navigate(route);
      await new Promise(r => setTimeout(r, 0));
    }
    for (let i = 0; i < 50 && !isReady(); i++) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (isReady()) open();
    else Toast.warning('Chưa tải được dữ liệu, vui lòng thử lại');
  },

  handleInput() {
    const query = document.getElementById('command-input').value.trim();
    this.selectedIndex = 0;
    this.updateResults(query);
  },

  handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.flatItems.length === 0) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.flatItems.length;
      this.highlightSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.flatItems.length === 0) return;
      this.selectedIndex = (this.selectedIndex - 1 + this.flatItems.length) % this.flatItems.length;
      this.highlightSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.flatItems[this.selectedIndex]) {
        this.executeItem(this.flatItems[this.selectedIndex]);
      }
    }
  },

  executeItem(item) {
    this.close();
    if (typeof item.action === 'function') {
      item.action();
    }
  },

  highlightSelected() {
    const container = document.getElementById('command-results');
    if (!container) return;

    const domItems = container.querySelectorAll('.command-item');
    domItems.forEach((el, idx) => {
      if (idx === this.selectedIndex) {
        el.classList.add('active');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('active');
      }
    });
  },

  updateResults(rawQuery) {
    const container = document.getElementById('command-results');
    if (!container) return;

    const q = this.normalize(rawQuery);
    const groups = [];

    // 1. Navigation items
    const navItems = [
      { id: 'nav-dashboard', icon: 'layout-dashboard', title: 'Tổng quan', hint: 'Trang chủ', route: '/dashboard', perm: 'view_dashboard' },
      { id: 'nav-machines', icon: 'wrench', title: 'Danh sách máy công cụ', hint: 'Máy móc & Thiết bị', route: '/machines', perm: 'view_machines' },
      { id: 'nav-repairs', icon: 'clipboard-list', title: 'Quản lý sửa chữa', hint: 'Phiếu báo hỏng', route: '/repairs', perm: 'view_repairs' },
      { id: 'nav-ext-repairs', icon: 'truck', title: 'Sửa chữa ngoài', hint: 'Thuê ngoài & Gia công', route: '/external-repairs', perm: 'view_repairs' },
      { id: 'nav-spare-parts', icon: 'package', title: 'Kho phụ tùng', hint: 'Tồn kho & Nhập/Xuất', route: '/spare-parts', perm: 'view_parts' },
      { id: 'nav-reports', icon: 'chart-line', title: 'Báo cáo & Thống kê', hint: 'Biểu đồ MTBF/MTTR', route: '/reports', perm: 'view_reports' },
      { id: 'nav-users', icon: 'users', title: 'Quản lý người dùng', hint: 'Tài khoản & Phân quyền', route: '/users', perm: 'manage_users' },
      { id: 'nav-settings', icon: 'settings', title: 'Cài đặt hệ thống', hint: 'Mã lỗi, danh mục', route: '/settings', perm: 'manage_settings' },
      { id: 'nav-guide', icon: 'book-open', title: 'Hướng dẫn sử dụng', hint: 'Tài liệu hướng dẫn', route: '/guide' },
    ];

    const filteredNav = navItems.filter(item => {
      if (item.perm && typeof Auth !== 'undefined' && !Auth.can(item.perm)) return false;
      if (!q) return true;
      return this.matches(q, item.title, item.hint);
    }).map(item => ({
      ...item,
      action: () => Router.navigate(item.route)
    }));

    if (filteredNav.length > 0) {
      groups.push({ title: 'Điều hướng trang', items: filteredNav });
    }

    // 2. Quick actions
    const actionItems = [];

    if (typeof Auth !== 'undefined' && Auth.can('create_repair')) {
      actionItems.push({
        id: 'act-report',
        icon: 'plus-circle',
        title: 'Tạo phiếu báo hỏng máy',
        hint: 'Hành động',
        keywords: 'bao hong tao sua chua moi create repair',
        action: () => App.quickReport()
      });
    }

    if (typeof Auth !== 'undefined' && Auth.can('edit_machine')) {
      actionItems.push({
        id: 'act-add-machine',
        icon: 'wrench',
        title: 'Thêm máy công cụ mới',
        hint: 'Hành động',
        keywords: 'them may machine new add',
        action: async () => {
          if (Router.getPath() !== '/machines') Router.navigate('/machines');
          setTimeout(() => {
            if (typeof MachinesPage !== 'undefined' && MachinesPage.showAddModal) {
              MachinesPage.showAddModal();
            }
          }, 200);
        }
      });
    }

    if (typeof Auth !== 'undefined' && Auth.can('edit_parts')) {
      actionItems.push({
        id: 'act-add-part',
        icon: 'package-plus',
        title: 'Thêm phụ tùng mới',
        hint: 'Kho phụ tùng',
        keywords: 'them phu tung moi spare part new add',
        action: async () => {
          if (Router.getPath() !== '/spare-parts') Router.navigate('/spare-parts');
          setTimeout(() => {
            if (typeof SparePartsPage !== 'undefined' && SparePartsPage.showAddModal) {
              SparePartsPage.showAddModal();
            }
          }, 200);
        }
      });
    }

    // Profile action
    actionItems.push({
      id: 'act-profile',
      icon: 'user',
      title: 'Xem thông tin cá nhân',
      hint: 'Tài khoản',
      keywords: 'thong tin ca nhan profile user account',
      action: () => Header.showProfile()
    });

    // Logout action
    actionItems.push({
      id: 'act-logout',
      icon: 'log-out',
      title: 'Đăng xuất tài khoản',
      hint: 'Hệ thống',
      keywords: 'dang xuat logout exit signout',
      action: () => Auth.logout()
    });

    const filteredActions = actionItems.filter(item => {
      if (!q) return true;
      return this.matches(q, item.title, item.keywords);
    });

    if (filteredActions.length > 0) {
      groups.push({ title: 'Hành động nhanh', items: filteredActions });
    }

    // 3. Records: prefer what the pages already loaded, fall back to the background cache
    if (q.length >= 2) {
      const pick = (pageList, cached) => (pageList && pageList.length ? pageList : cached) || [];
      const machines = pick(typeof MachinesPage !== 'undefined' && MachinesPage.machines, this.dataCache.machines);
      const repairs = pick(typeof RepairsPage !== 'undefined' && RepairsPage.repairs, this.dataCache.repairs);
      const parts = pick(typeof SparePartsPage !== 'undefined' && SparePartsPage.parts, this.dataCache.parts);

      const matchedMachines = machines.filter(m =>
        this.matches(q, m.machine_code, m.machine_type, m.machine_name, m.department, m.location)
      ).slice(0, 5).map(m => ({
        icon: 'wrench',
        title: `${m.machine_code} - ${m.machine_type || m.machine_name || ''}`,
        hint: [m.department, m.status].filter(Boolean).join(' · ') || 'Máy công cụ',
        action: () => this.openWhenReady('/machines',
          () => MachinesPage.machines.some(x => x.id === m.id),
          () => MachinesPage.showDetail(m.id))
      }));

      if (matchedMachines.length > 0) {
        groups.push({ title: `Máy công cụ (${matchedMachines.length})`, items: matchedMachines });
      }

      const matchedRepairs = repairs.filter(r =>
        this.matches(q, r.id, r.machine_code, r.machine_name, r.fault_description, r.reported_by)
      ).slice(0, 5).map(r => ({
        icon: 'clipboard-list',
        title: `${r.id} - ${r.machine_code || r.machine_name || 'Máy'}`,
        hint: [r.status, r.fault_description].filter(Boolean).join(' · '),
        action: () => this.openWhenReady('/repairs',
          () => RepairsPage.repairs.some(x => x.id === r.id),
          () => RepairsPage.showDetail(r.id))
      }));

      if (matchedRepairs.length > 0) {
        groups.push({ title: `Phiếu sửa chữa (${matchedRepairs.length})`, items: matchedRepairs });
      }

      const matchedParts = parts.filter(p =>
        this.matches(q, p.part_code, p.part_name, p.category, p.supplier)
      ).slice(0, 5).map(p => ({
        icon: 'package',
        title: `${p.part_code} - ${p.part_name}`,
        hint: `Tồn: ${p.quantity ?? 0} ${p.unit || ''}`.trim(),
        // Parts have no detail dialog: open the list filtered to this part
        action: () => {
          SparePartsPage.activeTab = 'list';
          if (Router.getPath() === '/spare-parts') SparePartsPage.switchTab('list');
          this.openWhenReady('/spare-parts',
            () => !!document.getElementById('parts-search') && SparePartsPage.parts.some(x => x.id === p.id),
            () => {
              const input = document.getElementById('parts-search');
              input.value = p.part_code;
              SparePartsPage.onSearch(p.part_code);
              input.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
        }
      }));

      if (matchedParts.length > 0) {
        groups.push({ title: `Kho phụ tùng (${matchedParts.length})`, items: matchedParts });
      }
    }

    // Flatten for keyboard navigation
    this.flatItems = [];
    let itemCounter = 0;

    let html = '';
    if (groups.length === 0) {
      html = `<div class="command-empty">Không tìm thấy kết quả nào cho "${Utils.escapeHtml(rawQuery)}"</div>`;
    } else {
      groups.forEach(g => {
        html += `<div class="command-group-title">${g.title}</div>`;
        g.items.forEach(item => {
          const currentIdx = itemCounter++;
          this.flatItems.push(item);
          const isActive = currentIdx === this.selectedIndex;
          html += `
            <div class="command-item ${isActive ? 'active' : ''}"
                 data-index="${currentIdx}"
                 onclick="CommandPalette.executeItem(CommandPalette.flatItems[${currentIdx}])"
                 onmouseenter="CommandPalette.setHoverIndex(${currentIdx})">
              <i data-lucide="${item.icon}"></i>
              <span class="command-item-label">${Utils.escapeHtml(item.title)}</span>
              ${item.hint ? `<span class="command-item-hint">${Utils.escapeHtml(item.hint)}</span>` : ''}
            </div>
          `;
        });
      });
    }

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [container] });
  },

  setHoverIndex(idx) {
    this.selectedIndex = idx;
    const container = document.getElementById('command-results');
    if (!container) return;
    const items = container.querySelectorAll('.command-item');
    items.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
  }
};
