import { test, expect } from '@playwright/test';

test.describe('Hệ thống Quản lý Sửa chữa - Quản lý Máy công cụ', () => {

  test.beforeEach(async ({ page }) => {
    // Đăng nhập quyền admin trước mỗi bài test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // Điều hướng vào trang Máy công cụ
    await page.locator('.nav-item[data-route="/machines"]').click();
    await expect(page).toHaveURL(/#\/machines/);
    await expect(page.locator('h2')).toHaveText('Máy công cụ');
  });

  test('TC01 - Hiển thị bảng danh sách máy công cụ và thanh công cụ tìm kiếm', async ({ page }) => {
    // Kiểm tra ô tìm kiếm và các bộ lọc
    await expect(page.locator('#machine-search')).toBeVisible();
    await expect(page.locator('#filter-type')).toBeVisible();
    await expect(page.locator('#filter-dept')).toBeVisible();
    await expect(page.locator('#filter-status')).toBeVisible();

    // Kiểm tra bảng danh sách máy hiển thị
    const table = page.locator('.data-table');
    await expect(table).toBeVisible();

    // Bảng có các dòng dữ liệu
    const rows = page.locator('.data-table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('TC02 - Tìm kiếm máy theo từ khóa', async ({ page }) => {
    const searchInput = page.locator('#machine-search');

    // Nhập từ khóa tìm kiếm (lấy ký tự từ dòng đầu tiên để chắc chắn có kết quả)
    const firstCode = await page.locator('.data-table tbody tr td strong.cell-id').first().textContent();
    const query = firstCode ? firstCode.slice(0, 3) : 'M';
    await searchInput.fill(query);

    // Chờ debounce 300ms và cập nhật kết quả
    await page.waitForTimeout(500);

    // Bảng hiển thị kết quả khớp với từ khóa
    const rows = page.locator('.data-table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC03 - Kiểm tra Validation: Báo lỗi khi để trống trường bắt buộc lúc thêm máy', async ({ page }) => {
    // Bấm nút "Thêm máy mới"
    await page.getByRole('button', { name: 'Thêm máy mới' }).click();

    // Modal xuất hiện
    const overlay = page.locator('.modal-overlay.show');
    await expect(overlay).toBeVisible();

    // Bấm ngay nút "Thêm mới" trong modal mà không điền gì
    await page.locator('.modal-footer button.btn-primary').click();

    // Hệ thống phải hiện Toast cảnh báo màu vàng
    const toast = page.locator('.toast.toast-warning');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Vui lòng điền đầy đủ thông tin');
  });

  test('TC04 - Đóng modal thêm máy khi bấm nút Hủy', async ({ page }) => {
    // Mở modal thêm máy
    await page.getByRole('button', { name: 'Thêm máy mới' }).click();
    const overlay = page.locator('.modal-overlay.show');
    await expect(overlay).toBeVisible();

    // Bấm nút Hủy
    await page.locator('.modal-footer [data-modal-close]').click();

    // Modal biến mất
    await expect(overlay).not.toBeVisible();
  });

});
