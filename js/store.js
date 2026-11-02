/* ==========================================================================
   JATIZAKAYA — STORE
   Satu-satunya tempat logika keranjang, perhitungan harga, promo, dan pesanan.
   Halaman lain hanya memanggil fungsi di sini; tidak ada perhitungan harga di tempat lain.

   CATATAN KEAMANAN: ini frontend demo. Harga selalu dihitung ulang dari data menu
   (js/data/menu.js), bukan dipercaya dari localStorage, tetapi browser tetap bukan sumber
   transaksi yang tepercaya. Sistem sungguhan wajib memvalidasi harga di server.
   ========================================================================== */
window.JTZ = window.JTZ || {};

/* ---------- Utilitas ---------- */
JTZ.util = {
  rupiah(n) {
    n = Math.round(Number(n) || 0);
    const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-Rp ' : 'Rp ') + s;
  },
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  /* Nomor telepon Indonesia -> '62812...' atau null bila tidak valid */
  normalizePhone(input) {
    const raw = String(input || '').replace(/[\s\-().]/g, '');
    if (!/^(\+?62|0)8\d{8,12}$/.test(raw)) return null;
    return '62' + raw.replace(/^(\+?62|0)/, '');
  },
  safeJSON(str, fallback) {
    try { const v = JSON.parse(str); return v == null ? fallback : v; } catch (e) { return fallback; }
  },
  storageGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
  storageSet(key, val) { try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; } },
  formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

/* ---------- Katalog ---------- */
JTZ.catalog = {
  get(id) { return JTZ.products.find((p) => p.id === id) || null; },
  byCategory(cat) { return JTZ.products.filter((p) => p.category === cat); },
  categoryLabel(id) { const c = JTZ.categories.find((x) => x.id === id); return c ? c.label : id; },

  /* Pilihan default: grup 'single' memakai pilihan pertama, 'multi' kosong */
  defaultSelection(product) {
    const sel = {};
    (product.options || []).forEach((g) => { sel[g.id] = g.type === 'single' ? [g.choices[0].id] : []; });
    return sel;
  },

  /* Bersihkan pilihan: buang id yang tidak dikenal, isi default untuk grup single */
  normalizeSelection(product, sel) {
    const out = {};
    (product.options || []).forEach((g) => {
      const valid = new Set(g.choices.map((c) => c.id));
      let ids = Array.isArray(sel && sel[g.id]) ? sel[g.id].filter((id) => valid.has(id)) : [];
      ids = Array.from(new Set(ids));
      if (g.type === 'single') ids = ids.length ? [ids[0]] : [g.choices[0].id];
      out[g.id] = ids.sort();
    });
    return out;
  },

  unitPrice(product, sel) {
    let p = product.price;
    (product.options || []).forEach((g) => {
      ((sel && sel[g.id]) || []).forEach((id) => {
        const c = g.choices.find((x) => x.id === id);
        if (c) p += c.price;
      });
    });
    return p;
  },

  /* Daftar label pilihan untuk ditampilkan (di keranjang, checkout, pesanan) */
  describeSelection(product, sel) {
    const labels = [];
    (product.options || []).forEach((g) => {
      ((sel && sel[g.id]) || []).forEach((id) => {
        const c = g.choices.find((x) => x.id === id);
        if (c) labels.push(g.type === 'multi' ? '+ ' + c.label : c.label);
      });
    });
    return labels;
  },

  /* Identitas baris keranjang: produk sama + pilihan sama + catatan sama = baris sama */
  lineKey(productId, sel, note) {
    const parts = Object.keys(sel || {}).sort().map((g) => g + ':' + (sel[g] || []).slice().sort().join('+'));
    return productId + '|' + parts.join(';') + '|' + String(note || '').trim().toLowerCase();
  }
};

