import { test, expect } from '@playwright/test';

test.describe('Hệ thống Quản lý Sửa chữa - Yêu cầu sửa chữa (Repairs)', () => {

  test.beforeEach(async ({ page }) => {
    // Đăng nhập quyền admin trước mỗi bài test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // Điều hướng vào trang Sửa chữa
    await page.goto('/#/repairs');
    await expect(page).toHaveURL(/#\/repairs/);
    await expect(page.locator('h2')).toHaveText('Yêu cầu sửa chữa');
  });

  test('TC01 - Hiển thị danh sách Yêu cầu sửa chữa ở chế độ Bảng mặc định', async ({ page }) => {
    // Kiểm tra ô tìm kiếm và bộ lọc trạng thái
    await expect(page.locator('#repair-search')).toBeVisible();
    await expect(page.locator('#filter-repair-status')).toBeVisible();

    // Kiểm tra các nút chuyển đổi chế độ xem
    await expect(page.locator('.view-toggle')).toBeVisible();

    // Vùng nội dung hiển thị (chờ tải dữ liệu xong rồi kiểm tra bảng hoặc trạng thái trống)
    await expect(page.locator('#repairs-content')).toBeVisible();
    await expect(page.locator('#repairs-content .spinner')).toBeHidden();
    const hasTable = await page.locator('#repairs-content .data-table').isVisible();
    if (hasTable) {
      await expect(page.locator('#repairs-content .data-table thead th')).toContainText(['Mã YC', 'Máy', 'Bộ phận', 'Trạng thái']);
    } else {
      await expect(page.locator('#repairs-content .empty-state')).toBeVisible();
    }
  });

  test('TC02 - Chuyển đổi linh hoạt giữa chế độ xem Bảng và Kanban', async ({ page }) => {
    // Bấm chuyển sang chế độ Kanban
    await page.locator('.view-toggle-btn:has-text("Kanban")').click();

    // Bảng ẩn đi, bảng Kanban xuất hiện
    await expect(page.locator('.kanban-board')).toBeVisible();

    // Kiểm tra có đủ 4 cột trạng thái chuẩn trong quy trình
    const columns = page.locator('.kanban-column-title');
    await expect(columns).toContainText(['Báo hỏng', 'Sửa ngoài', 'Đã về', 'Đã sửa']);

    // Bấm chuyển ngược lại về dạng Bảng
    await page.locator('.view-toggle-btn:has-text("Bảng")').click();
    await expect(page.locator('.kanban-board')).not.toBeVisible();
    await expect(page.locator('#repairs-content .table-wrapper')).toBeVisible();
  });

  test('TC03 - Tìm kiếm phiếu sửa chữa theo từ khóa', async ({ page }) => {
    const searchInput = page.locator('#repair-search');

    // Nhập từ khóa tìm kiếm
    await searchInput.fill('SC');

    // Chờ debounce 300ms
    await page.waitForTimeout(500);

    // Kiểm tra các dòng trả về
    const rows = page.locator('.data-table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const firstRowCode = await rows.first().locator('strong.cell-id').textContent();
      expect(firstRowCode).toContain('SC');
    }
  });

  test('TC04 - Lọc phiếu theo trạng thái', async ({ page }) => {
    const statusSelect = page.locator('#filter-repair-status');

    // Lọc theo trạng thái "Đã sửa"
    await statusSelect.selectOption('Đã sửa');
    await page.waitForTimeout(400);

    // Nếu có dòng hiển thị, tất cả badge trạng thái phải là "Đã sửa"
    const badges = page.locator('.data-table tbody tr .badge');
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveText('Đã sửa');
    }

    // Chọn lại "Tất cả trạng thái"
    await statusSelect.selectOption('');
    await page.waitForTimeout(400);
  });

  test('TC05 - Kiểm tra Validation: Báo lỗi khi gửi báo hỏng mà để trống thông tin', async ({ page }) => {
    // Bấm nút "Báo hỏng" trên thanh tiêu đề
    await page.locator('.page-header-actions button:has-text("Báo hỏng")').click();

    // Modal Báo hỏng xuất hiện
    const overlay = page.locator('.modal-overlay.show');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('.modal-title')).toContainText('Báo hỏng');

    // Bấm ngay nút "Gửi báo hỏng" mà không nhập thiết bị
    await overlay.locator('button:has-text("Gửi báo hỏng")').click();

    // Phải hiển thị Toast cảnh báo màu vàng
    const toast = page.locator('.toast.toast-warning');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Vui lòng nhập ít nhất một thiết bị');
  });

  test('TC06 - Thao tác thêm dòng và xóa dòng linh hoạt trong modal Báo hỏng', async ({ page }) => {
    // Mở modal Báo hỏng
    await page.locator('.page-header-actions button:has-text("Báo hỏng")').click();
    const overlay = page.locator('.modal-overlay.show');
    await expect(overlay).toBeVisible();

    // Ban đầu có 1 dòng với STT = 1
    const rows = overlay.locator('#repair-items-body tr.repair-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('.row-stt')).toHaveText('1');

    // Bấm "Thêm dòng"
    await overlay.locator('button:has-text("Thêm dòng")').click();

    // Bây giờ có 2 dòng, dòng thứ 2 có STT = 2
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1).locator('.row-stt')).toHaveText('2');

    // Xóa dòng đầu tiên
    await rows.first().locator('.entry-remove').click();

    // Chỉ còn 1 dòng và số thứ tự tự động đánh lại thành 1
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('.row-stt')).toHaveText('1');

    // Đóng modal bằng nút Hủy
    await overlay.locator('[data-modal-close]').first().click();
    await expect(overlay).not.toBeVisible();
  });

});
