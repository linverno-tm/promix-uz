// Devor taʼmiri: eski devor 4 qadamda yangilanadi (canvas).
// Har qadamda asbob (valik yoki shpatel) devor boʻylab yuradi, keyingi qatlam faqat u oʻtgan izdan ochiladi.
(() => {
  const devor = document.querySelector('.devor');
  if (!devor) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const harakat = matchMedia('(prefers-reduced-motion: no-preference)');

  const canvas = $('.devor-canvas', devor);
  const ctx = canvas.getContext('2d');
  const yorliq = $('.devor-yorliq', devor);
  const bosqichNom = JSON.parse(devor.dataset.bosqich);
  const tugmalar = $$('.qadam-tugma');
  const valik = $('.asbob-valik', devor);
  const shpatel = $('.asbob-shpatel', devor);
  const qayta = $('[data-qayta]', devor);
  const solishtir = $('[data-solishtir]', devor);
  const kichik = devor.clientWidth * (window.devicePixelRatio || 1) < 1000;
  const manba = kichik ? devor.dataset.kichik : devor.dataset.katta;
  const W = kichik ? 720 : 1200;
  const H = W * 0.75;
  canvas.width = W;
  canvas.height = H;
  const yangi = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const niqob = yangi();
  const nctx = niqob.getContext('2d');
  const qatlam = yangi();
  const qctx = qatlam.getContext('2d');

  // Yoʻllar 0..1 koordinatada. Valik — tik ustunlar (zigzag), shpatel — yoylar va gorizontal tortishlar.
  const ustunlar = (n) => Array.from({ length: n }, (_, i) => {
    const x = (i + 0.5) / n;
    return i % 2 ? [[x, 1.08], [x, -0.08]] : [[x, -0.08], [x, 1.08]];
  });
  const yoylar = Array.from({ length: 7 }, (_, i) => {
    const y0 = -0.1 + i * 0.19;
    return Array.from({ length: 9 }, (_, k) => [-0.08 + k * 0.145, y0 + 0.32 - 0.32 * Math.sin((k / 8) * Math.PI * 0.9)]);
  });
  const qatorlar = Array.from({ length: 6 }, (_, i) => {
    const y = (i + 0.5) / 6;
    return i % 2 ? [[1.08, y + 0.02], [-0.08, y - 0.02]] : [[-0.08, y - 0.02], [1.08, y + 0.02]];
  });
  const QADAM = [
    null,
    { asbob: valik, yollar: ustunlar(6), en: (1 / 6) * 1.25, vaqt: 2600, rang: 'rgb(150 160 165 / .55)' },
    { asbob: shpatel, yollar: yoylar, en: 0.24, vaqt: 3000 },
    { asbob: shpatel, yollar: qatorlar, en: (1 / 6) * 1.3, vaqt: 2400 },
    { asbob: valik, yollar: ustunlar(6), en: (1 / 6) * 1.25, vaqt: 2600, rang: 'rgb(140 182 170 / .95)' },
  ];
  const rasmlar = [0, 1, 2, 3, 4].map((n) => new Promise((ok, xato) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => ok(im);
    im.onerror = xato;
    im.src = manba.replace('{n}', n);
  }));
  const hammaRasm = Promise.all(rasmlar).then((r) => { devor.classList.add('tayyor'); return r; });

  let ish = 0;        // joriy animatsiya raqami (eskisini toʻxtatish uchun)
  let joriy = 0;      // qaysi holat chizilgan
  let qolda = false;
  const chiz = (rasm) => ctx.drawImage(rasm, 0, 0, W, H);
  const belgila = (k, p = 0) => {
    tugmalar.forEach((t, i) => {
      t.setAttribute('aria-pressed', String(i + 1 === k));
      t.classList.toggle('bajarildi', i + 1 < k || (i + 1 === k && p >= 1));
      t.style.setProperty('--p', i + 1 < k ? 1 : i + 1 === k ? p : 0);
    });
    yorliq.textContent = bosqichNom[k] || bosqichNom[0];
    yorliq.classList.toggle('tayyor', k === 4 && p >= 1);
  };
  const asboblarniYashir = () => [valik, shpatel].forEach((a) => a.classList.remove('faol'));

  // yoʻl boʻyicha p ulushdagi nuqta va yoʻnalish
  const yolNuqta = (q, uzun, jami, p) => {
    let qoldiq = p * jami;
    let yi = 0;
    while (yi < q.yollar.length - 1 && qoldiq > uzun[yi]) { qoldiq -= uzun[yi]; yi++; }
    const y = q.yollar[yi];
    for (let i = 1; i < y.length; i++) {
      const d = Math.hypot(y[i][0] - y[i - 1][0], y[i][1] - y[i - 1][1]);
      if (qoldiq <= d || i === y.length - 1) {
        const f = d ? Math.min(qoldiq / d, 1) : 1;
        return {
          yi,
          x: y[i - 1][0] + (y[i][0] - y[i - 1][0]) * f,
          y: y[i - 1][1] + (y[i][1] - y[i - 1][1]) * f,
          burchak: Math.atan2((y[i][1] - y[i - 1][1]) * H, (y[i][0] - y[i - 1][0]) * W),
        };
      }
      qoldiq -= d;
    }
    return { yi, x: y[0][0], y: y[0][1], burchak: 0 };
  };

  // bitta qadamni oʻynatadi; true — oxirigacha yetdi
  const oyna = async (k, tez = false) => {
    const men = ++ish;
    const r = await hammaRasm;
    if (men !== ish) return false;
    solishtir.setAttribute('aria-pressed', 'false');
    const q = QADAM[k];
    asboblarniYashir();
    chiz(r[k - 1]);
    belgila(k, 0);
    if (tez || !harakat.matches) { chiz(r[k]); belgila(k, 1); joriy = k; return true; }
    nctx.clearRect(0, 0, W, H);
    nctx.lineCap = 'round';
    nctx.lineJoin = 'round';
    nctx.strokeStyle = '#000';
    nctx.lineWidth = q.en * W;
    const uzun = q.yollar.map((y) => y.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - y[i][0], p[1] - y[i][1]), 0));
    const jami = uzun.reduce((a, b) => a + b, 0);
    if (q.rang) q.asbob.style.setProperty('--valik-rang', q.rang);
    q.asbob.classList.add('faol');
    const bosh = performance.now();
    let oldingi = null;
    return new Promise((tugadi) => {
      const kadr = (vaqt) => {
        if (men !== ish) { tugadi(false); return; }
        const p = Math.min((vaqt - bosh) / q.vaqt, 1);
        const n = yolNuqta(q, uzun, jami, p);
        // niqobga yangi iz (bir yoʻl ichida uzluksiz chiziq)
        nctx.beginPath();
        if (oldingi && oldingi.yi === n.yi) nctx.moveTo(oldingi.x * W, oldingi.y * H);
        else nctx.moveTo(n.x * W, n.y * H);
        nctx.lineTo(n.x * W + 0.01, n.y * H);
        nctx.stroke();
        oldingi = n;
        // tarkib: oldingi holat + niqob boʻyicha yangi qatlam
        chiz(r[k - 1]);
        qctx.globalCompositeOperation = 'source-over';
        qctx.clearRect(0, 0, W, H);
        qctx.drawImage(r[k], 0, 0, W, H);
        qctx.globalCompositeOperation = 'destination-in';
        qctx.drawImage(niqob, 0, 0);
        ctx.drawImage(qatlam, 0, 0);
        // asbob: valik tik yuradi, shpatel tortish yoʻnalishiga koʻndalang turadi
        const ox = Math.min(Math.max(n.x, 0.05), 0.95) * 100;
        const oy = Math.min(Math.max(n.y, 0.05), 0.95) * 100;
        let aylan = 0;
        if (q.asbob === shpatel) {
          aylan = (n.burchak * 180) / Math.PI - 90;
          if (Math.cos(n.burchak) < 0) aylan += 180;
        }
        q.asbob.style.left = `${ox}%`;
        q.asbob.style.top = `${oy}%`;
        q.asbob.style.transform = `translate(-50%, -50%) rotate(${aylan}deg)`;
        belgila(k, p);
        if (p < 1) requestAnimationFrame(kadr);
        else { chiz(r[k]); asboblarniYashir(); joriy = k; tugadi(true); }
      };
      requestAnimationFrame(kadr);
    });
  };
  const hammasi = async () => {
    for (let k = 1; k <= 4; k++) {
      if (!(await oyna(k))) return;
      await new Promise((r) => setTimeout(r, 450));
    }
  };

  hammaRasm.then((r) => {
    if (joriy) return;
    if (harakat.matches) { chiz(r[0]); belgila(0); } else { chiz(r[4]); belgila(4, 1); joriy = 4; }
  });
  tugmalar.forEach((t) => t.addEventListener('click', () => { qolda = true; oyna(Number(t.dataset.qadam)); }));
  qayta.addEventListener('click', () => { qolda = true; hammasi(); });
  solishtir.addEventListener('click', async () => {
    const r = await hammaRasm;
    const bos = solishtir.getAttribute('aria-pressed') !== 'true';
    ish++;
    asboblarniYashir();
    solishtir.setAttribute('aria-pressed', String(bos));
    if (bos) { chiz(r[0]); yorliq.textContent = bosqichNom[0]; yorliq.classList.remove('tayyor'); }
    else { chiz(r[joriy || 4]); belgila(joriy || 4, 1); }
  });
  // koʻringanda oʻzi bir marta toʻliq koʻrsatadi
  if (harakat.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([y]) => {
      if (!y.isIntersecting || qolda) return;
      io.disconnect();
      setTimeout(() => { if (!qolda) hammasi(); }, 400);
    }, { threshold: 0.45 });
    io.observe(devor);
  }
})();
