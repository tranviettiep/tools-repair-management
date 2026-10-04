// ============================================
// Reports.js - Reports & statistics page
// ============================================

const ReportsPage = {
  charts: {},

  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>📈 Báo cáo & Thống kê</h2>
          <div class="page-header-actions">
            <button class="btn btn-secondary" onclick="ReportsPage.exportExcel()">📥 Xuất Excel</button>
            <button class="btn btn-secondary" onclick="ReportsPage.exportPDF()">📄 Xuất PDF</button>
          </div>
        </div>

        <!-- Cost chart -->
        <div class="report-grid">
          <div class="chart-card report-full-width">
            <div class="chart-card-header">
              <span class="chart-card-title">💰 Chi phí sửa chữa theo tháng</span>
            </div>
            <div class="chart-container" style="height:300px">
              <canvas id="cost-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Frequency charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">🔧 Top 10 máy hỏng nhiều nhất</span>
            </div>
            <div id="top-machines-chart" style="padding:8px 0"></div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <span class="chart-card-title">🍩 Tỷ lệ hỏng theo loại máy</span>
            </div>
            <div class="chart-container" style="height:300px">
              <canvas id="type-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const [costResult, freqResult] = await Promise.all([
      API.getCostReport(),
      API.getFrequencyReport()
    ]);

    if (costResult.success) this.renderCostChart(costResult.data.monthlyData);
    if (freqResult.success) {
      this.renderTopMachines(freqResult.data.topMachines);
      this.renderTypeChart(freqResult.data.byType);
    }
  },

  renderCostChart(data) {
    const ctx = document.getElementById('cost-chart');
    if (!ctx) return;
    if (this.charts.cost) this.charts.cost.destroy();

    this.charts.cost = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Chi phí (₫)',
          data: data.map(d => d.cost),
          backgroundColor: 'rgba(108, 92, 231, 0.5)',
          borderColor: '#6c5ce7',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.5,
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
            callbacks: {
              label: (ctx) => ' ' + Utils.formatCurrency(ctx.raw)
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(51,51,85,0.3)' }, ticks: { color: '#a0a0b8' } },
          y: {
            grid: { color: 'rgba(51,51,85,0.3)' },
            ticks: {
              color: '#a0a0b8',
              callback: (v) => Utils.formatNumber(v) + ' ₫'
            },
            beginAtZero: true
          }
        }
      }
    });
  },

  renderTopMachines(data) {
    const container = document.getElementById('top-machines-chart');
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Chưa có dữ liệu</div></div>';
      return;
    }

    const maxCount = Math.max(...data.map(d => d.count));

    container.innerHTML = `
      <div class="hbar-chart">
        ${data.map(d => {
          const pct = (d.count / maxCount) * 100;
          return `
            <div class="hbar-item">
              <span class="hbar-label" title="${Utils.escapeHtml(d.name)}">${Utils.escapeHtml(d.name)}</span>
              <div class="hbar-track">
                <div class="hbar-fill" style="width:${pct}%"></div>
              </div>
              <span class="hbar-value">${d.count} lần</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Animate bars
    setTimeout(() => {
      container.querySelectorAll('.hbar-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        requestAnimationFrame(() => bar.style.width = width);
      });
    }, 100);
  },

  renderTypeChart(data) {
    const ctx = document.getElementById('type-chart');
    if (!ctx) return;
    if (this.charts.type) this.charts.type.destroy();

    const colors = ['#6c5ce7', '#00cec9', '#e17055', '#fdcb6e', '#00b894', '#a855f7', '#74b9ff'];

    this.charts.type = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.type),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: colors.slice(0, data.length),
          borderColor: '#1a1a2e',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#a0a0b8',
              padding: 12,
              usePointStyle: true,
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
          }
        }
      }
    });
  },

  async exportExcel() {
    try {
      const result = await API.getRepairReport();
      if (!result.success) { Toast.error('Không thể tải dữ liệu'); return; }

      const data = result.data.map(r => ({
        'Mã YC': r.id,
        'Mã máy': r.machine_code,
        'Tên máy': r.machine_name,
        'Bộ phận': r.department,
        'Mô tả lỗi': r.fault_description,
        'Ưu tiên': r.priority,
        'Trạng thái': r.status,
        'Người báo': r.reported_by,
        'Ngày báo': Utils.formatDateTime(r.reported_at),
        'KTV': r.technician,
        'Ngày sửa xong': Utils.formatDateTime(r.completed_at),
        'Mã lỗi': (() => { try { return JSON.parse(r.fault_codes || '[]').map(c => c.code).join(', '); } catch { return ''; } })(),
        'Chi phí': r.total_cost,
        'Ghi chú': r.repair_notes
      }));

      // Use SheetJS if available
      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo sửa chữa');
        XLSX.writeFile(wb, `bao-cao-sua-chua-${new Date().toISOString().slice(0, 10)}.xlsx`);
        Toast.success('Đã xuất file Excel');
      } else {
        // Fallback to CSV
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
        const bom = '\uFEFF';
        Utils.downloadFile(bom + csv, `bao-cao-sua-chua-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
        Toast.success('Đã xuất file CSV');
      }
    } catch (err) {
      Toast.error('Lỗi khi xuất báo cáo');
      console.error(err);
    }
  },

  async exportPDF() {
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      Toast.warning('Thư viện jsPDF chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }

    Toast.info('Đang tạo PDF...');

    try {
      const result = await API.getDashboardStats();
      if (!result.success) { Toast.error('Không thể tải dữ liệu'); return; }

      const { jsPDF: JsPDF } = window.jspdf || { jsPDF: window.jsPDF };
      const doc = new JsPDF();

      doc.setFontSize(16);
      doc.text('BÁO CÁO TỔNG HỢP SỬA CHỮA MÁY CÔNG CỤ', 15, 20);
      doc.setFontSize(10);
      doc.text(`Ngày xuất: ${Utils.formatDate(new Date().toISOString())}`, 15, 28);

      doc.setFontSize(12);
      doc.text(`Tổng số máy: ${result.data.totalMachines}`, 15, 40);
      doc.text(`Báo hỏng: ${result.data.broken}`, 15, 48);
      doc.text(`Sửa ngoài: ${result.data.repairing}`, 15, 56);
      doc.text(`Đã sửa tháng này: ${result.data.completedThisMonth}`, 15, 64);

      doc.save(`bao-cao-${new Date().toISOString().slice(0, 10)}.pdf`);
      Toast.success('Đã xuất file PDF');
    } catch (err) {
      Toast.error('Lỗi khi xuất PDF');
      console.error(err);
    }
  },

  destroy() {
    Object.values(this.charts).forEach(c => c?.destroy());
    this.charts = {};
  }
};