/* ---------- Harga (aturan tunggal) ---------- */
JTZ.pricing = {
  /* lines: [{productId, sel, note, qty}] ; ctx: {type, promoCode} */
  compute(lines, ctx) {
    const cfg = JTZ.config, fees = cfg.fees;
    ctx = ctx || {};
    const detailed = [];
    let subtotal = 0, itemCount = 0;

    lines.forEach((l) => {
      const product = JTZ.catalog.get(l.productId);
      if (!product) return;
      const unit = JTZ.catalog.unitPrice(product, l.sel);
      const total = unit * l.qty;
      subtotal += total; itemCount += l.qty;
      detailed.push({ key: l.key, productId: l.productId, product, sel: l.sel, note: l.note || '', qty: l.qty,
        unit, total, labels: JTZ.catalog.describeSelection(product, l.sel) });
    });

    /* Promo */
    let promo = { code: '', title: '', amount: 0, valid: false, message: '' };
    if (ctx.promoCode) {
      const p = cfg.promos.find((x) => x.code === String(ctx.promoCode).toUpperCase());
      if (!p) {
        promo.code = String(ctx.promoCode).toUpperCase();
        promo.message = 'Kode promo tidak dikenal.';
      } else {
        promo.code = p.code; promo.title = p.title;
        const inCat = detailed.filter((d) => d.product.category === p.category);
        if (subtotal < (p.minSubtotal || 0)) {
          promo.message = 'Minimal belanja ' + JTZ.util.rupiah(p.minSubtotal) + ' untuk promo ini.';
        } else if (!inCat.length) {
          promo.message = 'Tambahkan menu ' + JTZ.catalog.categoryLabel(p.category) + ' agar promo ini berlaku.';
        } else if (p.type === 'percent_category') {
          const base = inCat.reduce((s, d) => s + d.total, 0);
          promo.amount = Math.round(base * p.percent / 100);
          promo.valid = true;
          promo.message = 'Hemat ' + JTZ.util.rupiah(promo.amount) + '.';
        } else if (p.type === 'buy_x_get_1') {
          const units = [];
          inCat.forEach((d) => { for (let i = 0; i < d.qty; i++) units.push(d.unit); });
          units.sort((a, b) => a - b);
          const free = Math.floor(units.length / (p.buy + 1));
          if (free < 1) {
            promo.message = 'Pesan minimal ' + (p.buy + 1) + ' porsi ' + JTZ.catalog.categoryLabel(p.category) +
              ' (kamu baru punya ' + units.length + ').';
          } else {
            promo.amount = units.slice(0, free).reduce((s, v) => s + v, 0);
            promo.valid = true;
            promo.message = free + ' porsi gratis, hemat ' + JTZ.util.rupiah(promo.amount) + '.';
          }
        }
      }
    }
    const discount = promo.valid ? Math.min(promo.amount, subtotal) : 0;

    /* Biaya tambahan */
    const hasItems = detailed.length > 0;
    const type = ctx.type || null;
    const packaging = hasItems && (type === 'takeaway' || type === 'delivery') ? fees.packagingFee : 0;
    const delivery = hasItems && type === 'delivery' ? fees.deliveryFee : 0;
    const taxable = subtotal - discount;
    const tax = hasItems && type && fees.taxRate > 0 ? Math.round(taxable * fees.taxRate) : 0;
    const total = hasItems ? subtotal - discount + packaging + delivery + tax : 0;

    const errors = [];
    if (type === 'delivery' && hasItems && subtotal < fees.deliveryMinOrder) {
      errors.push('Minimal belanja untuk pesan antar adalah ' + JTZ.util.rupiah(fees.deliveryMinOrder) + ' (belum termasuk biaya lain).');
    }
    return { lines: detailed, itemCount, subtotal, discount, promo, packaging, delivery, tax, total, errors, type };
  }
};

