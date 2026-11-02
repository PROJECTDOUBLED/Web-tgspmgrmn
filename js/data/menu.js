/* ==========================================================================
   DATA MENU JATIZAKAYA — satu-satunya sumber harga & produk.
   Nama, deskripsi, harga dasar, dan foto dari proyek asli.
   Opsi/varian & harganya adalah DATA DEMO (ditandai) — sesuaikan dengan konsep final.
   ========================================================================== */
window.JTZ = window.JTZ || {};

JTZ.categories = [
  { id: 'ramen',    label: 'Ramen' },
  { id: 'yakitori', label: 'Yakitori' },
  { id: 'bento',    label: 'Bento' },
  { id: 'drink',    label: 'Minuman' }
];

/* Grup opsi dipakai ulang agar konsisten. type: 'single' (radio) | 'multi' (checkbox).
   price adalah tambahan (Rp) di atas harga dasar. Item pertama pada grup 'single' = default. */
JTZ.optionSets = {
  pedasRamen: { id: 'pedas', label: 'Level pedas', type: 'single', choices: [
    { id: 'tidak', label: 'Tidak pedas', price: 0 },
    { id: 'sedang', label: 'Sedang', price: 0 },
    { id: 'pedas', label: 'Pedas', price: 0 } ] },
  pedasMiso: { id: 'pedas', label: 'Level pedas', type: 'single', choices: [
    { id: 'sedang', label: 'Sedang', price: 0 },
    { id: 'pedas', label: 'Pedas', price: 0 },
    { id: 'sangat', label: 'Sangat pedas', price: 0 } ] },
  porsiRamen: { id: 'porsi', label: 'Ukuran porsi', type: 'single', choices: [
    { id: 'reguler', label: 'Reguler', price: 0 },
    { id: 'jumbo', label: 'Jumbo (mi lebih banyak)', price: 8000 } ] },
  tambahRamen: { id: 'tambah', label: 'Tambahan', type: 'multi', choices: [
    { id: 'telur', label: 'Telur ajitsuke', price: 6000 },
    { id: 'chashu', label: 'Chashu ayam', price: 10000 },
    { id: 'nori', label: 'Nori', price: 3000 } ] },
  bumbuYaki: { id: 'bumbu', label: 'Bumbu', type: 'single', choices: [
    { id: 'tare', label: 'Saus Tare', price: 0 },
    { id: 'shio', label: 'Garam (Shio)', price: 0 } ] },
  tambahYaki: { id: 'tambah', label: 'Tambahan', type: 'multi', choices: [
    { id: 'nasi', label: 'Nasi putih', price: 5000 },
    { id: 'sambal', label: 'Sambal', price: 2000 } ] },
  tambahBento: { id: 'tambah', label: 'Tambahan', type: 'multi', choices: [
    { id: 'nasi', label: 'Nasi tambahan', price: 5000 },
    { id: 'telur', label: 'Telur ajitsuke', price: 6000 } ] },
  gula: { id: 'gula', label: 'Tingkat manis', type: 'single', choices: [
    { id: 'normal', label: 'Normal', price: 0 },
    { id: 'less', label: 'Kurang manis', price: 0 } ] },
  es: { id: 'es', label: 'Es', type: 'single', choices: [
    { id: 'normal', label: 'Normal', price: 0 },
    { id: 'less', label: 'Sedikit es', price: 0 } ] },
  suhu: { id: 'suhu', label: 'Suhu', type: 'single', choices: [
    { id: 'dingin', label: 'Dingin', price: 0 },
    { id: 'panas', label: 'Hangat', price: 0 } ] }
};

