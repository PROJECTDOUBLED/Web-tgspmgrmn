// Uji unit logika harga/keranjang/pesanan (Node, tanpa browser)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
globalThis.window = globalThis;
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => delete store[k] };
globalThis.CustomEvent = class { constructor(t) { this.type = t; } };
globalThis.addEventListener = () => {}; globalThis.dispatchEvent = () => {};
for (const f of ['js/config.js', 'js/data/menu.js', 'js/store.js']) (0, eval)(fs.readFileSync(path.join(root, f), 'utf8'));
const J = globalThis.JTZ;
let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (ok ? '' : '  got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want))); };

// 1 data
eq('jumlah produk', J.products.length, 19);
eq('id produk unik', new Set(J.products.map(p => p.id)).size, 19);
eq('semua kategori valid', J.products.every(p => J.categories.some(c => c.id === p.category)), true);

// 2 harga satuan dengan varian
const miso = J.catalog.get('spicy-miso-ramen');
eq('harga ramen + jumbo + telur + chashu', J.catalog.unitPrice(miso, { porsi: ['jumbo'], tambah: ['telur', 'chashu'] }), 35000 + 8000 + 6000 + 10000);

// 3 baris tidak digabung bila varian beda; digabung bila sama
J.cart.clear();
J.cart.add('spicy-miso-ramen', { pedas: ['pedas'], tambah: ['telur'] }, '', 2);
J.cart.add('spicy-miso-ramen', { tambah: ['telur'], pedas: ['pedas'] }, '', 1);   // urutan berbeda, sama
J.cart.add('spicy-miso-ramen', { pedas: ['sedang'] }, '', 1);
J.cart.add('spicy-miso-ramen', { pedas: ['sedang'] }, 'tanpa jagung', 1);
eq('jumlah baris', J.cart.lines().length, 3);
eq('total unit', J.cart.count(), 5);
eq('qty baris tergabung', J.cart.lines().find(l => l.sel.pedas[0] === 'pedas').qty, 3);

// 4 validasi kuantitas
const k = J.cart.lines()[0].key;
eq('setQty 0 -> 1', (J.cart.setQty(k, 0), J.cart.lines()[0].qty), 1);
eq('setQty 999 -> maks', (J.cart.setQty(k, 999), J.cart.lines()[0].qty), J.config.fees.maxQtyPerLine);
eq('setQty "abc" -> 1', (J.cart.setQty(k, 'abc'), J.cart.lines()[0].qty), 1);

// 5 hapus + urungkan
eq('remove', J.cart.remove(k), true);
eq('baris setelah hapus', J.cart.lines().length, 2);
eq('undo', J.cart.undoRemove(), true);
eq('baris setelah undo', J.cart.lines().length, 3);

// 6 total dine-in tanpa promo
J.cart.clear();
J.cart.add('negima', {}, '', 3);       // 3 x 20000
J.cart.add('torikawa', {}, '', 1);     // 18000
let p = J.cart.price('dinein');
eq('subtotal', p.subtotal, 78000);
eq('dinein: tanpa kemasan/ongkir', [p.packaging, p.delivery], [0, 0]);
eq('pajak 10% dibulatkan', p.tax, 7800);
eq('total dinein', p.total, 85800);

// 7 promo YAKI4: 4 porsi -> termurah (torikawa 18000) gratis
J.cart.setPromo('YAKI4'); p = J.cart.price('dinein');
eq('YAKI4 diskon', p.discount, 18000);
eq('YAKI4 pajak dari (sub-diskon)', p.tax, Math.round(60000 * 0.1));
eq('YAKI4 total', p.total, 78000 - 18000 + 6000);

// 8 YAKI4 tidak berlaku bila < 4 porsi
J.cart.clear(); J.cart.add('negima', {}, '', 3); J.cart.setPromo('YAKI4'); p = J.cart.price('dinein');
eq('YAKI4 <4 porsi tidak valid', [p.promo.valid, p.discount], [false, 0]);
// 8b 8 porsi -> 2 gratis (termurah)
J.cart.add('torikawa', {}, '', 5); p = J.cart.price('dinein');   // 3x20000 + 5x18000 = 8 unit; 2 termurah = 36000
eq('YAKI4 8 porsi -> 2 gratis', p.discount, 36000);

// 9 RAMEN20 hanya kategori ramen (termasuk tambahan pada ramen)
J.cart.clear();
J.cart.add('shoyu-ramen', { tambah: ['telur'] }, '', 2);   // (32000+6000)*2 = 76000
J.cart.add('es-kopi-susu', {}, '', 1);                       // 22000
J.cart.setPromo('RAMEN20'); p = J.cart.price('takeaway');
eq('RAMEN20 diskon 20% ramen saja', p.discount, 15200);
eq('takeaway kemasan', p.packaging, 2000);
eq('total takeaway', p.total, (98000 - 15200) + 2000 + Math.round((98000 - 15200) * 0.1));

// 10 delivery: ongkir + minimum
p = J.cart.price('delivery');
eq('ongkir', p.delivery, 10000);
J.cart.clear(); J.cart.add('ocha', {}, '', 1); p = J.cart.price('delivery');
eq('delivery di bawah minimum -> error', p.errors.length, 1);
eq('orders.create ditolak di bawah minimum', J.orders.create({ customer: { name: 'A', phone: '628111111111' }, type: 'delivery', details: {}, paymentMethod: 'cod' }).ok, false);

// 11 promo tidak dikenal & promo tanpa item kategori
J.cart.clear(); J.cart.add('ocha', {}, '', 1);
eq('setPromo tak dikenal', J.cart.setPromo('NGAWUR').ok, false);
J.cart.setPromo('RAMEN20'); p = J.cart.price('dinein');
eq('RAMEN20 tanpa ramen -> tidak valid', [p.promo.valid, p.discount], [false, 0]);

// 12 pesanan
J.cart.clear(); J.cart.add('katsu-curry-bento', { tambah: ['nasi'] }, 'tanpa salad', 2); J.cart.setPromo('');
const r = J.orders.create({ customer: { name: 'Budi', phone: '628123456789' }, type: 'dinein', details: { table: '5' }, paymentMethod: 'qris' });
eq('order dibuat', r.ok, true);
const o = r.order;
eq('id format', /^JTZ-\d{6}-[A-Z2-9]{4}$/.test(o.id), true);
eq('total order = harga hitung ulang', o.totals.total, (43000 * 2) + Math.round(86000 * 0.1));
eq('qris belum dibayar', o.payment.status, 'unpaid');
eq('tidak bisa advance sebelum bayar', J.orders.advance(o.id).ok, false);
eq('simulasi bayar', J.orders.simulatePayment(o.id).ok, true);
eq('advance -> confirmed', J.orders.advance(o.id).order.status, 'confirmed');
eq('tidak bisa cancel setelah confirmed', J.orders.cancel(o.id).ok, false);
['preparing', 'served', 'done'].forEach(s => eq('advance -> ' + s, J.orders.advance(o.id).order.status, s));
eq('advance setelah selesai ditolak', J.orders.advance(o.id).ok, false);

// 13 metode tidak cocok jenis pesanan
J.cart.clear(); J.cart.add('katsu-curry-bento', {}, '', 1);
eq('COD untuk dine-in ditolak', J.orders.create({ customer: { name: 'A', phone: '628111111111' }, type: 'dinein', details: {}, paymentMethod: 'cod' }).ok, false);
eq('tunai kasir dine-in diterima', J.orders.create({ customer: { name: 'A', phone: '628111111111' }, type: 'dinein', details: {}, paymentMethod: 'cashier' }).ok, true);

// 14 cancel dari pending (dibayar -> refund demo)
const r2 = J.orders.create({ customer: { name: 'A', phone: '628111111111' }, type: 'takeaway', details: {}, paymentMethod: 'qris' });
J.orders.simulatePayment(r2.order.id);
eq('cancel pending', J.orders.cancel(r2.order.id).order.status, 'cancelled');
eq('refund demo', J.orders.get(r2.order.id).payment.status, 'refund_demo');

// 15 sanitasi data localStorage rusak/dimanipulasi
store[J.config.storage.cart] = JSON.stringify({ lines: [{ productId: 'hantu', qty: 3, sel: {} }, { productId: 'ocha', qty: -5, sel: { suhu: ['xx'] }, note: 'x'.repeat(300) }, { productId: 'negima', qty: 9999, sel: {} }], promo: 'HACK' });
J.cart.init();
const ls = J.cart.lines();
eq('produk hantu dibuang', ls.some(l => l.productId === 'hantu'), false);
eq('qty negatif -> 1', ls.find(l => l.productId === 'ocha').qty, 1);
eq('pilihan invalid -> default', ls.find(l => l.productId === 'ocha').sel.suhu, ['dingin']);
eq('catatan dipotong 100', ls.find(l => l.productId === 'ocha').note.length, 100);
eq('qty 9999 -> maks', ls.find(l => l.productId === 'negima').qty, 20);
eq('promo palsu dibuang', J.cart.promo(), '');
store[J.config.storage.cart] = '{rusak';
J.cart.init(); eq('JSON rusak -> keranjang kosong', J.cart.isEmpty(), true);
store[J.config.storage.orders] = 'bukan json'; eq('orders JSON rusak -> []', J.orders.list().length, 0);

// 16 telepon
eq('tel 0812...', J.util.normalizePhone('0812-3456-7890'), '6281234567890');
eq('tel +62', J.util.normalizePhone('+62 838 9691 6403'), '6283896916403');
eq('tel invalid', J.util.normalizePhone('12345'), null);
eq('tel bukan 08', J.util.normalizePhone('0212345678'), null);
eq('rupiah', J.util.rupiah(1234567), 'Rp 1.234.567');
console.log('\n' + pass + ' lulus, ' + fail + ' gagal'); process.exit(fail ? 1 : 0);
