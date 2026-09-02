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

  console.log("1. Starting Multi-Waiter Flow: Waiter 1 (Budi Santoso)...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });

  // Set active staff to Budi Santoso (staff-2)
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-2");
  });

  await page.goto("http://localhost:5173/pelayan", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Budi adds items to Meja 01
  const selectBtns = await page.$$("button");
  let pickedCount = 0;
  for (const b of selectBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Pilih" && pickedCount < 2) {
      await b.click();
      pickedCount++;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Budi sends order to Kitchen
  const sendKitchenBtns = await page.$$("button");
  for (const b of sendKitchenBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Kirim ke Dapur")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Budi's Order screen
  const pBudi = path.join(artifactDir, "27-pelayan-1-budi-pesan.png");
  await page.screenshot({ path: pBudi });
  fs.copyFileSync(pBudi, path.join(docsDir, "27-pelayan-1-budi-pesan.png"));
  console.log("Captured 27-pelayan-1-budi-pesan.png");

  // 2. Switch to Waiter 2 (Siti Rahma - staff-3)
  console.log("2. Switching to Waiter 2 (Siti Rahma)...");
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-3");
  });
  await page.goto("http://localhost:5173/pelayan", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  // Siti selects Meja 02 (Meja 01 shows occupied by Budi)
  const tableBtns = await page.$$("button");
  for (const b of tableBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Meja 02")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));

  // Siti adds items to Meja 02
  const sitiSelectBtns = await page.$$("button");
  let sitiPicked = 0;
  for (const b of sitiSelectBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.trim() === "Pilih" && sitiPicked < 2) {
      await b.click();
      sitiPicked++;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const pSiti = path.join(artifactDir, "28-pelayan-2-siti-terisolasi.png");
  await page.screenshot({ path: pSiti });
  fs.copyFileSync(pSiti, path.join(docsDir, "28-pelayan-2-siti-terisolasi.png"));
  console.log("Captured 28-pelayan-2-siti-terisolasi.png");

  // Siti sends order to Kitchen
  const sendKitchenBtns2 = await page.$$("button");
  for (const b of sendKitchenBtns2) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Kirim ke Dapur")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // 3. Siti checks "Pesanan Saya" (Tab 2)
  console.log("3. Viewing Pesanan Saya...");
  const tabBtns = await page.$$("button");
  for (const b of tabBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Pesanan Saya")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  const pMyOrders = path.join(artifactDir, "29-pesanan-aktif-per-pelayan.png");
  await page.screenshot({ path: pMyOrders });
  fs.copyFileSync(pMyOrders, path.join(docsDir, "29-pesanan-aktif-per-pelayan.png"));
  console.log("Captured 29-pesanan-aktif-per-pelayan.png");

  // 4. View "Denah Meja" (Tab 3)
  console.log("4. Viewing Denah Meja & Pelayan...");
  const tabBtns2 = await page.$$("button");
  for (const b of tabBtns2) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes("Denah Meja")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  const pFloorMap = path.join(artifactDir, "30-denah-meja-multi-pelayan.png");
  await page.screenshot({ path: pFloorMap });
  fs.copyFileSync(pFloorMap, path.join(docsDir, "30-denah-meja-multi-pelayan.png"));
  console.log("Captured 30-denah-meja-multi-pelayan.png");

  // 5. Check Kitchen (KDS) for Multi-Waiter Tickets
  console.log("5. Viewing Kitchen KDS...");
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-5"); // Chef Junaedi
  });
  await page.goto("http://localhost:5173/dapur", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  const pKitchen = path.join(artifactDir, "31-dapur-multi-pelayan-tickets.png");
  await page.screenshot({ path: pKitchen });
  fs.copyFileSync(pKitchen, path.join(docsDir, "31-dapur-multi-pelayan-tickets.png"));
  console.log("Captured 31-dapur-multi-pelayan-tickets.png");

  // 6. Check Kasir (Orders List)
  console.log("6. Viewing Kasir Orders List...");
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-1"); // Jamie Morgan
  });
  await page.goto("http://localhost:5173/pesanan", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  const pOrders = path.join(artifactDir, "32-kasir-daftar-pesanan-pelayan.png");
  await page.screenshot({ path: pOrders });
  fs.copyFileSync(pOrders, path.join(docsDir, "32-kasir-daftar-pesanan-pelayan.png"));
  console.log("Captured 32-kasir-daftar-pesanan-pelayan.png");

  await browser.close();
  console.log("All Multi-Waiter captures completed successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