(function () {
  const S = JTZ.optionSets;
  const img = (n) => ({ img: 'assets/images/menu/' + n + '.webp', imgSm: 'assets/images/menu/' + n + '-sm.webp' });

  JTZ.products = [
    /* ---------- RAMEN ---------- */
    { id: 'spicy-miso-ramen', category: 'ramen', name: 'Jatinegara Spicy Miso Ramen', price: 35000, best: true,
      desc: 'Ramen kuah tonkotsu chicken pekat racikan khas Jaktim.',
      alt: 'Semangkuk ramen kuah pekat dengan telur setengah matang, jamur, jagung, dan daun bawang',
      options: [S.pedasMiso, S.porsiRamen, S.tambahRamen], ...img('spicy-miso-ramen') },
    { id: 'shoyu-ramen', category: 'ramen', name: 'Classic Shoyu Ramen', price: 32000,
      desc: 'Kuah shoyu bening dengan topping chashu ayam dan ajitsuke tamago.',
      alt: 'Ramen shoyu berkuah bening dengan irisan chashu dan telur',
      options: [S.pedasRamen, S.porsiRamen, S.tambahRamen], ...img('shoyu-ramen') },
    { id: 'tori-paitan-ramen', category: 'ramen', name: 'Tori Paitan Ramen', price: 36000,
      desc: 'Kuah kaldu ayam putih yang kental dan gurih, dengan irisan ayam lembut, telur ramen, dan sayuran segar.',
      alt: 'Ramen kuah putih kental dengan irisan ayam, telur, dan sayuran hijau di mangkuk biru',
      options: [S.pedasRamen, S.porsiRamen, S.tambahRamen], ...img('tori-paitan-ramen') },
    { id: 'miso-butter-ramen', category: 'ramen', name: 'Miso Butter Ramen', price: 34000,
      desc: 'Kuah kaldu dengan pasta miso dan lelehan mentega, disajikan dengan pakcoy, telur rebus, dan daun bawang.',
      alt: 'Ramen miso butter dengan telur rebus dan taburan daun bawang',
      options: [S.pedasRamen, S.porsiRamen, S.tambahRamen], ...img('miso-butter-ramen') },
    { id: 'abura-soba', category: 'ramen', name: 'Abura Soba', price: 30000,
      desc: 'Ramen tanpa kuah dengan saus gurih, lengkap dengan narutomaki, ajitsuke tamago, chashu ayam, rebon, dan rumput laut.',
      alt: 'Abura soba di mangkuk hitam dengan narutomaki, telur, dan rumput laut',
      options: [S.pedasRamen, S.porsiRamen, S.tambahRamen], ...img('abura-soba') },

    /* ---------- YAKITORI ---------- */
    { id: 'yakitori-mix', category: 'yakitori', name: 'Otista Yakitori Mix (5 tusuk)', price: 28000, best: true,
      desc: 'Sate paha ayam dan kulit renyah dengan saus Tare manis gurih.',
      alt: 'Tusuk yakitori ayam berlapis saus Tare di piring hitam',
      options: [S.bumbuYaki, S.tambahYaki], ...img('yakitori-mix') },
    { id: 'negima', category: 'yakitori', name: 'Negima Yakitori (3 tusuk)', price: 20000,
      desc: 'Sate paha ayam panggang yang diselingi daun bawang, dilumuri saus Tare.',
      alt: 'Tiga tusuk negima paha ayam dan daun bawang di piring putih',
      options: [S.bumbuYaki, S.tambahYaki], ...img('negima') },
    { id: 'torikawa', category: 'yakitori', name: 'Torikawa Yakitori (3 tusuk)', price: 18000,
      desc: 'Sate kulit ayam garing yang dibakar dengan saus kecap Tare.',
      alt: 'Tusuk torikawa kulit ayam bakar dengan taburan wijen',
      options: [S.bumbuYaki, S.tambahYaki], ...img('torikawa') },
    { id: 'tsukune', category: 'yakitori', name: 'Tsukune Yakitori (2 tusuk)', price: 22000,
      desc: 'Bakso ayam cincang berbumbu yang dibakar dengan glasir saus manis.',
      alt: 'Dua tusuk tsukune bakso ayam panggang di piring putih',
      options: [S.bumbuYaki, S.tambahYaki], ...img('tsukune') },

    /* ---------- BENTO ---------- */
    { id: 'katsu-curry-bento', category: 'bento', name: 'Chicken Katsu Curry Bento', price: 38000, best: true,
      desc: 'Nasi Jepang, chicken katsu, kuah kari Jepang, salad, dan miso soup.',
      alt: 'Kotak bento merah dengan chicken katsu, kari, nasi, dan salad',
      options: [S.tambahBento], ...img('katsu-curry-bento') },
    { id: 'chicken-nanban-bento', category: 'bento', name: 'Chicken Nanban Bento', price: 38000,
      desc: 'Ayam goreng renyah dengan saus manis gurih dan saus tartar, nasi bertabur wijen, edamame, dan salad.',
      alt: 'Kotak bento berisi ayam nanban, saus tartar, nasi wijen, dan salad',
      options: [S.tambahBento], ...img('chicken-nanban-bento') },
    { id: 'chicken-teriyaki-bento', category: 'bento', name: 'Chicken Teriyaki Bento', price: 36000,
      desc: 'Nasi hangat, paha ayam saus teriyaki, gyoza renyah, dan salad sayur segar.',
      alt: 'Kotak bento dengan ayam teriyaki, gyoza, nasi, dan salad di atas tikar bambu',
      options: [S.tambahBento], ...img('chicken-teriyaki-bento') },
    { id: 'beef-gyudon-bento', category: 'bento', name: 'Beef Gyudon Bento', price: 42000,
      desc: 'Irisan daging sapi manis gurih dengan bawang bombay, nasi hangat, kari sayuran, dan salad.',
      alt: 'Kotak bento dengan daging sapi gyudon, nasi putih, dan sayuran',
      options: [S.tambahBento], ...img('beef-gyudon-bento') },

    /* ---------- MINUMAN ---------- */
    { id: 'es-kopi-susu', category: 'drink', name: 'Es Kopi Susu Jaktim', price: 22000, best: true,
      desc: 'Espresso ganda dengan susu segar dan gula aren.',
      alt: 'Segelas es kopi susu berlapis di atas alas kayu',
      options: [S.gula, S.es, { id: 'tambah', label: 'Tambahan', type: 'multi', choices: [
        { id: 'shot', label: 'Extra shot espresso', price: 5000 } ] }], ...img('es-kopi-susu') },
    { id: 'matcha-latte', category: 'drink', name: 'Kyoto Matcha Latte Ice', price: 22000,
      desc: 'Matcha dengan susu segar dan krim yang manis.',
      alt: 'Segelas iced matcha latte hijau dengan krim di atasnya',
      options: [S.gula, S.es], ...img('matcha-latte') },
    { id: 'ocha', category: 'drink', name: 'Ocha (hangat / dingin)', price: 8000,
      desc: 'Teh hijau khas Jepang, tersedia hangat atau dingin.',
      alt: 'Cangkir keramik berisi ocha dingin dengan es batu',
      options: [S.suhu], ...img('ocha') },
    { id: 'tokyo-milk-tea', category: 'drink', name: 'Tokyo Milk Tea', price: 18000,
      desc: 'Milk tea berbahan teh hitam dengan racikan manis pas dan susu segar dingin.',
      alt: 'Segelas milk tea dingin dengan sedotan hitam',
      options: [S.gula, S.es], ...img('tokyo-milk-tea') },
    { id: 'sparkling-yuzu', category: 'drink', name: 'Sparkling Yuzu Lemonade', price: 20000,
      desc: 'Soda dingin rasa yuzu dan lemon yang asam manis, dengan daun mint.',
      alt: 'Segelas sparkling yuzu lemonade dengan irisan lemon dan daun basil',
      options: [S.es], ...img('sparkling-yuzu') },
    { id: 'le-minerale', category: 'drink', name: 'Le Minerale', price: 5000,
      desc: 'Air mineral dalam kemasan botol.',
      alt: 'Sebotol air mineral Le Minerale',
      options: [], ...img('le-minerale') }
  ];
})();
