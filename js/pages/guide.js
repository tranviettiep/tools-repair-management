const GuidePage = {
  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <h2>📖 Hướng dẫn sử dụng</h2>
        </div>
        <div class="card" style="padding: 24px; overflow-y: auto; max-height: calc(100vh - 120px);">
          <div id="guide-content" class="markdown-body">
            <div class="loading-inline"><div class="spinner"></div> Đang tải hướng dẫn...</div>
          </div>
        </div>
      </div>
      <style>
        .markdown-body {
          font-family: var(--font-family);
          color: var(--text-primary);
          line-height: 1.6;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-body h1 { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: .3em; }
        .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: .3em; }
        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body p, .markdown-body ul, .markdown-body ol { margin-top: 0; margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; }
        .markdown-body li { margin-top: 0.25em; }
        .markdown-body a { color: var(--accent-primary); text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body strong { font-weight: 600; }
        .markdown-body hr { height: 1px; padding: 0; margin: 24px 0; background-color: var(--border-color); border: 0; }
        .markdown-body blockquote { margin: 0; padding: 0 1em; color: var(--text-muted); border-left: .25em solid var(--border-color); }
        .markdown-body code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: var(--bg-tertiary); border-radius: 6px; }
      </style>
    `;

    const markdownContent = `# HƯỚNG DẪN SỬ DỤNG PHẦN MỀM QUẢN LÝ SỬA CHỮA MÁY CÔNG CỤ
**Phiên bản: 1.0**

---

## MỤC LỤC
1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Đăng nhập & Giao diện chính](#2-đăng-nhập--giao-diện-chính)
3. [Phân quyền Người dùng](#3-phân-quyền-người-dùng)
4. [Quản lý Máy công cụ](#4-quản-lý-máy-công-cụ)
5. [Quy trình Báo hỏng & Sửa chữa](#5-quy-trình-báo-hỏng--sửa-chữa)
6. [Quản lý Phụ tùng / Vật tư](#6-quản-lý-phụ-tùng--vật-tư)
7. [Báo cáo & Thống kê](#7-báo-cáo--thống-kê)
8. [Cài đặt hệ thống](#8-cài-đặt-hệ-thống)

---

## 1. GIỚI THIỆU CHUNG
Phần mềm **Quản lý Sửa chữa Máy công cụ** là giải pháp số hóa toàn diện giúp doanh nghiệp theo dõi, quản lý vòng đời thiết bị, quy trình báo hỏng, xuất/nhập phụ tùng, và đo lường hiệu suất bảo trì. 

Hệ thống hoạt động trên nền tảng web, đồng bộ dữ liệu thời gian thực và tự động quản lý trạng thái luồng công việc.

## 2. ĐĂNG NHẬP & GIAO DIỆN CHÍNH
- **Đăng nhập:** Truy cập địa chỉ website của hệ thống. Nhập Tên đăng nhập và Mật khẩu được cấp.
- **Menu điều hướng (Thanh bên trái):** Chứa các Tab chức năng tùy thuộc vào phân quyền tài khoản của bạn (Tổng quan, Máy công cụ, Sửa chữa, Phụ tùng, Người dùng, Cài đặt).
- **Góc trên bên phải:** Tên tài khoản đang đăng nhập và nút Đăng xuất.

## 3. PHÂN QUYỀN NGƯỜI DÙNG
Hệ thống được thiết kế với 4 vai trò chính:
- **Người báo hỏng (Reporter):** Chỉ xem danh sách máy và tạo/theo dõi phiếu báo hỏng.
- **Kỹ thuật viên (Technician):** Toàn quyền với Máy công cụ và Phụ tùng; Cập nhật tiến độ và hoàn thành sửa chữa.
- **Trưởng bộ phận (Manager):** Xem báo cáo, đánh giá và giám sát tình hình tổng thể.
- **Admin (Quản trị viên):** Có mọi quyền hạn, bao gồm quản lý tài khoản người dùng, điều phối sửa chữa và thiết lập hệ thống.

## 4. QUẢN LÝ MÁY CÔNG CỤ
*Thanh công cụ: \`Menu > Máy công cụ\`*

Tính năng này giúp theo dõi danh sách toàn bộ thiết bị trong nhà máy.
- **Xem danh sách:** Xem thông tin Mã máy, Loại máy, Hãng sản xuất, Model, Phân xưởng quản lý và Trạng thái hiện tại.
- **Thêm mới thiết bị:** Nhấn nút \`[+ Thêm máy mới]\`. Điền các thông tin (Mã máy và Loại máy là bắt buộc). Có thể thêm cùng lúc nhiều máy.
- **Chỉnh sửa / Xóa:** Nhấn vào biểu tượng \`⋮\` ở cuối mỗi dòng máy để chọn chức năng sửa thông tin hoặc xóa thiết bị.
- **Báo hỏng nhanh:** Tại nút \`⋮\`, chọn \`Báo hỏng\` để tự động tạo phiếu sửa chữa cho máy đó.

## 5. QUY TRÌNH BÁO HỎNG & SỬA CHỮA
*Thanh công cụ: \`Menu > Sửa chữa\`*

Quy trình sửa chữa được thiết kế theo dạng thẻ trạng thái (Kanban) bao gồm 4 bước: **Chờ xử lý ➔ Đang sửa ➔ Sửa ngoài ➔ Đã hoàn thành**.

### Bước 1: Tạo phiếu báo hỏng
- Nhấn \`[+ Tạo phiếu báo hỏng]\`.
- Quét/nhập mã máy hoặc tên máy. Form sẽ tự động điền các thông tin liên quan.
- Nhập mô tả tình trạng hỏng hóc và chọn Mức độ ưu tiên.
- *Lưu ý:* Tất cả các vai trò đều có quyền thực hiện thao tác này.

### Bước 2: Điều phối & Tiếp nhận (Dành cho Admin)
- Admin sẽ nhìn thấy phiếu ở cột **Chờ xử lý**. 
- Nhấn nút \`[Tiếp nhận]\` và chỉ định Kỹ thuật viên phụ trách. Phiếu sẽ tự động chuyển sang cột **Đang sửa**.

### Bước 3: Cập nhật sửa chữa (Dành cho Kỹ thuật viên)
- Kỹ thuật viên vào các phiếu đang ở trạng thái **Đang sửa**.
- Có thể thêm các Ghi chú, hoặc ghi nhận xuất các **Phụ tùng/Vật tư** thay thế ngay trong phiếu. Số lượng vật tư sẽ tự động trừ đi trong kho.
- Nếu phải gửi ra ngoài sửa, chuyển trạng thái sang **Sửa ngoài**.

### Bước 4: Hoàn thành
- Khi sửa xong, Kỹ thuật viên hoặc Admin nhấn nút \`[Hoàn thành]\`. Thiết bị tự động chuyển trạng thái về "Đang hoạt động" trong danh sách máy công cụ.

## 6. QUẢN LÝ PHỤ TÙNG / VẬT TƯ
*Thanh công cụ: \`Menu > Phụ tùng\` (Dành cho Admin & Kỹ thuật viên)*

- **Quản lý danh mục:** Danh sách các linh kiện, số lượng tồn kho hiện tại, mã vật tư.
- **Thêm mới / Sửa / Xóa:** Tương tự giao diện máy công cụ.
- **Cảnh báo tồn kho:** Khi số lượng vật tư xuống thấp dưới mức tối thiểu định trước, hệ thống sẽ cảnh báo bằng màu đỏ.
- **Lịch sử xuất nhập:** Mọi thao tác xuất/nhập vật tư (qua kho hoặc qua phiếu sửa chữa) đều được ghi chú lại rành mạch.

## 7. QUẢN LÝ NGƯỜI DÙNG
*Thanh công cụ: \`Menu > Người dùng\` (Chỉ Admin)*

- Thêm tài khoản mới, thiết lập mật khẩu và phân quyền (Vai trò).
- Khóa/Mở khóa tài khoản (Active/Inactive) nếu nhân sự nghỉ việc mà không bị mất dữ liệu lịch sử.

## 8. CÀI ĐẶT HỆ THỐNG
*Thanh công cụ: \`Menu > Cài đặt\` (Chỉ Admin)*

- **Loại máy công cụ:** Danh sách các loại máy (Máy mài, máy khoan...).
- **Phân xưởng/Bộ phận:** Danh sách các bộ phận trong nhà máy.
- **Cấu hình chung:** Cài đặt các tham số khác. Dữ liệu cài đặt ở đây sẽ quyết định các danh sách thả xuống (Dropdown) ở các giao diện thêm mới, báo hỏng.

---

*Tài liệu này được biên soạn dành cho mục đích hướng dẫn nội bộ. Mọi thắc mắc kỹ thuật vui lòng liên hệ Admin hệ thống để được hỗ trợ giải quyết.*`;

    try {
      if (typeof marked !== 'undefined') {
        document.getElementById('guide-content').innerHTML = marked.parse(markdownContent);
      } else {
        // Fallback if marked is blocked
        document.getElementById('guide-content').innerHTML = '<div style="white-space: pre-wrap; font-family: monospace;">' + markdownContent + '</div>';
      }
    } catch (e) {
      console.error(e);
      document.getElementById('guide-content').innerHTML = '<div style="color:var(--status-danger)">Lỗi khi render hướng dẫn.</div>';
    }
  }
};
