/* ============================================================
   UI helpers: toast, modal, SVG trống đồng, escape
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

/* ---------- toast ---------- */
function toast(msg, isErr) {
  const box = $('#toast-box');
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* ---------- modal dùng chung ---------- */
function openModal(title, bodyHTML, actionsHTML) {
  const panel = $('#modal-panel');
  panel.innerHTML = `
    <div class="modal-head"><h3>${title}</h3>
      <button class="btn btn-small btn-red" data-close-modal>✕</button></div>
    <div class="modal-body">${bodyHTML}</div>
    ${actionsHTML ? `<div class="modal-actions">${actionsHTML}</div>` : ''}`;
  $('#modal-overlay').classList.remove('hidden');
  panel.querySelector('[data-close-modal]').onclick = closeModal;
}
function closeModal() { $('#modal-overlay').classList.add('hidden'); }

function confirmModal(title, msg, onYes) {
  openModal(title, `<p>${msg}</p>`,
    `<button class="btn" data-close-modal2>Không</button>
     <button class="btn btn-red" data-yes>Đồng ý</button>`);
  $('#modal-panel [data-close-modal2]').onclick = closeModal;
  $('#modal-panel [data-yes]').onclick = () => { closeModal(); onYes(); };
}

/* ---------- SVG trống đồng Đông Sơn ---------- */
// Mặt trống: sao nhiều cánh ở giữa, vòng tròn đồng tâm, chim Lạc bay quanh
function dongSonSVG(size) {
  const c = 60, pts = [];
  const spikes = 12, rOut = 22, rIn = 10;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push((c + r * Math.cos(a)).toFixed(1) + ',' + (c + r * Math.sin(a)).toFixed(1));
  }
  // chim Lạc cách điệu
  const bird = `M0,0 q6,-7 14,-5 q7,2 12,-3 l-4,7 q-7,5 -14,3 q-6,-1 -8,-2 z`;
  let birds = '';
  for (let i = 0; i < 4; i++) {
    birds += `<g transform="rotate(${i * 90} ${c} ${c}) translate(${c - 13} ${c - 44})">
      <path d="${bird}" fill="var(--bronze-hi, #e3a95c)"/></g>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-label="Trống đồng Đông Sơn" role="img">
    <circle cx="${c}" cy="${c}" r="57" fill="#2a1f14" stroke="#b87333" stroke-width="5"/>
    <circle cx="${c}" cy="${c}" r="48" fill="none" stroke="#8a5a26" stroke-width="2" stroke-dasharray="4 4"/>
    <circle cx="${c}" cy="${c}" r="30" fill="none" stroke="#8a5a26" stroke-width="2"/>
    <circle cx="${c}" cy="${c}" r="26" fill="none" stroke="#b87333" stroke-width="1.5" stroke-dasharray="2 3"/>
    ${birds}
    <polygon points="${pts.join(' ')}" fill="#e3a95c" stroke="#b87333" stroke-width="2"/>
    <circle cx="${c}" cy="${c}" r="4" fill="#2a1f14"/>
  </svg>`;
}
