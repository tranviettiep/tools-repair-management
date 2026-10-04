-- ==========================================
-- Supabase Schema for Tools Repair Management
-- ==========================================

-- 1. Table: users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'manager', 'technician', 'reporter'
    department TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: config
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
);

-- 3. Table: machines
CREATE TABLE machines (
    id TEXT PRIMARY KEY,
    machine_code TEXT UNIQUE NOT NULL,
    machine_name TEXT NOT NULL,
    machine_type TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'Hoạt động', -- 'Hoạt động', 'Báo hỏng', 'Sửa ngoài', 'Đã sửa', 'Ngừng sử dụng', 'Đã về'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: repairs (Yêu cầu sửa chữa)
CREATE TABLE repairs (
    id TEXT PRIMARY KEY,
    machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
    machine_code TEXT,
    machine_name TEXT,
    department TEXT,
    fault_description TEXT,
    priority TEXT DEFAULT 'Bình thường',
    status TEXT DEFAULT 'Báo hỏng', -- 'Báo hỏng', 'Sửa ngoài', 'Đã về', 'Đã sửa'
    reported_by TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    technician TEXT,
    repair_start TIMESTAMP WITH TIME ZONE,
    repair_end TIMESTAMP WITH TIME ZONE,
    repair_notes TEXT,
    fault_codes JSONB DEFAULT '[]'::jsonb,
    parts_used JSONB DEFAULT '[]'::jsonb,
    total_cost NUMERIC DEFAULT 0,
    completed_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Table: external_repairs (Sửa chữa ngoài)
CREATE TABLE external_repairs (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'Đang sửa', -- 'Đang sửa', 'Hoàn thành'
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table: parts (Vật tư phụ tùng)
CREATE TABLE parts (
    id TEXT PRIMARY KEY,
    part_code TEXT UNIQUE NOT NULL,
    part_name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    quantity NUMERIC DEFAULT 0,
    min_quantity NUMERIC DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table: transactions (Lịch sử nhập/xuất kho)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
    part_name TEXT,
    type TEXT NOT NULL, -- 'Nhập kho', 'Xuất kho'
    quantity NUMERIC NOT NULL,
    repair_request_id TEXT, -- Có thể NULL nếu nhập kho
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 8. Table: proposals (Đề xuất vật tư)
CREATE TABLE proposals (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'Nháp', -- 'Nháp', 'Đang xử lý', 'Hoàn thành'
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Insert Default Admin User & Config
-- ==========================================

-- Password hash cho 'admin' là: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
INSERT INTO users (id, username, password_hash, full_name, role, department, email, is_active)
VALUES (
    'u-admin-01', 
    'admin', 
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 
    'Quản trị viên', 
    'admin', 
    '', 
    'admin@company.com', 
    true
);

INSERT INTO config (key, value, description) VALUES
('machine_types', '["Máy mài tay", "Máy mài góc", "Máy đục tay", "Máy khoan tay", "Máy cắt"]', 'Danh sách loại máy'),
('departments', '["Phân xưởng A", "Phân xưởng B", "Phân xưởng C", "Phân xưởng D"]', 'Danh sách bộ phận'),
('part_categories', '["Điện", "Cơ khí", "Mài", "Đục", "Cắt", "Khoan", "Bôi trơn"]', 'Danh sách loại phụ tùng'),
('fault_codes', '[{"id":"fc-1","code":"E01","name":"Hỏng motor","machine_type":"Máy mài tay"},{"id":"fc-2","code":"E02","name":"Mòn đá mài","machine_type":"Máy mài tay"}]', 'Danh sách mã lỗi');
