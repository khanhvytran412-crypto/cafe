/* ============================================================
   Khởi động ứng dụng
   ============================================================ */
function showLogin() {
  $('#view-login').classList.remove('hidden');
  $('#view-customer').classList.add('hidden');
  $('#view-shop').classList.add('hidden');
  $('#login-user').value = '';
  $('#login-pass').value = '';
  $('#login-err').textContent = '';
}

function enterApp(user) {
  $('#view-login').classList.add('hidden');
  if (user.role === 'shop') {
    $('#view-shop').classList.remove('hidden');
    $('#view-customer').classList.add('hidden');
    Shop.init(user);
  } else {
    $('#view-customer').classList.remove('hidden');
    $('#view-shop').classList.add('hidden');
    Customer.init(user);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  DB.load();

  // logo trống đồng nhỏ trên thanh tiêu đề
  $$('[data-drum]').forEach(el => el.innerHTML = dongSonSVG(40));

  initLoginView();

  // đóng modal khi bấm ra ngoài
  $('#modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  $('#my-orders-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  // còn phiên đăng nhập thì vào thẳng
  const u = Auth.user();
  if (u) enterApp(u);
});
