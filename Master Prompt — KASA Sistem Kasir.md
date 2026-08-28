# Master Prompt — KASA Sistem Kasir

> **Cara pakai:** Salin seluruh blok prompt di bawah ini ke agen pengembang atau AI coding pilihan Anda. Prompt ini menjelaskan target aplikasi dari nol sampai setara dengan versi KASA saat ini.

## Prompt Utama

```text
Anda adalah seorang Senior Product Engineer, UI/UX Designer, dan Frontend Architect. Tugas Anda adalah membangun aplikasi point of sale (POS) desktop-first bernama **KASA Sistem Kasir** dari nol hingga siap dipakai sebagai aplikasi kasir untuk warung, kedai kopi, restoran kecil, atau toko makanan.

Bangun aplikasi yang terasa seperti sistem kasir nyata: cepat dipahami, mudah digunakan oleh orang awam, nyaman dipakai berjam-jam, dan tidak terlihat seperti dashboard demo. Fokus utama adalah membantu kasir menerima pesanan, menambah produk, menerima pembayaran, mencetak struk, dan membantu pemilik usaha melihat status operasional sederhana.

Gunakan Bahasa Indonesia yang sederhana untuk seluruh teks yang dilihat pengguna. Gunakan format mata uang Rupiah Indonesia, misalnya `Rp 25.000`, tanpa angka desimal. Hindari istilah teknis yang tidak diperlukan oleh kasir.

---

# 1. Tujuan Produk

Bangun sistem kasir bernama **KASA Sistem Kasir** dengan karakter berikut:

- Desktop-first, tetapi tetap responsif untuk layar tablet dan ponsel.
- Cocok untuk usaha makanan dan minuman, tetapi struktur data cukup fleksibel untuk toko kecil.
- Semua operasi utama dapat dipahami dalam sekali lihat.
- Tidak memakai ulasan/testimoni palsu, rating palsu, atau data pelanggan palsu.
- Berjalan langsung setelah instalasi dependency biasa, tanpa langkah setup rumit.
- Pada tahap ini, buat sebagai frontend yang berfungsi penuh dengan state lokal. Jangan memaksa backend, database, atau integrasi pembayaran sungguhan apabila belum tersedia.

Fungsi yang harus dapat dipakai sekarang:

1. Kasir dapat memilih produk dari katalog.
2. Kasir dapat mencari produk dan memfilter kategori.
3. Kasir dapat menambah, mengurangi, dan menghapus produk dari pesanan.
4. Kasir dapat memilih pesanan bawa pulang atau pesanan meja.
5. Sistem menghitung subtotal, pajak 11%, total pembayaran, dan jumlah produk.
6. Kasir dapat membayar menggunakan kartu/QR atau tunai.
7. Untuk tunai, sistem harus memeriksa nominal uang yang diterima dan menghitung kembalian otomatis.
8. Kasir dapat mencetak struk melalui dialog cetak browser dengan tampilan thermal receipt yang rapi.
9. Pengguna dapat membuka halaman Pesanan, Meja, Produk, Laporan, dan Pengaturan.
10. Pengaturan harus menampilkan status printer, pajak, dan ringkasan kas tunai harian.

---

# 2. Teknologi dan Struktur Proyek

Gunakan stack berikut apabila proyek masih kosong. Jika proyek sudah memiliki struktur yang kompatibel, pertahankan struktur yang ada dan jangan rewrite tanpa alasan kuat.

| Area | Standar yang digunakan |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS 4 dan CSS global untuk token visual |
| Komponen | Gunakan komponen shadcn/ui yang tersedia, jangan membuat ulang komponen dasar tanpa alasan |
| Ikon | lucide-react |
| Notifikasi | Sonner/toast |
| Routing | Wouter atau router ringan yang sudah tersedia |
| Data sementara | File TypeScript pada folder `client/src/data/` |
| Bahasa | File terpusat pada folder `client/src/locales/` |
| Currency | `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 })` |

Gunakan struktur berikut, atau adaptasikan dengan struktur yang sudah ada:

```text
client/
  src/
    components/       # Komponen bersama dan komponen shadcn/ui
    data/
      menu.ts         # Data menu dan helper format Rupiah
    locales/
      en.ts           # Nama file boleh dipertahankan demi kompatibilitas, isi harus Bahasa Indonesia
    pages/
      Home.tsx        # Workspace POS utama
    App.tsx
    index.css         # Token visual dan gaya global
  index.html
