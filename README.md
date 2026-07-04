# ☕ Cà Phê Lạc Việt — Web bán cà phê & đồ ăn vặt

Trang web quán cà phê phong cách **pixel/Minecraft** pha hoạ tiết **trống đồng Đông Sơn**
(sao nhiều cánh, chim Lạc, viền răng cưa, tông màu đồng — gỗ — xanh rỉ đồng).

Chạy thuần **HTML/CSS/JavaScript**, không cần cài đặt gì — dữ liệu lưu trong
`localStorage` của trình duyệt.

## 🚀 Chạy thử

Mở thẳng file `index.html` bằng trình duyệt, hoặc chạy một server tĩnh:

```bash
npx serve .
# hoặc
python3 -m http.server 8000
```

rồi mở http://localhost:8000

## 🔑 Tài khoản dùng thử

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Khách hàng | `khach` | `123456` |
| Chủ quán | `admin` | `admin123` |

Khách có thể tự **đăng ký tài khoản mới** ngay ở màn hình đăng nhập.

## 🧑 Phía khách hàng

- Xem **menu** theo nhóm: cà phê, trà & trà sữa, nước & sinh tố, đồ ăn vặt, tráng miệng
- Thêm món vào **giỏ hàng**, ghi chú cho quán (ít đường, nhiều đá...)
- **Đặt hàng** và theo dõi trạng thái đơn: chờ xác nhận → đang chuẩn bị → hoàn thành
- Hủy đơn khi quán chưa nhận

## 🏪 Phía chủ quán

| Mục | Chức năng |
|---|---|
| 🔔 Đơn hàng | Nhận đơn / từ chối / hoàn thành; lọc theo trạng thái |
| ☕ Sản phẩm | Thêm / **sửa** (tên, giá bán, giá vốn, nhóm, mô tả) / **ẩn** / **xóa** món |
| 📈 Doanh thu | Số lượng bán từng món + doanh thu theo **ngày / tuần / tháng / năm**, món bán chạy nhất, biểu đồ |
| 📦 Kho nguyên liệu | Tồn kho từng nguyên liệu, **cảnh báo sắp hết** để đi mua, nhập kho |
| 💰 Báo cáo lãi/lỗ | **Doanh thu − Vốn = Lợi nhuận** theo kỳ, biểu đồ so sánh, biên lợi nhuận |
| 📖 Công thức | Sổ tay công thức pha chế: nguyên liệu + các bước |
| ✅ Checklist & việc | Checklist mở ca (reset mỗi ngày) + danh sách việc cần làm |

## 📁 Cấu trúc

```
index.html        # khung trang (đăng nhập / khách / quán)
css/style.css     # theme pixel Minecraft + hoạ tiết Đông Sơn
js/db.js          # lớp dữ liệu localStorage + dữ liệu mẫu + thống kê
js/ui.js          # toast, modal, SVG trống đồng
js/charts.js      # biểu đồ cột pixel (tooltip, chú thích)
js/auth.js        # đăng nhập / đăng ký / phiên
js/customer.js    # giao diện khách
js/shop.js        # giao diện quản lý quán
js/main.js        # khởi động
```

## ⚠️ Ghi chú

- Đây là bản demo chạy hoàn toàn trên trình duyệt: **mật khẩu lưu dạng thường
  trong localStorage** — muốn dùng thật cần backend (API + database + mã hoá mật khẩu).
- Đơn hàng của khách và màn hình quán dùng chung dữ liệu trên **cùng một trình duyệt**.
- Dữ liệu mẫu (~13 tháng đơn hàng) được sinh sẵn để xem thử báo cáo;
  xoá key `lacviet_cafe_v1` trong localStorage nếu muốn làm sạch dữ liệu.
