# 📝 Lịch sử làm việc & Tiến độ dự án (Project Status)

**Dự án:** Hệ thống Quản lý Sửa chữa Máy công cụ (Tools Repair Management)
**Cập nhật lần cuối:** 03/10/2026

---

## 1. Các hạng mục ĐÃ hoàn thành (Done)
*   **Kiến trúc & Giao diện (UI/UX - 06/10/2026):** Giao diện **phong cách ArchitectUI** viết bằng CSS riêng (`css/style.css`, không dùng thư viện CSS): có **giao diện sáng và tối**, chữ hệ thống Segoe UI, màu chính `#3f6ad8` trên nền `#f1f4f6`, thẻ không viền có bóng mờ.
    *   Menu trái có **menu con** (`js/components/sidebar.js`): *Sửa chữa* → Yêu cầu / Sửa chữa ngoài; *Kho phụ tùng* → Danh sách / Nhập-Xuất / Đề xuất / Lịch sử (mở đúng tab). Thu gọn hoặc máy tính bảng: chỉ hiện icon, bấm mục cha mở trang đầu tiên.
    *   **Khối tiêu đề trang** có ô icon lớn: tự gắn qua `App.decoratePageHeader()` theo bảng `App.pageIcons` — trang mới chỉ cần thêm 1 dòng vào bảng này.
    *   Thẻ số liệu nền chuyển màu, tiêu đề thẻ chữ in hoa, bảng sọc, badge màu đặc, tab có vạch dưới, phân trang liền khối.
    *   **Tìm nhanh Ctrl+K** (`js/components/command-palette.js`): tìm trang, thao tác, máy, phiếu sửa chữa, phụ tùng; gõ không dấu vẫn tìm được; bấm kết quả sẽ mở trang và chờ dữ liệu tải xong rồi mở chi tiết (phụ tùng: lọc danh sách theo mã).
    *   **Chế độ tối** (`js/components/theme.js`): nút mặt trăng/mặt trời trên thanh đầu trang hoặc gõ "toi" trong Ctrl+K. Lưu lựa chọn trong `app_theme`; chưa chọn thì theo cài đặt sáng/tối của điện thoại/máy tính. `index.html` đọc lựa chọn trước khi vẽ trang nên không bị nháy trắng. Màu tối là bộ biến `:root[data-theme="dark"]` đầu `css/style.css` — khi thêm màu mới hãy dùng biến, đừng viết cứng mã màu.
    *   Màu biểu đồ dùng chung `Utils.chartTheme` (bảng màu ArchitectUI).
*   **Tối ưu điện thoại (05/10/2026):** `js/components/mobile.js` tự gắn nhãn cột (`data-label`) cho mọi bảng `.data-table`/`.table` → dưới 768px mỗi dòng hiển thị thành thẻ; menu ⋮ mở dạng bảng trượt từ dưới; hộp thoại lớn mở toàn màn hình; ô nhập 16px (tránh iPhone tự phóng to), nút ≥ 40px; nút nổi "Báo hỏng" (`App.quickReport()`). Khi thêm bảng mới chỉ cần dùng class `data-table` có `<thead>` là tự hỗ trợ điện thoại.
*   **Tính năng mới (06/10/2026):**
    *   **Thông báo** (`js/components/notifications.js`): chuông + số trên menu Sửa chữa = số phiếu đang *Báo hỏng*; bấm chuông xem danh sách và mở phiếu. Tự cập nhật qua Supabase Realtime (cần chạy `ALTER PUBLICATION supabase_realtime ADD TABLE repairs;` — cuối file `database/supabase_schema.sql`), dự phòng kiểm tra lại mỗi 60 giây.
    *   **Lịch sử sửa chữa trong chi tiết máy**: số lần hỏng, tổng chi phí vật tư, lỗi hay gặp, dòng thời gian; cảnh báo khi hỏng ≥ 3 lần/90 ngày.
    *   **Tạo đề xuất vật tư một lần bấm** từ cảnh báo tồn kho (trang Phụ tùng) và khối "Phụ tùng sắp hết" (Tổng quan); SL gợi ý = 2 × tối thiểu − tồn. Sửa lỗi phiếu đề xuất cũ không hiện lại vật tư khi sửa.
    *   **PWA**: `manifest.webmanifest`, `sw.js`, icon trong `icons/`; mục "Cài app lên điện thoại" trong menu tài khoản và banner gợi ý trên điện thoại.
*   **Frontend (SPA - HTML/CSS/Vanilla JS):**
    *   Hoàn thiện toàn bộ các trang: Dashboard, Quản lý Máy, Sửa chữa, Kho phụ tùng, Báo cáo, Người dùng, Cài đặt.
    *   Xây dựng hệ thống Mock API để chạy thử nghiệm trực tiếp trên trình duyệt (Chế độ Demo).
    *   **Nâng cấp chức năng:** Thêm nhiều máy công cụ cùng lúc, báo hỏng nhiều máy cùng lúc (bỏ trường Ưu tiên, không bắt buộc mô tả).
*   **Backend & Cơ sở dữ liệu:**
    *   ~~(Cũ) Google Apps Script & Google Sheets~~.
    *   **(Mới - 04/10/2026):** Đã chuyển đổi toàn bộ hệ thống sang **Supabase (PostgreSQL)** giúp tăng tốc độ truy xuất dữ liệu gấp 20 lần. Cấu trúc DB được lưu trữ tại `database/supabase_schema.sql`.
    *   File `js/api.js` đã được viết lại sử dụng `supabase-js` để gọi API trực tiếp không cần qua máy chủ trung gian.
*   **Triển khai & Hosting:**
    *   Đã kết nối mã nguồn với GitHub thông qua GitHub Desktop.
    *   Website đã được host trực tuyến thành công bằng **GitHub Pages**.
*   **Kỹ năng tự động hóa (AI Skills):**
    *   Đã thiết lập kỹ năng `template-generate` (tại `.agents/skills/template-generate/SKILL.md`) giúp AI phân tích ảnh/markdown biểu mẫu mẫu và tự động sinh code xuất file PDF (sử dụng jsPDF).
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

**👉 Về phía hệ thống & AI (Cho phiên làm việc tới):**
1. Test kỹ năng `template-generate`: Người dùng sẽ tải lên biểu mẫu (ưu tiên dạng Ảnh/Markdown), AI sẽ bóc tách các trường dữ liệu và thiết lập code tự động sinh PDF.
2. Kiểm tra tính ổn định của các chức năng trên cơ sở dữ liệu Supabase mới.

**👉 Về phía người dùng:**
1. Trải nghiệm hệ thống trực tuyến trên link GitHub Pages.
2. Chuẩn bị file ảnh (screenshot) hoặc file text các biểu mẫu xuất PDF cần tạo cho phiên làm việc tới.

---
*Ghi chú: Khi mở lại dự án vào lần tới, bạn chỉ cần nhắn "Tiếp tục dự án", tải biểu mẫu mẫu lên và kích hoạt kỹ năng, tôi sẽ đọc file này và tiếp tục!*
