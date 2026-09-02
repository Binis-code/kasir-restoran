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

  console.log("1. Testing Table QR Matrix Modal in Tables.tsx...");
  await page.goto("http://localhost:5173/meja", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Find and click "QR Meja" button on Meja 01
  const qrButtons = await page.$$("button");
  for (const b of qrButtons) {
    const title = await page.evaluate((el) => el.getAttribute("title") || el.textContent, b);
    if (title && (title.includes("QR Meja") || title.includes("QR"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  const pTableQr = path.join(artifactDir, "37-qr-meja-scannable-matrix.png");
  await page.screenshot({ path: pTableQr });
  fs.copyFileSync(pTableQr, path.join(docsDir, "37-qr-meja-scannable-matrix.png"));
  console.log("Captured 37-qr-meja-scannable-matrix.png");

  // Close modal
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 500));

  console.log("2. Testing Network Hub Modal Wi-Fi QR Codes...");
  // Click "Pair HP" or Network Hub header button
  const headerBtns = await page.$$("button");
  for (const b of headerBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && (text.includes("Pair HP") || text.includes("Server Lokal"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  const pNetwork = path.join(artifactDir, "38-pusat-jaringan-wifi-qr-scannable.png");
  await page.screenshot({ path: pNetwork });
  fs.copyFileSync(pNetwork, path.join(docsDir, "38-pusat-jaringan-wifi-qr-scannable.png"));
  console.log("Captured 38-pusat-jaringan-wifi-qr-scannable.png");

  // Close modal
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 500));

  console.log("3. Testing Customer Self-Order QRIS Modal...");
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/order/meja-01", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Add 1 item
  const addBtns = await page.$$("button");
  for (const b of addBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Tambah") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 500));

  // Open Cart
  const cartBtns = await page.$$("button");
  for (const b of cartBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Lihat Keranjang")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  // Click "Bayar Langsung via QRIS Mandiri"
  const qrisBtns = await page.$$("button");
  for (const b of qrisBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("QRIS Mandiri")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  const pQrisSelf = path.join(artifactDir, "39-qris-mandiri-scannable-matrix.png");
  await page.screenshot({ path: pQrisSelf });
  fs.copyFileSync(pQrisSelf, path.join(docsDir, "39-qris-mandiri-scannable-matrix.png"));
  console.log("Captured 39-qris-mandiri-scannable-matrix.png");

  console.log("4. Testing Cashier POS QRIS Modal...");
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Add 1 item in POS
  const posAddBtns = await page.$$("article");
  if (posAddBtns.length > 0) {
    await posAddBtns[0].click();
  }
  await new Promise((r) => setTimeout(r, 400));

  // Click "Bayar"
  const payBtns = await page.$$("button");
  for (const b of payBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Bayar")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  // Select "QRIS" in payment modal
  const qrisPayBtns = await page.$$("button");
  for (const b of qrisPayBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("QRIS")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  const pPosQris = path.join(artifactDir, "40-kasir-qris-scannable-matrix.png");
  await page.screenshot({ path: pPosQris });
  fs.copyFileSync(pPosQris, path.join(docsDir, "40-kasir-qris-scannable-matrix.png"));
  console.log("Captured 40-kasir-qris-scannable-matrix.png");

  await browser.close();
  console.log("All Scannable Barcode tests completed successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
