// ============================================
// ReportService.gs - Reports & statistics
// ============================================

const ReportService = {
  getDashboardStats() {
    const machines = getSheetData(SHEETS.MACHINES);
    const repairs = getSheetData(SHEETS.REPAIRS);
    const parts = getSheetData(SHEETS.PARTS);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const totalMachines = machines.length;
    const broken = machines.filter(m => m.status === 'Báo hỏng').length;
    const repairing = machines.filter(m => m.status === 'Sửa ngoài').length;

    const completedThisMonth = repairs.filter(r => {
      if (r.status !== 'Đã sửa' || !r.completed_at) return false;
      const d = new Date(r.completed_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    // Recent repairs (last 5)
    const sortedRepairs = [...repairs].sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    const recentRepairs = sortedRepairs.slice(0, 5);

    // Low stock parts
    const lowStockParts = parts.filter(p => Number(p.quantity) <= Number(p.min_quantity));

    // Monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();

      const count = repairs.filter(r => {
        const rd = new Date(r.reported_at);
        return rd.getMonth() === month && rd.getFullYear() === year;
      }).length;

      const cost = repairs.filter(r => {
        if (r.status !== 'Đã sửa' || !r.completed_at) return false;
        const rd = new Date(r.completed_at);
        return rd.getMonth() === month && rd.getFullYear() === year;
      }).reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0);

      monthlyData.push({ label: 'T' + (month + 1) + '/' + year, count, cost });
    }

    // Status distribution
    const statusDist = {
      'Hoạt động': machines.filter(m => m.status === 'Hoạt động').length,
      'Báo hỏng': broken,
      'Sửa ngoài': repairing,
      'Đã sửa': machines.filter(m => m.status === 'Đã sửa').length,
      'Ngừng sử dụng': machines.filter(m => m.status === 'Ngừng sử dụng').length
    };

    return {
      success: true,
      data: { totalMachines, broken, repairing, completedThisMonth, recentRepairs, lowStockParts, monthlyData, statusDist }
    };
  },

  getRepairReport(filters) {
    let data = getSheetData(SHEETS.REPAIRS);

    if (filters.from) data = data.filter(r => new Date(r.reported_at) >= new Date(filters.from));
    if (filters.to) data = data.filter(r => new Date(r.reported_at) <= new Date(filters.to));

    return { success: true, data: data };
  },

  getCostReport(filters) {
    const repairs = getSheetData(SHEETS.REPAIRS);
    const now = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();

      const cost = repairs.filter(r => {
        if (r.status !== 'Đã sửa' || !r.completed_at) return false;
        const rd = new Date(r.completed_at);
        return rd.getMonth() === month && rd.getFullYear() === year;
      }).reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0);

      monthlyData.push({ label: 'T' + (month + 1), cost });
    }

    return { success: true, data: { monthlyData } };
  },

  getFrequencyReport(filters) {
    const repairs = getSheetData(SHEETS.REPAIRS);
    const machines = getSheetData(SHEETS.MACHINES);

    // Top machines by repair frequency
    const freq = {};
    repairs.forEach(r => {
      const key = r.machine_name || 'Unknown';
      freq[key] = (freq[key] || 0) + 1;
    });

    const topMachines = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Frequency by machine type
    const typeFreq = {};
    repairs.forEach(r => {
      const machine = machines.find(m => m.id === r.machine_id);
      const type = machine ? machine.machine_type : 'Khác';
      typeFreq[type] = (typeFreq[type] || 0) + 1;
    });

    const byType = Object.entries(typeFreq).map(([type, count]) => ({ type, count }));

    return { success: true, data: { topMachines, byType } };
  }
};
