// «Devor qanday quriladi»: skroll bilan boshqariladigan motion graphics.
// Ekran qotadi, 3D devor boʻlagiga qatlamlar bittalab tushadi (grunt → H → mato → F → boʻyoq).
// Devor qiyshiq (kabinet) proyeksiyada: chuqurlik oʻngga-yuqoriga ketadi, shuning uchun
// har qatlamning yuqori va oʻng qirrasi «tort kesimi»dek koʻrinadi.
(() => {
  const bolim = document.querySelector('.ish');
  if (!bolim) return;
  const svg = bolim.querySelector('.ish-svg');
  const NS = 'http://www.w3.org/2000/svg';
  const harakat = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const belgilar = JSON.parse(bolim.dataset.belgi || '[]');
  const yozuvlar = [...bolim.querySelectorAll('.ish-yozuv')];
  const nuqtalar = [...bolim.querySelectorAll('[data-borish]')];

  // ---- geometriya ----
  const W = 330, H = 360, OX = 175, OY = 120, K1 = 0.75, K2 = 0.55;
  const P = (x, y, z) => [OX + x - z * K1, OY + y + z * K2];
  const nuq = (...pp) => pp.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const el = (tag, attr = {}, ota = svg) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attr).forEach(([k, v]) => e.setAttribute(k, v));
    ota.appendChild(e);
    return e;
  };

  // ---- naqshlar ----
  const defs = el('defs');
  defs.innerHTML = `
    <filter id="ish-shovqin" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <linearGradient id="ish-beton" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ABA79F"/><stop offset="1" stop-color="#8E8A82"/></linearGradient>
    <linearGradient id="ish-h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ECE0CB"/><stop offset="1" stop-color="#DCCDB2"/></linearGradient>
    <pattern id="ish-mato" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#F7F7F3"/>
      <path d="M0 8 L16 8 M8 0 L8 16" stroke="#C9CBC4" stroke-width="1.2"/>
      <path d="M0 0 L16 16" stroke="#E0E1DB" stroke-width=".8"/>
    </pattern>
    <linearGradient id="ish-f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEEEEA"/></linearGradient>
    <linearGradient id="ish-boyoq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9CC9C3"/><stop offset="1" stop-color="#6FA59E"/></linearGradient>
    <linearGradient id="ish-soya" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;

  // ---- qatlamlar ----
  // z0..z1 — chuqurlik (koʻrsatish uchun qalinlik kattalashtirilgan)
  const QATLAM = [
    { z0: -70, z1: 0, old: 'url(#ish-beton)', tepa: '#C4C0B8', ong: '#77736C', shovqin: true },
    { z0: 0, z1: 3, old: 'rgba(96,90,82,.42)', tepa: '#A9A397', ong: '#6E695F' },
    { z0: 3, z1: 19, old: 'url(#ish-h)', tepa: '#F2E9D8', ong: '#C3B193', shovqin: true },
    { z0: 19, z1: 22, old: 'url(#ish-mato)', tepa: '#FFFFFF', ong: '#D3D4CD' },
    { z0: 22, z1: 28, old: 'url(#ish-f)', tepa: '#FFFFFF', ong: '#D9D9D3' },
    { z0: 28, z1: 31, old: 'url(#ish-boyoq)', tepa: '#B5D6D1', ong: '#4C847E' },
  ];
  // polda soya
  el('ellipse', { cx: OX + W / 2 + 10, cy: OY + H + 28, rx: W * 0.62, ry: 22, fill: 'url(#ish-soya)' });
  const qismlar = QATLAM.map((q, i) => {
    const g = el('g', { class: `ish-q ish-q${i}` });
    const ong = el('polygon', { fill: q.ong }, g);
    const tepa = el('polygon', { fill: q.tepa }, g);
    const old = el('rect', { fill: q.old }, g);
    const sh = q.shovqin ? el('rect', { fill: '#000', filter: 'url(#ish-shovqin)', opacity: '.55' }, g) : null;
    return { q, g, ong, tepa, old, sh };
  });
  // betondagi yoriq va chuqurchalar (H qatlami ularni yopadi)
  const nuqson = el('g', { class: 'ish-nuqson', fill: 'none', stroke: '#3A3833', 'stroke-width': '2', 'stroke-linecap': 'round', opacity: '.8' });
  const [fx, fy] = P(0, 0, 0);
  nuqson.innerHTML = `
    <path d="M${fx + 60} ${fy} l14 40 l-8 30 l22 46 l-6 30 l20 40"/>
    <path d="M${fx + W} ${fy + 120} l-36 14 l-10 30 l-40 18 l-14 34"/>
    <path d="M${fx + 150} ${fy + H} l10 -40 l-14 -30 l22 -36"/>
    <g fill="#4A4741" stroke="none"><circle cx="${fx + 200}" cy="${fy + 80}" r="6"/><circle cx="${fx + 90}" cy="${fy + 250}" r="8"/><circle cx="${fx + 260}" cy="${fy + 300}" r="5"/><circle cx="${fx + 120}" cy="${fy + 170}" r="4"/></g>`;
  // nuqsonlar beton bilan grunt orasida chiziladi
  svg.insertBefore(nuqson, qismlar[1].g);

  // ---- asboblar ----
  const asbob = el('g', { class: 'ish-asbob', opacity: '0' });
  const valik = el('g', {}, asbob);
  valik.innerHTML = `
    <path d="M0 0 L0 26 L30 44 L30 92" fill="none" stroke="#5C6670" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="22" y="88" width="16" height="36" rx="7" fill="#C9A86E"/>
    <rect class="valik-mo" x="-62" y="-14" width="124" height="28" rx="13" fill="#EDEAE3" stroke="#9C9586" stroke-width="1.5"/>`;
  const shpatel = el('g', {}, asbob);
  shpatel.innerHTML = `
    <path d="M-60 -6 L60 -6 L48 34 L-48 34 Z" fill="#C7CED5" stroke="#6F7A84" stroke-width="1.5"/>
    <path d="M-60 -6 L60 -6" stroke="#fff" stroke-width="2.5"/>
    <rect x="-10" y="34" width="20" height="44" rx="8" fill="#15191E"/>`;
  const rulon = el('g', {}, asbob);
  rulon.innerHTML = `
    <rect x="-170" y="-12" width="340" height="24" rx="12" fill="#F4F4F0" stroke="#BFC1BA" stroke-width="1.5"/>
    <ellipse cx="-170" cy="0" rx="5" ry="12" fill="#D8D9D3"/><ellipse cx="170" cy="0" rx="5" ry="12" fill="#E7E8E2"/>`;

  // ---- belgi (qalinlik koʻrsatkichi) ----
  const belgi = el('g', { class: 'ish-belgi', opacity: '0' });
  const chiziq = el('polyline', { fill: 'none', stroke: '#15191E', 'stroke-width': '1.5' }, belgi);
  const nuqta = el('circle', { r: '4', fill: '#8A6A33' }, belgi);
  const fon = el('rect', { rx: '13', height: '26', fill: '#15191E' }, belgi);
  const yozuv = el('text', { fill: '#fff', 'font-family': 'Onest Variable, sans-serif', 'font-weight': '700', 'font-size': '14' }, belgi);
  // tayyor belgisi
  const tayyor = el('g', { class: 'ish-tayyor', opacity: '0' });
  tayyor.innerHTML = `<circle r="30" fill="#8A6A33"/><path d="M-12 1 l8 8 l16 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const [tx, ty] = P(W - 40, 40, 31);
  tayyor.setAttribute('transform', `translate(${tx} ${ty})`);

  // ---- chizish ----
  const qatlamChiz = (k, p) => {
    const { q, ong, tepa, old, sh, g } = qismlar[k];
    const ph = H * p;
    g.style.display = p <= 0 ? 'none' : '';
    if (p <= 0) return;
    const [x, y] = P(0, 0, q.z1);
    old.setAttribute('x', x); old.setAttribute('y', y); old.setAttribute('width', W); old.setAttribute('height', ph);
    if (sh) { sh.setAttribute('x', x); sh.setAttribute('y', y); sh.setAttribute('width', W); sh.setAttribute('height', ph); }
    tepa.setAttribute('points', nuq(P(0, 0, q.z0), P(W, 0, q.z0), P(W, 0, q.z1), P(0, 0, q.z1)));
    ong.setAttribute('points', nuq(P(W, 0, q.z0), P(W, ph, q.z0), P(W, ph, q.z1), P(W, 0, q.z1)));
  };
  const ASBOB = [null, valik, shpatel, rulon, shpatel, valik];
  let oldingiFaol = -1;
  const holat = (s) => {
    // s: 0…6 (1–5 — qatlamlar, 6 — tayyor)
    qatlamChiz(0, 1);
    for (let k = 1; k <= 5; k++) qatlamChiz(k, Math.min(Math.max(s - (k - 1), 0), 1));
    const faol = Math.min(Math.max(Math.ceil(s), 1), 6);
    const k = Math.min(faol, 5);
    const p = Math.min(Math.max(s - (k - 1), 0), 1);
    // asbob: qatlam chetida, chapga-oʻngga yuradi (mato rulon toʻliq en boʻylab tushadi)
    const ishda = s < 5 && p > 0.001 && p < 0.999;
    asbob.setAttribute('opacity', ishda ? '1' : '0');
    [valik, shpatel, rulon].forEach((a) => a.setAttribute('display', a === ASBOB[k] ? 'inline' : 'none'));
    if (ishda) {
      const q = QATLAM[k];
      const x = k === 3 ? W / 2 : W * (0.5 + 0.38 * Math.sin(p * Math.PI * 7));
      const [ax, ay] = P(x, H * p, q.z1 + 4);
      const egil = k === 2 || k === 4 ? Math.cos(p * Math.PI * 7) * 10 : 0;
      asbob.setAttribute('transform', `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${egil.toFixed(1)})`);
      const mo = valik.querySelector('.valik-mo');
      mo.setAttribute('fill', k === 5 ? '#7FB3AD' : '#EDEAE3');
    }
    // qalinlik belgisi: faol qatlamning oʻng qirrasidan chiqadi
    if (s > 0.15 && s < 5.4) {
      const q = QATLAM[k];
      const [bx, by] = P(W, Math.min(H * 0.18, H * Math.max(p, 0.05)), (q.z0 + q.z1) / 2);
      const lx = bx + 46, ly = by - 34;
      chiziq.setAttribute('points', nuq([bx, by], [lx, ly], [lx + 14, ly]));
      nuqta.setAttribute('cx', bx); nuqta.setAttribute('cy', by);
      yozuv.textContent = belgilar[k - 1] || '';
      const en = yozuv.getComputedTextLength ? yozuv.getComputedTextLength() : 80;
      fon.setAttribute('x', lx + 14); fon.setAttribute('y', ly - 13); fon.setAttribute('width', en + 22);
      yozuv.setAttribute('x', lx + 25); yozuv.setAttribute('y', ly + 5);
      belgi.setAttribute('opacity', '1');
    } else belgi.setAttribute('opacity', '0');
    tayyor.setAttribute('opacity', s >= 5.6 ? '1' : '0');
    // yozuvlar va nuqtalar
    if (faol !== oldingiFaol) {
      yozuvlar.forEach((y) => y.classList.toggle('faol', Number(y.dataset.i) === faol));
      nuqtalar.forEach((n) => {
        const i = Number(n.dataset.borish);
        n.classList.toggle('faol', i === faol);
        n.classList.toggle('otdi', i < faol);
        n.setAttribute('aria-current', i === faol ? 'step' : 'false');
      });
      oldingiFaol = faol;
    }
  };

  // harakat cheklangan yoki ekran juda past (yotiq telefon) — tayyor kesim va roʻyxat
  if (!harakat || innerHeight < 520) { holat(6); return; }

  // ---- skroll ----
  bolim.classList.add('ish-jonli');
  const QADAMLAR = 6.4;            // boʻlim balandligi: ekranlar soni
  const s_dan = () => {
    const r = bolim.getBoundingClientRect();
    const jami = bolim.offsetHeight - innerHeight;
    const u = Math.min(Math.max(-r.top / jami, 0), 1);
    return u * 6;
  };
  let kutish = false;
  const yangila = () => { kutish = false; holat(s_dan()); };
  addEventListener('scroll', () => { if (!kutish) { kutish = true; requestAnimationFrame(yangila); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(yangila));
  nuqtalar.forEach((n) => n.addEventListener('click', () => {
    const i = Number(n.dataset.borish);
    const jami = bolim.offsetHeight - innerHeight;
    const top = bolim.getBoundingClientRect().top + scrollY + ((i - 0.25) / 6) * jami;
    scrollTo({ top, behavior: 'smooth' });
  }));
  bolim.style.setProperty('--ish-ekran', QADAMLAR);
  yangila();
})();
