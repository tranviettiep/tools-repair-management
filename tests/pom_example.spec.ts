import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { MachinesPage } from './pages/MachinesPage';

test.describe('Kiểm thử áp dụng mô hình Page Object Model (POM)', () => {

  test('POM-TC01: Đăng nhập thất bại khi sai thông tin', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Hành động rất ngắn gọn, đọc như ngôn ngữ tự nhiên
    await loginPage.goto();
    await loginPage.login('wrong_user_xyz', 'wrong_pass');

    // Kiểm tra kết quả
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).not.toBeEmpty();
  });

  test('POM-TC02: Đăng nhập Admin và tìm kiếm máy công cụ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const machinesPage = new MachinesPage(page);

    // Bước 1: Đăng nhập
    await loginPage.goto();
    await loginPage.loginAndExpectSuccess('admin', 'admin');

    // Bước 2: Vào trang Máy công cụ và tìm kiếm
    await machinesPage.goto();
    await expect(machinesPage.pageHeading).toHaveText('Máy công cụ');
    await expect(machinesPage.table).toBeVisible();

    await machinesPage.search('M');
    const rowCount = await machinesPage.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('POM-TC03: Kiểm tra Validation modal thêm máy và đóng modal', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const machinesPage = new MachinesPage(page);

    // Đăng nhập
    await loginPage.goto();
    await loginPage.loginAndExpectSuccess('admin', 'admin');

    // Mở modal thêm máy
    await machinesPage.goto();
    await machinesPage.openAddModal();
    await expect(machinesPage.modalOverlay).toBeVisible();

    // Bấm lưu mà không điền thông tin (Unhappy Path)
    await machinesPage.submitModal();
    await expect(machinesPage.toastWarning).toBeVisible();
    await expect(machinesPage.toastWarning).toContainText('Vui lòng điền đầy đủ thông tin');

    // Đóng modal bằng nút Hủy
    await machinesPage.closeModal();
    await expect(machinesPage.modalOverlay).not.toBeVisible();
  });

});
