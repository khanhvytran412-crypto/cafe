/* ============================================================
   Đăng nhập / đăng ký / phiên làm việc
   (Demo chạy hoàn toàn trên trình duyệt — mật khẩu lưu dạng
   thường trong localStorage, KHÔNG dùng cho môi trường thật)
   ============================================================ */
const SESSION_KEY = 'lacviet_session';

const Auth = {
  currentRole: 'customer', // tab đang chọn ở màn hình đăng nhập

  user() {
    const id = localStorage.getItem(SESSION_KEY);
    return DB.data.users.find(u => u.id === id) || null;
  },

  login(username, password) {
    const u = DB.data.users.find(u => u.u === username.trim() && u.p === password);
    if (!u) return { err: 'Sai tên đăng nhập hoặc mật khẩu!' };
    if (u.role !== this.currentRole) {
      return { err: u.role === 'shop' ? 'Đây là tài khoản chủ quán — hãy chọn tab "Chủ quán".' : 'Đây là tài khoản khách — hãy chọn tab "Khách hàng".' };
    }
    localStorage.setItem(SESSION_KEY, u.id);
    return { user: u };
  },

  register(name, username, password) {
    username = username.trim();
    if (!name.trim() || !username || !password) return { err: 'Điền đủ thông tin nhé!' };
    if (username.length < 3) return { err: 'Tên đăng nhập tối thiểu 3 ký tự.' };
    if (password.length < 6) return { err: 'Mật khẩu tối thiểu 6 ký tự.' };
    if (DB.data.users.some(u => u.u === username)) return { err: 'Tên đăng nhập đã tồn tại.' };
    const u = { id: DB.uid(), u: username, p: password, name: name.trim(), role: 'customer' };
    DB.data.users.push(u);
    DB.save();
    localStorage.setItem(SESSION_KEY, u.id);
    return { user: u };
  },

  logout() { localStorage.removeItem(SESSION_KEY); },
};

function initLoginView() {
  // vẽ trống đồng
  $('#login-drum').innerHTML = dongSonSVG(150);

  $$('.role-tab').forEach(tab => {
    tab.onclick = () => {
      $$('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Auth.currentRole = tab.dataset.role;
      $('#register-box').classList.toggle('hidden', Auth.currentRole !== 'customer');
      $('#login-err').textContent = '';
    };
  });

  $('#login-form').onsubmit = e => {
    e.preventDefault();
    const r = Auth.login($('#login-user').value, $('#login-pass').value);
    if (r.err) { $('#login-err').textContent = r.err; return; }
    enterApp(r.user);
  };

  $('#btn-show-register').onclick = () => {
    openModal('✚ Tạo tài khoản khách', `
      <label>Tên của bạn</label>
      <input type="text" id="reg-name" placeholder="vd: Nguyễn Văn A">
      <label>Tên đăng nhập</label>
      <input type="text" id="reg-user" placeholder="vd: vana">
      <label>Mật khẩu (≥ 6 ký tự)</label>
      <input type="password" id="reg-pass">
      <p class="form-err" id="reg-err"></p>`,
      `<button class="btn btn-green" id="btn-do-register">✔ Đăng ký & vào quán</button>`);
    $('#btn-do-register').onclick = () => {
      const r = Auth.register($('#reg-name').value, $('#reg-user').value, $('#reg-pass').value);
      if (r.err) { $('#reg-err').textContent = r.err; return; }
      closeModal();
      toast('Chào mừng ' + r.user.name + ' đến với quán! 🎉');
      enterApp(r.user);
    };
  };
}
