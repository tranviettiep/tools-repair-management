import { test, expect, Page } from '@playwright/test';

const SUPABASE_REST = 'https://kkodcjkljpigmjpvguzm.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb2RjamtsanBpZ21qcHZndXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjU3MzIsImV4cCI6MjEwNjY0MTczMn0.gluB0tclkdBlDcPKNd-JKLIpTHVjUWLK1cHrvFZv_yw';
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function sbDelete(table: string, column: string, value: string | null) {
  if (!value) return;
  await fetch(`${SUPABASE_REST}/${table}?${column}=eq.${encodeURIComponent(value)}`, { method: 'DELETE', headers: SB_HEADERS });
}

async function sbGet(table: string, query: string) {
  const res = await fetch(`${SUPABASE_REST}/${table}?${query}`, { headers: SB_HEADERS });
  return res.json();
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-btn').click();
  await expect(page.locator('.app-container')).toBeVisible();
}

test.describe('Cải tiến hệ thống (đợt rà soát 2)', () => {

  test('IMP-01: Màn hình đăng nhập không còn dòng Demo & font/template PDF chỉ tải khi xuất file', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('.login-card')).not.toContainText('Demo');

    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    const loadedAtStartup = await page.evaluate(() => typeof (window as any).FONT_TIMES_REGULAR_B64 !== 'undefined' || document.querySelector('script[src*="template-data"]') !== null);
    expect(loadedAtStartup).toBe(false);

    const loadedOnDemand = await page.evaluate(async () => {
      // @ts-ignore
      await Utils.loadTemplateData();
      // @ts-ignore
      return typeof FONT_TIMES_REGULAR_B64 === 'string' && typeof PROPOSAL_TEMPLATE_B64 === 'string' && typeof LOGO_VICO_B64 === 'string';
    });
    expect(loadedOnDemand).toBe(true);
  });

  test('IMP-02: Sửa/Xóa phiếu báo hỏng, xóa phiếu sửa ngoài trả phiếu về Báo hỏng, PDF có Bộ phận, sửa xong máy về Hoạt động', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await loginAs(page, 'admin', 'admin');

    const suffix = Date.now().toString().slice(-6);
    const machineCode = `TM-IMP-${suffix}`;
    let machineId: string | null = null;
    const repairIds: string[] = [];
    let extId: string | null = null;

    try {
      const setup = await page.evaluate(async (code) => {
        // @ts-ignore
        const m = await API.createMachine({ machine_code: code, machine_type: 'Máy test IMP', machine_name: 'Bosch', department: 'PX Test IMP', status: 'Hoạt động' });
        const base = { machine_id: m.data.id, machine_code: code, machine_name: 'Máy test IMP', department: 'PX Test IMP', priority: 'Bình thường', reported_by: 'Test' };
        // @ts-ignore
        const r1 = await API.createRepair({ ...base, fault_description: 'IMP phiếu báo nhầm' });
        // @ts-ignore
        const r2 = await API.createRepair({ ...base, fault_description: 'IMP phiếu sửa ngoài' });
        return { machineId: m.data.id, r1: r1.data.id, r2: r2.data.id };
      }, machineCode);
      machineId = setup.machineId;
      repairIds.push(setup.r1, setup.r2);

      // 1) Sửa phiếu báo hỏng qua menu ⋮ -> Sửa phiếu
      await page.goto('/#/repairs');
      await expect(page.locator('#repairs-content .spinner')).toBeHidden();
      const row1 = page.locator(`.data-table tbody tr[data-id="${setup.r1}"]`);
      await row1.locator('.action-menu-trigger').click();
      await row1.locator('.action-menu-item', { hasText: 'Sửa phiếu' }).click();
      const editModal = page.locator('.modal-overlay.show');
      await editModal.locator('#f-edit-desc').fill('IMP mô tả đã sửa');
      await editModal.locator('#btn-save-repair-edit').click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Đã cập nhật phiếu báo hỏng' })).toBeVisible();
      await expect(row1).toContainText('IMP mô tả đã sửa');

      // 2) Xóa phiếu báo nhầm qua menu ⋮ -> Xóa phiếu
      await row1.locator('.action-menu-trigger').click();
      await row1.locator('.action-menu-item', { hasText: 'Xóa phiếu' }).click();
      await page.locator('.modal-overlay.show [data-action="confirm"]').click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Đã xóa phiếu báo hỏng' })).toBeVisible();
      await expect(row1).toHaveCount(0);
      expect(await sbGet('repairs', `id=eq.${setup.r1}&select=id`)).toEqual([]);

      // 3) Lập phiếu sửa ngoài cho r2 rồi xuất PDF -> cột Bộ phận phải có 'PX Test IMP', mã phiếu nằm 1 dòng
      const ext = await page.evaluate(async (r) => {
        // @ts-ignore
        const res = await API.saveExternalRepair({ status: 'Đang sửa', items: [{ repair_id: r, name: 'Máy test IMP', condition: 'Cháy', uom: 'cái', qty: 1, note: '' }] });
        // @ts-ignore
        await API.markRepairsExternal([r], res.data.id);
        return res.data.id;
      }, setup.r2);
      extId = ext;

      await page.goto('/#/external-repairs');
      await expect(page.locator('#external-repairs-tbody')).toContainText(extId!, { timeout: 10000 });
      await page.evaluate(() => {
        (window as any).__cells = [];
        const OrigJsPDF = (window as any).jspdf.jsPDF;
        const Patched: any = function (...args: any[]) {
          const inst = new OrigJsPDF(...args);
          const origAuto = inst.autoTable.bind(inst);
          inst.autoTable = function (opts: any) {
            if (opts && opts.body) (window as any).__cells.push(...opts.body.flat().map((c: any) => String(c)));
            return origAuto(opts);
          };
          return inst;
        };
        Object.assign(Patched, OrigJsPDF);
        Patched.prototype = OrigJsPDF.prototype;
        (window as any).jspdf = { ...(window as any).jspdf, jsPDF: Patched };
      });
      const dl = page.waitForEvent('download', { timeout: 15000 });
      await page.locator('#external-repairs-tbody tr', { hasText: extId! }).getByRole('button', { name: /Xuất PDF/ }).click();
      await dl;
      const cells = await page.evaluate(() => (window as any).__cells as string[]);
      expect(cells).toContain('PX Test IMP');

      expect((await sbGet('machines', `id=eq.${machineId}&select=status`))[0].status).toBe('Sửa ngoài');

      // 4) Xóa phiếu sửa ngoài -> r2 và máy quay về 'Báo hỏng'
      await page.locator('#external-repairs-tbody tr', { hasText: extId! }).getByRole('button', { name: /Xóa/ }).click();
      await page.locator('.modal-overlay.show [data-action="confirm"]').click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Đã xóa phiếu' })).toBeVisible();
      await expect.poll(async () => (await sbGet('repairs', `id=eq.${setup.r2}&select=status`))[0]?.status).toBe('Báo hỏng');
      expect((await sbGet('machines', `id=eq.${machineId}&select=status`))[0].status).toBe('Báo hỏng');
      extId = null;

      // 5) Hoàn tất sửa chữa r2 -> máy về 'Hoạt động'
      const done = await page.evaluate(async (r) => {
        // @ts-ignore
        return API.completeRepair(r, { fault_codes: [{ id: 'x', code: 'F-T', name: 'Test' }], parts_used: [], completed_by: 'Test' });
      }, setup.r2);
      expect(done.success).toBe(true);
      expect((await sbGet('machines', `id=eq.${machineId}&select=status`))[0].status).toBe('Hoạt động');

      expect(pageErrors).toEqual([]);
    } finally {
      await sbDelete('external_repairs', 'id', extId);
      for (const id of repairIds) await sbDelete('repairs', 'id', id);
      await sbDelete('machines', 'id', machineId);
    }
  });

  test('IMP-03: Tài khoản thường tự đổi mật khẩu, tự lưu chữ ký biểu mẫu & bị đăng xuất khi admin khóa tài khoản', async ({ browser }) => {
    test.setTimeout(90000);
    const suffix = Date.now().toString().slice(-6);
    const username = `tmp_imp_${suffix}`;
    let userId: string | null = null;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const userCtx = await browser.newContext();
    const page = await userCtx.newPage();

    try {
      await loginAs(adminPage, 'admin', 'admin');
      userId = await adminPage.evaluate(async (u) => {
        // @ts-ignore
        const res = await API.createUser({ username: u, full_name: 'Tạm Thời IMP', role: 'technician', department: '', password: 'old1234' });
        return res.data?.id || null;
      }, username);
      expect(userId).toBeTruthy();

      // Đăng nhập tài khoản KTV -> Thông tin cá nhân -> Đổi mật khẩu
      await loginAs(page, username, 'old1234');
      await page.locator('.header-user').click();
      await page.locator('.user-dropdown-item', { hasText: 'Thông tin cá nhân' }).click();
      await page.locator('#btn-open-change-password').click();
      await page.locator('#f-pw-old').fill('old1234');
      await page.locator('#f-pw-new').fill('new5678');
      await page.locator('#f-pw-confirm').fill('new5678');
      await page.locator('#btn-save-password').click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Đã đổi mật khẩu thành công' })).toBeVisible();

      // Tự lưu chữ ký biểu mẫu (KTV không vào được trang Cài đặt)
      await page.locator('.header-user').click();
      await page.locator('.user-dropdown-item', { hasText: 'Thông tin cá nhân' }).click();
      await page.locator('#btn-open-form-settings').click();
      await page.locator('#pfs-creator').fill('KTV Ký Tên IMP');
      await page.locator('#btn-save-pfs').click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Đã lưu thông tin biểu mẫu' })).toBeVisible();
      const cfg = await sbGet('config', `key=eq.form_settings_${username}&select=value`);
      expect(JSON.parse(cfg[0].value).creator).toBe('KTV Ký Tên IMP');

      // Mật khẩu cũ không đăng nhập được, mật khẩu mới thì được
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.goto('/');
      await page.locator('#login-username').fill(username);
      await page.locator('#login-password').fill('old1234');
      await page.locator('#login-btn').click();
      await expect(page.locator('#login-error')).toBeVisible();
      await page.locator('#login-password').fill('new5678');
      await page.locator('#login-btn').click();
      await expect(page.locator('.app-container')).toBeVisible();

      // Admin khóa tài khoản -> tải lại trang thì bị đưa về màn hình đăng nhập
      await fetch(`${SUPABASE_REST}/users?id=eq.${encodeURIComponent(userId!)}`, {
        method: 'PATCH', headers: SB_HEADERS, body: JSON.stringify({ is_active: false })
      });
      await page.reload();
      await expect(page.locator('#login-btn')).toBeVisible();
    } finally {
      await sbDelete('config', 'key', `form_settings_${username}`);
      await sbDelete('users', 'id', userId);
      await adminCtx.close().catch(() => {});
      await userCtx.close().catch(() => {});
    }
  });

  test('IMP-05: Tạo phiếu sửa ngoài chỉ với dòng nhập tay (không chọn phiếu báo hỏng) vẫn lưu & xuất PDF được', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await loginAs(page, 'admin', 'admin');
    const tag = `IMP5-${Date.now().toString().slice(-6)}`;
    let extId: string | null = null;

    try {
      await page.goto('/#/external-repairs');
      await page.getByRole('button', { name: /Tạo phiếu mới/ }).click();
      const modal = page.locator('.modal-overlay.show');
      await expect(modal).toBeVisible();
      await modal.getByRole('button', { name: /Thêm dòng/ }).click();
      await modal.locator('.ei-name').first().fill(`Động cơ nhập tay ${tag}`);
      await modal.locator('.ei-vendor').first().fill('Tâm Toản');
      await modal.locator('.ei-condition').first().fill('Cháy');

      const dl = page.waitForEvent('download', { timeout: 15000 });
      await modal.getByRole('button', { name: /Xác nhận và xuất PDF/ }).click();
      const file = await dl;
      extId = file.suggestedFilename().replace('Phieu_Sua_Chua_Ngoai_', '').replace('.pdf', '');
      expect(extId).toMatch(/^SCCC-/);
      await expect(page.locator('.toast.toast-error')).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    } finally {
      await sbDelete('external_repairs', 'id', extId);
    }
  });

  test('IMP-04: Báo hỏng 2 thiết bị gõ tay (không có trong danh sách máy) phải gửi thành công', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await loginAs(page, 'admin', 'admin');
    const tag = `IMP4-${Date.now().toString().slice(-6)}`;

    try {
      await page.goto('/#/repairs');
      await expect(page.locator('#repairs-content .spinner')).toBeHidden();
      await page.locator('.page-header-actions button:has-text("Báo hỏng")').click();
      const modal = page.locator('.modal-overlay.show');
      await modal.locator('.r-machine').first().fill(`Cuộn dây máy mài to ${tag}`);
      await modal.locator('.r-desc').first().fill('cháy cuộn dây');
      await modal.getByRole('button', { name: /Thêm dòng/ }).click();
      await modal.locator('.r-machine').nth(1).fill(`Cuộn dây máy mài bé ${tag}`);
      await modal.locator('.r-desc').nth(1).fill('cháy cuộn dây');
      await modal.getByRole('button', { name: /Gửi báo hỏng/ }).click();

      await expect(page.locator('.toast.toast-success', { hasText: 'Đã báo hỏng thành công 2 thiết bị' })).toBeVisible();
      await expect(page.locator('#repairs-content tbody tr', { hasText: tag })).toHaveCount(2);
      const rows = await sbGet('repairs', `machine_name=like.*${tag}*&select=id,machine_id,department`);
      expect(rows.length).toBe(2);
      rows.forEach((r: any) => { expect(r.machine_id).toBeNull(); expect(r.department).toBe('Khác'); });
      expect(pageErrors).toEqual([]);
    } finally {
      await fetch(`${SUPABASE_REST}/repairs?machine_name=like.*${tag}*`, { method: 'DELETE', headers: SB_HEADERS });
    }
  });
});