/* ---------- Keranjang ---------- */
JTZ.cart = (function () {
  const KEY = () => JTZ.config.storage.cart;
  let state = { lines: [], promo: '' };
  let lastRemoved = null;

  function sanitize(raw) {
    const out = { lines: [], promo: '' };
    if (!raw || typeof raw !== 'object') return out;
    const max = JTZ.config.fees.maxQtyPerLine;
    (Array.isArray(raw.lines) ? raw.lines : []).slice(0, JTZ.config.fees.maxLines).forEach((l) => {
      const product = l && JTZ.catalog.get(l.productId);
      if (!product) return;                               // produk sudah dihapus dari menu
      const sel = JTZ.catalog.normalizeSelection(product, l.sel);
      const note = String(l.note || '').slice(0, 100);
      let qty = parseInt(l.qty, 10);
      if (!(qty >= 1)) qty = 1;
      qty = Math.min(qty, max);
      const key = JTZ.catalog.lineKey(product.id, sel, note);
      const dup = out.lines.find((x) => x.key === key);
      if (dup) dup.qty = Math.min(max, dup.qty + qty);
      else out.lines.push({ key, productId: product.id, sel, note, qty });
    });
    const code = String(raw.promo || '').toUpperCase();
    out.promo = JTZ.config.promos.some((p) => p.code === code) ? code : '';
    return out;
  }

  function load() { state = sanitize(JTZ.util.safeJSON(JTZ.util.storageGet(KEY()), null)); }
  function persist() {
    JTZ.util.storageSet(KEY(), JSON.stringify({ v: 1, lines: state.lines, promo: state.promo }));
    window.dispatchEvent(new CustomEvent('jtz:cart'));
  }

  const api = {
    init() {
      load();
      window.addEventListener('storage', (e) => {          // sinkron antar tab
        if (e.key === KEY()) { load(); window.dispatchEvent(new CustomEvent('jtz:cart')); }
      });
    },
    lines() { return state.lines.map((l) => ({ ...l })); },
    promo() { return state.promo; },
    count() { return state.lines.reduce((s, l) => s + l.qty, 0); },
    isEmpty() { return state.lines.length === 0; },
    price(type) { return JTZ.pricing.compute(state.lines, { type, promoCode: state.promo }); },

    /* return {ok, merged, clamped, error} */
    add(productId, sel, note, qty) {
      const product = JTZ.catalog.get(productId);
      if (!product) return { ok: false, error: 'Menu tidak ditemukan.' };
      const max = JTZ.config.fees.maxQtyPerLine;
      qty = parseInt(qty, 10); if (!(qty >= 1)) qty = 1;
      const nsel = JTZ.catalog.normalizeSelection(product, sel);
      const nnote = String(note || '').trim().slice(0, 100);
      const key = JTZ.catalog.lineKey(productId, nsel, nnote);
      const existing = state.lines.find((l) => l.key === key);
      let clamped = false;
      if (existing) {
        const next = existing.qty + qty;
        existing.qty = Math.min(next, max); clamped = next > max;
      } else {
        if (state.lines.length >= JTZ.config.fees.maxLines) return { ok: false, error: 'Keranjang penuh (maksimal ' + JTZ.config.fees.maxLines + ' jenis pesanan).' };
        state.lines.push({ key, productId, sel: nsel, note: nnote, qty: Math.min(qty, max) });
        clamped = qty > max;
      }
      persist();
      return { ok: true, merged: !!existing, clamped, key };
    },
    setQty(key, qty) {
      const l = state.lines.find((x) => x.key === key);
      if (!l) return { ok: false };
      const max = JTZ.config.fees.maxQtyPerLine;
      qty = parseInt(qty, 10);
      if (!(qty >= 1)) qty = 1;
      const clamped = qty > max;
      l.qty = Math.min(qty, max);
      persist();
      return { ok: true, clamped };
    },
    remove(key) {
      const i = state.lines.findIndex((x) => x.key === key);
      if (i < 0) return false;
      lastRemoved = { line: state.lines[i], index: i };
      state.lines.splice(i, 1);
      persist();
      return true;
    },
    undoRemove() {
      if (!lastRemoved) return false;
      if (!state.lines.some((l) => l.key === lastRemoved.line.key)) state.lines.splice(Math.min(lastRemoved.index, state.lines.length), 0, lastRemoved.line);
      lastRemoved = null; persist(); return true;
    },
    clear() { state.lines = []; state.promo = ''; lastRemoved = null; persist(); },
    setPromo(code) {
      code = String(code || '').trim().toUpperCase();
      if (!code) { state.promo = ''; persist(); return { ok: true, cleared: true }; }
      if (!JTZ.config.promos.some((p) => p.code === code)) return { ok: false, error: 'Kode promo tidak dikenal.' };
      state.promo = code; persist(); return { ok: true };
    },
    /* Isi ulang keranjang dari pesanan lama (pesan lagi). Harga memakai harga menu terkini. */
    addFromOrder(order) {
      let added = 0, skipped = 0;
      order.items.forEach((it) => {
        const product = JTZ.catalog.get(it.productId);
        if (!product) { skipped++; return; }
        const r = api.add(it.productId, it.sel, it.note, it.qty);
        if (r.ok) added++; else skipped++;
      });
      return { added, skipped };
    }
  };
  return api;
})();

