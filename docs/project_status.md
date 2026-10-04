# 📝 Lịch sử làm việc & Tiến độ dự án (Project Status)

**Dự án:** Hệ thống Quản lý Sửa chữa Máy công cụ (Tools Repair Management)
**Cập nhật lần cuối:** 03/10/2026

---

## 1. Các hạng mục ĐÃ hoàn thành (Done)
*   **Kiến trúc & Giao diện (UI/UX):** Đã chốt và triển khai toàn bộ giao diện Dark Mode theo chuẩn `01-architecture.md` và `02-ui-design.md`. 
*   **Frontend (SPA - HTML/CSS/Vanilla JS):**
    *   Hoàn thiện toàn bộ các trang: Dashboard, Quản lý Máy, Sửa chữa, Kho phụ tùng, Báo cáo, Người dùng, Cài đặt.
    *   Xây dựng hệ thống Mock API để chạy thử nghiệm trực tiếp trên trình duyệt (Chế độ Demo).
    *   **Nâng cấp chức năng:** Thêm nhiều máy công cụ cùng lúc, báo hỏng nhiều máy cùng lúc (bỏ trường Ưu tiên, không bắt buộc mô tả).
*   **Backend (Google Apps Script):**
    *   Đã tạo toàn bộ các dịch vụ: `Auth.gs`, `MachineService.gs`, `RepairService.gs`, `SparePartService.gs`, `ReportService.gs`, `UserService.gs`, `Code.gs`.
*   **Tính năng Đề nghị cấp vật tư & Sửa chữa ngoài (✅ Cập nhật mới nhất):**
    *   **Quản lý danh sách hoàn chỉnh:** Chuyển đổi tính năng Đề nghị cấp vật tư từ dạng biểu mẫu tĩnh sang danh sách quản lý (tương tự Sửa chữa ngoài), có nút tạo mới, xem/sửa, cập nhật trạng thái (Nháp, Đang xử lý, Hoàn thành), xóa và xuất PDF/Excel.
    *   **Backend cho Đề xuất vật tư:** Đã khởi tạo `proposals` database (ở API và Google Apps Script `ProposalService.gs`).
    *   **Mã hiệu tự động:** Tự động sinh mã `SCCC-XX-YYYY` cho Sửa chữa ngoài và `PDX-XX-YYYY` cho Đề xuất vật tư (với XX là năm hiện tại). Mã này tự động điền vào mục "Số: ..." trên file PDF xuất ra.
    *   **Tính năng "Lưu và Xuất PDF":** Tích hợp hành động lưu phiếu vào hệ thống và tải PDF/Excel xuống máy tính song song, sau đó tự động đóng biểu mẫu rất mượt mà. Đã xử lý cố định lỗi kẹt bộ nhớ đệm (Cache) trên trình duyệt.
    *   **Thiết kế & Giao diện:** Mở rộng khung cửa sổ (modal-xl) và tinh chỉnh độ giãn cách (padding, width %) cho bảng danh sách để thông tin hiển thị rộng rãi, cân đối và chuyên nghiệp hơn.
*   **Quy trình sửa chữa mở rộng (✅ Cập nhật 04/10/2026):** Báo hỏng → Sửa ngoài → Đã về → Đã sửa (áp dụng cho cả phiếu sửa chữa và trạng thái máy).
    *   Lập phiếu báo hỏng → máy & phiếu = *Báo hỏng*; có thể nhập "Thiết bị khác" ngoài danh mục (không lưu vào danh mục máy).
    *   Lập phiếu sửa ngoài phải chọn từ các phiếu đang *Báo hỏng* → phiếu & máy chuyển *Sửa ngoài*.
    *   **Trạng thái Sửa chữa ngoài:** Phiếu sửa ngoài chỉ có 2 trạng thái là *Đang sửa* (mặc định khi tạo) và *Hoàn thành* (chuyển đổi tự động, bỏ chọn thủ công).
    *   Khi người dùng xác nhận máy từ phiếu sửa ngoài trả về (click **🔙 Đã về**) hoặc xác nhận hoàn thiện (click **✅ Đã sửa**), nếu tất cả máy/phiếu thuộc phiếu sửa ngoài đó đều "Đã về" hoặc "Đã sửa", phiếu sửa ngoài sẽ tự động chuyển trạng thái thành *Hoàn thành*.
    *   Chuyển *Đã sửa* bắt buộc chọn mã lỗi (nhiều mã, lọc theo loại máy) + vật tư tiêu hao (tự trừ kho, ghi giao dịch xuất kho, tính chi phí).
    *   Mã lỗi quản lý (thêm/sửa/xóa) tại Cài đặt, lưu trong config key `fault_codes`.
    *   Đã bỏ bước Tiếp nhận / Bắt đầu sửa. Backend GAS đã đồng bộ (`RepairService.gs`, `Code.gs`, `ReportService.gs`). **Lưu ý:** sheet `repair_requests` cần thêm cột `fault_codes` (trước cột `parts_used`) và config thêm key `fault_codes`; dữ liệu cũ trạng thái "Hoàn thành"/"Hỏng"/"Đang sửa" cần chuyển sang tên mới.

---

## 2. Các hạng mục CẦN LÀM tiếp theo (To-Do)

**👉 Về phía AI:**
1. Hỗ trợ bạn kết nối Frontend với Google Apps Script URL (nếu có lỗi CORS hoặc lỗi cấu trúc dữ liệu).
2. Hỗ trợ test lỗi (Debug) các tính năng sau khi đã chạy trên cơ sở dữ liệu thật (Google Sheets).
3. Tùy chỉnh thêm biểu mẫu Excel nếu công ty yêu cầu thay đổi.

**👉 Về phía người dùng:**
1. **Triển khai Backend:** Làm theo hướng dẫn trong `docs/setup-guide.md` để đưa các file `.gs` lên Google Apps Script và liên kết với Google Sheets của bạn.

---
*Ghi chú: Khi mở lại dự án vào lần tới, bạn chỉ cần nhắn "Tiếp tục dự án" hoặc mô tả vấn đề cụ thể, tôi sẽ đọc file này và tiếp tục!*
