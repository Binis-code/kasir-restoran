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

  console.log("1. Navigating to Home (Kasir)...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Kasir Full Sidebar
  const pKasir = path.join(artifactDir, "25-kasir-full-sidebar.png");
  await page.screenshot({ path: pKasir });
  fs.copyFileSync(pKasir, path.join(docsDir, "25-kasir-full-sidebar.png"));
  console.log("Captured 25-kasir-full-sidebar.png");

  // Open QuickSwitchRoleModal
  console.log("2. Opening QuickSwitchRoleModal...");
  const switchBtns = await page.$$("button");
  for (const b of switchBtns) {
    const title = await page.evaluate((el) => el.getAttribute("title"), b);
    if (title && (title.includes("ganti peran") || title.includes("ganti staf") || title.includes("Login sebagai"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));

  // Type digit '2' on keypad
  const numBtns = await page.$$("button");
  for (const b of numBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "2") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));

  const pModal = path.join(artifactDir, "21-ganti-peran-modal.png");
  await page.screenshot({ path: pModal });
  fs.copyFileSync(pModal, path.join(docsDir, "21-ganti-peran-modal.png"));
  console.log("Captured 21-ganti-peran-modal.png");

  // Click on "Budi" shortcut to switch directly to Pelayan
  console.log("3. Switching to Pelayan...");
  const quickBtns = await page.$$("button");
  for (const b of quickBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Budi") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Pelayan Focus Mode
  const pPelayan = path.join(artifactDir, "22-pelayan-focus-mode.png");
  await page.screenshot({ path: pPelayan });
  fs.copyFileSync(pPelayan, path.join(docsDir, "22-pelayan-focus-mode.png"));
  console.log("Captured 22-pelayan-focus-mode.png");

  // Switch to Dapur
  console.log("4. Switching to Dapur (KDS)...");
  const pinBtns1 = await page.$$("button");
  for (const b of pinBtns1) {
    const title = await page.evaluate((el) => el.getAttribute("title"), b);
    if (title && (title.includes("ganti akun") || title.includes("ganti staf"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  const chefBtns = await page.$$("button");
  for (const b of chefBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Chef") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Dapur Focus Mode
  const pDapur = path.join(artifactDir, "23-dapur-focus-mode.png");
  await page.screenshot({ path: pDapur });
  fs.copyFileSync(pDapur, path.join(docsDir, "23-dapur-focus-mode.png"));
  console.log("Captured 23-dapur-focus-mode.png");

  // Switch to Manajer
  console.log("5. Switching to Manajer...");
  const pinBtns2 = await page.$$("button");
  for (const b of pinBtns2) {
    const title = await page.evaluate((el) => el.getAttribute("title"), b);
    if (title && (title.includes("ganti akun") || title.includes("ganti staf"))) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  const hendraBtns = await page.$$("button");
  for (const b of hendraBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Hendra") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Manajer Sidebar
  const pManajer = path.join(artifactDir, "24-manajer-sidebar.png");
  await page.screenshot({ path: pManajer });
  fs.copyFileSync(pManajer, path.join(docsDir, "24-manajer-sidebar.png"));
  console.log("Captured 24-manajer-sidebar.png");

  // Test Route Guard: Manager tries to open /produk
  console.log("6. Testing RouteGuard on /produk as Manajer...");
  await page.goto("http://localhost:5173/produk", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  const pGuard = path.join(artifactDir, "26-akses-dibatasi-guard.png");
  await page.screenshot({ path: pGuard });
  fs.copyFileSync(pGuard, path.join(docsDir, "26-akses-dibatasi-guard.png"));
  console.log("Captured 26-akses-dibatasi-guard.png");

  // Switch back to Kasir
  console.log("7. Switching back to Kasir...");
  const guardPinBtn = await page.$$("button");
  for (const b of guardPinBtn) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Ganti Staf")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 500));

  const jamieBtns = await page.$$("button");
  for (const b of jamieBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Jamie") {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  await browser.close();
  console.log("All captures completed successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
