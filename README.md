# Jatizakaya — Website Restoran (Upgrade Proyek UTS)

Pengembangan besar dari `index.html` + folder `Images` buatan kelompok menjadi situs restoran multi-halaman dengan menu interaktif, keranjang, checkout, simulasi pembayaran, dan status pesanan.

**Teknologi:** HTML, CSS, dan JavaScript biasa (tanpa framework, tanpa build, tanpa dependensi npm). Satu-satunya sumber daya luar adalah Google Fonts (Bricolage Grotesque, Plus Jakarta Sans); bila offline, situs memakai font sistem.

## Menjalankan
Cukup buka `index.html` di browser (klik dua kali). Semua skrip klasik, jadi tidak perlu server. Bila ingin server lokal: `python3 -m http.server 8000` lalu buka `http://localhost:8000`.

## Struktur
```
index.html  menu.html  checkout.html  pesanan.html  kontak.html  info.html
assets/images/menu/    foto menu (WebP; -sm = thumbnail)
assets/images/brand/   kedai, logo, favicon
css/   variables.css (warna, font)  base.css  components.css  pages.css
js/config.js           semua pengaturan bisnis (kontak, biaya, promo, sosial, pembayaran)
js/data/menu.js        satu-satunya sumber data menu & harga
js/store.js            keranjang, perhitungan harga & promo, pesanan (aturan tunggal)
js/ui.js               header/footer, drawer keranjang, modal produk, toast
js/*-page.js, home.js, checkout.js   skrip tiap halaman
tests/                 unit.js (logika harga) dan e2e.py (browser, Playwright)
```

## Cara mengubah
- **Gambar:** ganti file di `assets/images/menu/` dengan nama yang sama (`nama.webp` ukuran maks ±900px dan `nama-sm.webp` ±360px), atau ubah path `img`/`imgSm` di `js/data/menu.js`.
- **Menu & harga:** edit `js/data/menu.js`. Tiap produk: `id`, `category`, `name`, `price`, `desc`, `alt`, `best` (favorit), `available: false` (tandai habis), `options` (varian). Varian dipakai ulang lewat `JTZ.optionSets`; harga tambahan ada di `price` tiap pilihan. Harga hanya ditulis di file ini.
- **Tautan sosial:** isi `url` pada `social` di `js/config.js`. Yang kosong otomatis tidak ditampilkan. WhatsApp dan Google Maps dibuat dari `contact`.
- **Alamat, WhatsApp, jam buka:** `contact` di `js/config.js`.
- **Biaya:** `fees` (pajak, kemasan, ongkir, minimum pesan antar, batas kuantitas).
- **Promo:** `promos` di `js/config.js`. Tipe `percent_category` (diskon % per kategori) dan `buy_x_get_1` (tiap N+1 porsi, 1 termurah gratis).
- **Jenis pemesanan & metode bayar:** `orderTypes` dan `paymentMethods` (set `enabled: false` untuk menonaktifkan).

## Pengujian
- `node tests/unit.js` — 60 pemeriksaan logika harga, promo, varian, penggabungan baris, validasi, data localStorage rusak, alur status pesanan.
- `python3 tests/e2e.py` (butuh Playwright + Chromium, dan server di port 8765 dari folder proyek) — alur menu → keranjang → checkout → pesanan, validasi formulir, reservasi, overflow horizontal di 4 lebar layar, gambar rusak, tautan internal, error konsol.
Cek manual yang disarankan: tampilan di iPhone/Android sungguhan, Safari, dan pembacaan layar.

## Fitur
**Berfungsi penuh di frontend:** katalog dengan pencarian, filter, urutan; detail produk dengan varian, tambahan, catatan, harga dinamis; keranjang (tambah, ubah jumlah, hapus + urungkan, penggabungan baris cerdas, bertahan setelah reload, sinkron antar tab); kode promo; perhitungan total (diskon, kemasan, ongkir, pajak); checkout dengan validasi per jenis pemesanan; riwayat pesanan lokal dan pesan lagi; ringkasan pesanan & reservasi yang dikirim lewat WhatsApp (tautan `wa.me`).
**Simulasi (bukan sungguhan):** metode pembayaran (QRIS, transfer, e-wallet), data rekening/QR contoh, status pembayaran, dan status pesanan (dimajukan manual lewat "Kontrol demo"; tidak berubah acak atau otomatis).

## Keterbatasan (butuh backend/layanan)
Pesanan tersimpan di `localStorage` browser, bukan server, sehingga dapur tidak menerimanya. Untuk operasional nyata dibutuhkan: backend + database, validasi harga & promo di server (harga di browser tidak tepercaya), payment gateway (QRIS/VA/e-wallet) dengan verifikasi webhook, notifikasi pesanan, panel admin, pengelolaan stok, integrasi kurir. Jangan menaruh kunci rahasia atau data kartu di frontend. Situs ini **belum siap produksi**.

## Yang perlu dilengkapi
1. Jam operasional (`contact.openingHours`).
2. Akun Instagram/TikTok/Facebook/YouTube (`social`), bila ada.
3. Konfirmasi alamat dan nomor WhatsApp asli (diambil dari proyek lama).
4. Harga dasar dari proyek lama dipertahankan; **opsi, harga tambahan, biaya kemasan, ongkir, minimum pesan, dan pajak adalah data demo** — sesuaikan dengan konsep kelompok.
5. Tag `og:image` memakai path relatif; saat dipublikasikan ganti dengan URL absolut.
6. Tampilan di jaringan lambat dan di browser lama (butuh elemen `<dialog>`: Chrome/Edge 37+, Safari 15.4+, Firefox 98+).

## Perubahan dari proyek asli (ringkas)
Dipertahankan: nama, logo, foto kedai & 19 menu beserta harga dasarnya, alamat, WhatsApp, dua promo (diskon 20% ramen, beli 3 gratis 1 yakitori), palet hitam/oranye/merah. Dihapus: testimoni bernama dan rating bintang (tidak dapat diverifikasi), iframe peta yang menunjuk stasiun, formulir reservasi yang hanya menampilkan "berhasil" tanpa mengirim apa pun, dependensi Bootstrap/jQuery. Teks menu yang tidak dapat dipastikan (mis. "asli Uji", "gula aren asli Jatinegara") dilunakkan; "pokesoy" diasumsikan "pakcoy" — mohon dicek.