/* ---------- Pesanan (lokal, demo) ---------- */
JTZ.orders = (function () {
  const KEY = () => JTZ.config.storage.orders;

  /* Alur status per jenis pemesanan */
  const FLOWS = {
    dinein:   ['pending', 'confirmed', 'preparing', 'served', 'done'],
    takeaway: ['pending', 'confirmed', 'preparing', 'ready', 'done'],
    delivery: ['pending', 'confirmed', 'preparing', 'delivering', 'done']
  };
  const LABELS = {
    pending: 'Menunggu konfirmasi', confirmed: 'Dikonfirmasi', preparing: 'Sedang disiapkan',
    served: 'Siap disajikan', ready: 'Siap diambil', delivering: 'Sedang diantar',
    done: 'Selesai', cancelled: 'Dibatalkan'
  };

  function readAll() {
    const arr = JTZ.util.safeJSON(JTZ.util.storageGet(KEY()), []);
    return Array.isArray(arr) ? arr.filter((o) => o && typeof o === 'object' && o.id && FLOWS[o.type] && Array.isArray(o.items)) : [];
  }
  function writeAll(list) {
    const max = JTZ.config.storage.maxOrders;
    return JTZ.util.storageSet(KEY(), JSON.stringify(list.slice(0, max)));
  }
  function newId(list) {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let tries = 0; tries < 20; tries++) {
      const buf = new Uint8Array(4);
      (window.crypto || window.msCrypto).getRandomValues(buf);
      const id = 'JTZ-' + ymd + '-' + Array.from(buf).map((b) => alphabet[b % alphabet.length]).join('');
      if (!list.some((o) => o.id === id)) return id;
    }
    return 'JTZ-' + ymd + '-' + Date.now().toString(36).toUpperCase().slice(-4);
  }

  const api = {
    FLOWS, LABELS,
    statusLabel(s) { return LABELS[s] || s; },
    list() { return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); },
    get(id) { return readAll().find((o) => o.id === id) || null; },
    flow(type) { return FLOWS[type] || FLOWS.dinein; },

    /* Buat pesanan dari keranjang saat ini. Harga dihitung ulang di sini (bukan dari form). */
    create({ customer, type, details, paymentMethod }) {
      const priced = JTZ.cart.price(type);
      if (!priced.lines.length) return { ok: false, error: 'Keranjang kosong.' };
      if (priced.errors.length) return { ok: false, error: priced.errors[0] };
      const method = JTZ.config.paymentMethods.find((m) => m.id === paymentMethod && m.types.includes(type));
      if (!method) return { ok: false, error: 'Metode pembayaran tidak tersedia untuk jenis pemesanan ini.' };
      const list = readAll();
      const now = new Date().toISOString();
      const order = {
        v: 1, demo: true,
        id: newId(list), createdAt: now,
        customer: { name: customer.name, phone: customer.phone },
        type, details,
        payment: { method: method.id, label: method.label, kind: method.kind,
          status: method.kind === 'offline' ? (type === 'delivery' ? 'pay_on_delivery' : 'pay_at_cashier') : 'unpaid' },
        items: priced.lines.map((d) => ({ productId: d.productId, name: d.product.name, img: d.product.imgSm,
          sel: d.sel, labels: d.labels, note: d.note, qty: d.qty, unit: d.unit, total: d.total })),
        totals: { subtotal: priced.subtotal, discount: priced.discount, packaging: priced.packaging,
          delivery: priced.delivery, tax: priced.tax, total: priced.total },
        promo: priced.promo.valid ? { code: priced.promo.code, title: priced.promo.title } : null,
        status: 'pending',
        history: [{ status: 'pending', at: now }]
      };
      list.unshift(order);
      if (!writeAll(list)) return { ok: false, error: 'Penyimpanan browser penuh atau dinonaktifkan. Pesanan belum dibuat.' };
      return { ok: true, order };
    },

    _save(order) {
      const list = readAll();
      const i = list.findIndex((o) => o.id === order.id);
      if (i < 0) return false;
      list[i] = order; return writeAll(list);
    },

    /* Simulasi pembayaran digital (BUKAN transaksi sungguhan) */
    simulatePayment(id) {
      const o = api.get(id);
      if (!o || o.payment.kind !== 'digital' || o.payment.status !== 'unpaid' || o.status === 'cancelled') return { ok: false };
      o.payment.status = 'paid_demo'; o.payment.paidAt = new Date().toISOString();
      api._save(o); return { ok: true, order: o };
    },

    /* Apakah status berikutnya boleh dicapai? Pembayaran digital wajib "dibayar" sebelum dikonfirmasi. */
    canAdvance(o) {
      if (!o || o.status === 'cancelled' || o.status === 'done') return { ok: false, reason: '' };
      if (o.status === 'pending' && o.payment.kind === 'digital' && o.payment.status !== 'paid_demo') {
        return { ok: false, reason: 'Selesaikan simulasi pembayaran dulu agar pesanan bisa dikonfirmasi.' };
      }
      return { ok: true, reason: '' };
    },
    advance(id) {
      const o = api.get(id);
      const c = api.canAdvance(o);
      if (!c.ok) return { ok: false, reason: c.reason };
      const flow = FLOWS[o.type];
      const next = flow[flow.indexOf(o.status) + 1];
      if (!next) return { ok: false };
      o.status = next; o.history.push({ status: next, at: new Date().toISOString() });
      if (next === 'done' && o.payment.status === 'pay_at_cashier') o.payment.status = 'paid_cash';
      if (next === 'done' && o.payment.status === 'pay_on_delivery') o.payment.status = 'paid_cash';
      api._save(o); return { ok: true, order: o };
    },
    cancel(id) {
      const o = api.get(id);
      if (!o || o.status !== 'pending') return { ok: false };
      o.status = 'cancelled'; o.history.push({ status: 'cancelled', at: new Date().toISOString() });
      if (o.payment.status === 'paid_demo') o.payment.status = 'refund_demo';
      api._save(o); return { ok: true, order: o };
    },
    remove(id) { writeAll(readAll().filter((o) => o.id !== id)); },
    clearAll() { JTZ.util.storageSet(KEY(), '[]'); }
  };
  return api;
})();

