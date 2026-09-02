import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });

  const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
  const docsDir = "E:\\CLAUDE CODE\\Kuliner apps\\docs\\images";

  console.log("Navigating to http://localhost:5173/produk...");
  await page.goto("http://localhost:5173/produk", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Click "+ Tambah baru"
  console.log("Opening Add Product Modal...");
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && (text.includes("Tambah baru") || text.includes("Tambah Produk"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Capture Upload File Tab
  const p1 = path.join(artifactDir, "16-upload-image-produk-local.png");
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, path.join(docsDir, "16-upload-image-produk-local.png"));
  console.log("Captured 16-upload-image-produk-local.png");

  // 2. Switch to "Cari Gambar"
  let tabButtons = await page.$$("button");
  for (const b of tabButtons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Cari Gambar")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));

  // Type something in search box
  const searchInput = await page.$("input[placeholder*='Cari foto menu']");
  if (searchInput) {
    await searchInput.type("Ayam");
    await new Promise((r) => setTimeout(r, 600));
  }

  const p2 = path.join(artifactDir, "17-cari-gambar-google.png");
  await page.screenshot({ path: p2 });
  fs.copyFileSync(p2, path.join(docsDir, "17-cari-gambar-google.png"));
  console.log("Captured 17-cari-gambar-google.png");

  // 3. Switch to "Galeri Menu"
  tabButtons = await page.$$("button");
  for (const b of tabButtons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Galeri Menu")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  const p3 = path.join(artifactDir, "18-galeri-kuliner.png");
  await page.screenshot({ path: p3 });
  fs.copyFileSync(p3, path.join(docsDir, "18-galeri-kuliner.png"));
  console.log("Captured 18-galeri-kuliner.png");

  await browser.close();
  console.log("Modal captures done!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
