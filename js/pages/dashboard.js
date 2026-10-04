// ============================================
// Dashboard.js - Dashboard page
// ============================================

const DashboardPage = {
  charts: {},

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>📊 Tổng quan</h2>
        </div>

        <!-- KPI Cards -->
        <div class="stats-grid" id="stats-grid">
          <div class="stat-card total skeleton skeleton-card"></div>
          <div class="stat-card broken skeleton skeleton-card"></div>
          <div class="stat-card repairing skeleton skeleton-card"></div>
          <div class="stat-card completed skeleton skeleton-card"></div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">📊 Số lượng sửa chữa theo tháng</span>
            </div>
            <div class="chart-container">
              <canvas id="monthly-chart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">🍩 Trạng thái máy</span>
            </div>
            <div class="chart-container">
              <canvas id="status-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Recent repairs & Low stock -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">📋 Yêu cầu sửa chữa gần đây</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/repairs')">Xem tất cả →</button>
            </div>
            <div id="recent-repairs-table"></div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">⚠️ Phụ tùng sắp hết</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/spare-parts')">Xem tất cả →</button>
            </div>
            <div id="low-stock-table"></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const result = await API.getDashboardStats();
    if (!result.success) {
      Toast.error('Không thể tải dữ liệu dashboard');
      return;
    }

    const data = result.data;
    this.renderStats(data);
    this.renderMonthlyChart(data.monthlyData);
    this.renderStatusChart(data.statusDist);
    this.renderRecentRepairs(data.recentRepairs);
    this.renderLowStock(data.lowStockParts);
  },

  renderStats(data) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
      <div class="stat-card total">
        <div class="stat-card-header">
          <div class="stat-card-icon">🔧</div>
          <span class="stat-card-change neutral">Tổng cộng</span>
        </div>
        <div class="stat-card-value" id="stat-total">${data.totalMachines}</div>
        <div class="stat-card-label">Máy công cụ</div>
      </div>
      <div class="stat-card broken">
        <div class="stat-card-header">
          <div class="stat-card-icon">⚠️</div>
          <span class="stat-card-change up">Cần xử lý</span>
        </div>
        <div class="stat-card-value" id="stat-broken">${data.broken}</div>
        <div class="stat-card-label">Báo hỏng</div>
      </div>
      <div class="stat-card repairing">
        <div class="stat-card-header">
          <div class="stat-card-icon">🔨</div>
          <span class="stat-card-change neutral">Đang tiến hành</span>
        </div>
        <div class="stat-card-value" id="stat-repairing">${data.repairing}</div>
        <div class="stat-card-label">Sửa ngoài</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-card-header">
          <div class="stat-card-icon">✅</div>
          <span class="stat-card-change down">Tháng này</span>
        </div>
        <div class="stat-card-value" id="stat-completed">${data.completedThisMonth}</div>
        <div class="stat-card-label">Đã sửa</div>
      </div>
    `;

    // Animate numbers
    ['stat-total', 'stat-broken', 'stat-repairing', 'stat-completed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const val = parseInt(el.textContent);
        el.textContent = '0';
        Utils.animateCount(el, val);
      }
    });
  },

  renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthly-chart');
    if (!ctx) return;

    if (this.charts.monthly) this.charts.monthly.destroy();

    this.charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.label),
        datasets: [{
          label: 'Số lượng sửa chữa',
          data: monthlyData.map(d => d.count),
          backgroundColor: 'rgba(108, 92, 231, 0.6)',
          borderColor: '#6c5ce7',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2a4a',
            titleColor: '#e8e8f0',
            bodyColor: '#a0a0b8',
            borderColor: '#333355',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51,51,85,0.3)' },
            ticks: { color: '#a0a0b8' }
          },
          y: {
            grid: { color: 'rgba(51,51,85,0.3)' },
            ticks: { color: '#a0a0b8' },
            beginAtZero: true
          }
        }
      }
    });
  },

  renderStatusChart(statusDist) {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    if (this.charts.status) this.charts.status.destroy();

    const labels = Object.keys(statusDist);
    const values = Object.values(statusDist);
    const colors = ['#00b894', '#e17055', '#fdcb6e', '#74b9ff', '#6c6c80'];

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#1a1a2e',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#a0a0b8',
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 12,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#2a2a4a',
            titleColor: '#e8e8f0',
            bodyColor: '#a0a0b8',
            borderColor: '#333355',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
          }
        }
      }
    });
  },

  renderRecentRepairs(repairs) {
    const container = document.getElementById('recent-repairs-table');
    if (!repairs || repairs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Chưa có yêu cầu nào</div></div>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Máy</th>
            <th>Ưu tiên</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          ${repairs.map(r => `
            <tr class="cursor-pointer" onclick="Router.navigate('/repairs')">
              <td><strong style="color:var(--accent-secondary)">${Utils.escapeHtml(r.id)}</strong></td>
              <td>${Utils.escapeHtml(r.machine_name)}</td>
              <td>${Utils.getPriorityBadge(r.priority)}</td>
              <td>${Utils.getStatusBadge(r.status)}</td>
              <td class="text-muted">${Utils.formatRelativeTime(r.reported_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderLowStock(parts) {
    const container = document.getElementById('low-stock-table');
    if (!parts || parts.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">Tồn kho ổn định</div><div class="empty-state-desc">Tất cả phụ tùng trên mức tối thiểu</div></div>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Phụ tùng</th>
            <th>Tồn kho</th>
            <th>Tối thiểu</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map(p => `
            <tr>
              <td>${Utils.escapeHtml(p.part_name)}</td>
              <td><span class="quantity-warning">${p.quantity} ${p.unit}</span></td>
              <td class="text-muted">${p.min_quantity} ${p.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  destroy() {
    Object.values(this.charts).forEach(chart => chart?.destroy());
    this.charts = {};
  }
};
