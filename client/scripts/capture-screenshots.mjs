import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/images");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pagesToCapture = [
  { name: "01-pos-kasir.png", url: "http://localhost:5173/", width: 1366, height: 768 },
  { name: "02-dapur-kds.png", url: "http://localhost:5173/dapur", width: 1366, height: 768 },
  { name: "03-daftar-pesanan.png", url: "http://localhost:5173/pesanan", width: 1366, height: 768 },
  { name: "04-manajemen-meja.png", url: "http://localhost:5173/meja", width: 1366, height: 768 },
  { name: "05-katalog-produk.png", url: "http://localhost:5173/produk", width: 1366, height: 768 },
  { name: "06-laporan-penjualan.png", url: "http://localhost:5173/laporan", width: 1366, height: 768 },
  { name: "07-pengaturan-shift.png", url: "http://localhost:5173/pengaturan", width: 1366, height: 768 },
  { name: "08-self-order-qr.png", url: "http://localhost:5173/order/meja-01", width: 420, height: 860 },
  { name: "09-mode-pelayan.png", url: "http://localhost:5173/pelayan", width: 1366, height: 768 },
  { name: "10-laci-kas.png", url: "http://localhost:5173/laci-kas", width: 1366, height: 768 },
];

async function main() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  // First visit home to let Dexie seed database
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.url}...`);
    try {
      await page.setViewport({ width: item.width, height: item.height, deviceScaleFactor: 2 });
      await page.goto(item.url, { waitUntil: "networkidle0", timeout: 15000 });
      // Wait for any animations and Dexie db load
      await new Promise((r) => setTimeout(r, 2000));
      const targetPath = path.join(outDir, item.name);
      await page.screenshot({ path: targetPath });
      console.log(`Saved screenshot: ${targetPath}`);

      const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
      if (fs.existsSync(artifactDir)) {
        const artifactPath = path.join(artifactDir, item.name);
        fs.copyFileSync(targetPath, artifactPath);
        console.log(`Copied to artifact: ${artifactPath}`);
      }
    } catch (err) {
      console.error(`Failed to capture ${item.url}:`, err.message);
    }
  }

  // Interactive capture: Kelola Kategori Modal
  try {
    console.log("Navigating to Produk for Modal capture...");
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
    await page.goto("http://localhost:5173/produk", { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Kelola Kategori"
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Kelola Kategori")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    const catModalPath = path.join(outDir, "11-kelola-kategori.png");
    await page.screenshot({ path: catModalPath });
    console.log("Captured 11-kelola-kategori.png");

    const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(catModalPath, path.join(artifactDir, "11-kelola-kategori.png"));
    }

    // Click delete on a category to open 2-step verification modal
    const deleteButtons = await page.$$("button[title*='Hapus Kategori']");
    if (deleteButtons.length > 0) {
      await deleteButtons[deleteButtons.length - 1].click();
      await new Promise((r) => setTimeout(r, 1000));
      const verifyModalPath = path.join(outDir, "12-verifikasi-dua-langkah.png");
      await page.screenshot({ path: verifyModalPath });
      console.log("Captured 12-verifikasi-dua-langkah.png");
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(verifyModalPath, path.join(artifactDir, "12-verifikasi-dua-langkah.png"));
      }
    }
  } catch (e) {
    console.error("Failed interactive category captures:", e);
  }

  // Interactive capture: Product Modal & Image Picker
  try {
    console.log("Navigating to Produk for Product Modal & Image Picker capture...");
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
    await page.goto("http://localhost:5173/produk", { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Ubah" on the first product or "Tambah baru"
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && (text.includes("Ubah") || text.includes("Tambah baru"))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));
    const prodModalPath = path.join(outDir, "16-upload-image-produk-local.png");
    await page.screenshot({ path: prodModalPath });
    console.log("Captured 16-upload-image-produk-local.png");

    const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(prodModalPath, path.join(artifactDir, "16-upload-image-produk-local.png"));
    }

    // Switch to "Cari Gambar" Tab
    let tabButtons = await page.$$("button");
    for (const b of tabButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Cari Gambar")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    const searchModalPath = path.join(outDir, "17-cari-gambar-google.png");
    await page.screenshot({ path: searchModalPath });
    console.log("Captured 17-cari-gambar-google.png");
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(searchModalPath, path.join(artifactDir, "17-cari-gambar-google.png"));
    }

    // Switch to "Galeri Menu" Tab
    tabButtons = await page.$$("button");
    for (const b of tabButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Galeri Menu")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    const galleryModalPath = path.join(outDir, "18-galeri-kuliner.png");
    await page.screenshot({ path: galleryModalPath });
    console.log("Captured 18-galeri-kuliner.png");
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(galleryModalPath, path.join(artifactDir, "18-galeri-kuliner.png"));
    }
  } catch (e) {
    console.error("Failed image picker modal captures:", e);
  }

  // Interactive capture: Network & Waiter Pairing Hub Modal
  try {
    console.log("Navigating to Home for Network Hub capture...");
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Server Lokal" / "Pair HP" button in header
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && (text.includes("Server Lokal") || text.includes("Pair HP"))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    const netModalPath = path.join(outDir, "13-pusat-jaringan-pelayan.png");
    await page.screenshot({ path: netModalPath });
    console.log("Captured 13-pusat-jaringan-pelayan.png");

    const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(netModalPath, path.join(artifactDir, "13-pusat-jaringan-pelayan.png"));
    }

    // Switch to Dapur KDS tab
    const tabButtons = await page.$$("button");
    for (const b of tabButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Layar Dapur")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));

    const netDapurPath = path.join(outDir, "14-pusat-jaringan-dapur.png");
    await page.screenshot({ path: netDapurPath });
    console.log("Captured 14-pusat-jaringan-dapur.png");
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(netDapurPath, path.join(artifactDir, "14-pusat-jaringan-dapur.png"));
    }
  } catch (e) {
    console.error("Failed network hub modal captures:", e);
  }

  // Interactive capture: Panduan Server Lokal Modal from Settings
  try {
    console.log("Navigating to Settings for Guide Modal capture...");
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
    await page.goto("http://localhost:5173/pengaturan", { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Panduan & Arahan Penerapan" button
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Panduan & Arahan Penerapan")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    const guideModalPath = path.join(outDir, "15-panduan-server-lokal.png");
    await page.screenshot({ path: guideModalPath });
    console.log("Captured 15-panduan-server-lokal.png");

    const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(guideModalPath, path.join(artifactDir, "15-panduan-server-lokal.png"));
    }
  } catch (e) {
    console.error("Failed guide modal capture:", e);
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
