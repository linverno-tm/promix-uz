// PROMIX Oʻzbekiston: menyu, shpaklyovka tanlagichi, katalog filtri, sarf hisobi, ariza.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const til = document.documentElement.lang;
  const harakat = matchMedia('(prefers-reduced-motion: no-preference)');

  // ---- Jonli hero: toʻkilayotgan shpaklyovka (faqat harakat cheklanmagan va trafik tejalmayotgan boʻlsa) ----
  const video = $('.hero2-video');
  if (video && harakat.matches && !(navigator.connection && navigator.connection.saveData)) {
    const tugma = $('.video-tugma');
    let qolda = false;
    video.src = matchMedia('(max-width: 899px)').matches ? video.dataset.kichik : video.dataset.katta;
    video.addEventListener('playing', () => video.classList.add('tayyor'), { once: true });
    const oyna = (ijro) => {
      tugma.textContent = ijro ? tugma.dataset.pauza : tugma.dataset.davom;
      tugma.setAttribute('aria-pressed', String(!ijro));
    };
    video.play().then(() => { tugma.hidden = false; oyna(true); }).catch(() => {});
    tugma.addEventListener('click', () => {
      qolda = !video.paused;
      if (video.paused) video.play(); else video.pause();
      oyna(!video.paused);
    });
    // koʻrinmay qolsa — protsessorni bekor band qilmaymiz
    new IntersectionObserver(([y]) => {
      if (qolda) return;
      if (y.isIntersecting) video.play().catch(() => {}); else video.pause();
    }).observe(video);
  }

  // ---- Raqam noldan sanaladi (koʻringanda) ----
  $$('[data-son]').forEach((el) => {
    if (!harakat.matches || !('IntersectionObserver' in window)) return;
    const n = Number(el.dataset.son);
    const io = new IntersectionObserver(([y]) => {
      if (!y.isIntersecting) return;
      io.disconnect();
      const bosh = performance.now();
      const qadam = (vaqt) => {
        const p = Math.min((vaqt - bosh) / 1100, 1);
        el.textContent = Math.round(n * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(qadam);
      };
      el.textContent = '0';
      requestAnimationFrame(qadam);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  // ---- Til almashganda oʻsha joyda qolish ----
  // Ikkala tildagi sahifalar bir xil shablondan: bloklar tartibi bir xil, shuning uchun
  // «nechanchi blok va uning qaysi qismi» saqlanadi (matn uzunligi farq qilsa ham joy siljimaydi).
  const langarlar = () => $$('main > *, main section');
  const tepa = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
  $$('a.til').forEach((a) => a.addEventListener('click', () => {
    const els = langarlar();
    const t = tepa();
    let idx = 0;
    els.forEach((el, i) => { if (el.getBoundingClientRect().top <= t) idx = i; });
    const r = els[idx].getBoundingClientRect();
    const ulush = r.height ? Math.min(Math.max((t - r.top) / r.height, 0), 1) : 0;
    try {
      sessionStorage.setItem('til-joy', JSON.stringify({ yol: new URL(a.href).pathname, idx, ulush, sx: scrollY }));
    } catch (e) { /* saqlab boʻlmasa — oddiy oʻtish */ }
  }));
  try {
    const joy = JSON.parse(sessionStorage.getItem('til-joy') || 'null');
    if (joy && joy.yol === location.pathname && !location.hash) {
      sessionStorage.removeItem('til-joy');
      if (joy.sx > 0) {
        // shrift va suratlar yuklangach bloklar balandligi oʻzgaradi — joyni bir necha marta tiklaymiz,
        // foydalanuvchi oʻzi aylantirsa toʻxtaymiz
        let qol = false;
        const toxta = () => { qol = true; };
        addEventListener('wheel', toxta, { once: true, passive: true });
        addEventListener('touchstart', toxta, { once: true, passive: true });
        addEventListener('keydown', toxta, { once: true });
        const joyla = () => {
          if (qol) return;
          const el = langarlar()[joy.idx];
          if (!el) return;
          const r = el.getBoundingClientRect();
          window.scrollTo({ top: scrollY + r.top + r.height * joy.ulush - tepa(), behavior: 'instant' });
        };
        joyla();
        if (document.fonts) document.fonts.ready.then(joyla);
        addEventListener('load', joyla, { once: true });
        if ('ResizeObserver' in window) {
          const ro = new ResizeObserver(joyla);
          ro.observe(document.body);
          setTimeout(() => ro.disconnect(), 2500);
        }
      }
    }
  } catch (e) { /* eʼtiborsiz */ }

  // ---- Mobil menyu ----
  const menuTugma = $('.menu-tugma');
  const menu = $('#menu');
  if (menuTugma && menu) {
    const yop = () => { menu.classList.remove('ochiq'); menuTugma.setAttribute('aria-expanded', 'false'); };
    menuTugma.addEventListener('click', () => {
      const ochiq = menu.classList.toggle('ochiq');
      menuTugma.setAttribute('aria-expanded', String(ochiq));
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) yop(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('ochiq')) { yop(); menuTugma.focus(); }
    });
  }

  // ---- Shpaklyovka tanlagichi ----
  const javoblar = $$('[data-javob]');
  $$('input[name="vazifa"]').forEach((r) => r.addEventListener('change', () => {
    javoblar.forEach((j) => { j.hidden = j.dataset.javob !== r.value; });
  }));

  // ---- Oldin / keyin devori ----
  const sahna = $('.ok-sahna');
  if (sahna) {
    const surgich = $('.ok-surgich', sahna);
    const qoy = (v) => sahna.style.setProperty('--x', `${v}%`);
    let qolda = false;
    surgich.addEventListener('input', () => { qolda = true; qoy(surgich.value); });
    // koʻringanda tutqich oʻzi bir marta yurib, natijani koʻrsatadi
    if (harakat.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([y]) => {
        if (!y.isIntersecting) return;
        io.disconnect();
        const nuqtalar = [[0, 50], [700, 86], [1700, 18], [2500, 50]];
        const bosh = performance.now();
        const qadam = (vaqt) => {
          if (qolda) return;
          const t = vaqt - bosh;
          let i = 0;
          while (i < nuqtalar.length - 2 && t > nuqtalar[i + 1][0]) i++;
          const [t0, v0] = nuqtalar[i];
          const [t1, v1] = nuqtalar[i + 1];
          const p = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
          const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
          const v = v0 + (v1 - v0) * e;
          qoy(v);
          surgich.value = Math.round(v);
          if (t < nuqtalar[nuqtalar.length - 1][0]) requestAnimationFrame(qadam);
        };
        requestAnimationFrame(qadam);
      }, { threshold: 0.5 });
      io.observe(sahna);
    }
  }

  // ---- «Narx soʻrash» tugmalari formani toʻldiradi ----
  $$('[data-ariza]').forEach((a) => a.addEventListener('click', () => {
    const izoh = $('#f-izoh');
    if (izoh) izoh.value = a.dataset.ariza;
  }));

  // ---- Telefonda pastki tugma: forma koʻringanda yashirinadi ----
  const pastki = $('.pastki-cta');
  const ariza = $('#ariza');
  // hero tugmalari yoki formaning oʻzi koʻrinib tursa — bir ekranda ikki marta chiqmasin
  const kuzat = [ariza, $('.hero2 .tugmalar'), $('.mahsulot-matn .tugmalar')].filter(Boolean);
  if (pastki && kuzat.length && 'IntersectionObserver' in window) {
    const korinadi = new Set();
    pastki.classList.add('yashir');
    const io = new IntersectionObserver((yozuvlar) => {
      yozuvlar.forEach((y) => (y.isIntersecting ? korinadi.add(y.target) : korinadi.delete(y.target)));
      pastki.classList.toggle('yashir', korinadi.size > 0);
    }, { threshold: 0.1 });
    kuzat.forEach((el) => io.observe(el));
  }

  // ---- Obyekt toʻplamlari ----
  const toplamlar = $$('[data-toplam]');
  $$('input[name="toplam"]').forEach((r) => r.addEventListener('change', () => {
    toplamlar.forEach((t) => { t.hidden = t.dataset.toplam !== r.value; });
  }));

  // ---- Sertifikatni kattalashtirish ----
  const oyna = $('#hujjat-oyna');
  if (oyna) {
    const katta = $('img', oyna);
    $$('.sertifikat').forEach((b) => b.addEventListener('click', () => {
      katta.src = b.dataset.katta;
      katta.alt = b.dataset.alt;
      oyna.showModal();
    }));
    oyna.addEventListener('click', (e) => { if (e.target === oyna) oyna.close(); });
  }

  // ---- Devor kesimi: koʻringanda «surtiladi» ----
  const kesim = $('.tartib .kesim');
  if (kesim) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((yozuvlar) => {
        if (yozuvlar.some((y) => y.isIntersecting)) { kesim.classList.add('korindi'); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(kesim);
    } else {
      kesim.classList.add('korindi');
    }
  }

  // ---- Katalog filtri (jonli: birinchi harfdan) ----
  const kartalar = $$('#kartalar > .karta');
  if (kartalar.length) {
    const qidiruv = $('#qidiruv');
    const natija = $('#natija');
    const bosh = $('#bosh-natija');
    const url = new URL(location.href);
    const boshToifa = url.searchParams.get('toifa');
    if (boshToifa) {
      const r = $(`input[name="toifa"][value="${CSS.escape(boshToifa)}"]`);
      if (r) r.checked = true;
    }
    const sozla = () => {
      const toifa = $('input[name="toifa"]:checked')?.value || '';
      const joylar = $$('input[name="joy"]:checked').map((c) => c.value);
      const soz = qidiruv.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      kartalar.forEach((k) => {
        const joy = k.dataset.joy.split(' ');
        const kor = (!toifa || k.dataset.toifa === toifa)
          && joylar.every((j) => joy.includes(j))
          && soz.every((s) => k.dataset.qidiruv.includes(s));
        k.hidden = !kor;
        if (kor) n++;
      });
      natija.textContent = natija.dataset.shablon.replace('{n}', n);
      bosh.hidden = n > 0;
      const u = new URL(location.href);
      toifa ? u.searchParams.set('toifa', toifa) : u.searchParams.delete('toifa');
      history.replaceState(null, '', u);
    };
    // filtr oʻzgarganda kartalar yangi joyiga silliq oʻtadi
    kartalar.forEach((k, i) => { k.style.viewTransitionName = `karta-${i}`; });
    const silliq = () => (document.startViewTransition && harakat.matches ? document.startViewTransition(sozla) : sozla());
    qidiruv.addEventListener('input', sozla);
    $$('input[name="toifa"], input[name="joy"]').forEach((i) => i.addEventListener('change', silliq));
    $('#filtr-tozala').addEventListener('click', () => {
      qidiruv.value = '';
      $('input[name="toifa"][value=""]').checked = true;
      $$('input[name="joy"]').forEach((c) => { c.checked = false; });
      sozla();
      qidiruv.focus();
    });
    sozla();
  }

  // ---- Sarf hisobi ----
  const son = (x, kasr = 1) => {
    const s = (Math.round(x * 10 ** kasr) / 10 ** kasr).toString().replace('.', ',');
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const MATN = {
    uz: { kg: 'kg', l: 'l', taxminan: 'Taxminan', dan: '–', qadoq: (n, h, b) => `${son(h)} ${b} × ${n} ta`, yoki: 'yoki' },
    ru: { kg: 'кг', l: 'л', taxminan: 'Примерно', dan: '–', qadoq: (n, h, b) => `${son(h)} ${b} × ${n} шт.`, yoki: 'или' },
  }[til] || null;
  const qadoqTaklif = (jami, qadoqlar, birlik) => {
    if (!qadoqlar.length || !(jami > 0)) return '';
    const s = [...qadoqlar].sort((a, b) => b - a);
    const katta = s[0];
    const butun = Math.ceil(jami / katta - 1e-9);
    const variantlar = [MATN.qadoq(butun, katta, birlik)];
    if (s.length > 1) {
      const kichik = s[s.length - 1];
      const k = Math.floor(jami / katta);
      const qoldiq = jami - k * katta;
      const m = Math.ceil(qoldiq / kichik - 1e-9);
      if (k > 0 && m > 0 && m * kichik < katta) variantlar.push(`${MATN.qadoq(k, katta, birlik)} + ${MATN.qadoq(m, kichik, birlik)}`);
      else if (k === 0 && m * kichik < katta) variantlar.unshift(MATN.qadoq(m, kichik, birlik));
    }
    return variantlar.join(` ${MATN.yoki} `);
  };
  $$('.hisob').forEach((h) => {
    const d = JSON.parse(h.dataset.hisob);
    const out = $('.hisob-natija', h);
    const hisobla = () => {
      const maydon = parseFloat($('[name="maydon"]', h).value.replace(',', '.')) || 0;
      let matn = '';
      let pastki = '';
      if (d.tur === 'qalinlik') {
        const mm = parseFloat($('[name="qalinlik"]', h).value.replace(',', '.')) || 0;
        const kg = maydon * mm * d.kg_mm;
        matn = `${MATN.taxminan} ${son(kg)} ${MATN.kg}`;
        pastki = qadoqTaklif(kg, d.qadoqlar, MATN.kg);
      } else if (d.tur === 'qoplash') {
        const qatlam = parseInt($('[name="qatlam"]', h).value, 10) || 1;
        const l = maydon * qatlam / d.m2_l;
        matn = `${MATN.taxminan} ${son(l)} ${MATN.l}`;
        pastki = qadoqTaklif(l, d.qadoqlar, MATN.l);
      } else {
        const qatlam = parseInt($('[name="qatlam"]', h).value, 10) || 1;
        const b = d.birlik === 'l' ? MATN.l : MATN.kg;
        const a = maydon * qatlam * d.min;
        const z = maydon * qatlam * d.max;
        matn = Math.abs(z - a) < 1e-9 ? `${MATN.taxminan} ${son(a)} ${b}` : `${son(a)}${MATN.dan}${son(z)} ${b}`;
        pastki = qadoqTaklif(z, d.qadoqlar, b);
      }
      out.innerHTML = '';
      out.append(matn);
      if (pastki) { const s = document.createElement('small'); s.textContent = pastki; out.append(s); }
    };
    $$('input', h).forEach((i) => i.addEventListener('input', hisobla));
    hisobla();
  });

  // ---- Ariza formasi ----
  const forma = $('#ariza-forma');
  if (forma) {
    const tel = $('#f-tel', forma);
    const holat = $('.forma-holat', forma);
    // Telefon yozilayotganda: +998 90 123 45 67
    tel.addEventListener('input', () => {
      let r = tel.value.replace(/\D/g, '');
      if (r.startsWith('998')) r = r.slice(3);
      r = r.slice(0, 9);
      const q = [r.slice(0, 2), r.slice(2, 5), r.slice(5, 7), r.slice(7, 9)].filter(Boolean);
      tel.value = r ? '+998 ' + q.join(' ') : '';
    });
    tel.addEventListener('focus', () => { if (!tel.value) tel.value = '+998 '; });
    tel.addEventListener('blur', () => { if (tel.value.trim() === '+998') tel.value = ''; });
    const ariaSinx = (el) => el.setAttribute('aria-invalid', el.matches(':user-invalid') || el.classList.contains('notogri') ? 'true' : 'false');
    $$('input[required]', forma).forEach((el) => {
      el.addEventListener('blur', () => ariaSinx(el));
      el.addEventListener('input', () => { el.classList.remove('notogri'); if (el.hasAttribute('aria-invalid')) ariaSinx(el); });
    });
    forma.addEventListener('submit', (e) => {
      e.preventDefault();
      const majburiy = $$('input[required]', forma);
      majburiy.forEach((el) => { el.classList.toggle('notogri', !el.checkValidity()); ariaSinx(el); });
      const birinchi = majburiy.find((el) => !el.checkValidity());
      if (birinchi) { birinchi.focus(); return; }
      const f = new FormData(forma);
      const qatorlar = [
        til === 'ru' ? 'Заявка с сайта PROMIX' : 'PROMIX saytidan ariza',
        `${$('label[for="f-ism"]', forma).textContent}: ${f.get('ism')}`,
        `${$('label[for="f-tel"]', forma).textContent}: ${f.get('tel')}`,
        `${$('fieldset legend', forma).textContent}: ${f.get('kim')}`,
      ];
      if (f.get('shahar')) qatorlar.push(`${$('label[for="f-shahar"]', forma).firstChild.textContent.trim()}: ${f.get('shahar')}`);
      if (f.get('izoh')) qatorlar.push(String(f.get('izoh')));
      const xabar = qatorlar.join('\n');
      const { telegram, whatsapp } = forma.dataset;
      let havola = '';
      if (telegram) havola = `https://t.me/${telegram}?text=${encodeURIComponent(xabar)}`;
      else if (whatsapp) havola = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(xabar)}`;
      if (havola) {
        window.open(havola, '_blank', 'noopener');
        holat.textContent = forma.dataset.xabarYuborildi;
      } else {
        holat.textContent = forma.dataset.xabarUlanmagan;
      }
    });
  }
})();
