// ============================================
// API.js - Supabase API communication layer
// ============================================

const SUPABASE_URL = 'https://kkodcjkljpigmjpvguzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb2RjamtsanBpZ21qcHZndXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjU3MzIsImV4cCI6MjEwNjY0MTczMn0.gluB0tclkdBlDcPKNd-JKLIpTHVjUWLK1cHrvFZv_yw';

const API = {
  supabase: null,
  
  init() {
    if (!this.supabase) {
      // @ts-ignore (Supabase is loaded globally via CDN)
      this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  },

  // Helper to format Supabase errors
  _handleError(error, customMsg) {
    console.error('Supabase Error:', error);
    return { success: false, error: customMsg || error.message || 'Lỗi kết nối cơ sở dữ liệu' };
  },

  // ── Auth ──
  async login(username, password) {
    this.init();
    try {
      const passwordHash = await Utils.hashPassword(password);
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
      }
      
      const user = { ...data };
      delete user.password_hash;
      return { success: true, data: { token: 'sb-token-' + data.id, user } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async verifyToken() {
    // Basic verification - assume token is valid if it exists for now 
    // In a real app with Supabase Auth, we'd check session
    return { success: true };
  },

  async logout() {
    return { success: true };
  },

  // ── Machines ──
  async getMachines(filters = {}) {
    this.init();
    try {
      let query = this.supabase.from('machines').select('*');
      
      if (filters.machine_type) query = query.eq('machine_type', filters.machine_type);
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.status) query = query.eq('status', filters.status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      let result = data;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(m => 
          (m.machine_code || '').toLowerCase().includes(s) || 
          (m.machine_name || '').toLowerCase().includes(s)
        );
      }
      
      return { success: true, data: result, total: result.length };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async getMachine(id) {
    this.init();
    const { data, error } = await this.supabase.from('machines').select('*').eq('id', id).single();
    return error ? this._handleError(error) : { success: true, data };
  },

  async createMachine(data) {
    this.init();
    const machine = { id: Utils.generateId('m'), ...data };
    const { data: result, error } = await this.supabase.from('machines').insert(machine).select().single();
    return error ? this._handleError(error) : { success: true, data: result };
  },

  async updateMachine(id, data) {
    this.init();
    const { data: result, error } = await this.supabase.from('machines').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return error ? this._handleError(error) : { success: true, data: result };
  },

  async deleteMachine(id) {
    this.init();
    const { error } = await this.supabase.from('machines').delete().eq('id', id);
    return error ? this._handleError(error) : { success: true };
  },

  // ── Repair Requests ──
  async getRepairs(filters = {}) {
    this.init();
    try {
      let query = this.supabase.from('repairs').select('*');
      
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.machine_id) query = query.eq('machine_id', filters.machine_id);

      const { data, error } = await query.order('reported_at', { ascending: false });
      if (error) throw error;
      
      let result = data;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(r =>
          (r.id || '').toLowerCase().includes(s) ||
          (r.machine_name || '').toLowerCase().includes(s) ||
          (r.fault_description || '').toLowerCase().includes(s)
        );
      }
      return { success: true, data: result, total: result.length };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async getRepair(id) {
    this.init();
    const { data, error } = await this.supabase.from('repairs').select('*').eq('id', id).single();
    return error ? this._handleError(error) : { success: true, data };
  },

  async createRepair(data) {
    this.init();
    try {
      const { data: todayRepairs } = await this.supabase.from('repairs').select('id');
      const seq = (todayRepairs?.length || 0) + 1; // Simplified ID generation for demo
      
      const repair = {
        id: Utils.generateRepairId(seq),
        ...data,
        status: 'Báo hỏng',
      };
      
      const { data: result, error } = await this.supabase.from('repairs').insert(repair).select().single();
      if (error) throw error;
      
      if (repair.machine_id) {
        await this.supabase.from('machines').update({ status: 'Báo hỏng' }).eq('id', repair.machine_id);
      }
      
      return { success: true, data: result };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async markRepairsExternal(repairIds, ticketId = '') {
    this.init();
    try {
      if (!repairIds || repairIds.length === 0) return { success: true };
      
      await this.supabase.from('repairs').update({ status: 'Sửa ngoài' }).in('id', repairIds);
      
      // Update associated machines
      const { data: repairs } = await this.supabase.from('repairs').select('machine_id').in('id', repairIds);
      const machineIds = repairs?.map(r => r.machine_id).filter(Boolean) || [];
      
      if (machineIds.length > 0) {
        await this.supabase.from('machines').update({ status: 'Sửa ngoài' }).in('id', machineIds);
      }
      
      return { success: true };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async markRepairReturned(id) {
    this.init();
    try {
      const { data: repair } = await this.supabase.from('repairs').select('machine_id').eq('id', id).single();
      if (!repair) return { success: false, error: 'Không tìm thấy phiếu' };
      
      await this.supabase.from('repairs').update({ status: 'Đã về' }).eq('id', id);
      if (repair.machine_id) {
        await this.supabase.from('machines').update({ status: 'Đã về' }).eq('id', repair.machine_id);
      }
      
      await this._checkAndUpdateExternalRepairStatus(id);
      return { success: true };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async completeRepair(id, data = {}) {
    this.init();
    try {
      const { data: repair } = await this.supabase.from('repairs').select('*').eq('id', id).single();
      if (!repair) return { success: false, error: 'Không tìm thấy yêu cầu' };

      const faultCodes = typeof data.fault_codes === 'string' ? JSON.parse(data.fault_codes || '[]') : data.fault_codes;
      const partsUsed = typeof data.parts_used === 'string' ? JSON.parse(data.parts_used || '[]') : data.parts_used;
      
      if (!faultCodes || faultCodes.length === 0) return { success: false, error: 'Vui lòng chọn nguyên nhân hỏng (mã lỗi)' };

      // Check stock and calculate cost
      let cost = 0;
      if (partsUsed && partsUsed.length > 0) {
        const partIds = partsUsed.map(p => p.part_id);
        const { data: parts } = await this.supabase.from('parts').select('*').in('id', partIds);
        
        for (const pu of partsUsed) {
          const p = parts?.find(pt => pt.id === pu.part_id);
          if (!p) return { success: false, error: 'Không tìm thấy phụ tùng' };
          if (p.quantity < Number(pu.quantity)) return { success: false, error: 'Tồn kho không đủ: ' + p.part_name };
          cost += Number(pu.quantity) * (Number(p.unit_price) || 0);
        }

        // Deduct stock and create transactions
        for (const pu of partsUsed) {
          const p = parts?.find(pt => pt.id === pu.part_id);
          await this.supabase.from('parts').update({ quantity: p.quantity - Number(pu.quantity) }).eq('id', p.id);
          
          await this.supabase.from('transactions').insert({
            id: Utils.generateId('tx'),
            part_id: p.id,
            part_name: p.part_name,
            type: 'Xuất kho',
            quantity: Number(pu.quantity),
            repair_request_id: id,
            performed_by: data.completed_by || '',
            notes: 'Vật tư tiêu hao sửa chữa'
          });
        }
      }

      const updateData = {
        status: 'Đã sửa',
        repair_end: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        completed_by: data.completed_by || '',
        technician: data.completed_by || repair.technician,
        repair_notes: data.repair_notes || repair.repair_notes,
        fault_codes: faultCodes,
        parts_used: partsUsed,
        total_cost: cost
      };

      const { data: result } = await this.supabase.from('repairs').update(updateData).eq('id', id).select().single();
      
      if (repair.machine_id) {
        await this.supabase.from('machines').update({ status: 'Đã sửa' }).eq('id', repair.machine_id);
      }
      
      await this._checkAndUpdateExternalRepairStatus(id);

      return { success: true, data: result };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async updateRepair(id, data) {
    this.init();
    const { data: result, error } = await this.supabase.from('repairs').update(data).eq('id', id).select().single();
    return error ? this._handleError(error) : { success: true, data: result };
  },

  // Helper for External Repair Auto-completion
  async _checkAndUpdateExternalRepairStatus(repairId) {
    this.init();
    try {
      const { data: extTickets } = await this.supabase.from('external_repairs').select('*');
      if (!extTickets) return;
      
      for (const ext of extTickets) {
        // Find tickets containing this repairId
        const items = typeof ext.items === 'string' ? JSON.parse(ext.items || '[]') : (ext.items || []);
        if (!items.some(it => it.repair_id === repairId)) continue;
        
        // Fetch all repairs in this ticket
        const repairIds = items.map(it => it.repair_id).filter(Boolean);
        const { data: relatedRepairs } = await this.supabase.from('repairs').select('id, status').in('id', repairIds);
        
        const allCompleted = relatedRepairs?.every(r => r.status === 'Đã về' || r.status === 'Đã sửa');
        if (allCompleted) {
          await this.supabase.from('external_repairs').update({ status: 'Hoàn thành' }).eq('id', ext.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  // ── Spare Parts ──
  async getParts(filters = {}) {
    this.init();
    try {
      let query = this.supabase.from('parts').select('*');
      
      if (filters.category) query = query.eq('category', filters.category);
      
      const { data, error } = await query.order('part_code', { ascending: true });
      if (error) throw error;
      
      let result = data;
      if (filters.low_stock) {
        result = result.filter(p => Number(p.quantity) <= Number(p.min_quantity));
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(p => (p.part_code || '').toLowerCase().includes(s) || (p.part_name || '').toLowerCase().includes(s));
      }
      return { success: true, data: result, total: result.length };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async createPart(data) {
    this.init();
    const part = { id: Utils.generateId('pt'), ...data };
    const { data: result, error } = await this.supabase.from('parts').insert(part).select().single();
    return error ? this._handleError(error) : { success: true, data: result };
  },

  async updatePart(id, data) {
    this.init();
    const { data: result, error } = await this.supabase.from('parts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return error ? this._handleError(error) : { success: true, data: result };
  },

  async deletePart(id) {
    this.init();
    const { error } = await this.supabase.from('parts').delete().eq('id', id);
    return error ? this._handleError(error) : { success: true };
  },

  async importPart(partId, quantity, notes = '') {
    this.init();
    try {
      const { data: p } = await this.supabase.from('parts').select('*').eq('id', partId).single();
      if (!p) return { success: false, error: 'Không tìm thấy phụ tùng' };
      
      const newQty = Number(p.quantity) + Number(quantity);
      await this.supabase.from('parts').update({ quantity: newQty }).eq('id', partId);
      
      const tx = {
        id: Utils.generateId('tx'),
        part_id: p.id,
        part_name: p.part_name,
        type: 'Nhập kho',
        quantity: Number(quantity),
        performed_by: Auth.currentUser?.full_name || '',
        notes: notes
      };
      await this.supabase.from('transactions').insert(tx);
      
      return { success: true, data: { ...p, quantity: newQty } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async exportPart(partId, quantity, repairId = '', notes = '') {
    this.init();
    try {
      const { data: p } = await this.supabase.from('parts').select('*').eq('id', partId).single();
      if (!p) return { success: false, error: 'Không tìm thấy phụ tùng' };
      if (Number(p.quantity) < Number(quantity)) return { success: false, error: 'Số lượng tồn kho không đủ' };
      
      const newQty = Number(p.quantity) - Number(quantity);
      await this.supabase.from('parts').update({ quantity: newQty }).eq('id', partId);
      
      const tx = {
        id: Utils.generateId('tx'),
        part_id: p.id,
        part_name: p.part_name,
        type: 'Xuất kho',
        quantity: Number(quantity),
        repair_request_id: repairId,
        performed_by: Auth.currentUser?.full_name || '',
        notes: notes
      };
      await this.supabase.from('transactions').insert(tx);
      
      return { success: true, data: { ...p, quantity: newQty } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async getPartTransactions(filters = {}) {
    this.init();
    let query = this.supabase.from('transactions').select('*');
    if (filters.part_id) query = query.eq('part_id', filters.part_id);
    if (filters.type) query = query.eq('type', filters.type);
    
    const { data, error } = await query.order('performed_at', { ascending: false });
    return error ? this._handleError(error) : { success: true, data, total: data.length };
  },

  // ── Reports ──
  async getDashboardStats() {
    this.init();
    try {
      const [{ data: machines }, { data: repairs }, { data: parts }] = await Promise.all([
        this.supabase.from('machines').select('status'),
        this.supabase.from('repairs').select('*').order('reported_at', { ascending: false }),
        this.supabase.from('parts').select('quantity, min_quantity')
      ]);

      const totalMachines = machines?.length || 0;
      const broken = machines?.filter(m => m.status === 'Báo hỏng').length || 0;
      const repairing = machines?.filter(m => m.status === 'Sửa ngoài').length || 0;
      
      const now = new Date();
      const completedThisMonth = repairs?.filter(r => {
        if (!r.completed_at || r.status !== 'Đã sửa') return false;
        const d = new Date(r.completed_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length || 0;
      
      const recentRepairs = repairs?.slice(0, 5) || [];
      const lowStockParts = parts?.filter(p => Number(p.quantity) <= Number(p.min_quantity)) || [];

      // Monthly repair data
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const count = repairs?.filter(r => {
          if(!r.reported_at) return false;
          const rd = new Date(r.reported_at);
          return rd.getMonth() === month && rd.getFullYear() === year;
        }).length || 0;
        
        const cost = repairs?.filter(r => {
          if(!r.completed_at || r.status !== 'Đã sửa') return false;
          const rd = new Date(r.completed_at);
          return rd.getMonth() === month && rd.getFullYear() === year;
        }).reduce((sum, r) => sum + Number(r.total_cost || 0), 0) || 0;
        
        monthlyData.push({ label: `T${month + 1}/${year}`, count, cost });
      }

      const statusDist = {
        'Hoạt động': machines?.filter(m => m.status === 'Hoạt động').length || 0,
        'Báo hỏng': broken,
        'Sửa ngoài': repairing,
        'Đã sửa': machines?.filter(m => m.status === 'Đã sửa').length || 0,
        'Ngừng sử dụng': machines?.filter(m => m.status === 'Ngừng sử dụng').length || 0
      };

      return { success: true, data: { totalMachines, broken, repairing, completedThisMonth, recentRepairs, lowStockParts, monthlyData, statusDist } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async getRepairReport(filters = {}) {
    return this.getRepairs(filters);
  },

  async getCostReport(filters = {}) {
    this.init();
    try {
      const { data: repairs } = await this.supabase.from('repairs').select('total_cost, completed_at, status').eq('status', 'Đã sửa');
      
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const cost = repairs?.filter(r => {
          if(!r.completed_at) return false;
          const rd = new Date(r.completed_at);
          return rd.getMonth() === month && rd.getFullYear() === year;
        }).reduce((sum, r) => sum + Number(r.total_cost || 0), 0) || 0;
        
        monthlyData.push({ label: `T${month + 1}`, cost });
      }
      return { success: true, data: { monthlyData } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async getFrequencyReport(filters = {}) {
    this.init();
    try {
      const { data: repairs } = await this.supabase.from('repairs').select('machine_name, machine_id');
      const { data: machines } = await this.supabase.from('machines').select('id, machine_type');
      
      const freq = {};
      repairs?.forEach(r => {
        const key = r.machine_name;
        if(key) freq[key] = (freq[key] || 0) + 1;
      });
      const topMachines = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

      const typeFreq = {};
      repairs?.forEach(r => {
        const m = machines?.find(x => x.id === r.machine_id);
        const type = m ? m.machine_type : 'Khác';
        typeFreq[type] = (typeFreq[type] || 0) + 1;
      });
      const byType = Object.entries(typeFreq).map(([type, count]) => ({ type, count }));

      return { success: true, data: { topMachines, byType } };
    } catch (e) {
      return this._handleError(e);
    }
  },

  // ── Users ──
  async getUsers() {
    this.init();
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) return this._handleError(error);
    const users = data.map(u => { const { password_hash, ...rest } = u; return rest; });
    return { success: true, data: users };
  },

  async createUser(data) {
    this.init();
    try {
      const user = { id: Utils.generateId('u'), ...data, is_active: true };
      if (data.password) {
        user.password_hash = await Utils.hashPassword(data.password);
        delete user.password;
      }
      const { data: result, error } = await this.supabase.from('users').insert(user).select().single();
      if (error) throw error;
      const { password_hash, ...rest } = result;
      return { success: true, data: rest };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async updateUser(id, data) {
    this.init();
    try {
      const updateData = { ...data };
      if (updateData.password) {
        updateData.password_hash = await Utils.hashPassword(updateData.password);
        delete updateData.password;
      }
      const { data: result, error } = await this.supabase.from('users').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      const { password_hash, ...rest } = result;
      return { success: true, data: rest };
    } catch (e) {
      return this._handleError(e);
    }
  },

  async deleteUser(id) {
    this.init();
    const { error } = await this.supabase.from('users').delete().eq('id', id);
    return error ? this._handleError(error) : { success: true };
  },

  // ── Config ──
  async getConfig() {
    this.init();
    const { data, error } = await this.supabase.from('config').select('*');
    return error ? this._handleError(error) : { success: true, data };
  },

  async updateConfig(key, value) {
    this.init();
    try {
      const { data: existing } = await this.supabase.from('config').select('key').eq('key', key).single();
      if (existing) {
        await this.supabase.from('config').update({ value }).eq('key', key);
      } else {
        await this.supabase.from('config').insert({ key, value, description: '' });
      }
      return { success: true };
    } catch (e) {
      return this._handleError(e);
    }
  },
  
  // ── External Repairs ──
  async getExternalRepairs(filters = {}) {
    this.init();
    const { data, error } = await this.supabase.from('external_repairs').select('*').order('created_at', { ascending: false });
    return error ? this._handleError(error) : { success: true, data };
  },
  
  async saveExternalRepair(data) {
    this.init();
    try {
      let result;
      const item = { ...data, items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items };
      
      if (item.id) {
        item.updated_at = new Date().toISOString();
        const { data: res, error } = await this.supabase.from('external_repairs').update(item).eq('id', item.id).select().single();
        if (error) throw error;
        result = res;
      } else {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        
        // Simple sequence generation 
        const { data: existing } = await this.supabase.from('external_repairs').select('id').like('id', `SCCC-${yy}-%`);
        const seq = (existing?.length || 0) + 1;
        item.id = 'SCCC-' + yy + '-' + String(seq).padStart(4, '0');
        
        const { data: res, error } = await this.supabase.from('external_repairs').insert(item).select().single();
        if (error) throw error;
        result = res;
      }
      return { success: true, data: result };
    } catch (e) {
      return this._handleError(e);
    }
  },
  
  async deleteExternalRepair(id) {
    this.init();
    const { error } = await this.supabase.from('external_repairs').delete().eq('id', id);
    return error ? this._handleError(error) : { success: true };
  },
  
  // ── Proposals ──
  async getProposals(filters = {}) {
    this.init();
    const { data, error } = await this.supabase.from('proposals').select('*').order('created_at', { ascending: false });
    return error ? this._handleError(error) : { success: true, data };
  },
  
  async saveProposal(data) {
    this.init();
    try {
      let result;
      const item = { ...data, items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items };
      
      if (item.id) {
        item.updated_at = new Date().toISOString();
        const { data: res, error } = await this.supabase.from('proposals').update(item).eq('id', item.id).select().single();
        if (error) throw error;
        result = res;
      } else {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        
        const { data: existing } = await this.supabase.from('proposals').select('id').like('id', `PDX-${yy}-%`);
        const seq = (existing?.length || 0) + 1;
        item.id = 'PDX-' + yy + '-' + String(seq).padStart(4, '0');
        
        const { data: res, error } = await this.supabase.from('proposals').insert(item).select().single();
        if (error) throw error;
        result = res;
      }
      return { success: true, data: result };
    } catch (e) {
      return this._handleError(e);
    }
  },
  
  async deleteProposal(id) {
    this.init();
    const { error } = await this.supabase.from('proposals').delete().eq('id', id);
    return error ? this._handleError(error) : { success: true };
  },

  // ── Unified Request Dispatcher for legacy compatibility ──
  async request(action, params = {}, method = 'GET') {
    switch (action) {
      case 'login': return this.login(params.username, params.password || params.password_hash);
      case 'verify_token': return this.verifyToken();
      case 'logout': return this.logout();
      case 'get_machines': return this.getMachines(params);
      case 'get_machine': return this.getMachine(params.id);
      case 'create_machine': return this.createMachine(params);
      case 'update_machine': return this.updateMachine(params.id, params);
      case 'delete_machine': return this.deleteMachine(params.id);
      case 'get_repairs': return this.getRepairs(params);
      case 'get_repair': return this.getRepair(params.id);
      case 'create_repair': return this.createRepair(params);
      case 'mark_repairs_external': return this.markRepairsExternal(JSON.parse(params.repair_ids || '[]'));
      case 'mark_repair_returned': return this.markRepairReturned(params.id);
      case 'complete_repair': return this.completeRepair(params.id, params);
      case 'update_repair': return this.updateRepair(params.id, params);
      case 'get_parts': return this.getParts(params);
      case 'create_part': return this.createPart(params);
      case 'update_part': return this.updatePart(params.id, params);
      case 'delete_part': return this.deletePart(params.id);
      case 'import_part': return this.importPart(params.part_id, params.quantity, params.notes);
      case 'export_part': return this.exportPart(params.part_id, params.quantity, params.repair_request_id, params.notes);
      case 'get_part_transactions': return this.getPartTransactions(params);
      case 'get_dashboard_stats': return this.getDashboardStats();
      case 'get_repair_report': return this.getRepairReport(params);
      case 'get_cost_report': return this.getCostReport(params);
      case 'get_frequency_report': return this.getFrequencyReport(params);
      case 'get_users': return this.getUsers();
      case 'create_user': return this.createUser(params);
      case 'update_user': return this.updateUser(params.id, params);
      case 'delete_user': return this.deleteUser(params.id);
      case 'get_config': return this.getConfig();
      case 'update_config': return this.updateConfig(params.key, params.value);
      case 'get_external_repairs': return this.getExternalRepairs(params);
      case 'save_external_repair': return this.saveExternalRepair(params.data);
      case 'delete_external_repair': return this.deleteExternalRepair(params.id);
      case 'get_proposals': return this.getProposals(params);
      case 'save_proposal': return this.saveProposal(params.data);
      case 'delete_proposal': return this.deleteProposal(params.id);
      default: return { success: false, error: `Unknown action: ${action}` };
    }
  }
};
