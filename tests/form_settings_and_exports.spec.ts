import { test, expect } from '@playwright/test';

const SUPABASE_REST = 'https://kkodcjkljpigmjpvguzm.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb2RjamtsanBpZ21qcHZndXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjU3MzIsImV4cCI6MjEwNjY0MTczMn0.gluB0tclkdBlDcPKNd-JKLIpTHVjUWLK1cHrvFZv_yw';
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function sbDelete(table: string, id: string | null) {
  if (!id) return;
  await fetch(`${SUPABASE_REST}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: SB_HEADERS,
  });
}

async function sbRestoreFormSettings(origJson: string | null) {
  if (!origJson) return;
  await fetch(`${SUPABASE_REST}/config?key=eq.form_settings_admin`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify({ value: origJson }),
  });
}

test.describe('Đồng bộ Thông tin biểu mẫu ký tên & Xuất tài liệu (PDF/Excel)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC01 - Lưu Người lập phiếu ở Máy 1 phải đồng bộ sang Máy 2 (cùng tài khoản) qua Supabase', async ({ browser }) => {
    test.setTimeout(60000);
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    const origCfgRows = await (await fetch(`${SUPABASE_REST}/config?key=eq.form_settings_admin&select=value`, { headers: SB_HEADERS })).json();
    const origFormSettingsJson: string = origCfgRows?.[0]?.value || JSON.stringify({
      category: '', purpose: '', buyer: '', delivery: '',
      creator: 'Quản trị viên', receiver: '', reviewer: '', head: '', approver: '', city: ''
    });

    // Máy 1 đăng nhập admin
    await page1.goto('/');
    await page1.evaluate(() => localStorage.clear());
    await page1.goto('/');
    await page1.locator('#login-username').fill('admin');
    await page1.locator('#login-password').fill('admin');
    await page1.locator('#login-btn').click();
    await expect(page1).toHaveURL(/#\/dashboard/);

    // Vào trang Cài đặt trên Máy 1
    await page1.goto('/#/settings');
    await expect(page1.locator('#fs-creator')).toBeVisible();
    await page1.waitForTimeout(600);

    const testCreator = 'Nguyễn Văn Kiểm Thử ' + Date.now();
    const testReviewer = 'Trần Thị Xem Xét';
    const testCity = 'Hà Nội';

    try {
      await page1.locator('#fs-creator').fill(testCreator);
      await page1.locator('#fs-reviewer').fill(testReviewer);
      await page1.locator('#fs-city').fill(testCity);
      await page1.getByRole('button', { name: /Lưu thông tin biểu mẫu/ }).click();
      await expect(page1.locator('.toast.toast-success')).toBeVisible();

      // Mở Máy 2 (Context hoàn toàn mới, localStorage trống rỗng) đăng nhập cùng tài khoản admin
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto('/');
      await page2.locator('#login-username').fill('admin');
      await page2.locator('#login-password').fill('admin');
      await page2.locator('#login-btn').click();
      await expect(page2).toHaveURL(/#\/dashboard/);

      // Vào Cài đặt trên Máy 2: phải thấy đúng Người lập phiếu đã lưu ở Máy 1
      await page2.goto('/#/settings');
      await expect(page2.locator('#fs-creator')).toHaveValue(testCreator, { timeout: 10000 });
      await expect(page2.locator('#fs-reviewer')).toHaveValue(testReviewer);
      await expect(page2.locator('#fs-city')).toHaveValue(testCity);

      await context2.close();
    } finally {
      await sbRestoreFormSettings(origFormSettingsJson);
      await context1.close().catch(() => {});
    }
  });

  test('TC02 - Xuất PDF Sửa chữa ngoài & PDF/Excel Đề xuất vật tư trên Máy 2 phải lấy đúng tên Người lập phiếu mới', async ({ browser }) => {
    test.setTimeout(90000);
    const origCfgRows = await (await fetch(`${SUPABASE_REST}/config?key=eq.form_settings_admin&select=value`, { headers: SB_HEADERS })).json();
    const origFormSettingsJson: string = origCfgRows?.[0]?.value || JSON.stringify({
      category: '', purpose: '', buyer: '', delivery: '',
      creator: 'Quản trị viên', receiver: '', reviewer: '', head: '', approver: '', city: ''
    });

    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/');
    await page1.locator('#login-username').fill('admin');
    await page1.locator('#login-password').fill('admin');
    await page1.locator('#login-btn').click();
    await expect(page1).toHaveURL(/#\/dashboard/);

    await page1.goto('/#/settings');
    await expect(page1.locator('#fs-creator')).toBeVisible();
    await page1.waitForTimeout(600);
    const customCreator = 'Lê Văn Ký Tên ' + Date.now();

    let createdProposalId: string | null = null;
    let createdExtId: string | null = null;

    try {
      await page1.locator('#fs-creator').fill(customCreator);
      await page1.getByRole('button', { name: /Lưu thông tin biểu mẫu/ }).click();
      await expect(page1.locator('.toast.toast-success')).toBeVisible();

      // Tạo tạm 1 phiếu sửa ngoài & 1 phiếu đề xuất vật tư qua API để test xuất file trên Máy 2
      const tempIds = await page1.evaluate(async () => {
        // @ts-ignore
        const extRes = await API.saveExternalRepair({
          status: 'Đang sửa',
          items: [{ name: 'Máy mài test PDF', condition: 'Hỏng công tắc', uom: 'cái', qty: 1, note: 'Test' }]
        });
        // @ts-ignore
        const propRes = await API.saveProposal({
          status: 'Nháp',
          items: [{ code: 'PT-TEST', name: 'Đá mài test', unit: 'viên', qty: 2, stock: 0, needDate: '2026-11-20', priceReq: '' }]
        });
        return {
          extId: extRes.data?.id || null,
          propId: propRes.data?.id || null
        };
      });
      createdExtId = tempIds.extId;
      createdProposalId = tempIds.propId;
      expect(createdExtId).toBeTruthy();
      expect(createdProposalId).toBeTruthy();

      // Máy 2 (localStorage sạch) đăng nhập admin và xuất tài liệu
      const context2 = await browser.newContext({ acceptDownloads: true });
      const page2 = await context2.newPage();
      const page2Errors: string[] = [];
      page2.on('pageerror', err => page2Errors.push(err.message));

      await page2.goto('/');
      await page2.locator('#login-username').fill('admin');
      await page2.locator('#login-password').fill('admin');
      await page2.locator('#login-btn').click();
      await expect(page2).toHaveURL(/#\/dashboard/);

      // 1) Kiểm tra xuất PDF Sửa chữa ngoài trên Máy 2
      await page2.goto('/#/external-repairs');
      await expect(page2.locator('#external-repairs-tbody')).toContainText(createdExtId!, { timeout: 10000 });

      // Spy vào constructor window.jspdf.jsPDF & saveAs để kiểm tra nội dung chữ ký trong PDF và Excel thực tế
      await page2.evaluate(() => {
        (window as any).__pdfTexts = [];
        const OrigJsPDF = (window as any).jspdf.jsPDF;
        const PatchedJsPDF: any = function (...args: any[]) {
          const instance = new OrigJsPDF(...args);
          const origText = instance.text.bind(instance);
          instance.text = function (...tArgs: any[]) {
            const text = tArgs[0];
            (window as any).__pdfTexts.push(Array.isArray(text) ? text.join(' ') : String(text));
            return origText(...tArgs);
          };
          return instance;
        };
        Object.assign(PatchedJsPDF, OrigJsPDF);
        PatchedJsPDF.prototype = OrigJsPDF.prototype;
        (window as any).jspdf = { ...(window as any).jspdf, jsPDF: PatchedJsPDF };

        const origSaveAs = (window as any).saveAs;
        (window as any).__lastSavedBlob = null;
        (window as any).saveAs = function (blob: Blob, ...rest: any[]) {
          (window as any).__lastSavedBlob = blob;
          return origSaveAs.call(this, blob, ...rest);
        };
      });

      const extPdfDownloadPromise = page2.waitForEvent('download', { timeout: 15000 });
      const extRow = page2.locator('#external-repairs-tbody tr', { hasText: createdExtId! });
      await extRow.getByRole('button', { name: /Xuất PDF/ }).click();
      const extPdfDownload = await extPdfDownloadPromise;
      expect(extPdfDownload.suggestedFilename()).toContain(createdExtId!);

      const extPdfTexts = await page2.evaluate(() => (window as any).__pdfTexts as string[]);
      expect(extPdfTexts).toContain(customCreator);

      // 2) Kiểm tra xuất PDF và Xuất Excel Đề xuất vật tư trực tiếp từ bảng danh sách trên Máy 2
      await page2.goto('/#/spare-parts');
      await expect(page2.locator('#parts-content .spinner')).toBeHidden({ timeout: 10000 });
      await page2.locator('.tab', { hasText: 'Đề xuất vật tư' }).click();
      const propRow = page2.locator('#parts-content tbody tr', { hasText: createdProposalId! });
      await expect(propRow).toBeVisible({ timeout: 10000 });

      await page2.evaluate(() => { (window as any).__pdfTexts = []; });
      const propPdfDownloadPromise = page2.waitForEvent('download', { timeout: 15000 });
      await propRow.getByRole('button', { name: 'Xuất PDF' }).click();
      const propPdfDownload = await propPdfDownloadPromise;
      expect(propPdfDownload.suggestedFilename()).toContain('De_nghi_cap_vat_tu_');

      const propPdfTexts = await page2.evaluate(() => (window as any).__pdfTexts as string[]);
      expect(propPdfTexts).toContain(customCreator);

      // Bấm "Xuất Excel" trực tiếp từ dòng trong bảng và đọc lại nội dung ô chữ ký từ Blob Excel
      const propExcelDownloadPromise = page2.waitForEvent('download', { timeout: 15000 });
      await propRow.getByRole('button', { name: 'Xuất Excel' }).click();
      const propExcelDownload = await propExcelDownloadPromise;
      expect(propExcelDownload.suggestedFilename()).toMatch(/De_nghi_cap_vat_tu_.*\.xlsx$/);

      const excelSigCell = await page2.evaluate(async () => {
        const blob: Blob = (window as any).__lastSavedBlob;
        if (!blob) return '';
        const buf = await blob.arrayBuffer();
        const wb = new (window as any).ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const ws = wb.getWorksheet(1);
        return String(ws.getCell('A13').value || '');
      });
      expect(excelSigCell).toContain(customCreator);

      expect(page2Errors).toEqual([]);
      await context2.close();
    } finally {
      await sbDelete('external_repairs', createdExtId);
      await sbDelete('proposals', createdProposalId);
      await sbRestoreFormSettings(origFormSettingsJson);
      await context1.close().catch(() => {});
    }
  });

  test('TC03 - Không văng lỗi JS khi lưu Đề xuất vật tư chưa chọn phụ tùng & Báo hỏng từ trang Máy điền sẵn mã máy & Command Palette có Thêm phụ tùng', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // 1) Command Palette phải hiện hành động "Thêm phụ tùng mới" cho Admin
    await page.keyboard.press('Control+k');
    await page.locator('#command-input').fill('Thêm phụ tùng mới');
    await expect(page.locator('#command-results')).toContainText('Thêm phụ tùng mới');
    await page.keyboard.press('Escape');

    // 2) Mở modal Tạo phiếu đề xuất vật tư, bấm Lưu khi chưa chọn vật tư -> không được lỗi TypeError null.length
    await page.goto('/#/spare-parts');
    await page.locator('.tab', { hasText: 'Đề xuất vật tư' }).click();
    await page.getByRole('button', { name: /Tạo phiếu đề xuất/ }).click();
    await expect(page.locator('.modal-overlay.show')).toBeVisible();
    await page.getByRole('button', { name: 'Lưu và Xuất PDF' }).click();
    await expect(page.locator('.toast.toast-warning')).toBeVisible();
    expect(pageErrors).toEqual([]);
    await page.locator('.modal-overlay.show [data-modal-close]').first().click();

    // 3) Tại trang Máy công cụ, bấm ⋮ -> Báo hỏng trên dòng máy đầu tiên -> sang /repairs phải điền sẵn mã máy
    await page.goto('/#/machines');
    const firstRow = page.locator('.data-table tbody tr').first();
    await expect(firstRow).toBeVisible();
    const machineCode = (await firstRow.locator('strong.cell-id').textContent())?.trim() || '';
    expect(machineCode.length).toBeGreaterThan(0);

    await firstRow.locator('.action-menu-trigger').click();
    await firstRow.locator('.action-menu-item', { hasText: 'Báo hỏng' }).click();

    await expect(page).toHaveURL(/#\/repairs/);
    const modal = page.locator('.modal-overlay.show');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.r-machine').first()).toHaveValue(machineCode);
  });

  test('TC04 - Khi để trống Người lập phiếu thì cả ô Cài đặt lẫn file PDF/Excel xuất ra đều phải để trống (không tự điền Quản trị viên)', async ({ browser }) => {
    test.setTimeout(90000);
    const origCfgRows = await (await fetch(`${SUPABASE_REST}/config?key=eq.form_settings_admin&select=value`, { headers: SB_HEADERS })).json();
    const origFormSettingsJson: string = origCfgRows?.[0]?.value || JSON.stringify({
      category: '', purpose: '', buyer: '', delivery: '',
      creator: '', receiver: '', reviewer: '', head: '', approver: '', city: ''
    });

    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    let createdExtId: string | null = null;
    let createdProposalId: string | null = null;

    try {
      await page1.goto('/');
      await page1.evaluate(() => localStorage.clear());
      await page1.goto('/');
      await page1.locator('#login-username').fill('admin');
      await page1.locator('#login-password').fill('admin');
      await page1.locator('#login-btn').click();
      await expect(page1).toHaveURL(/#\/dashboard/);

      await page1.goto('/#/settings');
      await expect(page1.locator('#fs-creator')).toBeVisible();
      await page1.waitForTimeout(600);

      // Xóa trắng Người lập phiếu và bấm Lưu
      await page1.locator('#fs-creator').fill('');
      await page1.getByRole('button', { name: /Lưu thông tin biểu mẫu/ }).click();
      await expect(page1.locator('.toast.toast-success')).toBeVisible();

      // Ngay trên Máy 1 sau khi lưu: ô Người lập phiếu phải giữ nguyên rỗng '' (không bị nhảy lại thành 'Quản trị viên')
      await expect(page1.locator('#fs-creator')).toHaveValue('');

      // Tạo tạm 1 phiếu sửa ngoài & 1 phiếu đề xuất vật tư để kiểm tra xuất PDF/Excel khi creator = ''
      const tempIds = await page1.evaluate(async () => {
        // @ts-ignore
        const extRes = await API.saveExternalRepair({
          status: 'Đang sửa',
          items: [{ name: 'Máy test trống chữ ký', condition: 'Cháy', uom: 'cái', qty: 1, note: '' }]
        });
        // @ts-ignore
        const propRes = await API.saveProposal({
          status: 'Nháp',
          items: [{ code: 'PT-EMPTY', name: 'Vật tư test trống chữ ký', unit: 'cái', qty: 1, stock: 0, needDate: '2026-11-20', priceReq: '' }]
        });
        return {
          extId: extRes.data?.id || null,
          propId: propRes.data?.id || null
        };
      });
      createdExtId = tempIds.extId;
      createdProposalId = tempIds.propId;

      // Mở Máy 2 (context mới) kiểm tra cả trang Cài đặt lẫn PDF/Excel xuất ra
      const context2 = await browser.newContext({ acceptDownloads: true });
      const page2 = await context2.newPage();
      await page2.goto('/');
      await page2.locator('#login-username').fill('admin');
      await page2.locator('#login-password').fill('admin');
      await page2.locator('#login-btn').click();
      await expect(page2).toHaveURL(/#\/dashboard/);

      await page2.goto('/#/settings');
      await expect(page2.locator('#fs-creator')).toBeVisible();
      await page2.waitForTimeout(600);
      await expect(page2.locator('#fs-creator')).toHaveValue('');

      // Spy jsPDF & saveAs trên Máy 2
      await page2.evaluate(() => {
        (window as any).__pdfTexts = [];
        const OrigJsPDF = (window as any).jspdf.jsPDF;
        const PatchedJsPDF: any = function (...args: any[]) {
          const instance = new OrigJsPDF(...args);
          const origText = instance.text.bind(instance);
          instance.text = function (...tArgs: any[]) {
            const text = tArgs[0];
            (window as any).__pdfTexts.push(Array.isArray(text) ? text.join(' ') : String(text));
            return origText(...tArgs);
          };
          return instance;
        };
        Object.assign(PatchedJsPDF, OrigJsPDF);
        PatchedJsPDF.prototype = OrigJsPDF.prototype;
        (window as any).jspdf = { ...(window as any).jspdf, jsPDF: PatchedJsPDF };

        const origSaveAs = (window as any).saveAs;
        (window as any).__lastSavedBlob = null;
        (window as any).saveAs = function (blob: Blob, ...rest: any[]) {
          (window as any).__lastSavedBlob = blob;
          return origSaveAs.call(this, blob, ...rest);
        };
      });

      // Xuất PDF Sửa chữa ngoài: không được có chữ 'Quản trị viên'
      await page2.goto('/#/external-repairs');
      await expect(page2.locator('#external-repairs-tbody')).toContainText(createdExtId!, { timeout: 10000 });
      const extPdfPromise = page2.waitForEvent('download', { timeout: 15000 });
      await page2.locator('#external-repairs-tbody tr', { hasText: createdExtId! }).getByRole('button', { name: /Xuất PDF/ }).click();
      await extPdfPromise;
      const extPdfTexts = await page2.evaluate(() => (window as any).__pdfTexts as string[]);
      expect(extPdfTexts).not.toContain('Quản trị viên');

      // Xuất PDF & Excel Đề xuất vật tư: không được có chữ 'Quản trị viên'
      await page2.goto('/#/spare-parts');
      await expect(page2.locator('#parts-content .spinner')).toBeHidden({ timeout: 10000 });
      await page2.locator('.tab', { hasText: 'Đề xuất vật tư' }).click();
      const propRow = page2.locator('#parts-content tbody tr', { hasText: createdProposalId! });
      await expect(propRow).toBeVisible({ timeout: 10000 });

      await page2.evaluate(() => { (window as any).__pdfTexts = []; });
      const propPdfPromise = page2.waitForEvent('download', { timeout: 15000 });
      await propRow.getByRole('button', { name: 'Xuất PDF' }).click();
      await propPdfPromise;
      const propPdfTexts = await page2.evaluate(() => (window as any).__pdfTexts as string[]);
      expect(propPdfTexts).not.toContain('Quản trị viên');

      const propExcelPromise = page2.waitForEvent('download', { timeout: 15000 });
      await propRow.getByRole('button', { name: 'Xuất Excel' }).click();
      await propExcelPromise;
      const excelSigCell = await page2.evaluate(async () => {
        const blob: Blob = (window as any).__lastSavedBlob;
        if (!blob) return '';
        const buf = await blob.arrayBuffer();
        const wb = new (window as any).ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const ws = wb.getWorksheet(1);
        return String(ws.getCell('A13').value || '');
      });
      expect(excelSigCell).not.toContain('Quản trị viên');
      expect(excelSigCell.trim()).toBe('NGƯỜI LẬP');

      await context2.close();
    } finally {
      await sbDelete('external_repairs', createdExtId);
      await sbDelete('proposals', createdProposalId);
      await sbRestoreFormSettings(origFormSettingsJson);
      await context1.close().catch(() => {});
    }
  });

});