```

Jangan menghapus folder `data` atau `locales` yang sudah ada. Gunakan folder tersebut sebagai sumber data dan teks terpusat supaya aplikasi mudah ditingkatkan menjadi multi-bahasa atau tersambung ke database di masa depan.

---

# 3. Data Awal yang Dibutuhkan

Buat tipe data menu yang jelas:

```ts
export type MenuCategory = "Favorit" | "Sarapan" | "Makanan" | "Minuman" | "Camilan";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // simpan sebagai Rupiah utuh, misalnya 25000
  category: MenuCategory;
  image: string;
  badge?: string;
};
```

Gunakan data menu contoh yang realistis dan mudah dipahami:

| Produk | Kategori | Harga |
| --- | --- | ---: |
| Kopi Susu | Favorit | Rp 25.000 |
| Roti Panggang Isi | Favorit | Rp 42.000 |
| Kue Lemon | Camilan | Rp 28.000 |
| Kopi Hitam | Minuman | Rp 18.000 |
| Roti Pagi | Sarapan | Rp 32.000 |
| Nasi Sayur Panggang | Makanan | Rp 48.000 |
| Kopi Jeruk Dingin | Minuman | Rp 30.000 |
| Potongan Kue Beri | Camilan | Rp 27.000 |

Setidaknya dua produk awal sudah dimasukkan ke pesanan aktif agar layar kasir terlihat hidup ketika aplikasi pertama dibuka. Tampilkan contoh subtotal Rp 67.000, pajak 11% Rp 7.370, dan total Rp 74.370 untuk dua produk awal tersebut.

---

# 4. Arah Visual dan Branding

Gunakan arah desain **Counterlight Utility**: gabungan desain Swiss modern, sistem penunjuk arah industrial, dan suasana hangat kedai kecil. Hasilnya harus tampak profesional, tenang, dan operasional—bukan neon cyberpunk atau dashboard SaaS generik.

## Prinsip visual

1. **Cepat dibaca.** Informasi penting seperti total, status pesanan, dan aksi bayar harus paling mudah terlihat.
2. **Tenang untuk dipakai lama.** Informasi cukup padat, tetapi diberi ruang napas dan urutan visual yang jelas.
3. **Umpan balik terasa.** Tombol utama, kartu produk, dan pesanan aktif memberi respons visual cepat.
4. **Tidak berlebihan.** Hindari gradien ungu, kartu seragam yang terlalu membulat, layout yang terlalu terpusat, dan font Inter sebagai pilihan default tunggal.

## Warna

| Peran | Warna | Catatan |
| --- | --- | --- |
| Latar utama | Mineral gray `#EEF0EB` | Lebih lembut dari putih murni |
| Warna tinta | Ink navy `#14211F` | Sidebar dan teks utama |
| Aksi utama | Counterlime `#C7F36B` | Tombol bayar dan status aktif |
| Perhatian | Coral muted `#D45D52` | Titik penanda dan notifikasi kecil |
| Kartu | Putih `#FFFFFF` | Kartu produk dan struk |

Counterlime harus hadir sebagai bahasa status aktif, bukan hanya warna tombol bayar. Terapkan warna ini pada garis vertikal pesanan aktif, produk yang sudah masuk pesanan, indikator sinkronisasi, dan metrik operasional utama.

## Tipografi

- Gunakan **Space Grotesk** untuk judul, harga, angka penting, dan label operasional.
- Gunakan **DM Sans** untuk isi, deskripsi produk, formulir, dan teks pendukung.
- Harga harus tampak tegas dan mudah dipindai.
- Label kecil menggunakan huruf kapital dengan jarak huruf sedikit lebih lebar.

## Logo

Gunakan simbol KASA tanpa teks untuk favicon dan area sidebar: bentuk geometris sederhana yang terinspirasi dari struk dan meja kasir, memakai ink navy serta Counterlime. Jangan mengandalkan teks hasil generator gambar untuk wordmark.

---

# 5. Tata Letak Utama

Gunakan layout desktop asimetris:

```text
┌────────── Sidebar ──────────┬──────────── Workspace utama ────────────┐
│ Logo KASA                   │ Header: tanggal, judul, status tersimpan│
│ Kasir depan · Mesin 01      │ Strip ringkasan operasional             │
│                              │                                         │
│ Pesanan baru                │ Katalog menu             │ Pesanan saat ini │
│ Pesanan                     │ Kategori + pencarian     │ Rincian struk    │
│ Meja                        │ Kartu produk             │ Subtotal/pajak   │
│ Produk                      │                           │ Total + bayar    │
│ Laporan                     │                           │ Cetak struk      │
│ Pengaturan                  │                           │                  │
└─────────────────────────────┴─────────────────────────────────────────┘
```

## Sidebar

Sidebar berwarna ink navy dan tetap terlihat pada desktop. Isi sidebar:

