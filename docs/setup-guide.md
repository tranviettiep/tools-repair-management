# 📖 Hướng dẫn cài đặt - Tools Repair Management

## Bước 1: Chạy thử bản Demo (không cần backend)

App hiện đang ở chế độ **Demo** với dữ liệu mẫu. Bạn có thể mở `index.html` trực tiếp trên trình duyệt để test:

1. Mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox...)
2. Đăng nhập bằng một trong các tài khoản demo:
   - `admin` - Quản trị viên (xem tất cả)
   - `truongpxa` - Trưởng phân xưởng A
   - `ktv_binh` - Kỹ thuật viên
   - `nv_em` - Người báo hỏng
3. Mật khẩu: nhập bất kỳ (chế độ demo chấp nhận mọi mật khẩu)

> **Lưu ý:** Ở chế độ Demo, dữ liệu lưu trong bộ nhớ trình duyệt và sẽ reset khi refresh trang.

---

## Bước 2: Cài đặt Google Sheets Backend (Production)

### 2.1. Tạo Google Spreadsheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo bảng tính mới, đặt tên: **"Tools Repair Management DB"**
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2.2. Tạo Google Apps Script

1. Trong bảng tính vừa tạo, vào menu **Extensions → Apps Script**
2. Xóa code mặc định trong `Code.gs`
3. Copy nội dung từng file trong thư mục `gas/` vào Apps Script:
   - Mở file `gas/Code.gs` → paste vào file `Code.gs` trong Apps Script
   - Click `+` (New File) → tạo file `Auth` → paste nội dung `gas/Auth.gs`
   - Tương tự cho: `MachineService`, `RepairService`, `SparePartService`, `ReportService`, `UserService`
4. Trong file `Code.gs`, thay `YOUR_SPREADSHEET_ID_HERE` bằng Spreadsheet ID thực tế:
   ```javascript
   const SPREADSHEET_ID = 'abc123xyz...'; // Spreadsheet ID của bạn
   ```

### 2.3. Chạy Setup

1. Trong Apps Script, chọn function `setupSpreadsheet` từ dropdown
2. Click **Run** (▶️)
3. Cấp quyền truy cập khi được hỏi (chọn tài khoản Google → Allow)
4. Kiểm tra bảng tính - các sheet sẽ được tạo tự động với header

### 2.4. Deploy Web App

1. Click **Deploy → New deployment**
2. Chọn type: **Web app**
3. Cài đặt:
   - **Description**: Tools Repair Management API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy **Web App URL** (dạng `https://script.google.com/macros/s/.../exec`)

### 2.5. Kết nối Frontend với Backend

1. Mở app, đăng nhập (chế độ demo)
2. Vào **⚙️ Cài đặt**
3. Dán **Web App URL** vào ô "Google Apps Script URL"
4. Đổi chế độ từ "Demo" sang "Production"
5. Click **Lưu**
6. Đăng xuất và đăng nhập lại

### 2.6. Đăng nhập Production

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Quan trọng**: Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu!

---

## Bước 3: Host Frontend (Tùy chọn)

### Cách 1: Mở trực tiếp từ file
Chỉ cần mở `index.html` trên trình duyệt. Phù hợp cho 1 máy dùng.

### Cách 2: GitHub Pages (Miễn phí)
1. Tạo repository trên GitHub
2. Upload toàn bộ thư mục project (trừ `gas/`)
3. Vào Settings → Pages → chọn branch `main` → Save
4. Truy cập qua: `https://username.github.io/repo-name`

### Cách 3: Google Drive Hosting
1. Upload thư mục project lên Google Drive
2. Sử dụng công cụ như [DriveToWeb](https://drv.tw) để host

---

## Lưu ý quan trọng

### Bảo mật
- Mật khẩu được hash SHA256 trước khi lưu
- Token phiên đăng nhập tự hết hạn sau 8 giờ
- Google Apps Script chạy dưới tài khoản Google của bạn

### Giới hạn Google Apps Script
- **Thời gian thực thi**: Tối đa 6 phút / lần gọi
- **Lượt gọi**: 20,000 lần / ngày (tài khoản thường)
- **Dữ liệu**: 10 triệu ô / bảng tính

### Backup
- Google Sheets tự động lưu lịch sử phiên bản
- Nên export backup định kỳ (Download as .xlsx)

### Cập nhật
- Khi cập nhật frontend: thay file và refresh trình duyệt
- Khi cập nhật backend: sửa code trong Apps Script → Deploy → New deployment
- **Lưu ý**: Mỗi lần deploy mới sẽ tạo URL mới, cần cập nhật lại trong Cài đặt
