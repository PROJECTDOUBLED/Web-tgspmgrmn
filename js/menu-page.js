/* Halaman menu: pencarian, filter kategori, pengurutan, daftar menu */
(function () {
  const { esc, rupiah } = JTZ.util;
  const $ = (s) => document.querySelector(s);
  const state = { cat: 'all', q: '', sort: 'rec' };

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function readURL() {
    const sp = new URLSearchParams(location.search);
    const cat = sp.get('cat');
    if (cat && JTZ.categories.some((c) => c.id === cat)) state.cat = cat;
    state.q = (sp.get('q') || '').slice(0, 60);
    const sort = sp.get('sort'); if (['rec', 'asc', 'desc', 'name'].includes(sort)) state.sort = sort;
    return sp.get('item');
  }
  function writeURL() {
    const sp = new URLSearchParams();
    if (state.cat !== 'all') sp.set('cat', state.cat);
    if (state.q) sp.set('q', state.q);
    if (state.sort !== 'rec') sp.set('sort', state.sort);
    const qs = sp.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* file:// tertentu */ }
  }

  function sorted(list) {
    const l = list.slice();
    if (state.sort === 'asc') l.sort((a, b) => a.price - b.price);
    else if (state.sort === 'desc') l.sort((a, b) => b.price - a.price);
    else if (state.sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    else l.sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0));   // rekomendasi: favorit dulu; sort stabil menjaga urutan asli
    return l;
  }
  function filtered() {
    const q = norm(state.q.trim());
    return JTZ.products.filter((p) => (state.cat === 'all' || p.category === state.cat) &&
      (!q || norm(p.name + ' ' + p.desc + ' ' + JTZ.catalog.categoryLabel(p.category)).includes(q)));
  }

  function dishHTML(p) {
    const off = p.available === false;
    const hasOpts = (p.options || []).length > 0;
    return '<article class="dish' + (off ? ' off' : '') + '" data-id="' + esc(p.id) + '">' +
      '<img class="dish-img" src="' + esc(p.imgSm) + '" alt="' + esc(p.alt) + '" width="120" height="120" loading="lazy">' +
      '<div><h3 style="font-size:inherit"><button type="button" class="dish-name" data-open="' + esc(p.id) + '">' + esc(p.name) + '</button>' + (p.best ? '<span class="dish-tag">Favorit</span>' : '') + '</h3>' +
      '<p class="dish-desc">' + esc(p.desc) + '</p>' +
      '<div class="dish-foot"><span class="price">' + rupiah(p.price) + '</span>' +
      (off ? '<span class="fine">Sedang tidak tersedia</span>' :
        '<button type="button" class="btn btn-dark btn-sm" data-add="' + esc(p.id) + '" data-opts="' + (hasOpts ? 1 : 0) + '">' + JTZ.ui.icon('plus') + 'Tambah<span class="sr-only"> ' + esc(p.name) + '</span></button>') +
      '</div></div></article>';
  }

  function render() {
    const list = sorted(filtered());
    const box = $('#results');
    if (!list.length) {
      box.innerHTML = '<div class="no-result"><h2>Tidak ada menu yang cocok.</h2><p>Coba kata kunci lain atau tampilkan semua kategori.</p><button type="button" class="btn btn-primary" id="reset">Hapus pencarian &amp; filter</button></div>';
    } else if (state.cat === 'all' && !state.q) {
      box.innerHTML = JTZ.categories.map((c) => {
        const items = list.filter((p) => p.category === c.id);
        return items.length ? '<section class="menu-group" aria-labelledby="g-' + c.id + '"><h2 id="g-' + c.id + '">' + esc(c.label) + ' <small>' + items.length + ' menu</small></h2><div class="dish-list">' + items.map(dishHTML).join('') + '</div></section>' : '';
      }).join('');
    } else {
      const title = state.cat === 'all' ? 'Hasil pencarian' : JTZ.catalog.categoryLabel(state.cat);
      box.innerHTML = '<section class="menu-group"><h2>' + esc(title) + ' <small>' + list.length + ' menu</small></h2><div class="dish-list">' + list.map(dishHTML).join('') + '</div></section>';
    }
    $('#count').textContent = list.length ? list.length + ' menu ditampilkan' : 'Tidak ada menu yang cocok';
    $('#chips').querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
    writeURL();
  }

  function init() {
    const itemId = readURL();
    $('#chips').innerHTML = [{ id: 'all', label: 'Semua' }].concat(JTZ.categories).map((c) =>
      '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + '</button>').join('');
    $('#q').value = state.q; $('#sort').value = state.sort;

    $('#chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) { state.cat = b.dataset.cat; render(); } });
    let t; $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 120); });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
    $('#results').addEventListener('click', (e) => {
      if (e.target.closest('#reset')) { state.cat = 'all'; state.q = ''; $('#q').value = ''; render(); return; }
      const add = e.target.closest('[data-add]');
      if (add) {
        const id = add.dataset.add;
        if (add.dataset.opts === '1') JTZ.ui.openProduct(id);
        else JTZ.ui.addToCart(id, {}, '', 1);
        return;
      }
      const open = e.target.closest('[data-open]');
      const row = e.target.closest('.dish');
      if (open) JTZ.ui.openProduct(open.dataset.open);
      else if (row && !e.target.closest('button')) JTZ.ui.openProduct(row.dataset.id);
    });
    render();
    if (itemId && JTZ.catalog.get(itemId)) JTZ.ui.openProduct(itemId);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