- Logo KASA dan teks kecil `SISTEM KASIR`.
- Status `Kasir depan · Mesin 01` dengan titik hijau kecil.
- Menu: `Pesanan baru`, `Pesanan`, `Meja`, `Produk`, `Laporan`.
- Bagian `Kontrol` berisi `Pengaturan`.
- Ringkasan penjualan hari ini, misalnya `Rp 12.545.000`.
- Profil kasir, misalnya `Jamie Morgan · Kasir`.

Item aktif menggunakan latar Counterlime. Item Pesanan boleh memiliki badge jumlah pesanan berjalan, misalnya `3`.

## Header dan strip ringkasan

Header menampilkan:

- Tanggal dalam Bahasa Indonesia, contoh `SABTU, 14 JUNI 2025`.
- Judul utama pada halaman kasir: `Siap menerima pesanan.`
- Status kecil: `Semua perubahan tersimpan`.
- Tombol notifikasi dan avatar kasir.

Strip ringkasan menampilkan:

| Metrik | Contoh |
| --- | --- |
| Pesanan berjalan | 04 dan `+2 hari ini` |
| Penjualan hari ini | Rp 12.545.000 dan `+12,4%` |
| Rata-rata pesanan | Rp 185.000 dan `7 hari terakhir` |
| Aksi | `Buka laci kas` |

Berikan garis Counterlime vertikal pada metrik Pesanan berjalan agar status aktif terasa konsisten.

---

# 6. Layar Kasir / Pesanan Baru

## Katalog produk

Di area utama kiri, tampilkan:

- Judul `Buat pesanan`.
- Pencarian `Cari menu` dengan shortcut visual `⌘ K`.
- Kategori: `Favorit`, `Sarapan`, `Makanan`, `Minuman`, `Camilan`.
- Kartu produk dalam grid tiga kolom pada desktop, dua kolom pada layar lebih kecil.

Setiap kartu produk berisi:

1. Foto makanan/minuman yang hangat dan realistis.
2. Nama produk.
3. Deskripsi singkat.
4. Harga Rupiah.
5. Informasi operasional kecil, misalnya `Minuman · 2 menit` atau `Makanan · 8 menit`.
6. Badge bila relevan, misalnya `Paling laris` atau `Pilihan dapur`.
7. Label Counterlime `Di pesanan` bila produk sudah ada dalam cart.

Saat kartu dipilih:

- Tambahkan produk ke pesanan atau tingkatkan jumlah bila produk sudah ada.
- Tampilkan toast singkat, contoh: `Kopi Susu ditambahkan` dengan teks pendukung `Pesanan sudah diperbarui`.
- Beri efek hover ringan: kartu naik maksimal 2–3px, bayangan halus, tanpa animasi lambat.

Di bawah katalog, tampilkan petunjuk ringan: `Agar pelayanan lebih cepat` dan teks `Gunakan ⌘K untuk mencari produk di menu.`

## Panel pesanan / struk

Panel kanan harus terasa seperti objek struk thermal, bukan sekadar card putih. Gunakan garis halus berulang, garis pemisah putus-putus, microcopy, dan hierarki yang sangat jelas.

Bagian panel:

1. `PESANAN 1048 · BAWA PULANG`.
2. Judul `Pesanan saat ini` dan aksi `Hapus`.
3. Pilihan tipe pesanan: `Bawa pulang` dan `Meja 04`.
4. Jumlah tamu, contoh `2 tamu`.
5. Daftar item pesanan dengan thumbnail kecil, nama, harga satuan, tipe pesanan, pengatur jumlah minus/jumlah/plus, dan total per item.
6. Setiap item aktif memakai garis Counterlime vertikal tipis.
7. Ringkasan `Harga produk`, `Pajak 11%`, dan `Total bayar`.
8. Tombol `Simpan dulu` dan tombol utama `Bayar Rp ...`.
9. Tombol `Cetak struk` dengan shortcut visual `P`.

Jika cart kosong, tampilkan empty state yang ramah:

> `Pesanan masih kosong`  
> `Pilih produk untuk memulai pesanan.`

## Perhitungan pesanan

Gunakan rumus berikut:

```ts
subtotal = semua harga produk × jumlah produk
pajak = subtotal × 0.11
total = subtotal + pajak
```

Tampilkan Rupiah tanpa desimal. Jangan memproses transaksi ke layanan pembayaran sungguhan pada tahap frontend ini.

---

# 7. Pembayaran

Ketika tombol `Bayar` diklik, tampilkan modal pembayaran yang rapi dan fokus.

## Isi modal

