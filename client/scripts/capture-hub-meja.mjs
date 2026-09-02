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

  console.log("Navigating to Home...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Click Pair HP button in Header
  console.log("Opening NetworkHubModal...");
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && (text.includes("Server Lokal") || text.includes("Pair HP"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Click tab "QR Menu Meja"
  let tabButtons = await page.$$("button");
  for (const b of tabButtons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && (text.includes("QR Menu Meja") || text.includes("Menu Meja"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  // Capture Tab QR Menu Meja
  const p1 = path.join(artifactDir, "19-qr-menu-meja-fixed.png");
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, path.join(docsDir, "19-qr-menu-meja-fixed.png"));
  console.log("Captured 19-qr-menu-meja-fixed.png");

  // Click on "Teras 02"
  const tableButtons = await page.$$("button");
  for (const b of tableButtons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Teras 02") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));

  const p2 = path.join(artifactDir, "20-qr-menu-meja-selected.png");
  await page.screenshot({ path: p2 });
  fs.copyFileSync(p2, path.join(docsDir, "20-qr-menu-meja-selected.png"));
  console.log("Captured 20-qr-menu-meja-selected.png");

  await browser.close();
  console.log("Capture completed!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
