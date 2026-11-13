import { test, expect } from '@playwright/test';

test.describe('Hệ thống Quản lý Sửa chữa - Kiểm thử Đăng nhập', () => {

  test.beforeEach(async ({ page }) => {
    // Mở trang web và xóa sạch session cũ để đảm bảo trạng thái sạch
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('TC01 - Hiển thị đúng giao diện Đăng nhập khi chưa có session', async ({ page }) => {
    // Kiểm tra tiêu đề trang web
    await expect(page).toHaveTitle(/Tools Repair Management/);

    // Kiểm tra các phần tử trên form đăng nhập
    const heading = page.locator('.login-card h1');
    await expect(heading).toHaveText('Quản lý sửa chữa máy công cụ');

    const usernameInput = page.locator('#login-username');
    const passwordInput = page.locator('#login-password');
    const loginBtn = page.locator('#login-btn');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveText(/Đăng nhập/);
  });

  test('TC02 - Báo lỗi khi đăng nhập sai thông tin', async ({ page }) => {
    // Điền tài khoản không hợp lệ
    await page.locator('#login-username').fill('wrong_user_xyz');
    await page.locator('#login-password').fill('wrong_pass_123');
    await page.locator('#login-btn').click();

    // Kiểm tra thông báo lỗi hiển thị
    const errorEl = page.locator('#login-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).not.toBeEmpty();
  });

  test('TC03 - Đăng nhập thành công với tài khoản Admin và vào Dashboard', async ({ page }) => {
    // Điền tài khoản admin mặc định
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();

    // Chờ điều hướng vào #/dashboard
    await expect(page).toHaveURL(/#\/dashboard/);

    // Kiểm tra các thành phần giao diện sau khi đăng nhập thành công
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.app-header')).toBeVisible();

    // Kiểm tra có menu Máy công cụ và nhóm Sửa chữa
    await expect(page.locator('.nav-item[data-route="/machines"]')).toBeVisible();
    await expect(page.locator('.nav-group[data-group="repairs"]')).toBeVisible();
  });

  test('TC04 - Kiểm tra mở Command Palette bằng phím tắt Ctrl+K', async ({ page }) => {
    // Đăng nhập trước
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin');
    await page.locator('#login-btn').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // Bấm phím tắt Control+K
    await page.keyboard.press('Control+k');

    // Modal tìm kiếm nhanh Command Palette xuất hiện
    const commandOverlay = page.locator('#command-overlay');
    await expect(commandOverlay).toHaveClass(/show/);

    // Ô input tìm kiếm hiển thị và tự động focus
    const searchInput = page.locator('#command-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

});
