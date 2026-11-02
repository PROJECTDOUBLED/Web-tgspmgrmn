/* Halaman pesanan: detail, status, simulasi pembayaran, riwayat */
(function () {
  const { esc, rupiah, formatDateTime } = JTZ.util;
  const $ = (s) => document.querySelector(s);
  const O = JTZ.orders;
  const view = () => $('#view');

  const PAY_LABEL = { unpaid: ['Belum dibayar', 'wait'], paid_demo: ['Dibayar (simulasi)', 'ok'], pay_at_cashier: ['Bayar di kasir', 'wait'],
    pay_on_delivery: ['Bayar ke kurir', 'wait'], paid_cash: ['Lunas tunai (simulasi)', 'ok'], refund_demo: ['Dikembalikan (simulasi)', 'bad'] };
  const payBadge = (s) => { const p = PAY_LABEL[s] || [s, 'wait']; return '<span class="pay-status ' + p[1] + '">' + esc(p[0]) + '</span>'; };

  function confirmDlg(title, msg, yes) {
    const dlg = $('#confirm-dialog');
    $('#cf-title').textContent = title; $('#cf-msg').textContent = msg; $('#cf-yes').textContent = yes;
    return new Promise((res) => {
      dlg.addEventListener('close', () => res(dlg.returnValue === 'yes'), { once: true });
      dlg.returnValue = ''; dlg.showModal();
    });
  }

  /* QR contoh: pola acak deterministik + label jelas bahwa ini bukan QRIS */
  function demoQR(seedStr) {
    let h = 2166136261; for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    const N = 25; let d = '';
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.52) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    const finder = (ox, oy) => '<path fill-rule="evenodd" d="M' + ox + ' ' + oy + 'h7v7h-7zM' + (ox + 1) + ' ' + (oy + 1) + 'v5h5v-5z"/><rect x="' + (ox + 2) + '" y="' + (oy + 2) + '" width="3" height="3"/>';
    return '<svg class="qr" viewBox="-1 -1 ' + (N + 2) + ' ' + (N + 2) + '" role="img" aria-label="Contoh kode QR demo, tidak dapat dipindai" shape-rendering="crispEdges"><path d="' + d + '"/>' + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7) + '</svg>';
  }

  /* ---------- Panel pembayaran ---------- */
  function paymentPanel(o) {
    const p = o.payment, total = rupiah(o.totals.total), dp = JTZ.config.demoPayment;
    let body = '';
    if (o.status === 'cancelled') {
      body = '<p>Pesanan dibatalkan.' + (p.status === 'refund_demo' ? ' Pembayaran simulasi ditandai dikembalikan.' : ' Tidak ada pembayaran yang perlu dilakukan.') + '</p>';
    } else if (p.kind === 'digital') {
      if (p.status === 'paid_demo') {
        body = '<p>Pembayaran simulasi diterima' + (p.paidAt ? ' pada ' + esc(formatDateTime(p.paidAt)) : '') + '. Ini bukan transaksi sungguhan.</p>';
      } else {
        if (p.method === 'qris') body = '<p>Pindai kode di bawah dengan aplikasi pembayaranmu <strong>(contoh, tidak dapat dipindai)</strong>.</p>' + demoQR(o.id) + '<p class="fine">CONTOH — bukan QRIS sungguhan. Nominal: <strong>' + total + '</strong></p>';
        else if (p.method === 'transfer') body = '<p>Transfer ke rekening contoh berikut:</p><dl class="kv"><dt>Bank</dt><dd>' + esc(dp.bankName) + '</dd><dt>No. rekening</dt><dd>' + esc(dp.accountNumber) + '</dd><dt>Atas nama</dt><dd>' + esc(dp.accountHolder) + '</dd><dt>Nominal</dt><dd>' + total + '</dd></dl><p class="fine">Data rekening ini contoh dan tidak dapat menerima uang.</p>';
        else body = '<p>Pada sistem sungguhan, kamu akan diarahkan ke aplikasi e-wallet untuk membayar <strong>' + total + '</strong>. Di simulasi ini tidak ada tautan ke aplikasi apa pun.</p>';
        body += '<div class="actions"><button type="button" class="btn btn-primary" data-act="pay">Simulasikan pembayaran berhasil</button></div>';
      }
    } else {
      body = '<p>' + (o.type === 'delivery' ? 'Siapkan uang tunai <strong>' + total + '</strong> untuk dibayar ke kurir saat pesanan tiba.' : 'Bayar <strong>' + total + '</strong> di kasir saat di kedai.') + '</p>';
    }
    return '<section class="panel" aria-labelledby="pay-h"><h2 id="pay-h">Pembayaran · ' + esc(p.label) + '</h2><p style="margin-bottom:.75rem">' + payBadge(p.status) + '</p>' + body + '</section>';
  }

  /* ---------- Garis waktu status ---------- */
  function timeline(o) {
    const flow = O.flow(o.type), reached = {};
    o.history.forEach((h) => { reached[h.status] = h.at; });
    const idx = flow.indexOf(o.status);
    let items = flow.map((s, i) => {
      const cls = o.status === 'cancelled' ? (reached[s] ? 'done' : '') : (i < idx ? 'done' : i === idx ? 'now' : '');
      const cur = cls === 'now' ? ' aria-current="step"' : '';
      return '<li class="' + cls + '"' + cur + '><span class="dot" aria-hidden="true">' + (cls === 'done' ? '✓' : i + 1) + '</span><span><strong>' + esc(O.statusLabel(s)) + '</strong>' +
        (reached[s] ? '<span class="when">' + esc(formatDateTime(reached[s])) + '</span>' : '') + '</span></li>';
    });
    if (o.status === 'cancelled') {
      items = [items[0], '<li class="now" aria-current="step"><span class="dot" aria-hidden="true" style="background:var(--ember);color:#fff">×</span><span><strong>Dibatalkan</strong><span class="when">' + esc(formatDateTime(reached.cancelled)) + '</span></span></li>'];
    }
    return '<section class="panel" aria-labelledby="st-h"><h2 id="st-h">Status pesanan</h2><ol class="timeline">' + items.join('') + '</ol></section>';
  }

  function demoControls(o) {
    if (o.status === 'done' || o.status === 'cancelled') return '';
    const flow = O.flow(o.type), next = flow[flow.indexOf(o.status) + 1], c = O.canAdvance(o);
    return '<section class="demo-box" aria-labelledby="demo-h"><h3 id="demo-h">Kontrol demo</h3>' +
      '<p class="fine" style="margin:.4rem 0 .75rem">Pada sistem sungguhan, status diubah oleh staf kedai atau sistem dapur. Di prototipe ini kamu bisa memajukannya sendiri untuk mencoba alurnya. Status tidak berubah otomatis.</p>' +
      '<button type="button" class="btn btn-dark btn-sm" data-act="advance"' + (c.ok ? '' : ' disabled aria-describedby="adv-why"') + '>Majukan status ke “' + esc(O.statusLabel(next)) + '”</button>' +
      (c.ok ? '' : '<p class="fine" id="adv-why" style="margin-top:.5rem">' + esc(c.reason) + '</p>') + '</section>';
  }

  /* ---------- Detail ---------- */
  function detailRows(o) {
    const t = JTZ.config.orderTypes[o.type].label, d = o.details || {};
    let rows = '<dt>Jenis</dt><dd>' + esc(t) + '</dd>';
    if (o.type === 'dinein') rows += '<dt>Meja</dt><dd>' + (d.table ? esc(d.table) : 'Belum diisi') + '</dd>';
    if (o.type === 'takeaway') rows += '<dt>Ambil</dt><dd>' + (d.pickupTime ? 'Hari ini, ' + esc(d.pickupTime) : 'Secepatnya') + '</dd>';
    if (o.type === 'delivery') {
      rows += '<dt>Alamat</dt><dd>' + esc(d.address) + (d.addressDetail ? ', ' + esc(d.addressDetail) : '') + '</dd>';
      if (d.landmark) rows += '<dt>Patokan</dt><dd>' + esc(d.landmark) + '</dd>';
      if (d.courierNote) rows += '<dt>Catatan kurir</dt><dd>' + esc(d.courierNote) + '</dd>';
    }
    rows += '<dt>Pemesan</dt><dd>' + esc(o.customer.name) + ' · ' + esc(o.customer.phone) + '</dd>';
    return '<dl class="kv">' + rows + '</dl>';
  }
  function totalsHTML(o) {
    const t = o.totals; let h = '<dl class="totals" style="margin-top:1rem"><div><dt>Subtotal</dt><dd>' + rupiah(t.subtotal) + '</dd></div>';
    if (t.discount) h += '<div class="disc"><dt>Diskon' + (o.promo ? ' ' + esc(o.promo.code) : '') + '</dt><dd>-' + rupiah(t.discount) + '</dd></div>';
    if (t.packaging) h += '<div><dt>Biaya kemasan</dt><dd>' + rupiah(t.packaging) + '</dd></div>';
    if (t.delivery) h += '<div><dt>Ongkir</dt><dd>' + rupiah(t.delivery) + '</dd></div>';
    if (t.tax) h += '<div><dt>Pajak restoran</dt><dd>' + rupiah(t.tax) + '</dd></div>';
    return h + '<div class="grand"><dt>Total</dt><dd>' + rupiah(t.total) + '</dd></div></dl>';
  }

  function renderDetail(id, isNew) {
    const o = O.get(id);
    if (!o) {
      $('#ph-title').textContent = 'Pesanan tidak ditemukan';
      $('#ph-sub').textContent = 'Pesanan hanya tersimpan di browser tempat ia dibuat.';
      view().innerHTML = '<div class="empty"><p>Nomor pesanan tidak ada di perangkat ini.</p><a class="btn btn-primary" href="pesanan.html">Lihat riwayat</a></div>';
      return;
    }
    $('#ph-eyebrow').textContent = 'Pesanan simulasi';
    $('#ph-title').innerHTML = '<span class="od-id">' + esc(o.id) + '</span>';
    $('#ph-sub').textContent = 'Dibuat ' + formatDateTime(o.createdAt) + ' · ' + JTZ.config.orderTypes[o.type].label;
    const canCancel = o.status === 'pending';
    const waHref = JTZ.wa.link(JTZ.wa.orderMessage(o));
    view().innerHTML = '<div class="od">' +
      (isNew ? '<div class="success" role="status"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><div><strong>Pesanan simulasi dibuat.</strong><br>Pesanan ini belum dikirim ke kedai. Untuk benar-benar memesan, kirim ringkasannya lewat WhatsApp.</div></div>' : '') +
      '<div class="notice"><strong>Mode simulasi</strong>Data pesanan hanya tersimpan di browser ini. Tidak ada dapur yang menerima pesanan ini dan tidak ada pembayaran yang diproses.</div>' +
      '<div class="od-grid"><div>' + timeline(o) + '<div style="margin-top:1.25rem">' + paymentPanel(o) + '</div><div style="margin-top:1.25rem">' + demoControls(o) + '</div></div>' +
      '<div><section class="panel" aria-labelledby="it-h"><h2 id="it-h">Rincian pesanan</h2><ul class="items-list">' + o.items.map((it) =>
        '<li><img src="' + esc(it.img) + '" alt="" width="56" height="56"><div><p style="font-weight:700">' + it.qty + '× ' + esc(it.name) + '</p>' +
        (it.labels.length ? '<p class="fine">' + it.labels.map(esc).join(' · ') + '</p>' : '') + (it.note ? '<p class="fine">Catatan: ' + esc(it.note) + '</p>' : '') + '</div><p style="font-weight:700;white-space:nowrap">' + rupiah(it.total) + '</p></li>').join('') + '</ul>' +
        totalsHTML(o) + '</section>' +
        '<section class="panel" aria-labelledby="inf-h"><h2 id="inf-h">Informasi</h2>' + detailRows(o) + '</section>' +
        '<div class="actions"><a class="btn btn-primary" href="' + esc(waHref) + '" target="_blank" rel="noopener noreferrer">Kirim ke WhatsApp <span class="sr-only">(tab baru)</span></a>' +
        '<button type="button" class="btn btn-ghost" data-act="again">Pesan lagi</button>' +
        (canCancel ? '<button type="button" class="btn btn-danger" data-act="cancel">Batalkan pesanan</button>' : '') + '</div>' +
        '<p class="actions" style="margin-top:.5rem"><a class="text-link" href="pesanan.html">← Semua pesanan</a></p></div></div></div>';

    view().onclick = async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'pay') { O.simulatePayment(id); JTZ.ui.toast('Pembayaran simulasi berhasil.'); renderDetail(id); focusHeading(); }
      else if (act === 'advance') { const r = O.advance(id); if (r.ok) JTZ.ui.toast('Status: ' + O.statusLabel(r.order.status)); renderDetail(id); }
      else if (act === 'cancel') {
        if (await confirmDlg('Batalkan pesanan?', 'Pesanan ' + id + ' akan dibatalkan. Tindakan ini tidak dapat diurungkan.', 'Ya, batalkan')) { O.cancel(id); JTZ.ui.toast('Pesanan dibatalkan.'); renderDetail(id); }
      } else if (act === 'again') {
        const r = JTZ.cart.addFromOrder(O.get(id));
        JTZ.ui.toast(r.added + ' menu ditambahkan ke pesanan' + (r.skipped ? ' (' + r.skipped + ' tidak tersedia lagi)' : '') + '. Harga memakai daftar menu terbaru.', { action: { label: 'Lihat pesanan', fn: JTZ.ui.openCart } });
      }
    };
  }
  function focusHeading() { /* tetap di posisi; pembaruan hanya konten */ }

  /* ---------- Riwayat ---------- */
  function renderList() {
    const list = O.list();
    $('#ph-sub').textContent = 'Riwayat pesanan simulasi di perangkat ini. Tidak tersimpan di server.';
    if (!list.length) {
      view().innerHTML = '<div class="empty"><p class="empty-t">Belum ada pesanan.</p><p>Pesanan yang kamu buat lewat checkout akan muncul di sini.</p><a class="btn btn-primary" href="menu.html">Lihat menu</a></div>';
      return;
    }
    view().innerHTML = '<div style="padding-block:2rem 4rem"><ul class="hist">' + list.map((o) => {
      const n = o.items.reduce((s, i) => s + i.qty, 0);
      return '<li><div><a class="od-id" href="pesanan.html?id=' + encodeURIComponent(o.id) + '">' + esc(o.id) + '</a><p class="meta">' + esc(formatDateTime(o.createdAt)) + ' · ' + esc(JTZ.config.orderTypes[o.type].label) + ' · ' + n + ' item</p>' +
        '<p class="meta"><strong>' + esc(O.statusLabel(o.status)) + '</strong> · ' + esc((PAY_LABEL[o.payment.status] || [''])[0]) + '</p></div>' +
        '<div style="text-align:right"><p class="price">' + rupiah(o.totals.total) + '</p><a class="text-link" href="pesanan.html?id=' + encodeURIComponent(o.id) + '">Lihat detail</a></div></li>';
    }).join('') + '</ul><div class="actions"><button type="button" class="btn btn-danger btn-sm" data-act="clear">Hapus semua riwayat</button></div></div>';
    view().onclick = async (e) => {
      if (!e.target.closest('[data-act="clear"]')) return;
      if (await confirmDlg('Hapus semua riwayat?', 'Semua pesanan simulasi di perangkat ini akan dihapus.', 'Ya, hapus semua')) { O.clearAll(); renderList(); }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const sp = new URLSearchParams(location.search), id = sp.get('id');
    if (id) renderDetail(id, sp.get('baru') === '1'); else renderList();
  });
})();
