/* ============================================================
   DB — lớp dữ liệu lưu trong localStorage
   ============================================================ */
const DB_KEY = 'lacviet_cafe_v1';

const DB = {
  data: null,

  load() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); return; } catch (e) { /* seed lại */ }
    }
    this.data = seedData();
    this.save();
  },

  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};

/* ---------- danh mục sản phẩm ---------- */
const CATEGORIES = [
  { key: 'cafe',       label: '☕ Cà phê' },
  { key: 'tra',        label: '🍵 Trà & Trà sữa' },
  { key: 'nuoc',       label: '🥤 Nước & Sinh tố' },
  { key: 'anvat',      label: '🍢 Đồ ăn vặt' },
  { key: 'trangmieng', label: '🍮 Tráng miệng' },
];
function catLabel(key) {
  const c = CATEGORIES.find(c => c.key === key);
  return c ? c.label : key;
}

/* ---------- trạng thái đơn ---------- */
const ORDER_STATUS = {
  pending:   { label: 'Chờ xác nhận', cls: 'st-pending' },
  making:    { label: 'Đang chuẩn bị', cls: 'st-making' },
  done:      { label: 'Hoàn thành',   cls: 'st-done' },
  cancelled: { label: 'Đã hủy',       cls: 'st-cancelled' },
};

/* ============================================================
   Dữ liệu mẫu
   ============================================================ */
