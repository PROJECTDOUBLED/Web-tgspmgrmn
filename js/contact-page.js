/* Kontak & reservasi (dikirim lewat WhatsApp) */
(function () {
  const { esc } = JTZ.util;
  const $ = (s) => document.querySelector(s);

  function localISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function setErr(id, msg) {
    const e = $('#re-' + id), input = $('#r-' + id);
    e.textContent = msg || ''; e.hidden = !msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#contact-social').innerHTML = JTZ.ui.socialLinks();
    const dateInput = $('#r-date'); dateInput.min = localISO(new Date());
    const form = $('#rsv-form');
    form.addEventListener('input', (e) => { const id = e.target.id.replace('r-', ''); if (e.target.getAttribute('aria-invalid')) setErr(id, ''); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#r-name').value.trim(), phone = JTZ.util.normalizePhone($('#r-phone').value),
        date = $('#r-date').value, time = $('#r-time').value, guests = parseInt($('#r-guests').value, 10), note = $('#r-note').value.trim();
      const errs = [];
      const check = (id, bad, msg) => { if (bad) { setErr(id, msg); errs.push(id); } else setErr(id, ''); };
      check('name', name.length < 2, 'Isi nama minimal 2 huruf.');
      check('phone', !phone, 'Nomor tidak valid. Contoh: 0812 3456 7890.');
      check('date', !date || date < localISO(new Date()), !date ? 'Pilih tanggal.' : 'Tanggal tidak boleh sudah lewat.');
      let timeBad = !time, timeMsg = 'Pilih jam datang.';
      if (!timeBad && date === localISO(new Date())) {
        const [h, m] = time.split(':').map(Number), t = new Date(); t.setHours(h, m, 0, 0);
        if (t.getTime() < Date.now()) { timeBad = true; timeMsg = 'Jam sudah lewat untuk hari ini.'; }
      }
      check('time', timeBad, timeMsg);
      check('guests', !(guests >= 1 && guests <= 15), 'Jumlah tamu 1 sampai 15 orang. Untuk rombongan lebih besar, hubungi kami lewat WhatsApp.');
      if (errs.length) { $('#r-' + errs[0]).focus(); return; }

      const [y, mo, d] = date.split('-').map(Number);
      const dateText = new Date(y, mo - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const msg = ['Halo Jatizakaya, saya ingin reservasi meja.', '', 'Nama: ' + name, 'Tanggal: ' + dateText, 'Jam: ' + time, 'Jumlah tamu: ' + guests]
        .concat(note ? ['Catatan: ' + note] : []).concat(['No. HP: ' + '0' + phone.slice(2)]).join('\n');
      const url = JTZ.wa.link(msg);
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      const done = $('#rsv-done'); done.hidden = false;
      done.innerHTML = '<strong>Pesan reservasi sudah disiapkan.</strong><br>Kirim pesan di WhatsApp agar kedai menerimanya; reservasi baru terkonfirmasi setelah dibalas. ' +
        (w ? '' : 'Jika WhatsApp tidak terbuka, ') + '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + (w ? 'Buka lagi di WhatsApp' : 'buka lewat tautan ini') + '</a>.';
      done.focus && done.setAttribute('tabindex', '-1');
    });
  });
})();
