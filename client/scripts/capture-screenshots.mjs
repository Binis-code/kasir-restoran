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
  { name: "01-pos-kasir.png", url: "http://localhost:5174/" },
  { name: "02-dapur-kds.png", url: "http://localhost:5174/dapur" },
  { name: "03-manajemen-meja.png", url: "http://localhost:5174/meja" },
  { name: "04-katalog-produk.png", url: "http://localhost:5174/produk" },
  { name: "05-laporan-penjualan.png", url: "http://localhost:5174/laporan" },
  { name: "06-pengaturan-shift.png", url: "http://localhost:5174/pengaturan" },
];

async function main() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1366, height: 768, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.url}...`);
    try {
      await page.goto(item.url, { waitUntil: "networkidle0", timeout: 15000 });
      // Wait for any animations and Dexie db load
      await new Promise((r) => setTimeout(r, 1200));
      const targetPath = path.join(outDir, item.name);
      await page.screenshot({ path: targetPath });
      console.log(`Saved screenshot: ${targetPath}`);
    } catch (err) {
      console.error(`Failed to capture ${item.url}:`, err.message);
    }
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch(console.error);
