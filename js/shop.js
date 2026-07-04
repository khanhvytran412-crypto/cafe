/* ============================================================
   Giao diện QUÁN — đơn hàng, sản phẩm, doanh thu, kho,
   báo cáo, công thức, checklist & việc cần làm
   ============================================================ */
const Shop = {
  activePanel: 'orders',
  orderFilter: 'pending',
  revPeriod: 'day',  revOffset: 0,
  repPeriod: 'month', repOffset: 0,

  init(user) {
    this.user = user;
    $('#shop-hello').textContent = '👋 ' + user.name;
    $('#btn-shop-logout').onclick = () => { Auth.logout(); showLogin(); };

    $$('.nav-item').forEach(btn => btn.onclick = () => this.showPanel(btn.dataset.panel));
    this.showPanel(this.activePanel);
    this.updateBadges();
  },

  showPanel(name) {
    this.activePanel = name;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
    $$('.shop-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'panel-' + name));
    const fn = {
      orders: () => this.renderOrders(),
      products: () => this.renderProducts(),
      revenue: () => this.renderRevenue(),
      inventory: () => this.renderInventory(),
      report: () => this.renderReport(),
      recipes: () => this.renderRecipes(),
      tasks: () => this.renderTasks(),
    }[name];
    if (fn) fn();
  },

  updateBadges() {
    const pending = DB.data.orders.filter(o => o.status === 'pending').length;
    const pb = $('#pending-badge');
    pb.textContent = pending;
    pb.classList.toggle('hidden', pending === 0);

    const low = DB.data.ingredients.filter(i => i.qty <= i.min).length;
    const lb = $('#low-stock-badge');
    lb.textContent = low;
    lb.classList.toggle('hidden', low === 0);
  },

  /* ============ 1. ĐƠN HÀNG ============ */
  renderOrders() {
    const el = $('#panel-orders');
    const counts = { all: DB.data.orders.length };
    for (const k of Object.keys(ORDER_STATUS)) {
      counts[k] = DB.data.orders.filter(o => o.status === k).length;
    }
    const filters = [
      ['pending', '⏳ Chờ xác nhận'], ['making', '🍳 Đang chuẩn bị'],
      ['done', '✅ Hoàn thành'], ['cancelled', '🚫 Đã hủy'],
    ];
    let list = DB.data.orders.filter(o => o.status === this.orderFilter)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (this.orderFilter === 'done' || this.orderFilter === 'cancelled') list = list.slice(0, 30);

    el.innerHTML = `
      <h2 class="panel-title">🔔 Đơn hàng</h2>
      <p class="panel-sub">Nhận đơn của khách, bấm "Nhận đơn" → "Hoàn thành" để tính vào doanh thu.</p>
      <div class="panel-toolbar">${filters.map(([k, lb]) =>
        `<button class="period-tab ${this.orderFilter === k ? 'active' : ''}" data-of="${k}">${lb} (${counts[k]})</button>`).join('')}
      </div>
      <div class="order-grid">${list.map(o => this.orderCard(o)).join('') ||
        '<p class="empty-note">Không có đơn nào ở mục này.</p>'}</div>`;

    $$('[data-of]', el).forEach(b => b.onclick = () => { this.orderFilter = b.dataset.of; this.renderOrders(); });
    $$('[data-accept]', el).forEach(b => b.onclick = () => this.setOrderStatus(b.dataset.accept, 'making'));
    $$('[data-finish]', el).forEach(b => b.onclick = () => this.setOrderStatus(b.dataset.finish, 'done'));
    $$('[data-reject]', el).forEach(b => b.onclick = () =>
      confirmModal('Hủy đơn', 'Hủy đơn này của khách?', () => this.setOrderStatus(b.dataset.reject, 'cancelled')));
  },

  orderCard(o) {
    const st = ORDER_STATUS[o.status];
    let actions = '';
    if (o.status === 'pending') actions =
      `<button class="btn btn-small btn-red" data-reject="${o.id}">✕ Từ chối</button>
       <button class="btn btn-small btn-green" data-accept="${o.id}">✔ Nhận đơn</button>`;
    else if (o.status === 'making') actions =
      `<button class="btn btn-small btn-green" data-finish="${o.id}">🏁 Hoàn thành</button>`;
    return `<div class="ocard">
      <div class="ocard-head">
        <b>${esc(o.customerName)}</b>
        <span class="status-tag ${st.cls}">${st.label}</span>
      </div>
      <div class="ocard-id">${fmtTime(o.createdAt)}</div>
      <div class="ocard-items">${o.items.map(i =>
        `<div><span>${esc(i.icon)} ${esc(i.name)} ×${i.qty}</span><span>${fmtVND(i.price * i.qty)}</span></div>`).join('')}</div>
      ${o.note ? `<div class="ocard-note">Ghi chú: <b>${esc(o.note)}</b></div>` : ''}
      <div class="ocard-total">${fmtVND(o.total)}</div>
      <div class="ocard-actions">${actions}</div>
    </div>`;
  },

  setOrderStatus(id, status) {
    const o = DB.data.orders.find(o => o.id === id);
    if (!o) return;
    o.status = status;
    if (status === 'done') o.doneAt = Date.now();
    DB.save();
    toast(status === 'done' ? '✅ Đơn hoàn thành, đã cộng doanh thu!' :
          status === 'making' ? '🍳 Đã nhận đơn, bắt tay pha chế!' : 'Đã hủy đơn.');
    this.renderOrders();
    this.updateBadges();
  },

  /* ============ 2. SẢN PHẨM ============ */
  renderProducts() {
    const el = $('#panel-products');
    const rows = DB.data.products.map(p => `
      <tr class="${p.hidden ? 'row-dim' : ''}">
        <td>${esc(p.icon)}</td>
        <td>${esc(p.name)}${p.hidden ? ' <span class="status-tag st-cancelled">Đang ẩn</span>' : ''}</td>
        <td>${catLabel(p.cat)}</td>
        <td class="num">${fmtVND(p.price)}</td>
        <td class="num">${fmtVND(p.cost)}</td>
        <td class="num">${fmtVND(p.price - p.cost)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-small" data-edit="${p.id}">✏ Sửa</button>
          <button class="btn btn-small btn-bronze" data-hide="${p.id}">${p.hidden ? '👁 Hiện' : '🙈 Ẩn'}</button>
          <button class="btn btn-small btn-red" data-del="${p.id}">🗑</button>
        </td>
      </tr>`).join('');

    el.innerHTML = `
      <h2 class="panel-title">☕ Sản phẩm</h2>
      <p class="panel-sub">Thêm / sửa / ẩn / xóa món. Món ẩn sẽ không hiện với khách.</p>
      <div class="panel-toolbar">
        <button class="btn btn-green" id="btn-add-product">✚ Thêm sản phẩm</button>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th></th><th>Tên món</th><th>Nhóm</th><th class="num">Giá bán</th><th class="num">Giá vốn</th><th class="num">Lãi/món</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;

    $('#btn-add-product').onclick = () => this.productForm(null);
    $$('[data-edit]', el).forEach(b => b.onclick = () =>
      this.productForm(DB.data.products.find(p => p.id === b.dataset.edit)));
    $$('[data-hide]', el).forEach(b => b.onclick = () => {
      const p = DB.data.products.find(p => p.id === b.dataset.hide);
      p.hidden = !p.hidden;
      DB.save();
      toast(p.hidden ? 'Đã ẩn "' + p.name + '" khỏi menu.' : 'Đã hiện lại "' + p.name + '".');
      this.renderProducts();
    });
    $$('[data-del]', el).forEach(b => b.onclick = () => {
      const p = DB.data.products.find(p => p.id === b.dataset.del);
      confirmModal('Xóa sản phẩm', `Xóa hẳn <b>${esc(p.name)}</b>? (Đơn cũ vẫn giữ nguyên số liệu)`, () => {
        DB.data.products = DB.data.products.filter(x => x.id !== p.id);
        DB.save();
        toast('Đã xóa ' + p.name + '.');
        this.renderProducts();
      });
    });
  },

  productForm(p) {
    const isNew = !p;
    openModal(isNew ? '✚ Thêm sản phẩm' : '✏ Sửa sản phẩm', `
      <div class="form-row">
        <div><label>Biểu tượng (emoji)</label><input id="pf-icon" value="${esc(p?.icon || '🍹')}"></div>
        <div><label>Nhóm</label><select id="pf-cat">${CATEGORIES.map(c =>
          `<option value="${c.key}" ${p?.cat === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
      </div>
      <label>Tên món</label><input id="pf-name" value="${esc(p?.name || '')}" placeholder="vd: Cà phê trứng">
      <div class="form-row">
        <div><label>Giá bán (₫)</label><input id="pf-price" type="number" min="0" step="1000" value="${p?.price ?? 25000}"></div>
        <div><label>Giá vốn (₫)</label><input id="pf-cost" type="number" min="0" step="1000" value="${p?.cost ?? 10000}"></div>
      </div>
      <label>Mô tả ngắn</label><input id="pf-desc" value="${esc(p?.desc || '')}" placeholder="vd: béo thơm, đậm vị">
      <p class="form-err" id="pf-err"></p>`,
      `<button class="btn btn-green" id="pf-save">💾 Lưu</button>`);

    $('#pf-save').onclick = () => {
      const name = $('#pf-name').value.trim();
      const price = +$('#pf-price').value, cost = +$('#pf-cost').value;
      if (!name) { $('#pf-err').textContent = 'Nhập tên món nhé!'; return; }
      if (!(price > 0)) { $('#pf-err').textContent = 'Giá bán phải lớn hơn 0.'; return; }
      if (cost < 0) { $('#pf-err').textContent = 'Giá vốn không hợp lệ.'; return; }
      const data = {
        name, price, cost,
        cat: $('#pf-cat').value,
        icon: $('#pf-icon').value.trim() || '🍹',
        desc: $('#pf-desc').value.trim(),
      };
      if (isNew) DB.data.products.push({ id: DB.uid(), hidden: false, ...data });
      else Object.assign(p, data);
      DB.save();
      closeModal();
      toast(isNew ? 'Đã thêm món mới! 🎉' : 'Đã lưu thay đổi.');
      this.renderProducts();
    };
  },

  /* ============ 3. DOANH THU ============ */
  periodBar(kind, period, offset, onChange) {
    const tabs = [['day', 'Ngày'], ['week', 'Tuần'], ['month', 'Tháng'], ['year', 'Năm']];
    return `<div class="panel-toolbar">
      <div class="period-tabs">${tabs.map(([k, lb]) =>
        `<button class="period-tab ${period === k ? 'active' : ''}" data-${kind}-p="${k}">${lb}</button>`).join('')}</div>
      <div class="period-nav">
        <button class="btn btn-small" data-${kind}-nav="-1">◀</button>
        <span class="period-label">${periodLabel(period, offset)}</span>
        <button class="btn btn-small" data-${kind}-nav="1" ${offset >= 0 ? 'disabled' : ''}>▶</button>
      </div>
    </div>`;
  },

  bindPeriodBar(el, kind, onPeriod, onNav) {
    $$(`[data-${kind}-p]`, el).forEach(b => b.onclick = () => onPeriod(b.dataset[kind + 'P']));
    $$(`[data-${kind}-nav]`, el).forEach(b => b.onclick = () => onNav(+b.dataset[kind + 'Nav']));
  },

  renderRevenue() {
    const el = $('#panel-revenue');
    const st = getStats(this.revPeriod, this.revOffset);
    const nBuckets = { day: 14, week: 8, month: 12, year: 5 }[this.revPeriod];
    const buckets = statsSeries(this.revPeriod, this.revOffset, nBuckets);
    const top = Object.values(st.perProduct).sort((a, b) => b.qty - a.qty);
    const best = top[0];

    el.innerHTML = `
      <h2 class="panel-title">📈 Doanh thu & lượng bán</h2>
      <p class="panel-sub">Xem bán được bao nhiêu món, món nào chạy nhất theo ngày / tuần / tháng / năm.</p>
      ${this.periodBar('rev', this.revPeriod, this.revOffset)}
      <div class="stat-row">
        <div class="stat-tile"><div class="st-label">Doanh thu</div><div class="st-value money">${fmtVND(st.revenue)}</div></div>
        <div class="stat-tile"><div class="st-label">Số đơn hoàn thành</div><div class="st-value">${st.orderCount}</div></div>
        <div class="stat-tile"><div class="st-label">Món bán ra</div><div class="st-value">${st.itemCount}</div></div>
        <div class="stat-tile"><div class="st-label">Bán chạy nhất</div>
          <div class="st-value" style="font-size:24px">${best ? esc(best.icon + ' ' + best.name) : '—'}</div>
          <div class="st-note">${best ? best.qty + ' phần' : 'chưa có dữ liệu'}</div></div>
      </div>
      <div class="chart-box" id="rev-chart"></div>
      <h3 style="margin:4px 0 10px;color:var(--bronze-hi)">Chi tiết theo món — ${periodLabel(this.revPeriod, this.revOffset)}</h3>
      <div class="tbl-wrap"><table>
        <thead><tr><th>#</th><th>Món</th><th class="num">Số lượng</th><th class="num">Doanh thu</th></tr></thead>
        <tbody>${top.map((p, i) =>
          `<tr><td>${i + 1}</td><td>${esc(p.icon)} ${esc(p.name)}</td><td class="num">${p.qty}</td><td class="num">${fmtVND(p.revenue)}</td></tr>`).join('') ||
          '<tr><td colspan="4" class="empty-note">Chưa có đơn hoàn thành trong kỳ này.</td></tr>'}</tbody>
      </table></div>`;

    renderBarChart($('#rev-chart'), buckets,
      [{ key: 'revenue', label: 'Doanh thu', color: 'var(--c-revenue)' }],
      { title: `Doanh thu ${nBuckets} ${{ day: 'ngày', week: 'tuần', month: 'tháng', year: 'năm' }[this.revPeriod]} gần nhất` });

    this.bindPeriodBar(el, 'rev',
      p => { this.revPeriod = p; this.revOffset = 0; this.renderRevenue(); },
      d => { this.revOffset = Math.min(0, this.revOffset + d); this.renderRevenue(); });
  },

  /* ============ 4. KHO NGUYÊN LIỆU ============ */
  renderInventory() {
    const el = $('#panel-inventory');
    const ings = DB.data.ingredients;
    const low = ings.filter(i => i.qty <= i.min);

    const rows = ings.map(i => {
      const ratio = i.min > 0 ? Math.min(i.qty / (i.min * 2), 1) : 1;
      const color = i.qty <= 0 ? 'var(--danger)' : i.qty <= i.min ? 'var(--warn)' : 'var(--ok)';
      const tag = i.qty <= 0 ? '<span class="status-tag st-cancelled">HẾT</span>'
        : i.qty <= i.min ? '<span class="status-tag st-pending">Sắp hết</span>'
        : '<span class="status-tag st-done">Còn đủ</span>';
      return `<tr>
        <td>${esc(i.name)}</td>
        <td class="num">${i.qty} ${esc(i.unit)}</td>
        <td class="num">${i.min} ${esc(i.unit)}</td>
        <td><span class="stock-bar"><i style="width:${(ratio * 100).toFixed(0)}%;background:${color}"></i></span></td>
        <td>${tag}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-small btn-green" data-restock="${i.id}">📥 Nhập</button>
          <button class="btn btn-small" data-iedit="${i.id}">✏</button>
          <button class="btn btn-small btn-red" data-idel="${i.id}">🗑</button>
        </td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <h2 class="panel-title">📦 Kho nguyên liệu</h2>
      <p class="panel-sub">Theo dõi tồn kho — nguyên liệu chạm mức tối thiểu sẽ được cảnh báo để đi mua.</p>
      ${low.length
        ? `<div class="alert-box"><h4>⚠ Cần mua ngay (${low.length})</h4>${low.map(i =>
            `<div>• ${esc(i.name)}: còn <b>${i.qty} ${esc(i.unit)}</b> (tối thiểu ${i.min} ${esc(i.unit)})</div>`).join('')}</div>`
        : `<div class="alert-box ok"><h4>✔ Kho ổn định</h4><div>Tất cả nguyên liệu đều trên mức tối thiểu.</div></div>`}
      <div class="panel-toolbar"><button class="btn btn-green" id="btn-add-ing">✚ Thêm nguyên liệu</button></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Nguyên liệu</th><th class="num">Tồn kho</th><th class="num">Mức tối thiểu</th><th>Mức</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;

    $('#btn-add-ing').onclick = () => this.ingredientForm(null);
    $$('[data-iedit]', el).forEach(b => b.onclick = () =>
      this.ingredientForm(ings.find(i => i.id === b.dataset.iedit)));
    $$('[data-restock]', el).forEach(b => b.onclick = () => {
      const i = ings.find(x => x.id === b.dataset.restock);
      openModal('📥 Nhập kho: ' + esc(i.name), `
        <label>Số lượng nhập thêm (${esc(i.unit)})</label>
        <input id="rs-qty" type="number" min="0" step="any" value="1">
        <p class="form-err" id="rs-err"></p>`,
        `<button class="btn btn-green" id="rs-save">💾 Nhập kho</button>`);
      $('#rs-save').onclick = () => {
        const q = +$('#rs-qty').value;
        if (!(q > 0)) { $('#rs-err').textContent = 'Số lượng phải lớn hơn 0.'; return; }
        i.qty = Math.round((i.qty + q) * 100) / 100;
        DB.save(); closeModal();
        toast('Đã nhập ' + q + ' ' + i.unit + ' ' + i.name + '.');
        this.renderInventory(); this.updateBadges();
      };
    });
    $$('[data-idel]', el).forEach(b => b.onclick = () => {
      const i = ings.find(x => x.id === b.dataset.idel);
      confirmModal('Xóa nguyên liệu', `Xóa <b>${esc(i.name)}</b> khỏi kho?`, () => {
        DB.data.ingredients = ings.filter(x => x.id !== i.id);
        DB.save(); toast('Đã xóa ' + i.name + '.');
        this.renderInventory(); this.updateBadges();
      });
    });
  },

  ingredientForm(i) {
    const isNew = !i;
    openModal(isNew ? '✚ Thêm nguyên liệu' : '✏ Sửa nguyên liệu', `
      <label>Tên nguyên liệu</label><input id="if-name" value="${esc(i?.name || '')}" placeholder="vd: Sữa đặc">
      <div class="form-row">
        <div><label>Đơn vị</label><input id="if-unit" value="${esc(i?.unit || 'kg')}"></div>
        <div><label>Tồn kho hiện tại</label><input id="if-qty" type="number" min="0" step="any" value="${i?.qty ?? 0}"></div>
        <div><label>Mức tối thiểu</label><input id="if-min" type="number" min="0" step="any" value="${i?.min ?? 1}"></div>
      </div>
      <p class="form-err" id="if-err"></p>`,
      `<button class="btn btn-green" id="if-save">💾 Lưu</button>`);
    $('#if-save').onclick = () => {
      const name = $('#if-name').value.trim();
      if (!name) { $('#if-err').textContent = 'Nhập tên nguyên liệu nhé!'; return; }
      const data = {
        name, unit: $('#if-unit').value.trim() || 'đv',
        qty: Math.max(0, +$('#if-qty').value || 0),
        min: Math.max(0, +$('#if-min').value || 0),
      };
      if (isNew) DB.data.ingredients.push({ id: DB.uid(), ...data });
      else Object.assign(i, data);
      DB.save(); closeModal();
      toast(isNew ? 'Đã thêm nguyên liệu.' : 'Đã lưu.');
      this.renderInventory(); this.updateBadges();
    };
  },

  /* ============ 5. BÁO CÁO LÃI/LỖ ============ */
  renderReport() {
    const el = $('#panel-report');
    const st = getStats(this.repPeriod, this.repOffset);
    const nBuckets = { day: 14, week: 8, month: 12, year: 5 }[this.repPeriod];
    const buckets = statsSeries(this.repPeriod, this.repOffset, nBuckets);
    const margin = st.revenue > 0 ? Math.round((st.profit / st.revenue) * 100) : 0;

    el.innerHTML = `
      <h2 class="panel-title">💰 Báo cáo lãi/lỗ</h2>
      <p class="panel-sub">Doanh thu − Vốn (giá vốn từng món) = Lợi nhuận. Tính trên đơn đã hoàn thành.</p>
      ${this.periodBar('rep', this.repPeriod, this.repOffset)}
      <div class="stat-row">
        <div class="stat-tile"><div class="st-label">Doanh thu</div><div class="st-value money">${fmtVND(st.revenue)}</div></div>
        <div class="stat-tile"><div class="st-label">Vốn</div><div class="st-value">${fmtVND(st.cost)}</div></div>
        <div class="stat-tile"><div class="st-label">Lợi nhuận</div>
          <div class="st-value ${st.profit >= 0 ? 'pos' : 'neg'}">${fmtVND(st.profit)}</div>
          <div class="st-note">Biên lợi nhuận: ${margin}%</div></div>
      </div>
      <div class="chart-box" id="rep-chart"></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Kỳ</th><th class="num">Doanh thu</th><th class="num">Vốn</th><th class="num">Lợi nhuận</th></tr></thead>
        <tbody>${buckets.slice().reverse().map(b =>
          `<tr><td>${esc(b.full)}</td><td class="num">${fmtVND(b.revenue)}</td><td class="num">${fmtVND(b.cost)}</td><td class="num" style="color:${b.profit >= 0 ? '#7fe0a8' : '#ff9a80'}">${fmtVND(b.profit)}</td></tr>`).join('')}</tbody>
      </table></div>`;

    renderBarChart($('#rep-chart'), buckets, [
      { key: 'revenue', label: 'Doanh thu', color: 'var(--c-revenue)' },
      { key: 'cost',    label: 'Vốn',       color: 'var(--c-cost)' },
      { key: 'profit',  label: 'Lợi nhuận', color: 'var(--c-profit)' },
    ], { title: `So sánh ${nBuckets} kỳ gần nhất` });

    this.bindPeriodBar(el, 'rep',
      p => { this.repPeriod = p; this.repOffset = 0; this.renderReport(); },
      d => { this.repOffset = Math.min(0, this.repOffset + d); this.renderReport(); });
  },

  /* ============ 6. CÔNG THỨC ============ */
  renderRecipes() {
    const el = $('#panel-recipes');
    el.innerHTML = `
      <h2 class="panel-title">📖 Công thức pha chế</h2>
      <p class="panel-sub">Sổ tay công thức của quán — nguyên liệu & các bước làm.</p>
      <div class="panel-toolbar"><button class="btn btn-green" id="btn-add-recipe">✚ Thêm công thức</button></div>
      <div class="recipe-grid">${DB.data.recipes.map(r => `
        <div class="rcard">
          <h4>${esc(r.name)}</h4>
          <div class="r-sec">🧂 Nguyên liệu</div><pre>${esc(r.ing)}</pre>
          <div class="r-sec">🥄 Cách làm</div><pre>${esc(r.steps)}</pre>
          <div class="ocard-actions">
            <button class="btn btn-small" data-redit="${r.id}">✏ Sửa</button>
            <button class="btn btn-small btn-red" data-rdel="${r.id}">🗑 Xóa</button>
          </div>
        </div>`).join('') || '<p class="empty-note">Chưa có công thức nào.</p>'}</div>`;

    $('#btn-add-recipe').onclick = () => this.recipeForm(null);
    $$('[data-redit]', el).forEach(b => b.onclick = () =>
      this.recipeForm(DB.data.recipes.find(r => r.id === b.dataset.redit)));
    $$('[data-rdel]', el).forEach(b => b.onclick = () => {
      const r = DB.data.recipes.find(r => r.id === b.dataset.rdel);
      confirmModal('Xóa công thức', `Xóa công thức <b>${esc(r.name)}</b>?`, () => {
        DB.data.recipes = DB.data.recipes.filter(x => x.id !== r.id);
        DB.save(); toast('Đã xóa công thức.');
        this.renderRecipes();
      });
    });
  },

  recipeForm(r) {
    const isNew = !r;
    openModal(isNew ? '✚ Thêm công thức' : '✏ Sửa công thức', `
      <label>Tên công thức</label><input id="rf-name" value="${esc(r?.name || '')}" placeholder="vd: Cà phê trứng">
      <label>Nguyên liệu (mỗi dòng một thứ)</label><textarea id="rf-ing" rows="4">${esc(r?.ing || '')}</textarea>
      <label>Cách làm (các bước)</label><textarea id="rf-steps" rows="5">${esc(r?.steps || '')}</textarea>
      <p class="form-err" id="rf-err"></p>`,
      `<button class="btn btn-green" id="rf-save">💾 Lưu</button>`);
    $('#rf-save').onclick = () => {
      const name = $('#rf-name').value.trim();
      if (!name) { $('#rf-err').textContent = 'Nhập tên công thức nhé!'; return; }
      const data = { name, ing: $('#rf-ing').value.trim(), steps: $('#rf-steps').value.trim() };
      if (isNew) DB.data.recipes.push({ id: DB.uid(), ...data });
      else Object.assign(r, data);
      DB.save(); closeModal();
      toast('Đã lưu công thức.');
      this.renderRecipes();
    };
  },

  /* ============ 7. CHECKLIST & VIỆC CẦN LÀM ============ */
  renderTasks() {
    const el = $('#panel-tasks');
    const cl = DB.data.checklist, td = DB.data.todos;
    const clDone = cl.filter(t => t.done).length;

    const renderList = (list, kind) => list.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}">
        <span class="task-check" data-toggle-${kind}="${t.id}">${t.done ? '✔' : ''}</span>
        <span class="task-text">${esc(t.text)}</span>
        <button class="task-del" data-del-${kind}="${t.id}">✕</button>
      </div>`).join('') || '<p class="empty-note">Trống — thêm việc bên trên nhé.</p>';

    el.innerHTML = `
      <h2 class="panel-title">✅ Checklist & việc cần làm</h2>
      <p class="panel-sub">Checklist mở ca lặp lại mỗi ngày; việc cần làm là các đầu việc lẻ.</p>
      <div class="tasks-cols">
        <div class="task-col">
          <h4>📋 Checklist mở ca</h4>
          <div class="task-progress">Hoàn thành ${clDone}/${cl.length}
            ${clDone === cl.length && cl.length ? '— sẵn sàng bán hàng! 🎉' : ''}</div>
          <div class="task-add">
            <input id="cl-new" placeholder="Thêm việc vào checklist...">
            <button class="btn btn-small btn-green" id="cl-add">✚</button>
          </div>
          ${renderList(cl, 'cl')}
          <div style="margin-top:12px;text-align:right">
            <button class="btn btn-small btn-bronze" id="cl-reset">🔄 Reset ngày mới</button>
          </div>
        </div>
        <div class="task-col">
          <h4>📝 Việc cần làm</h4>
          <div class="task-progress">${td.filter(t => !t.done).length} việc chưa xong</div>
          <div class="task-add">
            <input id="td-new" placeholder="Thêm việc cần làm...">
            <button class="btn btn-small btn-green" id="td-add">✚</button>
          </div>
          ${renderList(td, 'td')}
        </div>
      </div>`;

    const addTask = (inputId, list) => {
      const inp = $(inputId);
      const text = inp.value.trim();
      if (!text) return;
      list.push({ id: DB.uid(), text, done: false });
      DB.save(); this.renderTasks();
    };
    $('#cl-add').onclick = () => addTask('#cl-new', cl);
    $('#td-add').onclick = () => addTask('#td-new', td);
    $('#cl-new').onkeydown = e => { if (e.key === 'Enter') addTask('#cl-new', cl); };
    $('#td-new').onkeydown = e => { if (e.key === 'Enter') addTask('#td-new', td); };
    $('#cl-reset').onclick = () => {
      cl.forEach(t => t.done = false);
      DB.save(); toast('Checklist đã reset cho ca mới!');
      this.renderTasks();
    };

    const bind = (kind, list) => {
      $$(`[data-toggle-${kind}]`, el).forEach(b => b.onclick = () => {
        const t = list.find(t => t.id === b.dataset['toggle' + kind[0].toUpperCase() + kind.slice(1)]);
        t.done = !t.done;
        DB.save(); this.renderTasks();
      });
      $$(`[data-del-${kind}]`, el).forEach(b => b.onclick = () => {
        const id = b.dataset['del' + kind[0].toUpperCase() + kind.slice(1)];
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) list.splice(idx, 1);
        DB.save(); this.renderTasks();
      });
    };
    bind('cl', cl);
    bind('td', td);
  },
};