/* ---------- WhatsApp ---------- */
JTZ.wa = {
  link(text) {
    return 'https://wa.me/' + JTZ.config.contact.whatsappNumber + (text ? '?text=' + encodeURIComponent(text) : '');
  },
  orderMessage(o) {
    const r = JTZ.util.rupiah;
    const L = [];
    L.push('Halo Jatizakaya, saya ingin memesan (No. ' + o.id + '):');
    L.push('');
    o.items.forEach((it) => {
      let line = '- ' + it.qty + '× ' + it.name + ' — ' + r(it.total);
      if (it.labels && it.labels.length) line += ' (' + it.labels.join(', ') + ')';
      if (it.note) line += ' | Catatan: ' + it.note;
      L.push(line);
    });
    L.push('');
    L.push('Subtotal: ' + r(o.totals.subtotal));
    if (o.totals.discount) L.push('Diskon' + (o.promo ? ' (' + o.promo.code + ')' : '') + ': -' + r(o.totals.discount));
    if (o.totals.packaging) L.push('Kemasan: ' + r(o.totals.packaging));
    if (o.totals.delivery) L.push('Ongkir: ' + r(o.totals.delivery));
    if (o.totals.tax) L.push('Pajak: ' + r(o.totals.tax));
    L.push('Total: ' + r(o.totals.total));
    L.push('');
    L.push('Jenis: ' + JTZ.config.orderTypes[o.type].label);
    if (o.type === 'dinein' && o.details.table) L.push('Meja: ' + o.details.table);
    if (o.type === 'takeaway') L.push('Ambil: ' + (o.details.pickupTime || 'Secepatnya'));
    if (o.type === 'delivery') {
      L.push('Alamat: ' + o.details.address + (o.details.addressDetail ? ', ' + o.details.addressDetail : ''));
      if (o.details.landmark) L.push('Patokan: ' + o.details.landmark);
      if (o.details.courierNote) L.push('Catatan kurir: ' + o.details.courierNote);
    }
    L.push('Pembayaran: ' + o.payment.label);
    L.push('Atas nama: ' + o.customer.name + ' (' + o.customer.phone + ')');
    return L.join('\n');
  }
};

JTZ.cart.init();
