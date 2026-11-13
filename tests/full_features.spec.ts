import { test, expect } from '@playwright/test';

const SUPABASE_REST = 'https://kkodcjkljpigmjpvguzm.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb2RjamtsanBpZ21qcHZndXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjU3MzIsImV4cCI6MjEwNjY0MTczMn0.gluB0tclkdBlDcPKNd-JKLIpTHVjUWLK1cHrvFZv_yw';
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function sbDelete(table: string, id: string | null) {
  if (!id) return;
  await fetch(`${SUPABASE_REST}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: SB_HEADERS,
  });
}

test.describe('Kiểm thử toàn diện tính năng hệ thống (End-to-End)', () => {

  test('E2E-01: Tổng quan (Dashboard), Chế độ Sáng/Tối, Thông tin cá nhân & Hướng dẫn sử dụng', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // 1. Dashboard KPIs & Charts
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#monthly-chart')).toBeVisible();
    await expect(page.locator('#status-chart')).toBeVisible();

    // 2. Chuyển đổi giao diện Sáng / Tối
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle-btn').click();
    const toggledTheme = await page.locator('html').getAttribute('data-theme');
    expect(toggledTheme).not.toBe(initialTheme);
    await page.locator('#theme-toggle-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', initialTheme!);

    // 3. Mở thông tin cá nhân
    await page.locator('.header-user').click();
    await page.locator('.user-dropdown-item', { hasText: 'Thông tin cá nhân' }).click();
    await expect(page.locator('.modal-overlay.show')).toContainText('admin');
    await page.locator('.modal-overlay.show [data-modal-close]').first().click();

    // 4. Trang Hướng dẫn sử dụng
    await page.goto('/#/guide');
    await expect(page.locator('#guide-content h1')).toContainText('HƯỚNG DẪN SỬ DỤNG');

    expect(pageErrors).toEqual([]);
  });

  test('E2E-02: Chu trình khép kín Máy -> Báo hỏng -> Sửa ngoài (Lưu & Xuất PDF ngay) -> Đã về -> Đã sửa', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    const uniqueSuffix = Date.now().toString().slice(-6);
    const testMachineCode = `TM-${uniqueSuffix}`;
    const testFaultDesc = `Lỗi kiểm thử tự động E2E ${uniqueSuffix}`;
    let createdMachineId: string | null = null;
    let createdRepairId: string | null = null;
    let createdExtId: string | null = null;

    try {
      // 1. Thêm máy mới qua UI
      await page.goto('/#/machines');
      await expect(page.locator('#machines-table-body .spinner')).toBeHidden();
      await page.getByRole('button', { name: 'Thêm máy mới' }).click();
      const addModal = page.locator('.modal-overlay.show');
      await expect(addModal).toBeVisible();

      await addModal.locator('.f-machine-code').fill(testMachineCode);
      await addModal.locator('.f-machine-type').selectOption({ index: 1 });
      await addModal.locator('.f-department').selectOption({ index: 1 });
      await addModal.locator('.f-location').fill('Model-X1');
      await addModal.getByRole('button', { name: 'Thêm mới' }).click();

      await expect(page.locator('.toast.toast-success')).toBeVisible();
      await expect(page.locator('.data-table tbody')).toContainText(testMachineCode);

      createdMachineId = await page.evaluate((code) => {
        // @ts-ignore
        return MachinesPage.machines.find((m: any) => m.machine_code === code)?.id || null;
      }, testMachineCode);
      expect(createdMachineId).toBeTruthy();

      // 2. Báo hỏng máy vừa tạo
      await page.goto('/#/repairs');
      await expect(page.locator('#repairs-content .spinner')).toBeHidden();
      await page.locator('.page-header-actions button:has-text("Báo hỏng")').click();
      const repModal = page.locator('.modal-overlay.show');
      await repModal.locator('.r-machine').first().fill(testMachineCode);
      await repModal.locator('.r-desc').first().fill(testFaultDesc);
      await repModal.getByRole('button', { name: /Gửi báo hỏng/ }).click();

      await expect(page.locator('.toast.toast-success', { hasText: 'Đã báo hỏng thành công' })).toBeVisible();
      const createdRow = page.locator('#repairs-content tbody tr', { hasText: testFaultDesc }).first();
      await expect(createdRow).toBeVisible({ timeout: 10000 });
      createdRepairId = await createdRow.getAttribute('data-id');
      expect(createdRepairId).toBeTruthy();

      // 3. Tạo phiếu Sửa chữa ngoài bằng nút "Xác nhận và xuất PDF" (phải tải được PDF ngay cho phiếu mới!)
      await page.goto('/#/external-repairs');
      await page.getByRole('button', { name: /Tạo phiếu mới/ }).click();
      const extModal = page.locator('.modal-overlay.show');
      await expect(extModal).toBeVisible();

      const cb = extModal.locator(`input[type="checkbox"][value="${createdRepairId}"]`);
      await expect(cb).toBeVisible();
      await cb.check();

      const pdfDownloadPromise = page.waitForEvent('download');
      await extModal.getByRole('button', { name: /Xác nhận và xuất PDF/ }).click();
      const pdfDownload = await pdfDownloadPromise;
      expect(pdfDownload.suggestedFilename()).toMatch(/Phieu_Sua_Chua_Ngoai_SCCC-.*\.pdf$/);

      createdExtId = pdfDownload.suggestedFilename().replace('Phieu_Sua_Chua_Ngoai_', '').replace('.pdf', '');

      // 4. Chuyển phiếu sửa chữa sang "Đã về" -> Phiếu Sửa chữa ngoài tự động chuyển sang "Hoàn thành"
      await page.goto('/#/repairs');
      await expect(page.locator('#repairs-content .spinner')).toBeHidden();
      const repairRow = page.locator(`.data-table tbody tr[data-id="${createdRepairId}"]`);
      await repairRow.locator('.action-menu-trigger').click();
      await repairRow.locator('.action-menu-item', { hasText: 'Đã về' }).click();
      await page.locator('.modal-overlay.show [data-action="confirm"]').click();
      await expect(repairRow.locator('.badge')).toHaveText('Đã về');

      await page.goto('/#/external-repairs');
      const extRow = page.locator('#external-repairs-tbody tr', { hasText: createdExtId! });
      await expect(extRow.locator('.badge')).toHaveText('Hoàn thành');

      // 5. Hoàn tất sửa chữa ("Đã sửa") có chọn mã lỗi
      await page.goto('/#/repairs');
      await expect(page.locator('#repairs-content .spinner')).toBeHidden();
      const returnedRow = page.locator(`.data-table tbody tr[data-id="${createdRepairId}"]`);
      await returnedRow.locator('.action-menu-trigger').click();
      await returnedRow.locator('.action-menu-item', { hasText: 'Đã sửa' }).click();

      const completeModal = page.locator('.modal-overlay.show');
      await expect(completeModal).toBeVisible();
      await completeModal.locator('.fc-cb').first().check();
      await completeModal.locator('#f-repair-notes').fill('Đã thay chổi than kiểm thử');
      await completeModal.locator('#btn-complete-repair').click();

      await expect(returnedRow.locator('.badge')).toHaveText('Đã sửa');
      expect(pageErrors).toEqual([]);
    } finally {
      // Dọn dẹp toàn bộ dữ liệu test trực tiếp qua Supabase REST (đảm bảo sạch ngay cả khi timeout)
      await sbDelete('external_repairs', createdExtId);
      await sbDelete('repairs', createdRepairId);
      await sbDelete('machines', createdMachineId);
    }
  });

  test('E2E-03: Kho phụ tùng (Thêm/Nhập/Xuất/Xóa), Chống trùng mã phiếu khi xóa giữa chừng, Báo cáo & Người dùng', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    const partCode = `PT-E2E-${Date.now().toString().slice(-5)}`;
    let createdPartId: string | null = null;
    const createdPropIds: string[] = [];

    try {
      // 1. Tạo phụ tùng mới, nhập kho +5, xuất kho -2
      await page.goto('/#/spare-parts');
      await expect(page.locator('#parts-content .spinner')).toBeHidden();
      await page.getByRole('button', { name: /Thêm phụ tùng/ }).click();

      const partModal = page.locator('.modal-overlay.show');
      await partModal.locator('#f-part-code').fill(partCode);
      await partModal.locator('#f-part-name').fill('Vật tư kiểm thử E2E');
      await partModal.locator('#f-part-qty').fill('10');
      await partModal.locator('#f-part-min').fill('2');
      await partModal.locator('#f-part-price').fill('15000');
      await partModal.getByRole('button', { name: 'Thêm mới' }).click();

      await expect(page.locator('#parts-table-body')).toContainText(partCode);
      createdPartId = await page.evaluate((code) => {
        // @ts-ignore
        return SparePartsPage.parts.find((p: any) => p.part_code === code)?.id || null;
      }, partCode);
      expect(createdPartId).toBeTruthy();

      // Chuyển sang tab Nhập/Xuất kho
      await page.locator('.tab', { hasText: 'Nhập/Xuất kho' }).click();
      await page.locator('#f-import-part').selectOption(createdPartId!);
      await page.locator('#f-import-qty').fill('5');
      await page.locator('#f-import-notes').fill('Nhập test E2E');
      await page.locator('.chart-card', { hasText: 'Nhập kho' }).getByRole('button', { name: 'Nhập kho' }).click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Nhập kho thành công' })).toBeVisible();

      await page.locator('#f-export-part').selectOption(createdPartId!);
      await page.locator('#f-export-qty').fill('2');
      await page.locator('#f-export-notes').fill('Xuất test E2E');
      await page.locator('.chart-card', { hasText: 'Xuất kho' }).getByRole('button', { name: 'Xuất kho' }).click();
      await expect(page.locator('.toast.toast-success', { hasText: 'Xuất kho thành công' })).toBeVisible();

      // Kiểm tra tồn kho = 10 + 5 - 2 = 13
      await page.locator('.tab', { hasText: 'Danh sách' }).click();
      const pRow = page.locator('#parts-table-body tr', { hasText: partCode });
      await expect(pRow).toContainText('13');

      // 2. Kiểm tra chống trùng mã PDX khi xóa phiếu đứng trước rồi tạo mới
      const propTest = await page.evaluate(async () => {
        // @ts-ignore
        const r1 = await API.saveProposal({ status: 'Nháp', items: [{ code: 'A', name: 'A', unit: 'cái', qty: 1 }] });
        // @ts-ignore
        const r2 = await API.saveProposal({ status: 'Nháp', items: [{ code: 'B', name: 'B', unit: 'cái', qty: 1 }] });
        // Xóa r1 để tạo khoảng trống sequence, sau đó tạo r3 không được đụng mã của r2!
        // @ts-ignore
        if (r1.data?.id) await API.deleteProposal(r1.data.id);
        // @ts-ignore
        const r3 = await API.saveProposal({ status: 'Nháp', items: [{ code: 'C', name: 'C', unit: 'cái', qty: 1 }] });
        return { r2Id: r2.data?.id, r3Success: r3.success, r3Id: r3.data?.id, r3Error: r3.error };
      });
      if (propTest.r2Id) createdPropIds.push(propTest.r2Id);
      if (propTest.r3Id) createdPropIds.push(propTest.r3Id);
      expect(propTest.r3Success).toBe(true);
      expect(propTest.r3Id).not.toBe(propTest.r2Id);

      // 3. Kiểm tra trang Báo cáo xuất Excel & PDF thành công không lỗi
      await page.goto('/#/reports');
      await expect(page.locator('#cost-chart')).toBeVisible();
      const excelDownloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Xuất Excel/ }).click();
      const excelDownload = await excelDownloadPromise;
      expect(excelDownload.suggestedFilename()).toContain('bao-cao-sua-chua-');

      const pdfDownloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Xuất PDF/ }).click();
      const pdfDownload = await pdfDownloadPromise;
      expect(pdfDownload.suggestedFilename()).toContain('bao-cao-');

      // 4. Kiểm tra trang Người dùng load danh mục Bộ phận động từ Config
      await page.goto('/#/users');
      await expect(page.locator('#users-table-body .data-table')).toContainText('admin');
      await page.getByRole('button', { name: /Thêm người dùng/ }).click();
      await expect(page.locator('.modal-overlay.show #f-user-dept')).toBeVisible();
      await page.locator('.modal-overlay.show [data-modal-close]').first().click();

      expect(pageErrors).toEqual([]);
    } finally {
      if (createdPartId) {
        await fetch(`${SUPABASE_REST}/transactions?part_id=eq.${encodeURIComponent(createdPartId)}`, {
          method: 'DELETE',
          headers: SB_HEADERS,
        });
        await sbDelete('parts', createdPartId);
      }
      for (const id of createdPropIds) {
        await sbDelete('proposals', id);
      }
    }
  });

});
