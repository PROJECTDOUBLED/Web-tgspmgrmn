import re, json
from playwright.sync_api import sync_playwright, expect
BASE='http://localhost:8765/'
res=[]
def chk(name, cond, extra=''):
    res.append((name,bool(cond))); print(('PASS ' if cond else 'FAIL ')+name+(' '+str(extra) if (extra and not cond) else ''))
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':800}, is_mobile=True, has_touch=True)
    ctx.route('**/*', lambda r: r.abort() if not r.request.url.startswith(BASE) else r.continue_())
    pg=ctx.new_page(); errs=[]; bad=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.on('response', lambda r: bad.append(r.url) if r.url.startswith(BASE) and r.status>=400 else None)

    # --- menu
    pg.goto(BASE+'menu.html'); pg.wait_for_selector('.dish')
    chk('19 menu tampil', pg.locator('.dish').count()==19)
    pg.click('.chip[data-cat="ramen"]'); chk('filter ramen=5', pg.locator('.dish').count()==5)
    pg.click('.chip[data-cat="all"]')
    pg.fill('#q','matcha'); pg.wait_for_timeout(300); chk('cari matcha=1', pg.locator('.dish').count()==1)
    pg.fill('#q','zzz'); pg.wait_for_timeout(300); chk('empty state', pg.locator('.no-result').count()==1)
    pg.click('#reset'); chk('reset', pg.locator('.dish').count()==19)
    pg.select_option('#sort','asc'); pg.click('.chip[data-cat="drink"]')
    prices=[int(re.sub(r'\D','',t)) for t in pg.locator('.dish .price').all_inner_texts()]
    chk('sort harga naik', prices==sorted(prices), prices)
    pg.click('.chip[data-cat="all"]'); pg.select_option('#sort','rec')

    # --- tambah via modal dengan varian
    pg.click('.dish-name[data-open="spicy-miso-ramen"]'); pg.wait_for_selector('#product-dialog[open]')
    pg.check('input[name="porsi"][value="jumbo"]'); pg.check('input[name="tambah"][value="telur"]')
    chk('total modal live', '49.000' in pg.inner_text('#pm-total'), pg.inner_text('#pm-total'))
    pg.click('[data-act="inc"]'); chk('total x2', '98.000' in pg.inner_text('#pm-total'))
    pg.fill('#pm-note','kuah dipisah'); pg.click('#pm-add'); pg.wait_for_timeout(300)
    chk('modal tertutup', pg.locator('#product-dialog[open]').count()==0)
    chk('badge=2', pg.inner_text('#cart-badge').strip()=='2')
    chk('toast', pg.locator('.toast').count()>=1)
    # varian beda => baris terpisah
    pg.click('.dish-name[data-open="spicy-miso-ramen"]'); pg.click('#pm-add'); pg.wait_for_timeout(200)
    # tanpa opsi => tambah langsung
    pg.click('[data-add="le-minerale"]'); pg.wait_for_timeout(200)
    chk('badge=4', pg.inner_text('#cart-badge').strip()=='4', pg.inner_text('#cart-badge'))
    chk('cartbar tampil di mobile', pg.is_visible('#cartbar'))

    # --- drawer
    pg.click('#cartbar'); pg.wait_for_selector('#cart-dialog[open]')
    chk('3 baris terpisah', pg.locator('.cl').count()==3, pg.locator('.cl').count())
    first=pg.locator('.cl').first
    first.locator('[data-act="inc"]').click(); chk('qty naik', first.locator('input').input_value()=='3')
    for i in range(30): 
        if first.locator('[data-act="inc"]').is_enabled(): first.locator('[data-act="inc"]').click()
    chk('qty maks 20', first.locator('input').input_value()=='20')
    first.locator('input').fill('0'); first.locator('input').dispatch_event('change'); pg.wait_for_timeout(200)
    chk('qty 0 -> 1', pg.locator('.cl').first.locator('input').input_value()=='1')
    pg.locator('.cl').nth(2).locator('[data-act="del"]').click(); chk('hapus', pg.locator('.cl').count()==2)
    pg.locator('.toast-act', has_text='Urungkan').click(); pg.wait_for_timeout(200); chk('urungkan', pg.locator('.cl').count()==3)
    # promo
    pg.fill('#drawer-promo input[name="code"]','ngawur'); pg.press('#drawer-promo input[name="code"]','Enter')
    chk('promo salah error', pg.locator('#drawer-promo .promo-err').is_visible())
    pg.fill('#drawer-promo input[name="code"]','ramen20'); pg.press('#drawer-promo input[name="code"]','Enter'); pg.wait_for_timeout(200)
    chk('promo terpasang', 'RAMEN20' in pg.inner_text('#drawer-promo'))
    chk('diskon tampil', pg.locator('.drawer-foot .disc').count()==1)
    # saran minuman: ada le-minerale (drink) jadi tidak muncul
    chk('saran minuman tersembunyi', pg.locator('.suggest').count()==0)
    pg.keyboard.press('Escape'); chk('esc menutup drawer', pg.locator('#cart-dialog[open]').count()==0)

    # --- persist reload
    pg.reload(); pg.wait_for_selector('.dish')
    chk('keranjang bertahan reload', pg.inner_text('#cart-badge').strip()!='' and int(pg.inner_text('#cart-badge'))>=3, pg.inner_text('#cart-badge'))
    n_before=int(pg.inner_text('#cart-badge'))

    # --- checkout
    pg.goto(BASE+'checkout.html'); pg.wait_for_selector('#co-main:not([hidden])')
    pg.click('#co-submit'); pg.wait_for_timeout(200)
    chk('validasi nama', pg.locator('#e-name').is_visible()); chk('validasi telp', pg.locator('#e-phone').is_visible()); chk('validasi bayar', pg.locator('#e-pay').is_visible())
    chk('fokus ke error pertama', pg.evaluate('document.activeElement.id')=='f-name')
    pg.fill('#f-name','Budi'); pg.fill('#f-phone','12345'); pg.click('#co-submit'); chk('telp invalid', pg.locator('#e-phone').is_visible())
    pg.fill('#f-phone','0812-3456-7890')
    pg.check('input[name="type"][value="delivery"]'); pg.wait_for_timeout(200)
    chk('field alamat muncul', pg.is_visible('#f-address'))
    chk('COD tersedia utk delivery', pg.locator('input[name="pay"][value="cod"]').count()==1)
    chk('kasir tidak utk delivery', pg.locator('input[name="pay"][value="cashier"]').count()==0)
    pg.evaluate("document.getElementById('sum-details').open=true")
    chk('ongkir di ringkasan', 'Ongkir' in pg.inner_text('#sum-totals'))
    pg.check('input[name="pay"][value="qris"]'); pg.click('#co-submit'); chk('alamat wajib', pg.locator('#e-address').is_visible())
    pg.fill('#f-address','Jl. Contoh No. 5, Jatinegara, Jakarta Timur')
    pg.check('input[name="type"][value="takeaway"]'); pg.wait_for_timeout(100)
    chk('kemasan, tanpa ongkir', 'kemasan' in pg.inner_text('#sum-totals') and 'Ongkir' not in pg.inner_text('#sum-totals'))
    pg.check('input[name="pickup"][value="later"]'); pg.fill('#f-pickup','00:01'); pg.click('#co-submit')
    # 00:01 hari ini sudah lewat -> error (kecuali jam saat tes < 23:46..), cek ada pesan
    chk('jam ambil lewat ditolak', pg.locator('#e-pickup').is_visible())
    pg.check('input[name="pickup"][value="asap"]')
    pg.check('input[name="type"][value="dinein"]'); pg.fill('#f-table','A5')
    pg.check('input[name="pay"][value="qris"]')
    total_txt=pg.inner_text('#co-total')
    pg.click('#co-submit'); pg.wait_for_url('**/pesanan.html?id=*')
    chk('redirect ke pesanan', 'baru=1' in pg.url)
    chk('keranjang kosong setelah order', pg.evaluate("JSON.parse(localStorage.getItem('jtz.cart.v1')).lines.length")==0)
    oid=re.search(r'id=([^&]+)',pg.url).group(1)
    chk('total order = total checkout', total_txt in pg.inner_text('#view'), total_txt)
    chk('banner sukses & demo', pg.locator('.success').count()==1 and 'simulasi' in pg.inner_text('#view').lower())
    chk('QR demo berlabel', 'bukan QRIS sungguhan' in pg.inner_text('#view'))
    chk('advance terkunci sebelum bayar', pg.locator('[data-act="advance"]').is_disabled())
    pg.click('[data-act="pay"]'); chk('dibayar simulasi', 'dibayar (simulasi)' in pg.inner_text('#view').lower())
    for s in ['Dikonfirmasi','Sedang disiapkan','Siap disajikan','Selesai']:
        pg.click('[data-act="advance"]'); pg.wait_for_timeout(100)
        chk('status '+s, s in pg.inner_text('.timeline li.now') or s in pg.inner_text('.timeline'), s)
    chk('tombol advance hilang di selesai', pg.locator('[data-act="advance"]').count()==0)
    pg.reload(); chk('status bertahan reload', 'Selesai' in pg.inner_text('.timeline li.now'))
    wa=pg.locator('a[href*="wa.me"]').first.get_attribute('href')
    chk('link WA berisi nomor & id', '6283896916403' in wa and oid in wa)
    chk('WA rel noopener', 'noopener' in pg.locator('a[href*="wa.me"]').first.get_attribute('rel'))
    # pesan lagi
    pg.click('[data-act="again"]'); pg.wait_for_timeout(200); chk('pesan lagi mengisi keranjang', int(pg.inner_text('#cart-badge'))>=1)
    # riwayat
    pg.goto(BASE+'pesanan.html'); chk('riwayat tampil', pg.locator('.hist li').count()==1)
    # batalkan: buat pesanan baru tunai
    pg.goto(BASE+'checkout.html'); pg.fill('#f-name','Ani'); pg.fill('#f-phone','081234567890'); pg.check('input[name="pay"][value="cashier"]'); pg.click('#co-submit'); pg.wait_for_url('**/pesanan.html?id=*')
    pg.click('[data-act="cancel"]'); pg.wait_for_selector('#confirm-dialog[open]'); pg.click('#cf-yes'); pg.wait_for_timeout(200)
    chk('batal berhasil', 'Dibatalkan' in pg.inner_text('.timeline'))
    pg.goto(BASE+'pesanan.html?id=JTZ-XXXX'); chk('id tak dikenal -> empty', 'tidak ditemukan' in pg.inner_text('#ph-title'))
    pg.goto(BASE+'checkout.html'); chk('checkout kosong -> empty state', pg.is_visible('#co-empty'))

    # --- kontak / reservasi
    pg.goto(BASE+'kontak.html')
    pg.click('#rsv-form button[type=submit]'); chk('reservasi validasi', pg.locator('#re-name').is_visible() and pg.locator('#re-date').is_visible())
    pg.fill('#r-name','Budi'); pg.fill('#r-phone','081234567890'); pg.fill('#r-date','2099-01-02'); pg.fill('#r-time','19:00'); pg.fill('#r-guests','20'); pg.click('#rsv-form button[type=submit]')
    chk('tamu >15 ditolak', pg.locator('#re-guests').is_visible())
    pg.fill('#r-guests','4')
    pg.evaluate("window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return {}}")
    pg.click('#rsv-form button[type=submit]')
    opened=pg.evaluate('window.__opened')
    wa=[u for u in opened if u and u.startswith('https://wa.me/6283896916403?text=')]
    chk('reservasi membuka WA dgn pesan', len(wa)==1 and 'reservasi' in wa[0], opened)
    chk('pesan sukses reservasi', pg.is_visible('#rsv-done'))

    # --- overflow horizontal + gambar rusak, semua halaman, 3 viewport
    for w,h in [(360,740),(390,800),(768,1024),(1366,820)]:
        pg.set_viewport_size({'width':w,'height':h})
        for page in ['index.html','menu.html','checkout.html','pesanan.html','kontak.html','info.html']:
            pg.goto(BASE+page); pg.wait_for_timeout(250)
            ov=pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            chk(f'no overflow {page}@{w}', ov<=0, ov)
    pg.set_viewport_size({'width':390,'height':800}); pg.goto(BASE+'index.html'); pg.wait_for_timeout(500)
    broken=pg.evaluate("Array.from(document.images).filter(i=>i.complete && i.naturalWidth===0).map(i=>i.src)")
    chk('tak ada gambar rusak (home)', not broken, broken)
    pg.goto(BASE+'menu.html'); pg.evaluate("window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(600)
    broken=pg.evaluate("Array.from(document.images).filter(i=>i.complete && i.naturalWidth===0).map(i=>i.src)")
    chk('tak ada gambar rusak (menu)', not broken, broken)

    # --- link internal
    pg.set_viewport_size({'width':1366,'height':820})
    hrefs=set()
    for page in ['index.html','menu.html','checkout.html','pesanan.html','kontak.html','info.html']:
        pg.goto(BASE+page); pg.wait_for_timeout(200)
        for h in pg.eval_on_selector_all('a[href]','els=>els.map(e=>e.getAttribute("href"))'):
            if h and not h.startswith(('http','#','mailto')): hrefs.add(h.split('#')[0].split('?')[0])
    import os
    miss=[h for h in hrefs if h and not os.path.exists('' + os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'+h)]
    chk('tautan internal valid', not miss, miss)
    chk('tak ada error JS/console', not errs, errs)
    chk('tak ada respons 4xx lokal', not bad, bad)
    b.close()
f=[n for n,ok in res if not ok]
print(f'\n{len(res)-len(f)} lulus, {len(f)} gagal'); print(f)
