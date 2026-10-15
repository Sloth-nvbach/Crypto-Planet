# 🪐 Crypto Planet

**Sàn giao dịch tiền điện tử MÔ PHỎNG** — dự án học tập MERN Stack (MongoDB · Express · React · Node.js).

> ⚠️ **Tuyên bố quan trọng:** Crypto Planet là website mô phỏng phục vụ học tập. Mọi số dư, giao dịch và "tiền" trong hệ thống đều là dữ liệu mô phỏng trong MongoDB — **không phải sàn giao dịch tiền thật**, không kết nối blockchain, không cổng thanh toán.

---

## ✨ Tính năng

**Người dùng**
- Đăng ký / đăng nhập (JWT + bcryptjs), đổi mật khẩu, quản lý hồ sơ.
- Thị trường: danh sách 10 đồng tiền, giá VND, biến động 24h, tìm kiếm, trang chi tiết.
- Giao dịch **lệnh thị trường** (mua/bán tức thời theo giá hệ thống), phí **0.5%** (cấu hình được qua `.env`).
- Ví đa tài sản: VND + crypto, tổng giá trị quy đổi, **sổ cái biến động số dư**.
- Nạp / rút tiền mô phỏng có **Admin phê duyệt**; hủy yêu cầu rút đang chờ.
- Lịch sử giao dịch có phân trang + bộ lọc; thông báo hệ thống; FAQ + gửi ticket hỗ trợ.

**Quản trị viên**
- Dashboard thống kê (aggregation): người dùng, giao dịch, khối lượng, doanh thu phí, chờ duyệt…
- Quản lý người dùng: tìm kiếm, khóa/mở khóa (kèm lý do bắt buộc), điều chỉnh số dư **có ghi nhật ký kiểm toán**.
- Quản lý tài sản: thêm / sửa giá / ẩn (mã tài sản không cho đổi sau khi tạo).
- Duyệt / từ chối nạp-rút; xem toàn bộ giao dịch; phản hồi ticket; đăng thông báo; quản lý FAQ.

**Nguyên tắc kỹ thuật đáng chú ý** (xem `docs/DESIGN.md` để hiểu chi tiết)
- **Số dư không bao giờ âm:** update nguyên tử có điều kiện `availableBalance: { $gte: amount }` — không dùng transactions, không cần replica set.
- **Chống giao dịch trùng lặp:** `idempotencyKey` do client tạo + unique partial index — gửi lại cùng request trả về kết quả gốc, không trừ tiền lần 2.
- **Giá do backend quyết định:** request giao dịch không có trường giá — client không thể thao túng giá.
- **Sổ cái nhất quán:** mọi biến động số dư tạo 1 bản ghi `Transaction` + ≥1 bản ghi `BalanceHistory` (bảo chứng `before + change = after`).
- Giao diện 100% tiếng Việt, tiền tệ định dạng `vi-VN`, có đủ 3 trạng thái UI (đang tải / trống / lỗi).

---

## 🧰 Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18 + React Router 6 + Axios + CSS thuần (Vite) |
| Backend | Node.js + Express.js (kiến trúc MVC: routes → middlewares → controllers → services → models) |
| Database | MongoDB **Local** + Mongoose 8 |
| Xác thực | JWT (`jsonwebtoken`) + **bcryptjs** (giống bcrypt, thuần JS — tránh lỗi biên dịch native trên Windows) |
| Kiểm tra dữ liệu | express-validator |
| Kiểm thử | Postman (bộ sưu tập sẵn trong `docs/postman/`) + script smoke-test Node |

---

## 📁 Cấu trúc dự án

```
Crypto Planet/
├── backend/
│   ├── src/
│   │   ├── config/        # kết nối MongoDB
│   │   ├── models/        # 11 Mongoose model
│   │   ├── middlewares/    # auth, authorize, validate, errorHandler...
│   │   ├── controllers/    # + admin/ (8 controller quản trị)
│   │   ├── services/       # nghiệp vụ: wallet, trading, cash, stat, audit...
│   │   ├── routes/         # REST API theo nhóm
│   │   └── utils/          # ApiError, pagination, round, constants
│   └── scripts/            # seed.js, smokeTest.js, resetDb.js
├── frontend/
│   └── src/
│       ├── pages/          # public/ user/ admin/ — 20 trang tiếng Việt
│       ├── components/     # bảng, badge, modal, toast, phân trang...
│       ├── layouts/        # PublicLayout, UserLayout, AdminLayout
│       ├── services/       # Axios instance + 8 module API
│       ├── context/        # AuthContext
│       ├── hooks/          # useApi (loading/error/reload)
│       └── utils/          # formatVND, nhãn tiếng Việt
└── docs/
    ├── DESIGN.md           # tài liệu thiết kế hệ thống đầy đủ
    └── postman/            # bộ sưu tập + môi trường Postman
```