function mulberry32(a) { // RNG có seed để dữ liệu demo ổn định
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedData() {
  const products = [
    { id: 'p01', name: 'Cà phê đen đá',      cat: 'cafe',       price: 20000, cost: 7000,  icon: '☕', desc: 'Robusta rang mộc, đậm đà', hidden: false },
    { id: 'p02', name: 'Cà phê sữa đá',      cat: 'cafe',       price: 25000, cost: 9000,  icon: '🥛', desc: 'Cà phê phin + sữa đặc',    hidden: false },
    { id: 'p03', name: 'Bạc xỉu',            cat: 'cafe',       price: 28000, cost: 10000, icon: '🍼', desc: 'Nhiều sữa, ít cà phê',     hidden: false },
    { id: 'p04', name: 'Cà phê muối',        cat: 'cafe',       price: 30000, cost: 11000, icon: '🧂', desc: 'Kem muối béo mặn kiểu Huế', hidden: false },
    { id: 'p05', name: 'Trà đào cam sả',     cat: 'tra',        price: 35000, cost: 13000, icon: '🍑', desc: 'Đào ngâm, cam vàng, sả tươi', hidden: false },
    { id: 'p06', name: 'Trà sữa trân châu',  cat: 'tra',        price: 32000, cost: 12000, icon: '🧋', desc: 'Trân châu đường đen dai ngon', hidden: false },
    { id: 'p07', name: 'Trà tắc mật ong',    cat: 'tra',        price: 25000, cost: 8000,  icon: '🍋', desc: 'Chua ngọt giải nhiệt',     hidden: false },
    { id: 'p08', name: 'Matcha đá xay',      cat: 'tra',        price: 42000, cost: 17000, icon: '🍃', desc: 'Matcha Nhật + kem tươi',   hidden: false },
    { id: 'p09', name: 'Sinh tố bơ',         cat: 'nuoc',       price: 38000, cost: 16000, icon: '🥑', desc: 'Bơ sáp Đắk Lắk béo mịn',   hidden: false },
    { id: 'p10', name: 'Nước cam vắt',       cat: 'nuoc',       price: 30000, cost: 13000, icon: '🍊', desc: 'Cam tươi 100%',            hidden: false },
    { id: 'p11', name: 'Nước dừa tươi',      cat: 'nuoc',       price: 28000, cost: 12000, icon: '🥥', desc: 'Dừa xiêm nguyên trái',     hidden: false },
    { id: 'p12', name: 'Bánh tráng trộn',    cat: 'anvat',      price: 25000, cost: 10000, icon: '🥡', desc: 'Đủ topping: khô bò, trứng cút', hidden: false },
    { id: 'p13', name: 'Khô gà lá chanh',    cat: 'anvat',      price: 30000, cost: 14000, icon: '🍗', desc: 'Cay nhẹ, thơm lá chanh',   hidden: false },
    { id: 'p14', name: 'Khoai tây chiên',    cat: 'anvat',      price: 25000, cost: 9000,  icon: '🍟', desc: 'Giòn rụm, chấm tương ớt',  hidden: false },
    { id: 'p15', name: 'Bánh mì nướng muối ớt', cat: 'anvat',   price: 22000, cost: 8000,  icon: '🥖', desc: 'Đặc sản vỉa hè',           hidden: false },
    { id: 'p16', name: 'Bánh flan caramel',  cat: 'trangmieng', price: 15000, cost: 5000,  icon: '🍮', desc: 'Mềm mịn, thơm trứng sữa',  hidden: false },
    { id: 'p17', name: 'Chè khúc bạch',      cat: 'trangmieng', price: 28000, cost: 11000, icon: '🍧', desc: 'Khúc bạch phô mai, nhãn, hạnh nhân', hidden: false },
  ];

  const users = [
    { id: 'u-admin', u: 'admin', p: 'admin123', name: 'Chủ quán', role: 'shop' },
    { id: 'u-khach', u: 'khach', p: '123456',   name: 'Khách dùng thử', role: 'customer' },
  ];

  const ingredients = [
    { id: 'i01', name: 'Cà phê hạt rang',  unit: 'kg',   qty: 4.5, min: 2 },
    { id: 'i02', name: 'Sữa đặc',          unit: 'lon',  qty: 12,  min: 6 },
    { id: 'i03', name: 'Sữa tươi',         unit: 'lít',  qty: 8,   min: 5 },
    { id: 'i04', name: 'Đường cát',        unit: 'kg',   qty: 1.5, min: 2 },
    { id: 'i05', name: 'Trà đen',          unit: 'kg',   qty: 0.8, min: 1 },
    { id: 'i06', name: 'Đào ngâm',         unit: 'hộp',  qty: 3,   min: 4 },
    { id: 'i07', name: 'Trân châu khô',    unit: 'kg',   qty: 2,   min: 1 },
    { id: 'i08', name: 'Bột matcha',       unit: 'g',    qty: 400, min: 200 },
    { id: 'i09', name: 'Bơ trái',          unit: 'kg',   qty: 3,   min: 2 },
    { id: 'i10', name: 'Cam vàng',         unit: 'kg',   qty: 5,   min: 3 },
    { id: 'i11', name: 'Bánh tráng',       unit: 'xấp',  qty: 6,   min: 3 },
    { id: 'i12', name: 'Khô gà',           unit: 'kg',   qty: 0.5, min: 1 },
    { id: 'i13', name: 'Trứng gà',         unit: 'quả',  qty: 30,  min: 20 },
    { id: 'i14', name: 'Ly nhựa + ống hút',unit: 'cái',  qty: 150, min: 100 },
  ];

  const recipes = [
    {
      id: 'r01', name: 'Cà phê sữa đá',
      ing: '25g cà phê bột\n25ml sữa đặc\nĐá viên',
      steps: '1. Tráng phin bằng nước sôi\n2. Cho cà phê vào phin, nén nhẹ\n3. Rót 30ml nước sôi ủ 30 giây\n4. Rót thêm 70ml, chờ nhỏ giọt hết\n5. Khuấy đều với sữa đặc, thêm đá',
    },
    {
      id: 'r02', name: 'Trà đào cam sả',
      ing: '10g trà đen\n2 miếng đào ngâm\n1/2 quả cam vàng\n1 cây sả\n20ml nước đường',
      steps: '1. Ủ trà với 150ml nước 90°C trong 5 phút\n2. Đập dập sả, cho vào bình lắc\n3. Thêm trà, nước đào, nước đường, đá — lắc 15 lần\n4. Rót ra ly, xếp đào + lát cam lên trên',
    },
    {
      id: 'r03', name: 'Trân châu đường đen',
      ing: '200g trân châu khô\n100g đường đen',
      steps: '1. Đun sôi 1 lít nước, thả trân châu\n2. Luộc 20 phút, ủ 20 phút\n3. Xả nước lạnh cho hết nhớt\n4. Sên với đường đen lửa nhỏ 10 phút\nDùng trong 4 giờ.',
    },
    {
      id: 'r04', name: 'Kem muối (cà phê muối)',
      ing: '100ml whipping cream\n50ml sữa tươi\n2g muối biển\n10g đường',
      steps: '1. Cho tất cả vào ca đánh\n2. Đánh bông mềm (không đánh quá tay)\n3. Bảo quản ngăn mát, dùng trong ngày',
    },
  ];

  const checklist = [
    { id: 'c1', text: 'Mở cửa, bật đèn + biển hiệu', done: false },
    { id: 'c2', text: 'Lau bàn ghế, quét sàn', done: false },
    { id: 'c3', text: 'Kiểm tra máy pha + máy xay', done: false },
    { id: 'c4', text: 'Nấu trân châu, ủ trà nền', done: false },
    { id: 'c5', text: 'Kiểm đếm tiền lẻ đầu ca', done: false },
    { id: 'c6', text: 'Kiểm tra kho nguyên liệu', done: false },
  ];

  const todos = [
    { id: 't1', text: 'Gọi nhà cung cấp đặt thêm đào ngâm', done: false },
    { id: 't2', text: 'Thay bảng menu mới cuối tuần', done: false },
    { id: 't3', text: 'Đăng bài khuyến mãi lên fanpage', done: true },
  ];

  // ---- đơn hàng mẫu ~13 tháng gần nhất để xem báo cáo demo ----
  const rnd = mulberry32(20260704);
  const orders = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const names = ['Anh Tuấn', 'Chị Hoa', 'Bé Na', 'Chú Ba', 'Cô Sáu', 'Bạn Minh', 'Khách lẻ', 'Anh Khoa', 'Chị Vy'];
  for (let d = 400; d >= 1; d--) {
    const day = new Date(today); day.setDate(day.getDate() - d);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const n = Math.floor(rnd() * 5) + (isWeekend ? 5 : 2); // cuối tuần đông hơn
    for (let k = 0; k < n; k++) {
      const itemCount = 1 + Math.floor(rnd() * 3);
      const items = [];
      for (let j = 0; j < itemCount; j++) {
        const p = products[Math.floor(rnd() * products.length)];
        const qty = 1 + Math.floor(rnd() * 2);
        const ex = items.find(i => i.pid === p.id);
        if (ex) ex.qty += qty;
        else items.push({ pid: p.id, name: p.name, icon: p.icon, price: p.price, cost: p.cost, qty });
      }
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const at = new Date(day); at.setHours(7 + Math.floor(rnd() * 14), Math.floor(rnd() * 60));
      orders.push({
        id: 'o' + d + '_' + k, userId: 'u-khach',
        customerName: names[Math.floor(rnd() * names.length)],
        items, total, note: '',
        status: 'done', createdAt: at.getTime(), doneAt: at.getTime(),
      });
    }
  }

  return { users, products, orders, ingredients, recipes, checklist, todos };
}

/* ============================================================
   Thống kê
   ============================================================ */

// Khoảng thời gian của 1 kỳ. offset=0: kỳ hiện tại, -1: kỳ trước...
function periodRange(period, offset) {
  const now = new Date();
  let start, end;
  if (period === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    end = new Date(start); end.setDate(end.getDate() + 1);
  } else if (period === 'week') {
    const dow = (now.getDay() + 6) % 7; // thứ 2 = 0
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + offset * 7);
    end = new Date(start); end.setDate(end.getDate() + 7);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  } else { // year
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(now.getFullYear() + offset + 1, 0, 1);
  }
  return { start: start.getTime(), end: end.getTime() };
}

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDM(t) { const d = new Date(t); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1); }

