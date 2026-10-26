// «Devor qanday quriladi»: skroll bilan boshqariladigan real 3D sahna (CSS 3D).
// Devor boʻlagi kameraga burilib turadi; qatlamlar Poly Haven skanerlari asosidagi teksturalar bilan
// bittalab tushadi. Har izoh koʻz bilan isbotlanadi:
//   grunt   — kesilgan qirrada nam chiziq ichkariga oʻsadi (chuqur singish), yonida chuqurlik oʻlchagichi
//   H       — qatlam qalinligi oʻlchagichi «5 mm gacha»
//   mato    — toʻr tolalari koʻrinib turadi
//   F       — «2 mm gacha» + silliq sirt ustidan yon nur oʻtadi, soya chiqmaydi
//   boʻyoq  — valik ikki marta oʻtadi: 1-qatlam och va notekis, 2-qatlam toʻliq
(() => {
  const bolim = document.querySelector('.ish');
  const sahna = bolim && bolim.querySelector('.ish-3d');
  if (!sahna) return;
  const R = JSON.parse(sahna.dataset.rasm);
  const B = JSON.parse(sahna.dataset.qatlam || '{}');
  const harakat = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const yozuvlar = [...bolim.querySelectorAll('.ish-yozuv')];
  const nuqtalar = [...bolim.querySelectorAll('[data-borish]')];

  // ---- oʻlchamlar (px, 640×520 sahna ichida) ----
  const SW = 640, SH = 520, W = 400, H = 340;
  const Z = { beton: [-150, 0], h: [0, 18], mato: [18, 20], f: [20, 26], b1: [26, 28], b2: [28, 30] };
  const div = (cls, ota, css = {}) => { const e = document.createElement('div'); e.className = cls; Object.assign(e.style, css); ota.appendChild(e); return e; };
  const fon = (url) => `url("${url}")`;

  const olcham = div('ish-olcham', sahna, { width: `${SW}px`, height: `${SH}px` });
  div('ish-pol', olcham);
  const kamera = div('ish-kamera', olcham);
  const kub = div('ish-kub', kamera, { width: `${W}px`, height: `${H}px` });
  const ustki = div('ish-ustki', olcham);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('class', 'ish-chizgi');
  ustki.appendChild(svg);

  // quti: old, tepa (yuqori qirra), oʻng (oʻng qirra)
  const quti = (nom, [z0, z1], oldFon, qirraFon) => {
    const t = z1 - z0;
    const g = div(`qt qt-${nom}`, kub);
    const old = div('yuz yuz-old', g, { width: `${W}px`, height: `${H}px`, transform: `translateZ(${z1}px)`, backgroundImage: oldFon });
    const tepa = div('yuz yuz-tepa', g, { width: `${W}px`, height: `${t}px`, transform: `translateZ(${z0}px) rotateX(90deg)`, backgroundImage: qirraFon });
    const ong = div('yuz yuz-ong', g, { width: `${t}px`, height: `${H}px`, transform: `translate3d(${W}px, 0, ${z1}px) rotateY(90deg)`, backgroundImage: qirraFon });
    return { g, old, tepa, ong, z0, z1 };
  };
  const beton = quti('beton', Z.beton, fon(R.beton), fon(R.kesim));
  // grunt: devor yuzi namlanadi (alohida qatlam emas — beton ichiga singadi)
  const nam = div('yuz yuz-old yuz-nam', beton.g, { width: `${W}px`, height: `${H}px`, transform: 'translateZ(.6px)', backgroundImage: fon(R.nam) });
  const singTepa = div('singish singish-tepa', beton.tepa);
  const singOng = div('singish singish-ong', beton.ong);
  const h = quti('h', Z.h, fon(R.h), fon(R.h));
  const mato = quti('mato', Z.mato, `${fon(R.mato)}, ${fon(R.h)}`, 'linear-gradient(#F4F4F0, #E6E6E0)');
  mato.old.style.backgroundSize = '120px 120px, cover';
  const f = quti('f', Z.f, fon(R.f), fon(R.f));
  const nur = div('nur', f.old);
  const b1 = quti('b1', Z.b1, fon(R.boyoq), fon(R.boyoq));
  const b2 = quti('b2', Z.b2, fon(R.boyoq), fon(R.boyoq));
  const QATLAM = [null, null, h, mato, f, null];

  // 3D nuqtani ekranga oʻgirish — CSS bilan bir xil matematika (.ish-kub: left 64, top 100,
  // rotateX(-16deg) rotateY(-32deg), markaz 50% 50%; .ish-kamera: perspective 1500px, origin 45% 30%).
  // DOM oʻlchanmaydi: har kadrda majburiy layout yoʻq, telefonda skroll silliq qoladi.
  const AX = -16 * Math.PI / 180, AY = -32 * Math.PI / 180, PD = 1500, PO = [0.45 * SW, 0.3 * SH];
  const cX = Math.cos(AX), sX = Math.sin(AX), cY = Math.cos(AY), sY = Math.sin(AY);
  const ekran = (_i, x, y, z) => {
    const px = x - W / 2, py = y - H / 2;
    const x1 = px * cY + z * sY, z1 = -px * sY + z * cY;           // rotateY
    const y2 = py * cX - z1 * sX, z2 = py * sX + z1 * cX;           // rotateX
    const sx = 64 + W / 2 + x1, sy = 100 + H / 2 + y2;
    const f = PD / (PD - z2);
    return [PO[0] + (sx - PO[0]) * f, PO[1] + (sy - PO[1]) * f];
  };

  // ---- asboblar (realistik SVG) ----
  const asbob = div('ish-asbob', ustki);
  asbob.innerHTML = `
  <svg class="a-valik" viewBox="-110 -40 220 190" aria-hidden="true">
    <defs>
      <linearGradient id="av-tuk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tuk1,#F3F0E8)"/><stop offset=".45" stop-color="var(--tuk2,#E2DCCF)"/><stop offset="1" stop-color="var(--tuk3,#B9B1A1)"/></linearGradient>
      <linearGradient id="av-metall" x1="0" x2="1"><stop offset="0" stop-color="#E9ECEF"/><stop offset=".5" stop-color="#9AA3AB"/><stop offset="1" stop-color="#5E676F"/></linearGradient>
      <linearGradient id="av-dasta" x1="0" x2="1"><stop offset="0" stop-color="#3B4249"/><stop offset=".45" stop-color="#1B1F24"/><stop offset="1" stop-color="#0E1114"/></linearGradient>
      <filter id="av-tolali"><feTurbulence type="fractalNoise" baseFrequency=".9 .25" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <pattern id="av-aylan" width="192" height="14" patternUnits="userSpaceOnUse"><rect width="192" height="14" fill="none"/><path d="M0 3 H192" stroke="#000" stroke-opacity=".13" stroke-width="2.2"/><path d="M0 9.5 H192" stroke="#fff" stroke-opacity=".16" stroke-width="1.6"/></pattern>
      <clipPath id="av-tana"><rect x="-96" y="-24" width="192" height="40" rx="16"/></clipPath>
    </defs>
    <path d="M0 10 C0 40 6 52 34 64 L34 104" fill="none" stroke="url(#av-metall)" stroke-width="6" stroke-linecap="round"/>
    <rect x="25" y="98" width="18" height="50" rx="8" fill="url(#av-dasta)"/>
    <rect x="29" y="104" width="4" height="36" rx="2" fill="#fff" opacity=".18"/>
    <rect x="-96" y="-24" width="192" height="40" rx="16" fill="url(#av-tuk)"/>
    <rect x="-96" y="-24" width="192" height="40" rx="16" fill="#000" filter="url(#av-tolali)"/>
    <rect x="-96" y="-40" width="192" height="72" fill="url(#av-aylan)" clip-path="url(#av-tana)"/>
    <rect x="-96" y="-24" width="192" height="12" rx="10" fill="#fff" opacity=".22"/>
  </svg>
  <svg class="a-shpatel" viewBox="-110 -30 220 170" aria-hidden="true">
    <defs>
      <linearGradient id="as-tig" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="#F6F8F9"/><stop offset=".35" stop-color="#C3CBD2"/><stop offset=".55" stop-color="#EEF1F3"/><stop offset="1" stop-color="#8C969F"/></linearGradient>
      <linearGradient id="as-dasta" x1="0" x2="1"><stop offset="0" stop-color="#3B4249"/><stop offset=".5" stop-color="#16191D"/><stop offset="1" stop-color="#0B0D10"/></linearGradient>
      <filter id="as-tirnalgan"><feTurbulence type="fractalNoise" baseFrequency="2.2 .04" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .25 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    </defs>
    <path d="M-100 0 L100 0 L82 62 L-82 62 Z" fill="url(#as-tig)" stroke="#6E7882" stroke-width="1.2"/>
    <path d="M-100 0 L100 0 L82 62 L-82 62 Z" fill="#fff" filter="url(#as-tirnalgan)"/>
    <path d="M-100 0 C-60 -9 -20 -4 0 -8 C30 -12 70 -6 100 0 Z" fill="var(--material,#E3D5BE)"/>
    <path d="M-12 62 L12 62 L9 80 L-9 80 Z" fill="#59626B"/>
    <rect x="-13" y="78" width="26" height="62" rx="11" fill="url(#as-dasta)"/>
    <rect x="-7" y="86" width="5" height="44" rx="2.5" fill="#fff" opacity=".16"/>
  </svg>
  <svg class="a-rulon" aria-hidden="true">
    <defs>
      <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CBC4"/><stop offset=".22" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#ECEDE8"/><stop offset="1" stop-color="#A9ACA4"/></linearGradient>
      <pattern id="ar-tor" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5 H9 M4.5 0 V9" stroke="#AEB2AA" stroke-width="1"/></pattern>
      <radialGradient id="ar-uch"><stop offset="0" stop-color="#9C8F7A"/><stop offset=".3" stop-color="#9C8F7A"/><stop offset=".34" stop-color="#E4E5DF"/><stop offset="1" stop-color="#CFD1CA"/></radialGradient>
    </defs>
    <path class="ar-varaq" fill="url(#ar-tor)" opacity=".55"/>
    <rect class="ar-tana" fill="url(#ar)"/>
    <rect class="ar-tor" fill="url(#ar-tor)" opacity=".75"/>
    <ellipse class="ar-chap" fill="url(#ar-uch)"/>
    <ellipse class="ar-ong" fill="url(#ar-uch)"/>
  </svg>`;
  const aValik = asbob.querySelector('.a-valik');
  const aShpatel = asbob.querySelector('.a-shpatel');
  const aRulon = asbob.querySelector('.a-rulon');
  const avAylan = aValik.querySelector('#av-aylan');
  // valik: devor tekisligida yotadi va tik yoʻllar bilan yuqoriga-pastga yuradi (haqiqiy boʻyash kabi),
  // yangi boʻyalgan joyga qayta chiqib tushadi; tuklar valik yurgan sari aylanadi
  const valikQoy = (t, z, otish) => {
    const yol = otish * 5;                                   // 5 ta tik yoʻl, chapdan oʻngga
    const ichki = yol - Math.floor(yol);
    const x = W * (0.2 + 0.6 * Math.min(Math.floor(yol), 4) / 4) + 22 * Math.sin(ichki * Math.PI * 2);
    const tepa = H * t;
    const y = Math.max(tepa - 95 * Math.abs(Math.sin(ichki * Math.PI * 3)), 18);
    const [lx, ly] = ekran(0, x - 80, y, z);
    const [rx, ry] = ekran(2, x + 80, y, z);
    const ug = Math.atan2(ry - ly, rx - lx) * 180 / Math.PI;
    avAylan.setAttribute('patternTransform', `translate(0 ${((y * 1.3) % 14).toFixed(2)})`);
    asbob.style.transform = `translate(${((lx + rx) / 2).toFixed(1)}px, ${((ly + ry) / 2).toFixed(1)}px) rotate(${ug.toFixed(2)}deg)`;
  };
  const arTor = aRulon.querySelector('#ar-tor');
  const [arVaraq, arTana, arTorQ, arChap, arOng] = ['.ar-varaq', '.ar-tana', '.ar-tor', '.ar-chap', '.ar-ong'].map((s) => aRulon.querySelector(s));
  // rulon devor yuzida yotadi: ikki uchi devorning chap va oʻng qirrasiga tegadi, pastga dumalaganda
  // aylanadi (toʻr chiziqlari sirt bilan birga yuradi) va mato yoyilgan sari ingichkalashadi
  const rulonQoy = (pk, z) => {
    const y = H * pk;
    const [lx, ly] = ekran(0, -14, y, z);
    const [rx, ry] = ekran(2, W + 14, y, z);
    const L = Math.hypot(rx - lx, ry - ly), ug = Math.atan2(ry - ly, rx - lx);
    const r = 24 * (1 - 0.42 * pk);
    const yarim = L / 2;
    arTana.setAttribute('x', -yarim); arTana.setAttribute('y', -r); arTana.setAttribute('width', L); arTana.setAttribute('height', 2 * r);
    arTorQ.setAttribute('x', -yarim); arTorQ.setAttribute('y', -r); arTorQ.setAttribute('width', L); arTorQ.setAttribute('height', 2 * r);
    arTor.setAttribute('patternTransform', `translate(0 ${(-(y * 1.6) % 9).toFixed(2)})`);
    arChap.setAttribute('cx', -yarim); arChap.setAttribute('ry', r); arChap.setAttribute('rx', r * 0.34);
    arOng.setAttribute('cx', yarim); arOng.setAttribute('ry', r); arOng.setAttribute('rx', r * 0.34);
    // rulondan devorga tushayotgan tarang mato boʻlagi
    arVaraq.setAttribute('d', `M${-yarim + 4} ${-r * 0.2} L${yarim - 4} ${-r * 0.2} L${yarim - 10} ${-r - 16} L${-yarim + 10} ${-r - 16} Z`);
    asbob.style.transform = `translate(${((lx + rx) / 2).toFixed(1)}px, ${((ly + ry) / 2).toFixed(1)}px) rotate(${(ug * 180 / Math.PI).toFixed(2)}deg)`;
  };

  // ---- belgilar (oʻlchagich + yozuv) ----
  const el = (tag, attr) => { const e = document.createElementNS(NS, tag); Object.entries(attr).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); return e; };
  const qavs = el('path', { class: 'qavs', fill: 'none' });
  const tirgak = el('path', { class: 'tirgak', fill: 'none' });
  const pill = el('rect', { class: 'pill', rx: 14, height: 28 });
  const matn = el('text', { class: 'pill-matn' });
  const qavsChiz = (a, b, yozuv, yon = 1) => {
    // a—b orasida qavs (oʻlchagich), undan yozuvga chiziq
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * 14 * yon, ny = (dx / L) * 14 * yon;
    const a2 = [a[0] + nx, a[1] + ny], b2 = [b[0] + nx, b[1] + ny];
    qavs.setAttribute('d', `M${a[0] + nx * .4} ${a[1] + ny * .4} L${a2[0]} ${a2[1]} L${b2[0]} ${b2[1]} L${b[0] + nx * .4} ${b[1] + ny * .4}`);
    const m = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2];
    const lx = Math.min(m[0] + 36, SW - 10), ly = m[1] - 34;
    tirgak.setAttribute('d', `M${m[0]} ${m[1]} L${lx} ${ly}`);
    matn.textContent = yozuv;
    const en = (matn.getComputedTextLength && matn.getComputedTextLength()) || yozuv.length * 8;
    const px = Math.min(lx, SW - en - 30);
    pill.setAttribute('x', px); pill.setAttribute('y', ly - 14); pill.setAttribute('width', en + 24);
    matn.setAttribute('x', px + 12); matn.setAttribute('y', ly + 5);
    svg.classList.add('korinadi');
  };
  const belgiYashir = () => svg.classList.remove('korinadi');
  // ---- lupa: devor burchagidagi kesim kattalashtirib koʻrsatiladi (har izohning isboti) ----
  // chapdan oʻngga: beton | (grunt beton ichiga singadi) | H 5 mm | mato | F 2 mm | boʻyoq 2 qatlam
  const LX = 540, LY = 118, LR = 82, MM = 9;            // 1 mm = 9 px
  const ns = (tag, attr, ota = svg) => { const e = document.createElementNS(NS, tag); Object.entries(attr).forEach(([k, v]) => e.setAttribute(k, v)); ota.appendChild(e); return e; };
  const ldefs = ns('defs', {});
  ldefs.innerHTML = `
    <clipPath id="lupa-ichi"><circle cx="${LX}" cy="${LY}" r="${LR}"/></clipPath>
    <pattern id="lupa-beton" width="140" height="140" patternUnits="userSpaceOnUse"><image href="${R.kesim}" width="140" height="140" preserveAspectRatio="xMidYMid slice"/></pattern>
    <pattern id="lupa-mato" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#F7F7F2"/><circle cx="2" cy="2" r=".9" fill="#B9BCB5"/></pattern>
    <linearGradient id="lupa-sing" x1="1" x2="0"><stop offset="0" stop-color="#1E1810" stop-opacity=".85"/><stop offset=".7" stop-color="#1E1810" stop-opacity=".45"/><stop offset="1" stop-color="#1E1810" stop-opacity="0"/></linearGradient>`;
  const lupaTirgak = ns('path', { class: 'lupa-tirgak', fill: 'none' });
  const lupa = ns('g', { class: 'lupa' });
  ns('circle', { cx: LX, cy: LY, r: LR, fill: '#F4F5F2' }, lupa);
  const ichi = ns('g', { 'clip-path': 'url(#lupa-ichi)' }, lupa);
  const x0 = LX - LR, xH = LX - 34;                    // beton chegarasi (devor yuzi)
  const BANT = { h: [xH, 5 * MM], mato: [xH + 5 * MM, 2], f: [xH + 5 * MM + 2, 2 * MM], b1: [xH + 7 * MM + 2, 5], b2: [xH + 7 * MM + 7, 5] };
  ns('rect', { x: x0, y: LY - LR, width: xH - x0, height: LR * 2, fill: 'url(#lupa-beton)' }, ichi);
  const lSing = ns('rect', { y: LY - LR, height: LR * 2, fill: 'url(#lupa-sing)', width: 0, x: xH }, ichi);
  const strelka = ns('g', { class: 'lupa-strelka' }, ichi);
  [-50, -18, 14, 46].forEach((dy) => ns('path', { d: `M0 ${LY + dy} l-12 -8 m12 8 l-12 8`, fill: 'none' }, strelka));
  const lBant = {
    h: ns('rect', { y: LY - LR, height: LR * 2, fill: '#E3D3B6', width: 0, x: BANT.h[0] }, ichi),
    mato: ns('rect', { y: LY - LR, height: LR * 2, fill: 'url(#lupa-mato)', width: 0, x: BANT.mato[0] }, ichi),
    f: ns('rect', { y: LY - LR, height: LR * 2, fill: '#FAFAF7', width: 0, x: BANT.f[0] }, ichi),
    b1: ns('rect', { y: LY - LR, height: LR * 2, fill: '#9CC6C0', width: 0, x: BANT.b1[0] }, ichi),
    b2: ns('rect', { y: LY - LR, height: LR * 2, fill: '#6FA59E', width: 0, x: BANT.b2[0] }, ichi),
  };
  ns('path', { d: `M${xH} ${LY - LR} V${LY + LR}`, class: 'lupa-yuz' }, ichi);
  const olchov = ns('g', { class: 'lupa-olchov' }, lupa);
  ns('circle', { cx: LX, cy: LY, r: LR, class: 'lupa-halqa', fill: 'none' }, lupa);
  let olchovD = '';
  // yozuv eni bir marta oʻlchanadi (har kadrda SVG matnni qayta oʻlchash telefonda layoutni majburlaydi)
  const enlar = new Map();
  const matnEn = (yozuv) => {
    if (matn.textContent !== yozuv) matn.textContent = yozuv;
    if (!enlar.has(yozuv)) enlar.set(yozuv, (matn.getComputedTextLength && matn.getComputedTextLength()) || yozuv.length * 8);
    return enlar.get(yozuv);
  };
  const olchovChiz = (xa, xb, bolak) => {
    // shkala: ikki chet + har mm uchun belgi
    const y = LY - 30;
    let d = `M${xa} ${y - 8} V${y + 8} M${xb} ${y - 8} V${y + 8} M${xa} ${y} H${xb}`;
    for (let i = 1; i < bolak; i++) { const x = xa + ((xb - xa) * i) / bolak; d += ` M${x} ${y - 4} V${y + 4}`; }
    if (d !== olchovD) { olchov.innerHTML = `<path d="${d}"/>`; olchovD = d; }
  };


  // ---- holat ----
  const qoy = (q, p) => {
    q.g.style.setProperty('--p', p.toFixed(4));
    q.g.classList.toggle('bosh', p <= 0);
  };
  let oldingiFaol = -1;
  const holat = (s) => {
    const p = (k) => Math.min(Math.max(s - (k - 1), 0), 1);
    const p1 = p(1), p2 = p(2), p3 = p(3), p4 = p(4), p5 = p(5);
    // 1) grunt: yuz namlanadi, qirralarda singish chizigʻi ichkariga oʻsadi
    nam.style.setProperty('--p', p1.toFixed(4));
    const chuqurlik = 0.34 * (Z.beton[1] - Z.beton[0]);
    const d = (p1 > 0 ? 0.25 + 0.75 * Math.min(p1 * 1.4, 1) : 0) * chuqurlik;
    singTepa.style.height = `${d}px`;
    singOng.style.width = `${d}px`;
    singOng.style.setProperty('--p', p1.toFixed(4));
    qoy(h, p2); qoy(mato, p3); qoy(f, p4);
    qoy(b1, Math.min(p5 * 2, 1)); qoy(b2, Math.max(p5 * 2 - 1, 0));
    // F: silliq sirt ustidan yon nur (qadam oxirida)
    nur.style.setProperty('--x', `${(-30 + 160 * Math.min(Math.max((p4 - 0.55) / 0.45, 0), 1)).toFixed(1)}%`);
    nur.style.opacity = p4 > 0.55 && p4 < 1 ? '1' : '0';

    const faol = Math.min(Math.max(Math.ceil(s), 1), 6);
    const k = Math.min(faol, 5);
    const pk = p(k);
    // asbob
    const ishda = s < 5 && pk > 0.002 && pk < 0.998;
    asbob.classList.toggle('faol', ishda);
    [aValik, aShpatel, aRulon].forEach((a) => a.classList.remove('bu'));
    if (ishda) {
      const z1 = (k === 1 ? 0 : (k === 5 ? (pk < .5 ? Z.b1[1] : Z.b2[1]) : QATLAM[k].z1)) + 3;
      const yOtish = k === 5 ? (pk < .5 ? pk * 2 : pk * 2 - 1) : pk;
      const tebranish = k === 3 ? 0.5 : 0.5 + 0.36 * Math.sin(yOtish * Math.PI * (k === 5 ? 6 : 7));
      const [ax, ay] = ekran(0, W * tebranish, H * yOtish, z1);
      const a = k === 1 || k === 5 ? aValik : k === 3 ? aRulon : aShpatel;
      a.classList.add('bu');
      if (a === aValik) {
        aValik.style.setProperty('--tuk1', k === 5 ? '#A9D0CA' : '#EEEBE4');
        aValik.style.setProperty('--tuk2', k === 5 ? '#8DBDB6' : '#DCD7CD');
        aValik.style.setProperty('--tuk3', k === 5 ? '#5F948D' : '#B4AD9E');
      }
      if (a === aShpatel) aShpatel.style.setProperty('--material', k === 2 ? '#E3D3B6' : '#F7F7F4');
      if (a === aRulon) rulonQoy(pk, z1);
      else if (a === aValik) valikQoy(yOtish, z1, yOtish);
      else {
        const egil = a === aShpatel ? Math.cos(yOtish * Math.PI * 7) * 9 - 6 : -4;
        asbob.style.transform = `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px) rotate(${egil.toFixed(1)}deg)`;
      }
    }
    // izohni isbotlovchi lupa + yozuv
    const singEn = p1 > 0 ? 6 + 34 * p1 : 0;
    lSing.setAttribute('x', xH - singEn); lSing.setAttribute('width', singEn);
    strelka.setAttribute('transform', `translate(${(xH - 4 - singEn * 0.75).toFixed(1)} 0)`);
    strelka.style.opacity = k === 1 && s < 1 ? 1 : 0;
    lBant.h.setAttribute('width', BANT.h[1] * p2);
    lBant.mato.setAttribute('width', BANT.mato[1] * (p3 > 0 ? 1 : 0));
    lBant.f.setAttribute('width', BANT.f[1] * p4);
    lBant.b1.setAttribute('width', BANT.b1[1] * Math.min(p5 * 2, 1));
    lBant.b2.setAttribute('width', BANT.b2[1] * Math.max(p5 * 2 - 1, 0));
    if (s > 0.12 && s < 5.45) {
      let yozuv = '';
      if (k === 1) { olchovChiz(xH - singEn, xH, 1); yozuv = B.singish; }
      else if (k === 2) { olchovChiz(BANT.h[0], BANT.h[0] + BANT.h[1], 5); yozuv = B.h; }
      else if (k === 3) { olchovChiz(BANT.mato[0] - 3, BANT.mato[0] + 5, 1); yozuv = B.mato; }
      else if (k === 4) { olchovChiz(BANT.f[0], BANT.f[0] + BANT.f[1], 2); yozuv = pk > 0.6 ? B.nur : B.f; }
      else { olchovChiz(BANT.b1[0], BANT.b1[0] + (pk < 0.5 ? 5 : 10), pk < 0.5 ? 1 : 2); yozuv = pk < 0.5 ? B.qatlam1 : B.qatlam2; }
      // lupa devorning yuqori-oʻng burchagiga tortilgan
      const zk = k === 1 ? 0 : k === 2 ? Z.h[1] : k === 3 ? Z.mato[1] : k === 4 ? Z.f[1] : Z.b2[1];
      const [cx, cy] = ekran(1, W, 0, zk);
      const ug = Math.atan2(cy - LY, cx - LX);
      lupaTirgak.setAttribute('d', `M${cx.toFixed(1)} ${cy.toFixed(1)} L${(LX + Math.cos(ug) * LR).toFixed(1)} ${(LY + Math.sin(ug) * LR).toFixed(1)}`);
      const en = matnEn(yozuv || '');
      const px = Math.min(Math.max(LX - en / 2 - 12, 4), SW - en - 28);
      pill.setAttribute('x', px); pill.setAttribute('y', LY + LR + 10); pill.setAttribute('width', en + 24);
      matn.setAttribute('x', px + 12); matn.setAttribute('y', LY + LR + 29);
      qavs.setAttribute('d', ''); tirgak.setAttribute('d', '');
      svg.classList.add('korinadi');
    } else belgiYashir();
    sahna.classList.toggle('tayyor', s >= 5.6);
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

  // sahnani konteyner eniga moslash
  const moslash = () => {
    const k = sahna.clientWidth / SW;
    olcham.style.transform = `scale(${k})`;
    sahna.style.height = `${SH * k}px`;
  };
  moslash();
  addEventListener('resize', moslash);

  // harakat cheklangan yoki ekran juda past (yotiq telefon) — tayyor devor va roʻyxat
  if (!harakat || innerHeight < 520) { holat(6); return; }

  bolim.classList.add('ish-jonli');
  const s_dan = () => {
    const r = bolim.getBoundingClientRect();
    const jami = bolim.offsetHeight - innerHeight;
    return Math.min(Math.max(-r.top / jami, 0), 1) * 6;
  };
  let kutish = false;
  const yangila = () => { kutish = false; holat(s_dan()); };
  addEventListener('scroll', () => { if (!kutish) { kutish = true; requestAnimationFrame(yangila); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(() => { moslash(); yangila(); }));
  nuqtalar.forEach((n) => n.addEventListener('click', () => {
    const i = Number(n.dataset.borish);
    const jami = bolim.offsetHeight - innerHeight;
    scrollTo({ top: bolim.getBoundingClientRect().top + scrollY + ((i - 0.25) / 6) * jami, behavior: 'smooth' });
  }));
  bolim.style.setProperty('--ish-ekran', 6.4);
  yangila();
})();
