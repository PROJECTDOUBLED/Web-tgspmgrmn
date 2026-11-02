/* Beranda: menu favorit, promo, kontak */
(function () {
  const { esc, rupiah } = JTZ.util;
  const $ = (s) => document.querySelector(s);

  function featHTML(p, large) {
    return '<article class="feat' + (large ? ' feat-lg' : '') + '">' +
      '<img src="' + esc(large ? p.img : p.imgSm) + '" alt="' + esc(p.alt) + '" ' + (large ? 'width="900" height="900"' : 'width="112" height="112"') + ' loading="lazy">' +
      '<div><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="row"><span class="price">' + rupiah(p.price) + '</span>' +
      '<button type="button" class="btn btn-dark btn-sm" data-id="' + esc(p.id) + '">Pesan<span class="sr-only"> ' + esc(p.name) + '</span></button></div></div></article>';
  }

  function renderFavs() {
    const favs = JTZ.products.filter((p) => p.best);
    $('#fav-grid').innerHTML = featHTML(favs[0], true) + '<div class="fav-side">' + favs.slice(1).map((p) => featHTML(p, false)).join('') + '</div>';
    $('#fav-grid').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]'); if (b) JTZ.ui.openProduct(b.dataset.id);
    });
  }

  function renderPromos() {
    const grid = $('#promo-grid');
    function draw() {
      const applied = JTZ.cart.promo();
      grid.innerHTML = JTZ.config.promos.map((p) =>
        '<div class="promo-card"><h3>' + esc(p.title) + '</h3><p>' + esc(p.rule) + '</p><span class="code">' + esc(p.code) + '</span>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-code="' + esc(p.code) + '"' + (applied === p.code ? ' aria-pressed="true"' : '') + '>' + (applied === p.code ? 'Kode terpasang' : 'Pasang kode') + '</button></div>').join('');
    }
    draw();
    window.addEventListener('jtz:cart', draw);
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-code]'); if (!b) return;
      const code = b.dataset.code;
      if (JTZ.cart.promo() === code) { JTZ.cart.setPromo(''); JTZ.ui.toast('Kode ' + code + ' dilepas.'); return; }
      JTZ.cart.setPromo(code);
      const promo = JTZ.config.promos.find((x) => x.code === code);
      JTZ.ui.toast('Kode ' + code + ' terpasang. Tambahkan menu ' + JTZ.catalog.categoryLabel(promo.category) + ' agar berlaku.', { action: { label: 'Ke menu', fn: () => { location.href = 'menu.html?cat=' + promo.category; } } });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderFavs(); renderPromos();
    $('#home-social').innerHTML = JTZ.ui.socialLinks();
  });
})();
