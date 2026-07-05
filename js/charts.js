/* ============================================================
   Biểu đồ cột pixel — thuần HTML/CSS, có tooltip khi rê chuột
   series: [{key, label, color}] — 1 series thì không cần chú thích
   buckets: [{label, full, ...values}]
   ============================================================ */
function renderBarChart(container, buckets, series, opts) {
  opts = opts || {};
  const max = Math.max(1, ...buckets.flatMap(b => series.map(s => b[s.key] || 0)));
  // làm tròn trần trục Y lên số "đẹp"
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const yMax = Math.ceil(max / mag) * mag;

  let html = '';
  if (opts.title) html += `<div class="chart-title">${esc(opts.title)}</div>`;
  if (series.length > 1) {
    html += `<div class="chart-legend">` + series.map(s =>
      `<span class="lg"><span class="sw" style="background:${s.color}"></span>${esc(s.label)}</span>`).join('') + `</div>`;
  }

  html += `<div class="chart-area"><div class="chart-grid">`;
  for (let i = 0; i <= 4; i++) {
    const v = yMax * (1 - i / 4);
    html += `<div class="chart-gridline" style="top:${(i / 4) * 100}%"><span>${fmtShort(v)}</span></div>`;
  }
  html += `</div><div class="chart-cols">`;

  buckets.forEach((b, bi) => {
    html += `<div class="chart-col" data-bi="${bi}">`;
    for (const s of series) {
      const h = Math.max(((b[s.key] || 0) / yMax) * 100, (b[s.key] || 0) > 0 ? 1 : 0);
      html += `<div class="chart-bar" style="height:${h.toFixed(2)}%;background:${s.color}"></div>`;
    }
    html += `</div>`;
  });

  html += `</div><div class="chart-xlabels">` +
    buckets.map(b => `<span>${esc(b.label)}</span>`).join('') +
    `</div></div>`;

  container.innerHTML = html;

  // màn hình hẹp: thưa bớt nhãn trục X cho khỏi dính nhau
  const labels = container.querySelectorAll('.chart-xlabels span');
  const step = Math.ceil((buckets.length * 40) / Math.max(container.clientWidth - 44, 1));
  if (step > 1) labels.forEach((el, i) => {
    if ((buckets.length - 1 - i) % step !== 0) el.style.visibility = 'hidden';
  });

  // tooltip
  const area = container.querySelector('.chart-area');
  let tip = null;
  container.querySelectorAll('.chart-col').forEach(col => {
    col.addEventListener('mouseenter', () => {
      const b = buckets[+col.dataset.bi];
      tip = document.createElement('div');
      tip.className = 'chart-tip';
      tip.innerHTML = `<div class="tt-title">${esc(b.full || b.label)}</div>` +
        series.map(s => `<div class="tt-row"><span class="sw" style="background:${s.color}"></span>${esc(s.label)}: <b>${fmtVND(b[s.key] || 0)}</b></div>`).join('');
      area.appendChild(tip);
      const cr = col.getBoundingClientRect(), ar = area.getBoundingClientRect();
      let left = cr.left - ar.left + cr.width / 2 + 8;
      tip.style.top = '6px';
      tip.style.left = left + 'px';
      // tránh tràn phải
      const tw = tip.getBoundingClientRect().width;
      if (left + tw > ar.width) tip.style.left = (cr.left - ar.left - tw - 8) + 'px';
    });
    col.addEventListener('mouseleave', () => { if (tip) { tip.remove(); tip = null; } });
  });
}