- Label kecil: `PESANAN 1048`.
- Judul: `Terima pembayaran`.
- Nilai besar: `Jumlah yang dibayar` dan total dalam Rupiah.
- Dua pilihan metode pembayaran:
  - `Kartu atau QR` dengan penjelasan `Tap, masukkan kartu, atau pindai`.
  - `Tunai` dengan penjelasan `Masukkan uang dari pelanggan`.

## Alur kartu atau QR

Metode ini dipilih secara default. Tombol `Selesaikan pembayaran` langsung aktif dan menutup modal ketika ditekan. Setelah berhasil, tampilkan toast:

> `Pembayaran berhasil`  
> `Pesanan #1048 · Rp ...`

## Alur tunai

Saat metode Tunai dipilih:

1. Tampilkan panel dengan label `Uang yang diterima`.
2. Sediakan input angka dengan prefix `Rp` dan placeholder `Contoh: 100000`.
3. Jika nominal masih kurang, tampilkan `Kurang: Rp ...`.
4. Jika nominal cukup, tampilkan `Kembalian: Rp ...`.
5. Tombol selesai pembayaran harus nonaktif jika uang tunai kurang dari total.
6. Saat transaksi berhasil, toast harus menyebutkan jumlah kembalian.

Gunakan validasi yang jelas, misalnya:

> `Uang tunai masih kurang`  
> `Masukkan minimal Rp ...`

---

# 8. Cetak Struk

Tombol `Cetak struk` harus memanggil `window.print()`.

Tambahkan gaya `@media print` agar yang tercetak hanya panel struk. Sembunyikan sidebar, header, katalog, tombol edit, tombol quantity, aksi simpan, tombol bayar, dan tombol cetak. Atur lebar struk sekitar `72mm`, tanpa bayangan, tanpa border besar, dan tetap mempertahankan rincian item, pajak, total, serta microcopy KASA.

Pada Pengaturan, tombol `Cetak percobaan` juga harus menggunakan fungsi cetak yang sama.

---

# 9. Halaman Operasional

Jangan biarkan menu navigasi hanya menjadi placeholder. Setiap menu harus membuka area kerja yang dapat dipahami.

## Pesanan

Tampilkan daftar pesanan dengan status sederhana:

| Nomor | Status | Contoh total |
| --- | --- | ---: |
| #1047 | Siap | Rp 284.000 |
| #1046 | Sudah dibayar | Rp 198.000 |
| #1045 | Disimpan | Rp 442.000 |
| #1044 | Sudah dibayar | Rp 118.000 |

Setiap baris memiliki garis Counterlime vertikal dan tombol `Buka`. Teks pendukung dapat berisi `Hari ini · Jamie Morgan · 2 produk`.

## Meja

Tampilkan papan meja dengan kartu `Meja 01`, `Meja 02`, `Meja 03`, `Meja 04`, `Teras 01`, dan `Meja kasir`. Meja kosong menampilkan `Kosong`. Satu meja aktif, misalnya Meja 04, menampilkan total pesanan aktif dan aksen Counterlime.

## Produk

Tampilkan daftar katalog produk dengan:

- Foto kecil.
- Nama produk dan deskripsi.
- Kategori.
- Harga Rupiah.
- Status `Aktif`.
- Tombol `Ubah`.
- Pencarian `Cari produk`.
- Tombol `Tambah baru` di area kanan atas.

Pada versi frontend lokal, tombol Ubah dan Tambah baru boleh menampilkan toast yang menjelaskan bahwa editor produk siap digunakan. Jangan membuat klaim bahwa data sudah tersimpan ke database jika database belum dibuat.

## Laporan

Tampilkan laporan ringkas:

- Penjualan bersih: Rp 12.545.000.
- Pesanan selesai: 68.
- Grafik batang penjualan per jam tanpa data palsu yang seolah-olah berasal dari pelanggan. Nyatakan sebagai ringkasan contoh operasional atau data lokal bila perlu.

## Pengaturan

Tampilkan kartu-kartu berikut:

| Kartu | Isi | Aksi |
| --- | --- | --- |
| Nama toko | `KASA · Sistem Kasir` | `Ubah data` |
| Printer struk | `Printer kasir · Siap` | `Cetak percobaan` |
| Pajak | `Pajak · 11%` | `Atur pajak` |
| Kas tunai hari ini | `Rp 1.680.000` | `Catat setoran` |

Keterangan kas tunai: `Perkiraan uang tunai di laci kas dari penjualan hari ini.`

---

# 10. Interaksi, Aksesibilitas, dan Responsif

Gunakan interaksi cepat dan tidak mengganggu:

- Tombol memiliki `scale(0.97)` saat ditekan.
- Durasi transisi sekitar 140–220ms dengan ease-out yang tegas.
- Jangan gunakan animasi berulang atau animasi masuk lambat untuk aksi kasir yang sering dilakukan.
- Hormati `prefers-reduced-motion`.
- Semua tombol penting memiliki label aksesibel.
- Jangan gunakan warna saja untuk menyampaikan informasi penting. Gabungkan warna dengan teks atau bentuk.

Perilaku responsif:

- Desktop: sidebar penuh, katalog 3 kolom, panel struk tetap di kanan.
- Tablet: sidebar lebih ringkas, katalog 2 kolom, panel struk tetap nyaman.
- Ponsel: sidebar menjadi strip ikon, katalog 2 kolom, panel struk pindah di bawah katalog.

---

# 11. Standar Kualitas Kode

1. Gunakan TypeScript dengan tipe eksplisit untuk menu, kategori, dan line item cart.
2. Pisahkan data menu dan teks antarmuka dari markup React.
3. Gunakan `useMemo` untuk filter katalog dan perhitungan yang sesuai.
4. Jangan melakukan `setState` di dalam fase render.
5. Jangan menambah dependency baru kecuali benar-benar diperlukan.
6. Jangan menghapus komponen shadcn/ui yang telah tersedia.
7. Jangan menyimpan media besar di folder source proyek bila platform menyediakan storage aset khusus.
8. Jangan membuat backend palsu atau endpoint seolah-olah berfungsi sungguhan.
9. Jangan memasang tool, agent, MCP, browser automation, peta, atau layanan eksternal yang tidak diperlukan untuk POS frontend ini.
10. Semua teks pengguna harus Bahasa Indonesia yang sederhana dan semua uang harus Rupiah.

---

# 12. Kriteria Penerimaan

Pekerjaan dianggap selesai jika seluruh kondisi berikut terpenuhi:

- [ ] Aplikasi dapat dijalankan dengan `pnpm dev` tanpa setup tambahan.
- [ ] `pnpm check` berhasil tanpa error TypeScript.
- [ ] `pnpm build` berhasil.
- [ ] Halaman kasir menampilkan menu, kategori, pencarian, cart, total, dan tombol bayar.
- [ ] Penambahan dan pengurangan item langsung mengubah subtotal, pajak, dan total.
- [ ] Harga ditampilkan sebagai Rupiah dengan format Indonesia.
- [ ] Pembayaran kartu/QR dapat diselesaikan.
- [ ] Pembayaran tunai tidak dapat diselesaikan jika nominal kurang dan menghitung kembalian jika cukup.
- [ ] Tombol cetak membuka dialog cetak dan hanya mencetak tampilan struk.
- [ ] Navigasi Pesanan, Meja, Produk, Laporan, dan Pengaturan berfungsi sebagai workspace, bukan dead-end.
- [ ] Tampilan konsisten dengan Counterlight Utility: ink navy, mineral gray, Counterlime untuk status aktif, struk thermal, dan layout asimetris.
- [ ] Layar tetap terbaca jelas pada desktop, tablet, dan ponsel.

---

# 13. Format Hasil yang Diinginkan dari Anda

Kerjakan aplikasi secara bertahap namun jangan berhenti pada wireframe. Hasil akhir harus berupa kode aplikasi yang bisa dijalankan, bukan hanya saran atau gambar desain.

Mulai dengan memeriksa struktur proyek yang ada. Pertahankan folder data dan bahasa yang sudah tersedia. Kemudian implementasikan tampilan utama, logika kasir, modal pembayaran, cetak struk, dan workspace operasional. Setelah itu jalankan type-check dan production build. Jika ada error, perbaiki sampai build berhasil.

Saat melaporkan hasil, jelaskan secara singkat fitur yang sudah dibuat, file utama yang berubah, hasil pemeriksaan build, serta batasan yang masih ada—contohnya data masih lokal dan belum tersimpan permanen.
```

## Catatan Implementasi

Master prompt tersebut sengaja memisahkan **fungsi yang dapat digunakan sekarang** dan **batasan versi frontend**. Dengan demikian, aplikasi tetap jujur: pembayaran kartu/QR dan printer hardware belum benar-benar terhubung, tetapi alur kasir, validasi tunai, tampilan struk, dan dialog cetaknya sudah berfungsi di browser.

Jika Anda ingin menaikkan aplikasi dari versi ini ke versi produksi penuh, langkah berikutnya adalah menambahkan database, autentikasi kasir, penyimpanan transaksi permanen, sinkronisasi inventori, serta koneksi aman ke perangkat pembayaran dan printer yang benar-benar digunakan toko.