function periodLabel(period, offset) {
  const { start, end } = periodRange(period, offset);
  const s = new Date(start);
  if (period === 'day') {
    const names = { 0: 'Hôm nay', [-1]: 'Hôm qua' };
    return (names[offset] || 'Ngày') + ' ' + fmtDM(start) + '/' + s.getFullYear();
  }
  if (period === 'week') return 'Tuần ' + fmtDM(start) + ' – ' + fmtDM(end - 86400000);
  if (period === 'month') return 'Tháng ' + (s.getMonth() + 1) + '/' + s.getFullYear();
  return 'Năm ' + s.getFullYear();
}

// Thống kê 1 kỳ: doanh thu, vốn, lợi nhuận, số đơn, chi tiết theo món
function getStats(period, offset) {
  const { start, end } = periodRange(period, offset);
  const res = { revenue: 0, cost: 0, profit: 0, orderCount: 0, itemCount: 0, perProduct: {} };
  for (const o of DB.data.orders) {
    if (o.status !== 'done') continue;
    const t = o.doneAt || o.createdAt;
    if (t < start || t >= end) continue;
    res.orderCount++;
    for (const it of o.items) {
      const cost = (it.cost || 0) * it.qty;
      const rev = it.price * it.qty;
      res.revenue += rev; res.cost += cost; res.itemCount += it.qty;
      const pp = res.perProduct[it.pid] || (res.perProduct[it.pid] = { name: it.name, icon: it.icon || '', qty: 0, revenue: 0 });
      pp.qty += it.qty; pp.revenue += rev;
    }
  }
  res.profit = res.revenue - res.cost;
  return res;
}

// Chuỗi n kỳ liên tiếp kết thúc tại offset — để vẽ biểu đồ
function statsSeries(period, offset, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const off = offset - i;
    const st = getStats(period, off);
    const { start } = periodRange(period, off);
    const d = new Date(start);
    let label;
    if (period === 'day') label = fmtDM(start);
    else if (period === 'week') label = fmtDM(start);
    else if (period === 'month') label = 'T' + (d.getMonth() + 1);
    else label = String(d.getFullYear());
    out.push({ label, full: periodLabel(period, off), ...st });
  }
  return out;
}

/* ---------- định dạng tiền ---------- */
function fmtVND(n) { return Math.round(n).toLocaleString('vi-VN') + '₫'; }
function fmtShort(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + 'tr';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(Math.round(n));
}
function fmtTime(t) {
  const d = new Date(t);
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ' ' + fmtDM(t) + '/' + d.getFullYear();
}
