/* Checkout: data pemesan, jenis pemesanan, pembayaran (simulasi), ringkasan & validasi */
(function () {
  const { esc, rupiah } = JTZ.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const cfg = JTZ.config;
  const st = { type: null, pay: null, submitting: false };

  const enabledTypes = () => Object.keys(cfg.orderTypes).filter((k) => cfg.orderTypes[k].enabled);
  const payOptions = () => cfg.paymentMethods.filter((m) => m.types.includes(st.type));

  /* ---------- Kartu pilihan ---------- */
  function renderTypes() {
    $('#type-cards').innerHTML = enabledTypes().map((k) => {
      const t = cfg.orderTypes[k];
      return '<label class="radio-card"><input type="radio" name="type" value="' + k + '"' + (st.type === k ? ' checked' : '') + '><span><strong>' + esc(t.label) + '</strong><span>' + esc(t.hint) + '</span></span></label>';
    }).join('');
  }
  function renderPayments() {
    const opts = payOptions();
    if (!opts.some((m) => m.id === st.pay)) st.pay = null;
    $('#pay-cards').innerHTML = opts.map((m) =>
      '<label class="radio-card"><input type="radio" name="pay" value="' + m.id + '"' + (st.pay === m.id ? ' checked' : '') + '><span><strong>' + esc(m.label) + '</strong><span>' + esc(m.note) + '</span></span></label>').join('');
  }
  function showConditional() {
    ['dinein', 'takeaway', 'delivery'].forEach((k) => { $('#c-' + k).hidden = st.type !== k; });
  }

  /* ---------- Ringkasan ---------- */
  function renderSummary() {
    const priced = JTZ.cart.price(st.type);
    if (!priced.lines.length) { $('#co-main').hidden = true; $('#co-empty').hidden = false; return; }
    $('#co-main').hidden = false; $('#co-empty').hidden = true;
    $('#sum-lines').innerHTML = priced.lines.map((d) =>
      '<div class="sl"><img src="' + esc(d.product.imgSm) + '" alt="" width="48" height="48"><div><p class="sl-name">' + d.qty + '× ' + esc(d.product.name) + '</p>' +
      (d.labels.length ? '<p class="sl-opt">' + d.labels.map(esc).join(' · ') + '</p>' : '') +
      (d.note ? '<p class="sl-opt">Catatan: ' + esc(d.note) + '</p>' : '') + '</div><p class="sl-t">' + rupiah(d.total) + '</p></div>').join('');
    const rows = [['Subtotal', rupiah(priced.subtotal)]];
    let html = '<div><dt>Subtotal</dt><dd>' + rupiah(priced.subtotal) + '</dd></div>';
    if (priced.discount) html += '<div class="disc"><dt>Diskon ' + esc(priced.promo.code) + '</dt><dd>-' + rupiah(priced.discount) + '</dd></div>';
    if (priced.packaging) html += '<div><dt>Biaya kemasan</dt><dd>' + rupiah(priced.packaging) + '</dd></div>';
    if (priced.delivery) html += '<div><dt>Ongkir</dt><dd>' + rupiah(priced.delivery) + '</dd></div>';
    if (priced.tax) html += '<div><dt>' + esc(cfg.fees.taxLabel) + '</dt><dd>' + rupiah(priced.tax) + '</dd></div>';
    html += '<div class="grand"><dt>Total</dt><dd>' + rupiah(priced.total) + '</dd></div>';
    $('#sum-totals').innerHTML = html;
    $('#sum-n').textContent = priced.itemCount + ' item · ' + rupiah(priced.total);
    $('#co-total').textContent = rupiah(priced.total);
    const errBox = $('#sum-err');
    errBox.hidden = !priced.errors.length; errBox.textContent = priced.errors.join(' ');
    $('#co-promo').innerHTML = JTZ.ui.promoBoxHTML(st.type);
  }

  /* ---------- Validasi ---------- */
  function setErr(field, msg) {
    const input = $('#f-' + field) || $('#e-' + field).previousElementSibling;
    const err = $('#e-' + field);
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
    if (input && input.setAttribute) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function validate() {
    const errors = [];     // {id, msg, focus}
    const add = (field, msg, focusEl) => errors.push({ field, msg, focusEl });
    const f = $('#co-form');

    const name = f.elements.name.value.trim();
    if (name.length < 2) add('name', 'Isi nama minimal 2 huruf.', $('#f-name')); else setErr('name', '');
    const phone = JTZ.util.normalizePhone(f.elements.phone.value);
    if (!phone) add('phone', 'Nomor tidak valid. Contoh: 0812 3456 7890.', $('#f-phone')); else setErr('phone', '');
    if (!st.type) { add('type', 'Pilih jenis pemesanan.', $('#type-cards input')); } else { setErr('type', ''); }
    const details = {};
    if (st.type === 'dinein') {
      const table = f.elements.table.value.trim();
      if (table && !/^[A-Za-z0-9]{1,4}$/.test(table)) add('table', 'Nomor meja hanya huruf/angka, maksimal 4 karakter.', $('#f-table')); else setErr('table', '');
      details.table = table;
    }
    if (st.type === 'takeaway') {
      const later = f.elements.pickup.value === 'later';
      if (later) {
        const v = f.elements.pickupTime.value;
        let msg = '';
        if (!v) msg = 'Pilih jam pengambilan.';
        else {
          const [h, m] = v.split(':').map(Number); const t = new Date(); t.setHours(h, m, 0, 0);
          if (t.getTime() - Date.now() < 15 * 60000) msg = 'Jam pengambilan minimal 15 menit dari sekarang (hari ini).';
        }
        if (msg) add('pickup', msg, $('#f-pickup')); else setErr('pickup', '');
        details.pickupTime = v;
      } else { setErr('pickup', ''); details.pickupTime = ''; }
    }
    if (st.type === 'delivery') {
      const address = f.elements.address.value.trim();
      if (address.length < 10) add('address', 'Isi alamat lengkap (minimal 10 karakter).', $('#f-address')); else setErr('address', '');
      Object.assign(details, { address, addressDetail: f.elements.addressDetail.value.trim(), landmark: f.elements.landmark.value.trim(), courierNote: f.elements.courierNote.value.trim() });
    }
    if (!st.pay) add('pay', 'Pilih metode pembayaran.', $('#pay-cards input')); else setErr('pay', '');

    errors.forEach((e) => { if (e.field === 'type' || e.field === 'pay') { const el = $('#e-' + e.field); el.textContent = e.msg; el.hidden = false; } else setErr(e.field, e.msg); });
    return { errors, values: { customer: { name, phone: phone ? '0' + phone.slice(2) : '' }, details } };
  }

  /* ---------- Kirim ---------- */
  function onSubmit(e) {
    e.preventDefault();
    if (st.submitting) return;
    const formErr = $('#e-form'); formErr.hidden = true;
    const { errors, values } = validate();
    if (errors.length) {
      formErr.textContent = 'Ada ' + errors.length + ' isian yang perlu diperbaiki.'; formErr.hidden = false;
      const first = errors[0].focusEl; if (first) first.focus();
      return;
    }
    st.submitting = true; const btn = $('#co-submit'); btn.disabled = true;
    const r = JTZ.orders.create({ customer: values.customer, type: st.type, details: values.details, paymentMethod: st.pay });
    if (!r.ok) {
      formErr.textContent = r.error; formErr.hidden = false; btn.disabled = false; st.submitting = false; return;
    }
    JTZ.cart.clear();      // keranjang baru dikosongkan setelah pesanan tersimpan
    location.href = 'pesanan.html?id=' + encodeURIComponent(r.order.id) + '&baru=1';
  }

  function init() {
    st.type = enabledTypes()[0] || null;
    renderTypes(); renderPayments(); showConditional(); renderSummary();
    JTZ.ui.bindPromo($('#co-promo'), null);

    $('#type-cards').addEventListener('change', (e) => {
      if (e.target.name !== 'type') return;
      st.type = e.target.value; $('#e-type').hidden = true;
      showConditional(); renderPayments(); renderSummary();
    });
    $('#pay-cards').addEventListener('change', (e) => { if (e.target.name === 'pay') { st.pay = e.target.value; $('#e-pay').hidden = true; } });
    $('#co-form').addEventListener('change', (e) => {
      if (e.target.name === 'pickup') $('#pickup-time-wrap').hidden = e.target.value !== 'later';
    });
    $('#co-form').addEventListener('input', (e) => {
      const id = e.target.id; if (!id || !id.startsWith('f-')) return;
      const field = id.slice(2);
      if (e.target.getAttribute('aria-invalid') === 'true') setErr(field, '');
    });
    $('#co-form').addEventListener('submit', onSubmit);
    $('#edit-order').addEventListener('click', () => JTZ.ui.openCart());
    window.addEventListener('jtz:cart', renderSummary);

    const d = $('#sum-details'), mq = window.matchMedia('(min-width: 960px)');
    const sync = () => { d.open = mq.matches; };
    sync(); (mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync));
  }
  document.addEventListener('DOMContentLoaded', init);
})();
