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
  // Mobile viewport for Customer Smartphone Experience
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });

  const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\77b4e46a-aed0-4cb0-8942-519e52354c00";
  const docsDir = "E:\\CLAUDE CODE\\Kuliner apps\\docs\\images";

  console.log("1. Customer scans table QR barcode: /order/meja-03...");
  await page.goto("http://localhost:5173/order/meja-03", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Customer inputs name
  const nameInput = await page.$("#customer-name-input");
  if (nameInput) {
    await nameInput.click({ clickCount: 3 });
    await nameInput.type("Bpk. Rian");
  }
  await new Promise((r) => setTimeout(r, 400));

  // Customer adds menu items
  const addBtns = await page.$$("button");
  let added = 0;
  for (const b of addBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Tambah" && added < 2) {
      await b.click();
      added++;
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const pMenu = path.join(artifactDir, "33-customer-self-order-menu.png");
  await page.screenshot({ path: pMenu });
  fs.copyFileSync(pMenu, path.join(docsDir, "33-customer-self-order-menu.png"));
  console.log("Captured 33-customer-self-order-menu.png");

  // Open Cart
  console.log("2. Customer opens cart...");
  const cartBarBtn = await page.$$("button");
  for (const b of cartBarBtn) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Lihat Keranjang")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  // Click "Kirim ke Dapur Sekarang (Bayar Nanti di Meja)"
  const submitBtns = await page.$$("button");
  for (const b of submitBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Kirim ke Dapur Sekarang")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));

  // Capture Live Cooking Status on Customer Smartphone
  const pLive = path.join(artifactDir, "34-customer-live-cooking-status.png");
  await page.screenshot({ path: pLive });
  fs.copyFileSync(pLive, path.join(docsDir, "34-customer-live-cooking-status.png"));
  console.log("Captured 34-customer-live-cooking-status.png");

  // 3. Switch to Desktop Viewport for Kitchen KDS
  console.log("3. Viewing Kitchen KDS...");
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/dapur", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  const pKitchen = path.join(artifactDir, "35-dapur-self-order-ticket.png");
  await page.screenshot({ path: pKitchen });
  fs.copyFileSync(pKitchen, path.join(docsDir, "35-dapur-self-order-ticket.png"));
  console.log("Captured 35-dapur-self-order-ticket.png");

  // Chef marks order as "Siap Saji"
  const readyBtns = await page.$$("button");
  for (const b of readyBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Tandai Siap Saji")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // 4. Return to Customer Smartphone Viewport to capture "SIAP DIANTAR KE MEJA"
  console.log("4. Capturing Customer Notification when Food is Ready...");
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/order/meja-03", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  const pReady = path.join(artifactDir, "36-customer-ready-at-table.png");
  await page.screenshot({ path: pReady });
  fs.copyFileSync(pReady, path.join(docsDir, "36-customer-ready-at-table.png"));
  console.log("Captured 36-customer-ready-at-table.png");

  await browser.close();
  console.log("All Customer Self-Order captures completed successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
