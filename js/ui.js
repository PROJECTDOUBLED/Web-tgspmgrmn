/* ==========================================================================
   JATIZAKAYA — UI BERSAMA
   Header, footer, ikon, drawer keranjang, toast, modal produk, kotak promo.
   Dimuat di semua halaman setelah store.js.
   ========================================================================== */
(function () {
  'use strict';
  const { esc, rupiah } = JTZ.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const page = document.body.dataset.page || '';

  const icon = (id, cls) => '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + id + '"/></svg>';

  const SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><defs>' +
    [['bag', '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'],
     ['search', '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'],
     ['plus', '<path d="M5 12h14"/><path d="M12 5v14"/>'],
     ['minus', '<path d="M5 12h14"/>'],
     ['trash', '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>'],
     ['x', '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'],
     ['menu', '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>'],
     ['wa', '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'],
     ['instagram', '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>'],
     ['facebook', '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
     ['youtube', '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>'],
     ['tiktok', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'],
     ['pin', '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'],
     ['clock', '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'],
     ['check', '<path d="M20 6 9 17l-5-5"/>'],
     ['arrow', '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>']
    ].map((i) => '<symbol id="i-' + i[0] + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + i[1] + '</symbol>').join('') +
    '</defs></svg>';

  /* ---------- Tautan kontak & sosial (dikonfigurasi di js/config.js) ---------- */
  const mapsUrl = () => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(JTZ.config.contact.address);
  function socialLinks(extraClass) {
    const c = JTZ.config;
    const items = [{ id: 'wa', label: 'WhatsApp', url: JTZ.wa.link('Halo Jatizakaya, saya ingin bertanya.') }];
    c.social.forEach((s) => { if (s.url) items.push({ id: s.id, label: s.label, url: s.url }); });
    items.push({ id: 'pin', label: 'Google Maps', url: mapsUrl() });
    return '<ul class="social ' + (extraClass || '') + '">' + items.map((i) =>
      '<li><a href="' + esc(i.url) + '" target="_blank" rel="noopener noreferrer">' + icon(i.id) + '<span>' + esc(i.label) + '</span><span class="sr-only"> (tab baru)</span></a></li>').join('') + '</ul>';
  }

  /* ---------- Toast ---------- */
  let toastBox;
  /* Dialog modal membuat sisa halaman inert, jadi toast harus berada DI DALAM dialog yang terbuka
     agar tombolnya (mis. "Urungkan") tetap bisa diklik. */
  function placeToasts() {
    if (!toastBox) return;
    const open = $$('dialog[open]').pop();
    const host = open || document.body;
    if (toastBox.parentNode !== host) { try { host.appendChild(toastBox); } catch (e) { /* node dipindah saat blur; abaikan */ } }
  }
  function setDialogContent(dlg, html) {
    let w = dlg.querySelector(':scope > .dlg-content');
    if (!w) { w = document.createElement('div'); w.className = 'dlg-content'; dlg.insertBefore(w, dlg.firstChild); }
    w.innerHTML = html;     // wrapper display:contents; kotak toast tidak pernah ikut terhapus
  }
  function toast(msg, opts) {
    opts = opts || {};
    if (!toastBox) return;
    const el = document.createElement('div');
    el.className = 'toast' + (opts.kind ? ' toast-' + opts.kind : '');
    const span = document.createElement('span'); span.textContent = msg; el.appendChild(span);
    if (opts.action) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-act'; b.textContent = opts.action.label;
      b.addEventListener('click', () => { opts.action.fn(); if (el.parentNode) el.parentNode.removeChild(el); });
      el.appendChild(b);
    }
    toastBox.appendChild(el);
    placeToasts();
    while (toastBox.children.length > 2) toastBox.removeChild(toastBox.firstChild);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, opts.action ? 6500 : 3500);
  }

  /* ---------- Header & footer ---------- */
  function buildChrome() {
    const nav = [['index.html', 'home', 'Beranda'], ['menu.html', 'menu', 'Menu'], ['pesanan.html', 'pesanan', 'Pesanan saya'], ['kontak.html', 'kontak', 'Kontak & reservasi']];
    const header = document.createElement('header');
    header.className = 'site-header on-dark';
    header.innerHTML =
      '<div class="container bar">' +
        '<a class="brand" href="index.html"><img class="brand-mark" src="assets/images/brand/logo-mark.webp" width="44" height="44" alt=""><span class="brand-name">JATIZAKAYA</span></a>' +
        '<nav class="nav" id="primary-nav" aria-label="Navigasi utama"><ul>' +
          nav.map((n) => '<li><a href="' + n[0] + '"' + (page === n[1] ? ' aria-current="page"' : '') + '>' + n[2] + '</a></li>').join('') + '</ul></nav>' +
        '<button type="button" class="cart-btn" id="open-cart">' + icon('bag') + '<span class="cart-label">Pesanan</span><span class="badge" id="cart-badge" hidden>0</span></button>' +
        '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><span class="sr-only">Buka navigasi</span>' + icon('menu') + '</button>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);

    const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Lewati ke konten';
    document.body.insertBefore(skip, document.body.firstChild);

    const c = JTZ.config;
    const footer = document.createElement('footer');
    footer.className = 'site-footer on-dark';
    footer.innerHTML =
      '<div class="container foot-grid">' +
        '<div><p class="foot-brand">JATIZAKAYA</p><p class="foot-tag">' + esc(c.brand.tagline) + '</p>' +
          '<p class="foot-addr">' + esc(c.contact.address) + '</p></div>' +
        '<div><p class="foot-h">Jelajahi</p><ul class="foot-links">' +
          nav.map((n) => '<li><a href="' + n[0] + '">' + n[2] + '</a></li>').join('') + '<li><a href="info.html">Ketentuan &amp; privasi</a></li></ul></div>' +
        '<div><p class="foot-h">Hubungi</p>' + socialLinks('social-foot') + '</div>' +
      '</div>' +
      '<div class="container foot-note"><p>Situs ini prototipe proyek kelompok: pemesanan dan pembayaran hanya simulasi, tidak ada pesanan yang diterima dapur atau uang yang diproses. © 2026 Jatizakaya.</p></div>';
    document.body.appendChild(footer);

    document.body.insertAdjacentHTML('beforeend', SPRITE +
      '<div class="toasts" role="status" aria-live="polite"></div>' +
      '<button type="button" class="cartbar on-dark" id="cartbar" hidden><span class="cartbar-n" id="cartbar-n"></span><span class="cartbar-l">Lihat pesanan</span><span class="cartbar-t" id="cartbar-t"></span></button>' +
      '<dialog id="cart-dialog" class="drawer" aria-labelledby="cart-title"></dialog>' +
      '<dialog id="product-dialog" class="sheet" aria-labelledby="pm-title"></dialog>');
    toastBox = $('.toasts');

    const toggle = $('.nav-toggle'), navEl = $('#primary-nav');
    toggle.addEventListener('click', () => {
      const open = navEl.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navEl.classList.contains('open')) { navEl.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }

  /* ---------- Lencana & bar keranjang ---------- */
  function updateBadges(bump) {
    const n = JTZ.cart.count();
    const badge = $('#cart-badge'), btn = $('#open-cart');
    badge.textContent = n; badge.hidden = n === 0;
    btn.setAttribute('aria-label', 'Buka pesanan, ' + n + ' item');
    const bar = $('#cartbar');
    const showBar = n > 0 && page !== 'checkout' && page !== 'pesanan';
    bar.hidden = !showBar;
    document.body.classList.toggle('has-cartbar', showBar);
    if (showBar) {
      $('#cartbar-n').textContent = n + ' item';
      $('#cartbar-t').textContent = rupiah(JTZ.cart.price(null).subtotal - JTZ.cart.price(null).discount);
    }
    if (bump && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    }
  }

  /* ---------- Stepper kuantitas ---------- */
  function stepperHTML(key, qty, name) {
    const max = JTZ.config.fees.maxQtyPerLine;
    return '<div class="stepper" data-key="' + esc(key) + '">' +
      '<button type="button" data-act="dec" aria-label="Kurangi jumlah ' + esc(name) + '"' + (qty <= 1 ? ' disabled' : '') + '>' + icon('minus') + '</button>' +
      '<input type="number" inputmode="numeric" min="1" max="' + max + '" value="' + qty + '" data-act="qty" aria-label="Jumlah ' + esc(name) + '">' +
      '<button type="button" data-act="inc" aria-label="Tambah jumlah ' + esc(name) + '"' + (qty >= max ? ' disabled' : '') + '>' + icon('plus') + '</button></div>';
  }

  /* HTML ringkas daftar item (dipakai drawer) */
  function lineHTML(d) {
    return '<li class="cl" data-key="' + esc(d.key) + '">' +
      '<img src="' + esc(d.product.imgSm) + '" alt="" width="64" height="64" loading="lazy">' +
      '<div class="cl-main"><p class="cl-name">' + esc(d.product.name) + '</p>' +
        (d.labels.length ? '<p class="cl-opt">' + d.labels.map(esc).join(' · ') + '</p>' : '') +
        (d.note ? '<p class="cl-opt">Catatan: ' + esc(d.note) + '</p>' : '') +
        '<p class="cl-unit">' + rupiah(d.unit) + ' / porsi</p>' +
        stepperHTML(d.key, d.qty, d.product.name) + '</div>' +
      '<div class="cl-side"><p class="cl-total">' + rupiah(d.total) + '</p>' +
        '<button type="button" class="icon-btn" data-act="del" aria-label="Hapus ' + esc(d.product.name) + ' dari pesanan">' + icon('trash') + '</button></div></li>';
  }

  /* ---------- Kotak promo (drawer & checkout) ---------- */
  function promoBoxHTML(type) {
    const code = JTZ.cart.promo();
    const priced = JTZ.cart.price(type);
    if (code) {
      return '<div class="promo-applied ' + (priced.promo.valid ? 'ok' : 'warn') + '">' +
        '<p><strong>' + esc(code) + '</strong> · ' + esc(priced.promo.title || '') + '<br><span>' + esc(priced.promo.message) + '</span></p>' +
        '<button type="button" class="link-btn" data-act="promo-clear">Lepas</button></div>';
    }
    return '<form class="promo-form" data-act="promo-form" novalidate>' +
      '<label for="promo-input-' + esc(type || 'cart') + '" class="label-sm">Punya kode promo?</label>' +
      '<div class="promo-row"><input id="promo-input-' + esc(type || 'cart') + '" name="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Contoh: ' + esc(JTZ.config.promos[0].code) + '">' +
      '<button type="submit" class="btn btn-dark btn-sm">Pakai</button></div>' +
      '<p class="promo-err" role="alert" hidden></p>' +
      '<p class="promo-hint">' + JTZ.config.promos.map((p) => '<button type="button" class="chip-link" data-act="promo-pick" data-code="' + esc(p.code) + '">' + esc(p.code) + '</button>').join(' ') + '</p></form>';
  }
  function bindPromo(container, type) {
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'promo-clear') JTZ.cart.setPromo('');
      if (b.dataset.act === 'promo-pick') applyPromo(container, b.dataset.code);
    });
    container.addEventListener('submit', (e) => {
      if (!e.target.matches('[data-act="promo-form"]')) return;
      e.preventDefault();
      applyPromo(container, e.target.elements.code.value);
    });
  }
  function applyPromo(container, code) {
    const r = JTZ.cart.setPromo(code);
    if (!r.ok) {
      const err = $('.promo-err', container);
      if (err) { err.textContent = r.error; err.hidden = false; }
    }
  }

  /* ---------- Drawer keranjang ---------- */
  const cartDlg = () => $('#cart-dialog');
  function suggestionsHTML(priced) {
    if (priced.lines.some((d) => d.product.category === 'drink')) return '';
    const picks = ['ocha', 'sparkling-yuzu'].map((id) => JTZ.catalog.get(id)).filter(Boolean);
    return '<div class="suggest"><p class="label-sm">Biasanya dipesan bersama minuman</p>' + picks.map((p) =>
      '<button type="button" class="suggest-item" data-act="suggest" data-id="' + esc(p.id) + '"><img src="' + esc(p.imgSm) + '" alt="" width="40" height="40"><span>' + esc(p.name) + '<small>' + rupiah(p.price) + '</small></span>' + icon('plus') + '</button>').join('') + '</div>';
  }
  function renderCart(focusSel) {
    const dlg = cartDlg(); if (!dlg) return;
    const priced = JTZ.cart.price(null);
    let body;
    if (!priced.lines.length) {
      body = '<div class="empty"><p class="empty-t">Pesananmu masih kosong.</p><p>Pilih ramen, yakitori, bento, atau minuman dari menu.</p>' +
        '<a class="btn btn-primary" href="menu.html">Lihat menu</a></div>';
    } else {
      body = '<ul class="cl-list">' + priced.lines.map(lineHTML).join('') + '</ul>' + suggestionsHTML(priced) +
        '<div class="promo-box" id="drawer-promo">' + promoBoxHTML(null) + '</div>';
    }
    const foot = priced.lines.length ?
      '<div class="drawer-foot"><dl class="totals">' +
        '<div><dt>Subtotal</dt><dd>' + rupiah(priced.subtotal) + '</dd></div>' +
        (priced.discount ? '<div class="disc"><dt>Diskon ' + esc(priced.promo.code) + '</dt><dd>-' + rupiah(priced.discount) + '</dd></div>' : '') +
        '</dl><p class="fine">Pajak, kemasan, dan ongkir dihitung di checkout sesuai jenis pemesanan.</p>' +
        '<a class="btn btn-primary btn-block" href="checkout.html">Lanjut ke checkout ' + icon('arrow') + '</a>' +
        '<button type="button" class="btn btn-ghost btn-block" data-close>Tambah menu lagi</button></div>' : '';
    setDialogContent(dlg, '<div class="drawer-head"><h2 id="cart-title">Pesanan kamu <span class="count">' + (priced.itemCount ? '(' + priced.itemCount + ' item)' : '') + '</span></h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Tutup pesanan">' + icon('x') + '</button></div>' +
      '<div class="drawer-body">' + body + '</div>' + foot);
    if (focusSel) { const el = $(focusSel, dlg); if (el && !el.disabled) el.focus(); }
  }
  function openCart() {
    const dlg = cartDlg(); if (dlg.open) return;
    renderCart();
    dlg.showModal(); document.body.classList.add('no-scroll'); placeToasts();
  }
  function closeDialog(dlg) { if (dlg.open) dlg.close(); }
  function wireDialog(dlg) {
    dlg.addEventListener('close', () => { if (!$$('dialog[open]').length) document.body.classList.remove('no-scroll'); placeToasts(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg); });
  }

  function wireCart() {
    const dlg = cartDlg();
    wireDialog(dlg);
    bindPromo(dlg, null);
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const li = b.closest('.cl'); const key = li && li.dataset.key;
      const act = b.dataset.act;
      if (act === 'inc' || act === 'dec') {
        const cur = JTZ.cart.lines().find((l) => l.key === key); if (!cur) return;
        const r = JTZ.cart.setQty(key, cur.qty + (act === 'inc' ? 1 : -1));
        if (r.clamped) toast('Maksimal ' + JTZ.config.fees.maxQtyPerLine + ' porsi per menu.', { kind: 'warn' });
        renderCart('[data-key="' + cssEsc(key) + '"] [data-act="' + act + '"]');
      } else if (act === 'del') {
        const line = JTZ.cart.lines().find((l) => l.key === key);
        const name = line ? JTZ.catalog.get(line.productId).name : 'Item';
        JTZ.cart.remove(key);
        toast(name + ' dihapus dari pesanan.', { action: { label: 'Urungkan', fn: () => JTZ.cart.undoRemove() } });
        renderCart('.drawer-head [data-close]');
      } else if (act === 'suggest') {
        const p = JTZ.catalog.get(b.dataset.id);
        addToCart(p.id, JTZ.catalog.defaultSelection(p), '', 1, { quiet: true });
      }
    });
    dlg.addEventListener('change', (e) => {
      if (e.target.dataset.act !== 'qty') return;
      const key = e.target.closest('.cl').dataset.key;
      const raw = parseInt(e.target.value, 10);
      const max = JTZ.config.fees.maxQtyPerLine;
      if (!(raw >= 1) || raw > max) toast(!(raw >= 1) ? 'Jumlah minimal 1.' : 'Maksimal ' + max + ' porsi per menu.', { kind: 'warn' });
      JTZ.cart.setQty(key, raw);
      renderCart('[data-key="' + cssEsc(key) + '"] [data-act="qty"]');
    });
  }
  const cssEsc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');

  /* ---------- Tambah ke keranjang + umpan balik ---------- */
  function addToCart(productId, sel, note, qty, opts) {
    const product = JTZ.catalog.get(productId);
    const r = JTZ.cart.add(productId, sel, note, qty);
    if (!r.ok) { toast(r.error, { kind: 'error' }); return r; }
    if (!(opts && opts.quiet)) {
      toast((r.clamped ? 'Jumlah dibatasi maksimal ' + JTZ.config.fees.maxQtyPerLine + ' · ' : '') + product.name + ' ditambahkan.', { action: { label: 'Lihat pesanan', fn: openCart } });
    }
    return r;
  }

  /* ---------- Modal produk ---------- */
  let pm = null;      // state modal
  function pmPrice() {
    const unit = JTZ.catalog.unitPrice(pm.product, pm.sel);
    return { unit, total: unit * pm.qty };
  }
  function renderProduct() {
    const p = pm.product, dlg = $('#product-dialog');
    const groups = (p.options || []).map((g) =>
      '<fieldset class="opt"><legend>' + esc(g.label) + ' <span class="req">' + (g.type === 'single' ? 'Pilih 1' : 'Opsional') + '</span></legend>' +
      g.choices.map((c) => {
        const checked = (pm.sel[g.id] || []).includes(c.id);
        return '<label class="choice"><input type="' + (g.type === 'single' ? 'radio' : 'checkbox') + '" name="' + esc(g.id) + '" value="' + esc(c.id) + '"' + (checked ? ' checked' : '') + '>' +
          '<span class="choice-l">' + esc(c.label) + '</span><span class="choice-p">' + (c.price ? '+' + rupiah(c.price) : '') + '</span></label>';
      }).join('') + '</fieldset>').join('');
    const unavailable = p.available === false;
    setDialogContent(dlg,
      '<div class="pm-media"><img src="' + esc(p.img) + '" alt="' + esc(p.alt) + '"></div>' +
      '<form class="pm-body" id="pm-form" novalidate>' +
        '<button type="button" class="icon-btn pm-close" data-close aria-label="Tutup detail menu">' + icon('x') + '</button>' +
        '<p class="eyebrow">' + esc(JTZ.catalog.categoryLabel(p.category)) + (p.best ? ' · Favorit kedai' : '') + '</p>' +
        '<h2 id="pm-title">' + esc(p.name) + '</h2>' +
        '<p class="pm-desc">' + esc(p.desc) + '</p>' +
        '<p class="pm-base">Harga dasar ' + rupiah(p.price) + '</p>' + groups +
        '<div class="field"><label for="pm-note">Catatan khusus <span class="req">Opsional</span></label>' +
          '<textarea id="pm-note" rows="2" maxlength="100" placeholder="Contoh: kuah dipisah, tanpa bawang"></textarea><p class="fine"><span id="pm-note-n">0</span>/100</p></div>' +
        '<div class="pm-foot">' + stepperHTML('pm', pm.qty, p.name) +
          '<button type="submit" class="btn btn-primary btn-grow" id="pm-add"' + (unavailable ? ' disabled' : '') + '>' +
            (unavailable ? 'Sedang tidak tersedia' : 'Tambah · <span id="pm-total">' + rupiah(pmPrice().total) + '</span>') + '</button></div>' +
      '</form>');
  }
  function openProduct(id) {
    const product = JTZ.catalog.get(id);
    if (!product) return;
    pm = { product, sel: JTZ.catalog.defaultSelection(product), qty: 1 };
    renderProduct();
    const dlg = $('#product-dialog');
    if (!dlg.open) dlg.showModal();
    document.body.classList.add('no-scroll'); placeToasts();
    const dlgScroll = $('.pm-body', dlg); if (dlgScroll) dlgScroll.scrollTop = 0;
  }
  function wireProduct() {
    const dlg = $('#product-dialog');
    wireDialog(dlg);
    dlg.addEventListener('change', (e) => {
      if (!pm) return;
      const t = e.target;
      if (t.name && (t.type === 'radio' || t.type === 'checkbox')) {
        const g = pm.product.options.find((x) => x.id === t.name);
        if (g.type === 'single') pm.sel[g.id] = [t.value];
        else pm.sel[g.id] = $$('input[name="' + g.id + '"]:checked', dlg).map((i) => i.value);
      } else if (t.dataset.act === 'qty') {
        const max = JTZ.config.fees.maxQtyPerLine; let n = parseInt(t.value, 10);
        if (!(n >= 1)) n = 1; if (n > max) { n = max; toast('Maksimal ' + max + ' porsi per menu.', { kind: 'warn' }); }
        pm.qty = n; t.value = n; syncQty();
      }
      refreshTotal();
    });
    dlg.addEventListener('input', (e) => { if (e.target.id === 'pm-note') $('#pm-note-n').textContent = e.target.value.length; });
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="inc"],[data-act="dec"]'); if (!b || !pm) return;
      const max = JTZ.config.fees.maxQtyPerLine;
      pm.qty = Math.min(max, Math.max(1, pm.qty + (b.dataset.act === 'inc' ? 1 : -1)));
      $('input[data-act="qty"]', dlg).value = pm.qty; syncQty(); refreshTotal();
    });
    dlg.addEventListener('submit', (e) => {
      e.preventDefault(); if (!pm || pm.product.available === false) return;
      const r = addToCart(pm.product.id, pm.sel, $('#pm-note', dlg).value, pm.qty);
      if (r.ok) dlg.close();
    });
  }
  function syncQty() {
    const dlg = $('#product-dialog'), max = JTZ.config.fees.maxQtyPerLine;
    $('[data-act="dec"]', dlg).disabled = pm.qty <= 1; $('[data-act="inc"]', dlg).disabled = pm.qty >= max;
  }
  function refreshTotal() { const t = $('#pm-total'); if (t && pm) t.textContent = rupiah(pmPrice().total); }

  /* ---------- Isi otomatis elemen [data-bind] dari config ---------- */
  function bindData() {
    const c = JTZ.config.contact;
    const vals = {
      address: c.address, addressShort: c.addressShort,
      hours: c.openingHours || 'Belum diumumkan. Tanya jam buka lewat WhatsApp.',
      'wa-display': c.whatsappDisplay
    };
    $$('[data-bind]').forEach((el) => {
      const k = el.dataset.bind;
      if (k === 'wa-link') { el.href = JTZ.wa.link('Halo Jatizakaya, saya ingin bertanya.'); }
      else if (k in vals) el.textContent = vals[k];
    });
  }

  /* ---------- Init ---------- */
  function init() {
    buildChrome();
    bindData();
    wireCart(); wireProduct();
    $('#open-cart').addEventListener('click', openCart);
    $('#cartbar').addEventListener('click', openCart);
    let prevCount = JTZ.cart.count();
    window.addEventListener('jtz:cart', () => {
      const n = JTZ.cart.count();
      updateBadges(n > prevCount); prevCount = n;
      if (cartDlg().open) renderCart();
    });
    updateBadges(false);
    document.dispatchEvent(new CustomEvent('jtz:ready'));
  }

  JTZ.ui = { icon, toast, openCart, openProduct, addToCart, socialLinks, mapsUrl, promoBoxHTML, bindPromo, stepperHTML, closeDialog };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
