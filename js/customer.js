/* ============================================================
   Giao diện KHÁCH — menu, giỏ hàng, đặt món, xem đơn
   ============================================================ */
const Customer = {
  cart: [],       // [{pid, qty}]
  activeCat: 'all',

  init(user) {
    this.user = user;
    this.cart = [];
    $('#cust-hello').textContent = '👋 ' + user.name;
    this.renderCats();
    this.renderMenu();
    this.renderCart();
    this.updateBadges();

    $('#btn-cart').onclick = () => $('#cart-drawer').classList.remove('hidden');
    $('#btn-close-cart').onclick = () => $('#cart-drawer').classList.add('hidden');
    $('#btn-place-order').onclick = () => this.placeOrder();
    $('#btn-my-orders').onclick = () => this.showMyOrders();
    $('#btn-close-my-orders').onclick = () => $('#my-orders-overlay').classList.add('hidden');
    $('#btn-cust-logout').onclick = () => { Auth.logout(); showLogin(); };
  },

  visibleProducts() {
    return DB.data.products.filter(p =>
      !p.hidden && (this.activeCat === 'all' || p.cat === this.activeCat));
  },

  renderCats() {
    const box = $('#cat-chips');
    const cats = [{ key: 'all', label: '🌟 Tất cả' }, ...CATEGORIES];
    box.innerHTML = cats.map(c =>
      `<button class="chip ${this.activeCat === c.key ? 'active' : ''}" data-cat="${c.key}">${c.label}</button>`).join('');
    $$('.chip', box).forEach(ch => ch.onclick = () => {
      this.activeCat = ch.dataset.cat;
      this.renderCats(); this.renderMenu();
    });
  },

  renderMenu() {
    const grid = $('#product-grid');
    const list = this.visibleProducts();
    if (!list.length) { grid.innerHTML = '<p class="empty-note">Chưa có món nào trong mục này.</p>'; return; }
    grid.innerHTML = list.map(p => `
      <div class="pcard">
        <div class="picon">${esc(p.icon)}</div>
        <div class="pname">${esc(p.name)}</div>
        <div class="pdesc">${esc(p.desc || '')}</div>
        <div class="pprice">${fmtVND(p.price)}</div>
        <button class="btn btn-green" data-add="${p.id}">＋ Thêm vào giỏ</button>
      </div>`).join('');
    $$('[data-add]', grid).forEach(b => b.onclick = () => this.addToCart(b.dataset.add));
  },

  addToCart(pid) {
    const line = this.cart.find(l => l.pid === pid);
    if (line) line.qty++;
    else this.cart.push({ pid, qty: 1 });
    const p = DB.data.products.find(p => p.id === pid);
    toast('Đã thêm ' + p.name + ' 🧺');
    this.renderCart();
    this.updateBadges();
  },

  changeQty(pid, delta) {
    const line = this.cart.find(l => l.pid === pid);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) this.cart = this.cart.filter(l => l !== line);
    this.renderCart();
    this.updateBadges();
  },

  cartTotal() {
    return this.cart.reduce((s, l) => {
      const p = DB.data.products.find(p => p.id === l.pid);
      return s + (p ? p.price * l.qty : 0);
    }, 0);
  },

  renderCart() {
    const box = $('#cart-items');
    if (!this.cart.length) {
      box.innerHTML = '<p class="empty-note">Giỏ hàng trống.<br>Chọn món ngon đi nào! 🍹</p>';
    } else {
      box.innerHTML = this.cart.map(l => {
        const p = DB.data.products.find(p => p.id === l.pid);
        if (!p) return '';
        return `<div class="cart-line">
          <span>${esc(p.icon)}</span>
          <span class="cl-name">${esc(p.name)}<br><span class="cl-price">${fmtVND(p.price)}</span></span>
          <span class="qty-ctl">
            <button data-dec="${p.id}">−</button><b>${l.qty}</b><button data-inc="${p.id}">＋</button>
          </span>
        </div>`;
      }).join('');
      $$('[data-dec]', box).forEach(b => b.onclick = () => this.changeQty(b.dataset.dec, -1));
      $$('[data-inc]', box).forEach(b => b.onclick = () => this.changeQty(b.dataset.inc, 1));
    }
    $('#cart-total').textContent = fmtVND(this.cartTotal());
    $('#btn-place-order').disabled = !this.cart.length;
  },

  updateBadges() {
    const n = this.cart.reduce((s, l) => s + l.qty, 0);
    const badge = $('#cart-badge');
    badge.textContent = n;
    badge.classList.toggle('hidden', n === 0);
    const active = DB.data.orders.filter(o =>
      o.userId === this.user.id && (o.status === 'pending' || o.status === 'making')).length;
    const ob = $('#my-orders-badge');
    ob.textContent = active;
    ob.classList.toggle('hidden', active === 0);
  },

  placeOrder() {
    if (!this.cart.length) return;
    const items = this.cart.map(l => {
      const p = DB.data.products.find(p => p.id === l.pid);
      return { pid: p.id, name: p.name, icon: p.icon, price: p.price, cost: p.cost, qty: l.qty };
    });
    const order = {
      id: DB.uid(),
      userId: this.user.id,
      customerName: this.user.name,
      items,
      total: items.reduce((s, i) => s + i.price * i.qty, 0),
      note: $('#cart-note').value.trim(),
      status: 'pending',
      createdAt: Date.now(),
      doneAt: null,
    };
    DB.data.orders.push(order);
    DB.save();
    this.cart = [];
    $('#cart-note').value = '';
    this.renderCart();
    this.updateBadges();
    $('#cart-drawer').classList.add('hidden');
    toast('🔔 Đã gửi đơn cho quán! Chờ xác nhận nhé.');
  },

  showMyOrders() {
    const list = DB.data.orders
      .filter(o => o.userId === this.user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);
    const box = $('#my-orders-list');
    if (!list.length) box.innerHTML = '<p class="empty-note">Bạn chưa đặt đơn nào.</p>';
    else box.innerHTML = list.map(o => {
      const st = ORDER_STATUS[o.status];
      return `<div class="ocard" style="margin-bottom:10px">
        <div class="ocard-head">
          <span class="status-tag ${st.cls}">${st.label}</span>
          <span class="ocard-id">${fmtTime(o.createdAt)}</span>
        </div>
        <div class="ocard-items">${o.items.map(i =>
          `<div><span>${esc(i.icon)} ${esc(i.name)} ×${i.qty}</span><span>${fmtVND(i.price * i.qty)}</span></div>`).join('')}</div>
        ${o.note ? `<div class="ocard-note">Ghi chú: <b>${esc(o.note)}</b></div>` : ''}
        <div class="ocard-total">${fmtVND(o.total)}</div>
        ${o.status === 'pending' ? `<div class="ocard-actions"><button class="btn btn-small btn-red" data-cancel="${o.id}">✕ Hủy đơn</button></div>` : ''}
      </div>`;
    }).join('');
    $$('[data-cancel]', box).forEach(b => b.onclick = () => {
      const o = DB.data.orders.find(o => o.id === b.dataset.cancel);
      if (o && o.status === 'pending') {
        o.status = 'cancelled';
        DB.save();
        toast('Đã hủy đơn.');
        this.showMyOrders();
        this.updateBadges();
      }
    });
    $('#my-orders-overlay').classList.remove('hidden');
  },
};
