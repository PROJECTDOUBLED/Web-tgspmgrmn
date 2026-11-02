/* ==========================================================================
   JATIZAKAYA — KONFIGURASI
   Semua informasi bisnis, biaya, promo, dan tautan ada di file ini.
   Ubah di sini saja; halaman lain membacanya otomatis.
   ========================================================================== */
window.JTZ = window.JTZ || {};

JTZ.config = {
  brand: {
    name: 'Jatizakaya',
    tagline: 'Kedai makan Jaktim × Jepang',   // sama dengan tulisan di papan kedai pada foto
    shortStory: 'Jatinegara + izakaya'
  },

  /* --- Informasi restoran (dari proyek asli kelompok) ---
     Alamat & nomor WhatsApp diambil dari index.html lama. Jika berubah, edit di sini. */
  contact: {
    address: 'Jl. Matraman Raya No. 12, Kel. Bali Mester, Kec. Jatinegara, Kota Jakarta Timur, DKI Jakarta 13310',
    addressShort: 'Jl. Matraman Raya No. 12, Jatinegara',
    whatsappNumber: '6283896916403',          // format internasional tanpa + atau spasi
    whatsappDisplay: '+62 838-9691-6403',
    /* Jam operasional belum ada di proyek asli. Isi bila sudah ditentukan,
       contoh: 'Setiap hari, 11.00 – 22.00 WIB'. Kosong = tampil "tanya via WhatsApp". */
    openingHours: ''
  },

  /* --- Media sosial ---
     Isi url untuk menampilkan tombolnya. url kosong = tombol tidak ditampilkan.
     (WhatsApp dan Google Maps dibuat otomatis dari data di atas.) */
  social: [
    { id: 'instagram', label: 'Instagram', url: '' },   // contoh: 'https://instagram.com/akunmu'
    { id: 'tiktok',    label: 'TikTok',    url: '' },
    { id: 'facebook',  label: 'Facebook',  url: '' },
    { id: 'youtube',   label: 'YouTube',   url: '' }
  ],

  /* --- Biaya & aturan pesanan (NILAI DEMO — sesuaikan dengan konsep kelompok) --- */
  fees: {
    taxRate: 0.10,                 // pajak restoran, dihitung dari subtotal setelah diskon. 0 = nonaktif
    taxLabel: 'Pajak restoran (10%)',
    packagingFee: 2000,            // biaya kemasan untuk Bawa Pulang & Pesan Antar (per pesanan)
    deliveryFee: 10000,            // ongkir flat Pesan Antar
    deliveryMinOrder: 30000,       // minimum subtotal untuk Pesan Antar
    maxQtyPerLine: 20,
    maxLines: 30
  },

  /* --- Jenis pemesanan yang diaktifkan --- */
  orderTypes: {
    dinein:   { enabled: true, label: 'Makan di tempat', hint: 'Pesanan disiapkan untuk meja kamu.' },
    takeaway: { enabled: true, label: 'Bawa pulang',     hint: 'Ambil sendiri di kedai.' },
    delivery: { enabled: true, label: 'Pesan antar',     hint: 'Diantar ke alamatmu (kurir belum terintegrasi — lihat README).' }
  },

  /* --- Metode pembayaran (SEMUA SIMULASI — tidak ada uang sungguhan yang diproses) ---
     types: jenis pemesanan yang boleh memakai metode ini. */
  paymentMethods: [
    { id: 'qris',     label: 'QRIS',                 kind: 'digital', types: ['dinein','takeaway','delivery'],
      note: 'Simulasi: kode QR demo, tidak dapat dipindai.' },
    { id: 'transfer', label: 'Transfer bank',        kind: 'digital', types: ['dinein','takeaway','delivery'],
      note: 'Simulasi: nomor rekening demo.' },
    { id: 'ewallet',  label: 'E-wallet',             kind: 'digital', types: ['dinein','takeaway','delivery'],
      note: 'Simulasi: tanpa tautan ke aplikasi sungguhan.' },
    { id: 'cashier',  label: 'Tunai di kasir',       kind: 'offline', types: ['dinein','takeaway'],
      note: 'Bayar langsung saat di kedai.' },
    { id: 'cod',      label: 'Bayar di tempat (COD)', kind: 'offline', types: ['delivery'],
      note: 'Bayar tunai ke kurir saat pesanan tiba.' }
  ],
  /* Data pembayaran DEMO. Jangan isi rekening/QRIS asli di berkas frontend yang belum
     diverifikasi server; untuk produksi gunakan payment gateway (lihat README). */
  demoPayment: {
    bankName: 'Bank Demo',
    accountNumber: '0000 0000 0000',
    accountHolder: 'JATIZAKAYA (DEMO)'
  },

  /* --- Promo ---
     Dua promo berasal dari banner di proyek asli:
     "Diskon 20% Paket Ramen" dan "Buy 3 Get 1 Free Yakitori".
     type 'percent_category'  : diskon persen untuk semua item pada kategori tertentu.
     type 'buy_x_get_1'       : tiap (buy+1) unit pada kategori, 1 unit termurah gratis. */
  promos: [
    { code: 'RAMEN20', title: 'Diskon 20% untuk semua ramen', type: 'percent_category',
      category: 'ramen', percent: 20, minSubtotal: 0,
      rule: 'Berlaku untuk semua menu kategori Ramen (termasuk tambahan pada ramen).' },
    { code: 'YAKI4', title: 'Beli 3 gratis 1 yakitori', type: 'buy_x_get_1',
      category: 'yakitori', buy: 3, minSubtotal: 0,
      rule: 'Tiap 4 porsi yakitori, 1 porsi dengan harga termurah gratis.' }
  ],

  /* --- Penyimpanan lokal --- */
  storage: { cart: 'jtz.cart.v1', orders: 'jtz.orders.v1', maxOrders: 20 }
};
