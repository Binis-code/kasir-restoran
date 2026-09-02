import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const projectRoot = 'E:\\CLAUDE CODE\\Kuliner apps';
const imagesDir = path.join(projectRoot, 'docs', 'images');
const outputPdfPath = path.join(projectRoot, 'docs', 'KASA-POS-Brosur-Profil-Produk.pdf');
const outputHtmlPath = path.join(projectRoot, 'docs', 'brochure', 'brochure-preview.html');
const artifactDir = 'C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\dda98174-020c-4654-830d-2545ffe5f6aa';

function getBase64Image(filename) {
  const fullPath = path.join(imagesDir, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Image not found: ${fullPath}`);
    return '';
  }
  const buffer = fs.readFileSync(fullPath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const imgPosKasir = getBase64Image('01-pos-kasir.png');
const imgDapurKds = getBase64Image('02-dapur-kds.png');
const imgManajemenMeja = getBase64Image('03-manajemen-meja.png');
const imgKatalogProduk = getBase64Image('04-katalog-produk.png');
const imgLaporanPenjualan = getBase64Image('05-laporan-penjualan.png');
const imgPengaturanShift = getBase64Image('06-pengaturan-shift.png');
const imgLaciKas = getBase64Image('10-laci-kas.png');
const imgKelolaKategori = getBase64Image('11-kelola-kategori.png');
const imgGantiPeran = getBase64Image('21-ganti-peran-modal.png');
const imgPelayanSiti = getBase64Image('28-pelayan-2-siti-terisolasi.png');
const imgDenahMultiPelayan = getBase64Image('30-denah-meja-multi-pelayan.png');
const imgDapurMultiTickets = getBase64Image('31-dapur-multi-pelayan-tickets.png');
const imgSelfOrderMenu = getBase64Image('33-customer-self-order-menu.png');
const imgCookingStatus = getBase64Image('34-customer-live-cooking-status.png');
const imgDapurSelfOrder = getBase64Image('35-dapur-self-order-ticket.png');
const imgWifiQrScannable = getBase64Image('38-pusat-jaringan-wifi-qr-scannable.png');
const imgQrisMandiri = getBase64Image('39-qris-mandiri-scannable-matrix.png');
const imgBarcodeModal = getBase64Image('41-barcode-scanner-modal-camera.png');
const imgBarcodeManual = getBase64Image('46-barcode-scanner-manual-input.png');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>KASA POS — Brosur Resmi & Panduan Fitur Produk</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #e2e8f0;
      color: #0f172a;
      line-height: 1.4;
      font-size: 10px;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
      position: relative;
      background: #ffffff;
      padding: 13mm 15mm 11mm 15mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0 auto 10mm auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }

    @media print {
      body { background: transparent; }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }

    /* TYPOGRAPHY */
    h1, h2, h3, .font-heading {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .font-brand {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      letter-spacing: -0.04em;
    }

    /* HEADER & FOOTER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-logo-badge {
      background: #0f172a;
      color: #bef264;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .header-module-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 9px;
      border-radius: 20px;
      border: 1px solid #a7f3d0;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 8px;
      color: #64748b;
    }

    .page-num-badge {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8px;
    }

    /* COMMON COMPONENTS */
    .hero-title {
      font-size: 19px;
      line-height: 1.25;
      color: #0f172a;
      font-weight: 800;
      margin-bottom: 3px;
    }

    .hero-subtitle {
      font-size: 10px;
      color: #475569;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 10px;
    }

    .card-dark {
      background: #0f172a;
      color: #ffffff;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .badge-lime {
      background: #bef264;
      color: #0f172a;
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .badge-emerald {
      background: #10b981;
      color: #ffffff;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .badge-blue {
      background: #38bdf8;
      color: #0f172a;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .badge-amber {
      background: #f59e0b;
      color: #ffffff;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .feature-list {
      list-style: none;
    }

    .feature-list li {
      position: relative;
      padding-left: 14px;
      margin-bottom: 5px;
      font-size: 9px;
      color: #334155;
      line-height: 1.35;
    }

    .feature-list li::before {
      content: "✔";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 8.5px;
    }

    .mockup-frame {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      background: #000;
    }

    .mockup-frame img {
      width: 100%;
      height: auto;
      display: block;
    }

    .stat-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 8px;
      text-align: center;
    }

    .stat-val {
      font-size: 15px;
      font-weight: 800;
      color: #059669;
    }

    .stat-label {
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
    }

    /* COVER SPECIFIC */
    .cover-page {
      background: linear-gradient(145deg, #091312 0%, #102421 50%, #0d1b19 100%);
      color: #ffffff;
      padding: 16mm 16mm 14mm 16mm;
      position: relative;
    }

    .cover-page::before {
      content: "";
      position: absolute;
      top: -80px;
      right: -80px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(190, 242, 100, 0.18) 0%, rgba(16, 185, 129, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .cover-title {
      font-size: 28px;
      line-height: 1.15;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.03em;
      margin: 10px 0 8px 0;
    }

    .cover-title span {
      background: linear-gradient(90deg, #bef264, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
      max-width: 95%;
      margin-bottom: 14px;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1: COVER ==================== -->
  <div class="page cover-page">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: #bef264; color: #0c1615; font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 900; padding: 3px 12px; border-radius: 8px;">KASA</div>
        <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; color: #a7f3d0; text-transform: uppercase;">Sistem Kasir &amp; Operasional Restoran</div>
      </div>
      <div style="border: 1px solid rgba(190,242,100,0.4); background: rgba(190,242,100,0.1); color: #bef264; font-size: 8.5px; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.08em;">Brosur Resmi Produk 2026</div>
    </div>

    <div style="margin-top: 10px;">
      <div style="color: #34d399; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px;">Ekosistem Restoran Cerdas &amp; Offline-First</div>
      <h1 class="cover-title">Transformasi Bisnis Kuliner Anda Menjadi <span>Cepat, Akurat &amp; Mandiri</span></h1>
      <p class="cover-desc">Satu platform terintegrasi untuk POS Kasir Kilat, Layar Dapur KDS Realtime, Mode Pelayan Keliling Anti-Bentrok, dan QR Self-Order Meja — <strong>Bekerja 100% tanpa internet &amp; bebas biaya langganan bulanan.</strong></p>
    </div>

    <div class="mockup-frame" style="border: 2px solid rgba(190,242,100,0.3); box-shadow: 0 15px 35px rgba(0,0,0,0.5); max-height: 125mm;">
      <img src="${imgPosKasir}" alt="KASA POS Dashboard" style="object-fit: cover; height: 120mm; width: 100%;">
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px;">
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 13px; margin-bottom: 2px;">⚡</div>
        <div style="color: #bef264; font-weight: 800; font-size: 9.5px;">100% Offline-First</div>
        <div style="color: #94a3b8; font-size: 7.5px;">Bebas mati internet</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 13px; margin-bottom: 2px;">📱</div>
        <div style="color: #38bdf8; font-weight: 800; font-size: 9.5px;">QR Self-Order</div>
        <div style="color: #94a3b8; font-size: 7.5px;">Pesan langsung di meja</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 13px; margin-bottom: 2px;">👨‍🍳</div>
        <div style="color: #fbbf24; font-weight: 800; font-size: 9.5px;">Layar Dapur KDS</div>
        <div style="color: #94a3b8; font-size: 7.5px;">Antrean masak realtime</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 13px; margin-bottom: 2px;">💎</div>
        <div style="color: #34d399; font-weight: 800; font-size: 9.5px;">Zero Cloud Fees</div>
        <div style="color: #94a3b8; font-size: 7.5px;">Beli putus &amp; hak milik</div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 8px; margin-top: 10px; font-size: 8.5px; color: #94a3b8;">
      <div>Dokumen Penawaran &amp; Profil Produk untuk Pemilik Bisnis Kuliner</div>
      <div style="color: #bef264; font-weight: 700;">kasa.id · Sistem Kasir Restoran</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 2: EXECUTIVE SUMMARY & ARSITEKTUR ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Executive Summary &amp; Solusi</div>
      </div>
      <div class="header-module-tag">01 · Nilai Bisnis</div>
    </div>

    <div>
      <h2 class="hero-title">Mengapa Restoran Modern Memilih KASA?</h2>
      <p class="hero-subtitle">Mengeliminasi bottleneck kasir lambat, kertas pesanan hilang, dan sistem POS cloud yang sering macet saat koneksi internet restoran tidak stabil.</p>

      <div class="grid-2" style="margin-bottom: 10px;">
        <div class="card" style="border-left: 3px solid #ef4444; background: #fef2f2;">
          <div style="font-weight: 800; color: #991b1b; font-size: 10.5px; margin-bottom: 3px;">❌ Masalah POS Tradisional / Cloud Lain</div>
          <ul style="list-style: none; font-size: 8.8px; color: #7f1d1d;">
            <li style="margin-bottom: 3px;">• Transaksi terhenti total saat internet mati/down.</li>
            <li style="margin-bottom: 3px;">• Kertas struk pesanan dapur sering tercecer atau kotor.</li>
            <li style="margin-bottom: 3px;">• Pelayan berebut mesin kasir untuk menginput pesanan.</li>
            <li style="margin-bottom: 3px;">• Biaya langganan bulanan mahal yang membebani cashflow.</li>
          </ul>
        </div>

        <div class="card" style="border-left: 3px solid #10b981; background: #f0fdf4;">
          <div style="font-weight: 800; color: #065f46; font-size: 10.5px; margin-bottom: 3px;">✅ Solusi Unggulan KASA POS</div>
          <ul style="list-style: none; font-size: 8.8px; color: #14532d;">
            <li style="margin-bottom: 3px;">• <strong>100% Offline-First:</strong> Data tersimpan lokal, cepat 24/7.</li>
            <li style="margin-bottom: 3px;">• <strong>KDS Dapur Digital:</strong> Layar masak rapi dengan timer antrean.</li>
            <li style="margin-bottom: 3px;">• <strong>Multi-Pelayan Mobile:</strong> Input order dari HP tanpa antre kasir.</li>
            <li style="margin-bottom: 3px;">• <strong>Tanpa Biaya Sewa:</strong> Sekali investasi untuk selamanya.</li>
          </ul>
        </div>
      </div>

      <div class="card-dark" style="margin-bottom: 10px; border: 1px solid #334155;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-weight: 800; font-size: 11px; color: #bef264;">🌐 Arsitektur Sinkronisasi Jaringan Lokal (Zero Downtime)</div>
          <span class="badge-emerald">WiFi Lokal Tanpa Kuota</span>
        </div>
        <p style="font-size: 8.8px; color: #cbd5e1; margin-bottom: 8px;">Perangkat kasir bertindak sebagai Server Master lokal. Seluruh HP pelayan, tablet dapur, dan smartphone pelanggan berkomunikasi melalui gelombang WiFi lokal secara instan tanpa perlu kuota internet eksternal.</p>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
          <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px;">
            <div style="font-size: 10px;">💻</div>
            <div style="font-weight: 700; font-size: 8.5px; color: #bef264;">Kasir Utama</div>
            <div style="font-size: 7px; color: #94a3b8;">Master Hub &amp; DB</div>
          </div>
          <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px;">
            <div style="font-size: 10px;">📱</div>
            <div style="font-weight: 700; font-size: 8.5px; color: #38bdf8;">HP Pelayan</div>
            <div style="font-size: 7px; color: #94a3b8;">Order Keliling</div>
          </div>
          <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px;">
            <div style="font-size: 10px;">📺</div>
            <div style="font-weight: 700; font-size: 8.5px; color: #fbbf24;">Layar Dapur</div>
            <div style="font-size: 7px; color: #94a3b8;">Tiket Masak KDS</div>
          </div>
          <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px;">
            <div style="font-size: 10px;">🤳</div>
            <div style="font-weight: 700; font-size: 8.5px; color: #f472b6;">QR Meja</div>
            <div style="font-size: 7px; color: #94a3b8;">Self-Order Tamu</div>
          </div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 10px;">
        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 4px;">📡 Pairing Perangkat QR Instant</div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <img src="${imgWifiQrScannable}" alt="WiFi QR" style="width: 32mm; height: 32mm; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="font-size: 8.3px; color: #475569; line-height: 1.35;">
              Cukup scan kode QR pada layar Pusat Jaringan Kasir dari kamera HP pelayan atau tablet dapur untuk langsung terhubung ke server lokal. Otomatis mengenali IP restoran tanpa setting rumit.
            </div>
          </div>
        </div>

        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 4px;">📊 Analisis Efisiensi Operasional</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div class="stat-box">
              <div class="stat-val">+40%</div>
              <div class="stat-label">Kecepatan Layanan</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">100%</div>
              <div class="stat-label">Bebas Kertas Dapur</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">0 Detik</div>
              <div class="stat-label">Antre Kasir Pelayan</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">Rp 0</div>
              <div class="stat-label">Sewa Cloud/Bulan</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Dokumen Profil Sistem &amp; Arsitektur</div>
      <div class="page-num-badge">Halaman 2 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 3: MODUL 1 - POS KASIR UTAMA ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 01 · Kasir &amp; Transaksi POS</div>
      </div>
      <div class="header-module-tag">Point of Sale</div>
    </div>

    <div>
      <h2 class="hero-title">Transaksi Cepat, Multi-Cart &amp; Cetak Struk Kilat</h2>
      <p class="hero-subtitle">Dirancang untuk kasir berkecepatan tinggi pada jam sibuk (peak hours) dengan pencarian menu kilat, multi-tab meja, dan kalkulasi pembayaran otomatis.</p>

      <div class="mockup-frame" style="margin-bottom: 10px;">
        <img src="${imgPosKasir}" alt="POS Kasir Interface" style="height: 82mm; object-fit: cover; width: 100%;">
      </div>

      <div class="grid-2">
        <div class="card">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
            <span class="badge-lime">Fitur Kasir</span>
            <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Operasional Fleksibel</div>
          </div>
          <ul class="feature-list">
            <li><strong>Multi-Tab Cart Meja:</strong> Buka transaksi di banyak meja bersamaan tanpa khawatir draft hilang saat beralih.</li>
            <li><strong>Pencarian Cepat (Ctrl+K):</strong> Cari menu seketika via keyboard atau sentuhan kategori.</li>
            <li><strong>Kustomisasi Pesanan:</strong> Tambahkan catatan khusus per item (*less sugar, extra pedas, takeaway*).</li>
            <li><strong>Diskon &amp; Pajak Dinamis:</strong> Kalkulasi otomatis subtotal, diskon %, nominal, service charge, dan PPN 11%.</li>
          </ul>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
            <span class="badge-emerald">Pembayaran &amp; Hardware</span>
            <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Integrasi Lengkap</div>
          </div>
          <ul class="feature-list">
            <li><strong>Multi-Metode Bayar:</strong> Tunai (smart kembalian), QRIS Dinamis Mandiri, Debit/Kredit, dan Transfer Bank.</li>
            <li><strong>Thermal Printer Bluetooth/USB:</strong> Driver ESC/POS biner native untuk kertas 58mm &amp; 80mm tanpa driver software pihak ketiga.</li>
            <li><strong>Cash Drawer Kick:</strong> Memicu pembukaan laci kas otomatis saat transaksi tunai selesai.</li>
            <li><strong>Mode Offline Penuh:</strong> Transaksi tersimpan ke database lokal Dexie IndexedDB seketika.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul Kasir &amp; Transaksi Utama</div>
      <div class="page-num-badge">Halaman 3 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 4: MODUL 2 - QR SELF-ORDER MEJA ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 02 · QR Self-Order Pelanggan</div>
      </div>
      <div class="header-module-tag">Self-Service</div>
    </div>

    <div>
      <h2 class="hero-title">Pesan Mandiri di Meja: Langsung Masak di Dapur</h2>
      <p class="hero-subtitle">Pelanggan memindai QR Code di meja makan menggunakan smartphone tanpa perlu install aplikasi. Pesanan langsung masuk ke KDS dapur dan makanan diantar ke meja.</p>

      <div class="grid-2" style="margin-bottom: 10px;">
        <div class="mockup-frame">
          <img src="${imgSelfOrderMenu}" alt="Menu Self Order" style="height: 75mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #bef264; font-size: 7.5px; font-weight: 700; text-align: center; padding: 2px;">1. Tampilan Menu Foto &amp; Keranjang Tamu</div>
        </div>
        <div class="mockup-frame">
          <img src="${imgCookingStatus}" alt="Live Cooking Tracker" style="height: 75mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #38bdf8; font-size: 7.5px; font-weight: 700; text-align: center; padding: 2px;">2. Pelacak Status Memasak Realtime (Live)</div>
        </div>
      </div>

      <div class="card-dark" style="margin-bottom: 8px; border-left: 3px solid #bef264;">
        <div style="font-weight: 800; font-size: 10.5px; color: #bef264; margin-bottom: 3px;">🚀 Alur Pesanan Self-Order yang Memangkas Antrean Kasir</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 8px; color: #cbd5e1;">
          <div><strong style="color: #ffffff;">1. Scan QR Meja:</strong> Kamera smartphone membuka katalog menu meja secara instan.</div>
          <div><strong style="color: #ffffff;">2. Pilih &amp; Catat:</strong> Tamu memilih varian menu dan catatan selera tanpa terburu-buru.</div>
          <div><strong style="color: #ffffff;">3. Masak Otomatis:</strong> Pesanan langsung mencetak tiket digital di layar dapur.</div>
          <div><strong style="color: #ffffff;">4. Antar ke Meja:</strong> Makanan siap saji diantar pelayan langsung ke meja pemesan.</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card">
          <div style="font-weight: 700; font-size: 9px; color: #059669; margin-bottom: 2px;">💰 Upselling Otomatis</div>
          <div style="font-size: 8px; color: #475569;">Foto menu menarik mendorong pelanggan memesan varian menu tambahan &amp; minuman lebih banyak.</div>
        </div>
        <div class="card">
          <div style="font-weight: 700; font-size: 9px; color: #0284c7; margin-bottom: 2px;">⚡ Efisiensi Pelayan</div>
          <div style="font-size: 8px; color: #475569;">Pelayan fokus mengantar makanan dan melayani tamu tanpa terbebani mencatat pesanan berulang.</div>
        </div>
        <div class="card">
          <div style="font-weight: 700; font-size: 9px; color: #d97706; margin-bottom: 2px;">💳 Opsi Bayar Fleksibel</div>
          <div style="font-size: 8px; color: #475569;">Mendukung pembayaran langsung via QRIS di smartphone tamu atau bayar di kasir selesai makan.</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul QR Self-Order &amp; Pelacak Pesanan Mandiri</div>
      <div class="page-num-badge">Halaman 4 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 5: MODUL 3 - LAYAR DAPUR KDS ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 03 · Layar Dapur / KDS</div>
      </div>
      <div class="header-module-tag">Kitchen Display</div>
    </div>

    <div>
      <h2 class="hero-title">Komunikasi Dapur Tanpa Kertas &amp; Manajemen Antrean</h2>
      <p class="hero-subtitle">Menggantikan printer struk kertas dapur yang berisik dan rentan hilang dengan layar tiket digital interaktif yang mengurutkan antrean memasak koki secara real-time.</p>

      <div class="mockup-frame" style="margin-bottom: 10px;">
        <img src="${imgDapurKds}" alt="Kitchen Display System" style="height: 82mm; object-fit: cover; width: 100%;">
      </div>

      <div class="grid-2">
        <div class="card">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
            <span class="badge-amber">Fitur KDS Dapur</span>
            <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Alur Memasak 3-Tahap</div>
          </div>
          <ul class="feature-list">
            <li><strong>Tiket Multi-Sumber:</strong> Menampilkan pesanan dari Kasir, Pelayan (Budi/Siti), dan QR Self-Order Meja secara terorganisir.</li>
            <li><strong>Workflow 1-Sentuhan:</strong> Tombol transisi instan dari <em>Menunggu ➔ Mulai Masak ➔ Siap Saji ➔ Selesai</em>.</li>
            <li><strong>Penyorotan Catatan Khusus:</strong> Catatan pelanggan (*pedas, no bawang, gula pisah*) disorot jelas agar koki tidak salah racik.</li>
            <li><strong>Audio Notifikasi Tiket Baru:</strong> Suara notifikasi berdering saat pesanan baru masuk ke dapur.</li>
          </ul>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
            <span class="badge-emerald">Efisiensi &amp; SLA</span>
            <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Kontrol Durasi Pesanan</div>
          </div>
          <ul class="feature-list">
            <li><strong>Timer Memasak Otomatis:</strong> Menghitung menit sejak pesanan dibuat untuk memantau kecepatan koki.</li>
            <li><strong>Peringatan Order Mendesak (&gt;15 Menit):</strong> Kartu tiket otomatis berubah warna merah berkedip jika pesanan tertunda lama.</li>
            <li><strong>Saring Berdasarkan Kategori:</strong> Layar dapat dipisah antara bagian Dapur Makanan (Hot Kitchen) dan Bar Minuman.</li>
            <li><strong>Integrasi Notifikasi Pelayan:</strong> Saat koki menekan "Siap Saji", notifikasi otomatis muncul di layar pelayan terkait.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul Kitchen Display System (KDS)</div>
      <div class="page-num-badge">Halaman 5 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 6: MODUL 4 - MODE PELAYAN KELILING ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 04 · Mode Pelayan Keliling (Waitstaff)</div>
      </div>
      <div class="header-module-tag">Waitstaff Focus</div>
    </div>

    <div>
      <h2 class="hero-title">Input Pesanan Mobile dengan Proteksi Anti-Bentrok Meja</h2>
      <p class="hero-subtitle">Pelayan mencatat pesanan langsung di samping meja tamu menggunakan smartphone. Draft pesanan terisolasi aman dan dilengkapi indikator pencegah tabrakan meja (*Table Lock*).</p>

      <div class="grid-2" style="margin-bottom: 10px;">
        <div class="mockup-frame">
          <img src="${imgPelayanSiti}" alt="Mode Pelayan Siti" style="height: 75mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #bef264; font-size: 7.5px; font-weight: 700; text-align: center; padding: 2px;">Antarmuka Fokus Pelayan (Mobile Ergonomis)</div>
        </div>
        <div class="mockup-frame">
          <img src="${imgDenahMultiPelayan}" alt="Denah Multi Pelayan" style="height: 75mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #38bdf8; font-size: 7.5px; font-weight: 700; text-align: center; padding: 2px;">Denah Meja Realtime &amp; Indikator Staf Aktif</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 5px;">🔒 Keranjang Terisolasi &amp; Anti-Bentrok</div>
          <ul class="feature-list">
            <li><strong>Sesi Mandiri per Pelayan:</strong> Keranjang tersimpan terpisah pada masing-masing akun staf sehingga draf tidak pernah tercampur.</li>
            <li><strong>Table Lock Protection:</strong> Jika Meja 01 sedang diinput oleh Pelayan A, Pelayan B akan menerima peringatan visual jelas di layarnya.</li>
            <li><strong>Kirim Langsung ke Dapur:</strong> Satu tap tombol <em>"Kirim ke Dapur"</em> meneruskan pesanan ke koki tanpa pelayan harus berjalan ke kasir.</li>
          </ul>
        </div>

        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 5px;">📱 3 Tab Kerja Efisien &amp; PIN Switch</div>
          <ul class="feature-list">
            <li><strong>1. Catat Pesanan:</strong> Katalog menu cepat dengan filter kategori dan pemindai barcode menu.</li>
            <li><strong>2. Pesanan Saya:</strong> Pantau status makanan meja tamu yang sedang ditangani secara langsung.</li>
            <li><strong>3. Denah Meja:</strong> Cek meja kosong, terisi, atau yang sedang menunggu hidangan.</li>
            <li><strong>Ganti Staf Cepat (PIN):</strong> Numpad PIN 4 digit untuk pergantian shift antar-pelayan dalam 2 detik.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul Pelayan Keliling (Waitstaff Mobile)</div>
      <div class="page-num-badge">Halaman 6 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 7: MODUL 5 & 6 - BARCODE & LACI KAS ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 05 &amp; 06 · Scanner Barcode &amp; Laci Kas</div>
      </div>
      <div class="header-module-tag">Hardware &amp; Kasir</div>
    </div>

    <div>
      <h2 class="hero-title">Pemindaian Presisi &amp; Rekonsiliasi Uang Fisik Kasir</h2>
      <p class="hero-subtitle">Dukungan hardware pemindai barcode canggih untuk item kemasan/retail serta modul audit laci kas harian yang akurat untuk mencegah kebocoran uang.</p>

      <div class="grid-2" style="margin-bottom: 10px;">
        <!-- KOLOM 1: BARCODE SCANNER -->
        <div>
          <div class="mockup-frame" style="margin-bottom: 6px;">
            <img src="${imgBarcodeModal}" alt="Barcode Scanner Modal" style="height: 56mm; object-fit: cover; width: 100%;">
          </div>
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="badge-lime">Modul Barcode / QR</span>
              <span style="font-size: 7.5px; color: #059669; font-weight: 700;">Multi-Engine</span>
            </div>
            <ul class="feature-list">
              <li><strong>Scanner Gun USB/Bluetooth:</strong> Menangkap pemindaian fisik HID secara pasif tanpa perlu klik form.</li>
              <li><strong>Kamera ZXing Multi-Format:</strong> Baca EAN-13, Code 128, QR Meja, hingga UPC dengan akurasi tinggi.</li>
              <li><strong>Audio Synthesizer:</strong> Nada beep suara khas kasir modern via Web Audio API.</li>
              <li><strong>4 Mode:</strong> Kamera, Unggah Foto, Ketik Manual Keypad, &amp; Demo Cepat.</li>
            </ul>
          </div>
        </div>

        <!-- KOLOM 2: LACI KAS & SHIFT -->
        <div>
          <div class="mockup-frame" style="margin-bottom: 6px;">
            <img src="${imgLaciKas}" alt="Laci Kas & Rekonsiliasi" style="height: 56mm; object-fit: cover; width: 100%;">
          </div>
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="badge-emerald">Modul Laci Kas &amp; Shift</span>
              <span style="font-size: 7.5px; color: #059669; font-weight: 700;">Audit Kasir</span>
            </div>
            <ul class="feature-list">
              <li><strong>Buka Shift:</strong> Pencatatan kasir bertugas dan input modal awal uang kembalian.</li>
              <li><strong>Rekonsiliasi Fisik Uang:</strong> Input lembar uang kertas &amp; koin saat tutup toko.</li>
              <li><strong>Deteksi Selisih Otomatis:</strong> Menghitung otomatis status kas (*Pas, Surplus, atau Minus*).</li>
              <li><strong>Log Riwayat Shift:</strong> Riwayat audit tersimpan rapi untuk rekonsiliasi akuntansi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul Hardware Barcode &amp; Rekonsiliasi Laci Kas</div>
      <div class="page-num-badge">Halaman 7 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 8: MODUL 7 & 8 - KATALOG, MEJA & LAPORAN ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Modul 07 &amp; 08 · Katalog Menu, Meja &amp; Laporan</div>
      </div>
      <div class="header-module-tag">Manajemen &amp; Analitik</div>
    </div>

    <div>
      <h2 class="hero-title">Manajemen Menu, Tata Letak Meja, &amp; Analitik Omset</h2>
      <p class="hero-subtitle">Kelola master data restoran secara leluasa dan pantau kesehatan finansial usaha melalui laporan performa penjualan yang komprehensif.</p>

      <div class="grid-3" style="margin-bottom: 10px;">
        <div class="mockup-frame">
          <img src="${imgKatalogProduk}" alt="Katalog Produk" style="height: 54mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #bef264; font-size: 7px; font-weight: 700; text-align: center; padding: 2px;">Katalog &amp; Foto Menu</div>
        </div>
        <div class="mockup-frame">
          <img src="${imgManajemenMeja}" alt="Manajemen Meja" style="height: 54mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #38bdf8; font-size: 7px; font-weight: 700; text-align: center; padding: 2px;">Denah Area &amp; QR Meja</div>
        </div>
        <div class="mockup-frame">
          <img src="${imgLaporanPenjualan}" alt="Laporan Penjualan" style="height: 54mm; object-fit: cover; width: 100%;">
          <div style="background: #0f172a; color: #34d399; font-size: 7px; font-weight: 700; text-align: center; padding: 2px;">Laporan &amp; Grafik Omset</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card">
          <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; margin-bottom: 3px;">🥗 Katalog &amp; Gambar Pintar</div>
          <ul class="feature-list">
            <li>Upload foto lokal (offline).</li>
            <li>Pencarian Google Gambar instan.</li>
            <li>Galeri preset kuliner siap pakai.</li>
            <li>Kategori kustom (Makanan, Minuman, Favorit, dll).</li>
          </ul>
        </div>

        <div class="card">
          <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; margin-bottom: 3px;">🪑 Manajemen Meja &amp; Area</div>
          <ul class="feature-list">
            <li>Pengelompokan area (*Utama, VIP, Teras, Lesehan*).</li>
            <li>Status visual meja aktif / kosong.</li>
            <li>Generator cetak QR Code Meja mandiri siap tempel.</li>
            <li>Kapasitas kursi dinamis per meja.</li>
          </ul>
        </div>

        <div class="card">
          <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; margin-bottom: 3px;">📊 Laporan &amp; Ekspor Excel</div>
          <ul class="feature-list">
            <li>Grafik tren omset harian &amp; bulanan.</li>
            <li>Rekapitulasi metode pembayaran.</li>
            <li>Daftar menu terlaris (*Best Seller*).</li>
            <li>Ekspor data ke format Excel (.xlsx) &amp; backup JSON lokal.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Modul Manajemen Menu, Meja &amp; Analitik Penjualan</div>
      <div class="page-num-badge">Halaman 8 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 9: SPESIFIKASI TEKNIS & KEAMANAN ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Spesifikasi Teknis &amp; Kompatibilitas</div>
      </div>
      <div class="header-module-tag">Infrastruktur &amp; Hardware</div>
    </div>

    <div>
      <h2 class="hero-title">Keandalan Infrastruktur, Proteksi Data &amp; Hardware</h2>
      <p class="hero-subtitle">Dibangun dengan teknologi web modern standar enterprise yang kompatibel dengan berbagai perangkat hardware kasir tanpa lisensi perangkat mahal.</p>

      <div class="card" style="margin-bottom: 10px;">
        <div style="font-weight: 800; font-size: 10.5px; color: #0f172a; margin-bottom: 5px;">🔌 Tabel Kompatibilitas Perangkat Hardware</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 4px 6px; border-radius: 4px 0 0 4px;">Komponen Hardware</th>
              <th style="padding: 4px 6px;">Spesifikasi / Protokol yang Didukung</th>
              <th style="padding: 4px 6px; border-radius: 0 4px 4px 0;">Status Kompatibilitas</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 6px; font-weight: 700;">Printer Struk Thermal</td>
              <td style="padding: 4px 6px;">ESC/POS 58mm &amp; 80mm via Web Bluetooth GATT &amp; USB</td>
              <td style="padding: 4px 6px; color: #059669; font-weight: 700;">✔ Plug &amp; Play Native</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 4px 6px; font-weight: 700;">Barcode / QR Scanner</td>
              <td style="padding: 4px 6px;">USB HID Keyboard Wedge, Wireless 2.4G &amp; Kamera ZXing</td>
              <td style="padding: 4px 6px; color: #059669; font-weight: 700;">✔ Otomatis Terdeteksi</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 6px; font-weight: 700;">Laci Kas (Cash Drawer)</td>
              <td style="padding: 4px 6px;">Konektor RJ11 standar via printer thermal</td>
              <td style="padding: 4px 6px; color: #059669; font-weight: 700;">✔ Kick Trigger Aktif</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 4px 6px; font-weight: 700;">Perangkat Kasir Master</td>
              <td style="padding: 4px 6px;">Laptop / PC Windows, MacOS, Linux, POS Touchscreen All-in-One</td>
              <td style="padding: 4px 6px; color: #059669; font-weight: 700;">✔ Chrome / Edge / PWA</td>
            </tr>
            <tr>
              <td style="padding: 4px 6px; font-weight: 700;">HP Pelayan &amp; Tablet Dapur</td>
              <td style="padding: 4px 6px;">Smartphone Android, iPhone (iOS), Tablet Android, iPad</td>
              <td style="padding: 4px 6px; color: #059669; font-weight: 700;">✔ Akses via Browser Lokal</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 3px;">🔐 Keamanan &amp; Hak Akses (RBAC)</div>
          <ul class="feature-list">
            <li><strong>PIN Staf 4-Digit:</strong> Pembatasan login kasir, pelayan, dapur, dan manajer.</li>
            <li><strong>RouteGuard Protection:</strong> Pelayan tidak dapat mengintip laporan keuangan atau mengubah harga produk.</li>
            <li><strong>Data Privat Lokal:</strong> Data transaksi tidak disimpan di server pihak ketiga, menjamin 100% privasi bisnis Anda.</li>
          </ul>
        </div>

        <div class="card">
          <div style="font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 3px;">⚡ Spesifikasi Minimal Sistem</div>
          <ul class="feature-list">
            <li><strong>Kasir Utama:</strong> Processor Dual Core, RAM 4GB, Storage 32GB (PC/Laptop standar).</li>
            <li><strong>Jaringan:</strong> Router WiFi standar (tanpa perlu koneksi internet berbayar).</li>
            <li><strong>Pelayan / Dapur:</strong> Smartphone atau Tablet dengan browser modern.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Spesifikasi Teknis, Keamanan &amp; Kompatibilitas Hardware</div>
      <div class="page-num-badge">Halaman 9 / 10</div>
    </div>
  </div>


  <!-- ==================== HALAMAN 10: PAKET IMPLEMENTASI & PENUTUP ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-brand">
        <div class="brand-logo-badge">KASA</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Paket Implementasi &amp; Pemesanan</div>
      </div>
      <div class="header-module-tag">Pilihan Paket</div>
    </div>

    <div>
      <h2 class="hero-title">Mulai Transformasi Restoran Anda Hari Ini</h2>
      <p class="hero-subtitle">Pilih paket solusi KASA yang sesuai dengan skala usaha kuliner Anda. <strong>Sekali investasi, bebas biaya langganan bulanan selamanya.</strong></p>

      <div class="grid-3" style="margin-bottom: 10px;">
        <!-- PAKET 1 -->
        <div class="card" style="border-top: 3px solid #64748b;">
          <div style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Usaha Rintisan</div>
          <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin: 2px 0;">Paket Starter</div>
          <div style="font-size: 7.5px; color: #64748b; margin-bottom: 6px;">Kedai Kopi, Warung &amp; Booth</div>
          <ul class="feature-list" style="font-size: 8px;">
            <li>Sistem POS Kasir Utama</li>
            <li>Katalog Produk &amp; Manajemen Meja</li>
            <li>Laporan Penjualan &amp; Ekspor Excel</li>
            <li>Dukungan 1 Printer Thermal</li>
            <li>Bebas Biaya Bulanan</li>
          </ul>
        </div>

        <!-- PAKET 2 -->
        <div class="card" style="border: 2px solid #10b981; background: #f0fdf4;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 7.5px; font-weight: 800; color: #059669; text-transform: uppercase;">Paling Populer</div>
            <span class="badge-lime">Recommended</span>
          </div>
          <div style="font-weight: 800; font-size: 12px; color: #065f46; margin: 2px 0;">Paket Resto Pro</div>
          <div style="font-size: 7.5px; color: #047857; margin-bottom: 6px;">Restoran, Cafe &amp; Rumah Makan</div>
          <ul class="feature-list" style="font-size: 8px;">
            <li><strong>Semua Fitur Starter</strong></li>
            <li><strong>QR Self-Order Meja Pelanggan</strong></li>
            <li><strong>Layar Dapur KDS Realtime</strong></li>
            <li><strong>Mode Multi-Pelayan Terisolasi</strong></li>
            <li><strong>Scanner Barcode / QR Engine</strong></li>
            <li><strong>Laci Kas &amp; Rekonsiliasi Shift</strong></li>
          </ul>
        </div>

        <!-- PAKET 3 -->
        <div class="card" style="border-top: 3px solid #0f172a;">
          <div style="font-size: 7.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Skala Besar</div>
          <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin: 2px 0;">Paket Enterprise</div>
          <div style="font-size: 7.5px; color: #64748b; margin-bottom: 6px;">Resto Multi-Lantai, VIP &amp; Bar</div>
          <ul class="feature-list" style="font-size: 8px;">
            <li><strong>Semua Fitur Resto Pro</strong></li>
            <li>Multi-Kasir Kasir Depan &amp; Bar</li>
            <li>Multi-Layar KDS (Makanan + Minuman)</li>
            <li>Setup Server Dedicated Lokal</li>
            <li>Training &amp; Pendampingan On-Site</li>
            <li>Kustomisasi Branding &amp; Garansi Penuh</li>
          </ul>
        </div>
      </div>

      <div class="card-dark" style="background: linear-gradient(135deg, #0c1615 0%, #14211f 100%); border: 1px solid rgba(190,242,100,0.3); padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>
            <div style="color: #bef264; font-weight: 800; font-size: 12px;">Siap Meningkatkan Omset &amp; Efisiensi Restoran Anda?</div>
            <div style="color: #cbd5e1; font-size: 8.8px;">Jadwalkan sesi demo gratis dan konsultasi implementasi langsung di lokasi usaha Anda.</div>
          </div>
          <div style="background: #bef264; color: #0c1615; font-weight: 800; font-size: 9px; padding: 5px 12px; border-radius: 6px; white-space: nowrap;">Hubungi Tim Kami</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 6px; font-size: 8px; color: #94a3b8;">
          <div>📍 <strong>Instalasi Cepat:</strong> 1 Hari Kerja Siap Operasional</div>
          <div>📞 <strong>Dukungan Teknis:</strong> Hotline Pendampingan Staf</div>
          <div>🛡️ <strong>Garansi Sistem:</strong> Update &amp; Maintenance Terjamin</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div>KASA POS · Brosur Resmi &amp; Penawaran Implementasi Sistem Restoran</div>
      <div class="page-num-badge">Halaman 10 / 10</div>
    </div>
  </div>

</body>
</html>
`;

async function generatePdf() {
  console.log('Writing preview HTML...');
  fs.writeFileSync(outputHtmlPath, htmlContent);

  console.log('Launching Puppeteer for high-res PDF generation...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Generating A4 PDF brochure...');
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`PDF successfully generated at: ${outputPdfPath}`);

  // Also take screenshots of individual pages for visual artifact review
  const pages = await page.$$('.page');
  console.log(`Found ${pages.length} pages. Capturing page preview screenshots...`);
  for (let i = 0; i < pages.length; i++) {
    const pageNum = String(i + 1).padStart(2, '0');
    const screenshotPath = path.join(artifactDir, `brochure-page-${pageNum}.png`);
    await pages[i].screenshot({ path: screenshotPath });
    console.log(`Captured brochure-page-${pageNum}.png`);
  }

  await browser.close();
  console.log('Done! All brochure pages generated and captured.');
}

generatePdf().catch(console.error);
