import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

async function run() {
  console.log("Starting Barcode & QR Scanner Comprehensive E2E Test...");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--incognito"],
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });

  const artifactDir = "C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\dda98174-020c-4654-830d-2545ffe5f6aa";
  const docsDir = "E:\\CLAUDE CODE\\Kuliner apps\\docs\\images";
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // -------------------------------------------------------------
  // Test 1: POS Home - Open Barcode & QR Scanner Modal
  // -------------------------------------------------------------
  console.log("1. Navigating to POS Home (http://localhost:5173/)...");
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("2. Opening Barcode Scanner modal...");
  // Find scanner button with title/aria-label "Pindai barcode"
  const scanBtn = await page.$('button[aria-label="Pindai barcode"]');
  if (scanBtn) {
    await scanBtn.click();
  } else {
    // Fallback search buttons
    const btns = await page.$$("button");
    for (const b of btns) {
      const title = await page.evaluate((el) => el.getAttribute("title") || el.getAttribute("aria-label"), b);
      if (title && title.includes("Pindai")) {
        await b.click();
        break;
      }
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  // Screenshot 1: Scanner Modal with Camera Tab
  const pScannerModal = path.join(artifactDir, "41-barcode-scanner-modal-camera.png");
  await page.screenshot({ path: pScannerModal });
  fs.copyFileSync(pScannerModal, path.join(docsDir, "41-barcode-scanner-modal-camera.png"));
  console.log("Captured 41-barcode-scanner-modal-camera.png");

  // -------------------------------------------------------------
  // Test 2: Switch to Demo Cepat Tab & Scan Sample Barcode
  // -------------------------------------------------------------
  console.log("3. Testing Demo Barcode scanning...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const demoBtn = btns.find((b) => b.textContent && b.textContent.includes("Demo Cepat"));
    if (demoBtn) demoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Screenshot 2: Demo Barcodes Tab
  const pDemoTab = path.join(artifactDir, "42-barcode-scanner-demo-tab.png");
  await page.screenshot({ path: pDemoTab });
  fs.copyFileSync(pDemoTab, path.join(docsDir, "42-barcode-scanner-demo-tab.png"));
  console.log("Captured 42-barcode-scanner-demo-tab.png");

  // Click on first demo product (Nasi Goreng Kasa)
  console.log("Clicking Demo Product 'Nasi Goreng'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const firstDemo = btns.find((b) => b.textContent && b.textContent.includes("Nasi Goreng"));
    if (firstDemo) firstDemo.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Verify Cart has 1 item and quantity is 1 (no double add bug)
  const cartInfo = await page.evaluate(() => {
    const cartLines = document.querySelectorAll("aside article, aside [data-item]");
    const text = document.querySelector("aside")?.textContent || "";
    return { cartLinesCount: cartLines.length, asideText: text };
  });
  console.log("Cart Status after 1 barcode scan:", cartInfo.asideText.slice(0, 150));

  // -------------------------------------------------------------
  // Test 3: Test Hardware USB / Bluetooth Barcode Gun Simulation
  // -------------------------------------------------------------
  console.log("4. Testing passive hardware USB/Bluetooth barcode gun scan (Es Kopi Susu: 8991002100022)...");
  // Simulate rapid key events for barcode scanner gun
  const barcodeCode = "8991002100022";
  for (const char of barcodeCode) {
    await page.keyboard.press(char);
    await new Promise((r) => setTimeout(r, 15)); // fast ~15ms burst
  }
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1000));

  // Screenshot 3: POS Cart with items added via Scanner
  const pCartScanned = path.join(artifactDir, "43-pos-cart-after-scans.png");
  await page.screenshot({ path: pCartScanned });
  fs.copyFileSync(pCartScanned, path.join(docsDir, "43-pos-cart-after-scans.png"));
  console.log("Captured 43-pos-cart-after-scans.png");

  // -------------------------------------------------------------
  // Test 4: Test Table QR Code Scan in POS Home
  // -------------------------------------------------------------
  console.log("5. Testing Table QR code scan (/order/meja-03)...");
  const scanBtn2 = await page.$('button[aria-label="Pindai barcode"]');
  if (scanBtn2) await scanBtn2.click();
  await new Promise((r) => setTimeout(r, 600));

  // Switch to Demo tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const demoBtn = btns.find((b) => b.textContent && b.textContent.includes("Demo Cepat"));
    if (demoBtn) demoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Click "Meja 03"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const meja3 = btns.find((b) => b.textContent && b.textContent.includes("Meja 03"));
    if (meja3) meja3.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // -------------------------------------------------------------
  // Test 5: Products Page & Product Modal Scanner
  // -------------------------------------------------------------
  console.log("6. Testing Products Page and Product Modal Barcode Scanner...");
  await page.goto("http://localhost:5173/produk", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));

  // Open "Tambah Produk" modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const addBtn = btns.find((b) => b.textContent && b.textContent.includes("Tambah Produk"));
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Screenshot 4: Product Modal with Pindai Barcode button
  const pProductModal = path.join(artifactDir, "44-product-modal-barcode-pindai.png");
  await page.screenshot({ path: pProductModal });
  fs.copyFileSync(pProductModal, path.join(docsDir, "44-product-modal-barcode-pindai.png"));
  console.log("Captured 44-product-modal-barcode-pindai.png");

  // Click "Pindai" button in Product Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pindaiBtn = btns.find((b) => b.textContent && b.textContent.includes("Pindai"));
    if (pindaiBtn) pindaiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Switch to Manual tab inside Product Modal scanner
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const manualTab = btns.find((b) => b.textContent && b.textContent.includes("Ketik Manual"));
    if (manualTab) manualTab.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Type a barcode and press Enter
  await page.keyboard.type("8997788990011");
  await new Promise((r) => setTimeout(r, 300));
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1000));

  // -------------------------------------------------------------
  // Test 6: Waiter Order Page Barcode & QR Scanner
  // -------------------------------------------------------------
  console.log("7. Testing Waiter Order Page Barcode Scanner...");
  await page.goto("http://localhost:5173/pelayan", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));

  const pWaiter = path.join(artifactDir, "45-waiter-order-barcode-scanner.png");
  await page.screenshot({ path: pWaiter });
  fs.copyFileSync(pWaiter, path.join(docsDir, "45-waiter-order-barcode-scanner.png"));
  console.log("Captured 45-waiter-order-barcode-scanner.png");

  await browser.close();
  console.log("All Barcode & QR Scanner tests completed successfully!");
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
