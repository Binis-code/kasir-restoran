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
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });

  // Set active staff to Budi in localStorage
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-2"); // Budi Santoso (Pelayan)
  });

  // Navigate to restricted page /laporan
  await page.goto("http://localhost:5173/laporan", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  const pGuard = path.join(artifactDir, "26-akses-dibatasi-guard.png");
  await page.screenshot({ path: pGuard });
  fs.copyFileSync(pGuard, path.join(docsDir, "26-akses-dibatasi-guard.png"));
  console.log("Captured 26-akses-dibatasi-guard.png");

  // Restore active staff to Jamie (Kasir)
  await page.evaluate(() => {
    localStorage.setItem("kasa_current_staff_id_v1", "staff-1");
  });

  await browser.close();
  console.log("Done!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
