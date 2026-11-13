import { Page, Locator } from '@playwright/test';

/**
 * Page Object đại diện cho trang Đăng nhập (Login Page)
 * Chứa toàn bộ Locators (phần tử giao diện) và Actions (hành động người dùng)
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Khai báo các Locator tập trung tại 1 nơi duy nhất
    this.heading = page.locator('.login-card h1');
    this.usernameInput = page.locator('#login-username');
    this.passwordInput = page.locator('#login-password');
    this.loginButton = page.locator('#login-btn');
    this.errorMessage = page.locator('#login-error');
  }

  /**
   * Mở trang đăng nhập và dọn sạch session cũ
   */
  async goto() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.goto('/');
  }

  /**
   * Thực hiện hành động đăng nhập
   */
  async login(username: string, pass: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }

  /**
   * Đăng nhập thành công và chờ đến khi vào Dashboard
   */
  async loginAndExpectSuccess(username: string, pass: string) {
    await this.login(username, pass);
    await this.page.waitForURL(/#\/dashboard/, { timeout: 8000 });
  }
}

