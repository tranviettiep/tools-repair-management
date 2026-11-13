import { Page, Locator } from '@playwright/test';

/**
 * Page Object đại diện cho trang Quản lý Máy công cụ
 */
export class MachinesPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly searchInput: Locator;
  readonly filterType: Locator;
  readonly filterDept: Locator;
  readonly filterStatus: Locator;
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly addMachineButton: Locator;
  readonly modalOverlay: Locator;
  readonly modalSaveButton: Locator;
  readonly modalCancelButton: Locator;
  readonly toastWarning: Locator;

  constructor(page: Page) {
    this.page = page;

    // Các phần tử trên trang
    this.pageHeading = page.locator('h2');
    this.searchInput = page.locator('#machine-search');
    this.filterType = page.locator('#filter-type');
    this.filterDept = page.locator('#filter-dept');
    this.filterStatus = page.locator('#filter-status');
    this.table = page.locator('.data-table');
    this.tableRows = page.locator('.data-table tbody tr');
    this.addMachineButton = page.getByRole('button', { name: 'Thêm máy mới' });

    // Các phần tử modal và thông báo
    this.modalOverlay = page.locator('.modal-overlay.show');
    this.modalSaveButton = page.locator('.modal-footer button.btn-primary');
    this.modalCancelButton = page.locator('.modal-footer [data-modal-close]');
    this.toastWarning = page.locator('.toast.toast-warning');
  }

  /**
   * Điều hướng vào trang Máy công cụ
   */
  async goto() {
    await this.page.locator('.nav-item[data-route="/machines"]').click();
    await this.page.waitForURL(/#\/machines/);
  }

  /**
   * Tìm kiếm theo từ khóa kèm chờ debounce
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(400);
  }

  /**
   * Mở modal thêm máy
   */
  async openAddModal() {
    await this.addMachineButton.click();
  }

  /**
   * Bấm nút Lưu/Thêm mới trong modal
   */
  async submitModal() {
    await this.modalSaveButton.click();
  }

  /**
   * Đóng modal bằng nút Hủy
   */
  async closeModal() {
    await this.modalCancelButton.click();
  }
}