---

## 🚀 Chạy dự án

### Yêu cầu

- **Node.js ≥ 18** (đã kiểm thử với Node 24)
- **MongoDB Local** đang chạy (Windows: service `MongoDB`; mac/Linux: `brew services start mongodb-community` / `systemctl start mongod`)

### 1. Backend

```bash
cd backend
npm install
# Nếu chưa có file .env thì copy từ .env.example và sửa JWT_SECRET
npm run seed      # tạo admin, user demo, 10 đồng tiền mẫu, FAQ, thông báo
npm run dev       # API chạy tại http://localhost:5000
```

### 2. Frontend (mở terminal khác)

```bash
cd frontend
npm install
npm run dev       # web chạy tại http://localhost:5173
```

### 3. Truy cập

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@cryptoplanet.vn` | trong `backend/.env` (`ADMIN_PASSWORD`, mặc định `Admin@123`) |
| Người dùng demo (có sẵn 100.000.000 ₫ + BTC + ETH) | `demo@cryptoplanet.vn` | `demo1234` |

### Các script hữu ích (trong `backend/`)

| Lệnh | Chức năng |
|---|---|
| `npm run seed` | Tạo/cập nhật dữ liệu mẫu (chạy lại nhiều lần được) |
| `npm run reset` | **Xóa sạch database** để seed lại từ đầu |
| `npm run smoke` | Kiểm thử tự động 34 luồng end-to-end (cần server đang chạy) |
| `npm run dev` | Chạy API ở chế độ phát triển (nodemon) |

---

## 🧪 Kiểm thử

### Cách 1 — Smoke test tự động (34/34 đạt)

```bash
cd backend
npm run dev        # cửa sổ 1 — server phải đang chạy
npm run smoke       # cửa sổ 2
```

Script tự tạo user test, chạy đủ luồng (đăng ký/đăng nhập, phân quyền, mua/bán, idempotency, nạp/rút duyệt/từ chối, khóa tài khoản, đối soát sổ cái…) rồi **tự dọn dẹp dữ liệu**.

### Cách 2 — Postman

1. Mở Postman → **Import** cả 2 file trong `docs/postman/` (collection + environment).
2. Chọn environment **Crypto Planet (Local)**.
3. Chạy lần lượt 2 request đăng nhập (demo + admin) để lấy token, sau đó chạy theo thứ tự thư mục.
4. ⚠️ Trước mỗi lệnh MUA/BÁN mới, **đổi biến `idempotencyKey`** trong environment — dùng lại key cũ sẽ trả về kết quả cũ (chính là cách hệ thống chống giao dịch trùng).

---

## 🔐 Ghi chú bảo mật (dành cho học tập)

- Mật khẩu hash bcryptjs; model đặt `select: false` nên API không bao giờ trả mật khẩu (kể cả dạng hash).
- JWT secret nằm trong `.env` (đã có trong `.gitignore`) — **không commit**.
- Phân quyền thật sự nằm ở backend (`auth` + `authorize('admin')`); frontend chỉ ẩn/hiện UI.
- Mọi truy vấn dữ liệu cá nhân lọc theo `req.user` từ JWT → chống IDOR.
- Xử lý lỗi tập trung: client chỉ nhận thông báo tiếng Việt, không bao giờ nhận stack trace.

---

## 📚 Tài liệu

- **`docs/DESIGN.md`** — tài liệu thiết kế đầy đủ: kiến trúc, CSDL (11 collection + index), 58 API, luồng giao dịch, idempotency, sổ cái, kế hoạch G3 mở rộng (biểu đồ giá, lệnh giới hạn…).

## 🗺️ Hướng phát triển tiếp theo (G3 — tùy chọn)

- Biểu đồ giá (Recharts + collection `PriceHistory` + mô phỏng giá random-walk).
- Lệnh giới hạn (limit order) với bộ khớp lệnh đơn giản.
- Khóa tiền khi tạo yêu cầu rút (`lockedBalance`).
- MongoDB replica set đơn node để dùng multi-document transactions.
- Jest + Supertest tự động hóa kiểm thử.
