# 🍽️ KASA — Sistem Kasir Restoran & Kuliner (Point of Sale)

> Aplikasi Point of Sale (POS) modern, cepat, dan offline-first yang dirancang khusus untuk warung, kedai kopi, restoran, dan usaha kuliner F&B.

---

## ✨ Fitur Utama

- 🛒 **Katalog & Transaksi Cepat**: Pemilihan menu cepat, pencarian instan (`Ctrl + K`), filter kategori, dan kalkulasi otomatis (Subtotal, PPN 11%, Diskon, & Kembalian).
- 🖨️ **Driver Struk Thermal Bluetooth (ESC/POS)**: Generator nota kasir 58mm & 80mm nirkabel langsung dari browser via Web Bluetooth GATT tanpa driver tambahan.
- 📱 **Dynamic QRIS & Barcode Scanner**: Tampilan kode QRIS dinamis di layar kasir dan pemindaian barcode produk dengan kamera.
- 🥗 **Kelola Menu Produk (CRUD)**: Tambah, edit, hapus produk makanan & minuman, pengaturan harga, deskripsi, dan kode barcode.
- 🪑 **Manajemen Meja & Area Kustom (CRUD)**: Kelola meja makan, kapasitas kursi, area kustom (*Utama, Teras, VIP, Rooftop, Lesehan*), filter area, dan deteksi meja aktif.
- 💾 **Offline-First Resilience**: Penyimpanan lokal menggunakan Dexie IndexedDB, memastikan kasir tetap dapat bertransaksi saat koneksi internet terputus.
- 📊 **Laporan Penjualan**: Ringkasan omset harian & bulanan serta ekspor data ke Excel (XLSX) dan CSV.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **Icons & UI** | Lucide React, Sonner (Toasts) |
| **Database Lokal** | Dexie.js (IndexedDB) |
| **Hardware Driver** | Web Bluetooth API (ESC/POS Raw Command Engine) |
| **Backend API** | Laravel 11/12, Filament Admin Panel, SQLite / MySQL |
| **Mobile Bridge** | Capacitor (Android / iOS) |

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Frontend Client
```bash
cd client
pnpm install
pnpm dev
```
Buka browser di `http://localhost:5173` atau `http://localhost:5174`.

### 2. Backend Laravel (Opsional untuk sinkronisasi server)
```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

---

## 📄 Lisensi
Didistribusikan di bawah lisensi open-source MIT.
