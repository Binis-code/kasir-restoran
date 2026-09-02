import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function captureTabs() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  const artifactDir = 'C:\\Users\\One Above All\\.gemini\\antigravity-ide\\brain\\dda98174-020c-4654-830d-2545ffe5f6aa';
  const docsDir = 'E:\\CLAUDE CODE\\Kuliner apps\\docs\\images';

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Open Scanner Modal
  const scanBtn = await page.$('button[aria-label="Pindai barcode"]');
  if (scanBtn) await scanBtn.click();
  await new Promise(r => setTimeout(r, 800));

  // Switch to Ketik Manual Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const manualBtn = btns.find(b => b.textContent && b.textContent.includes('Ketik Manual'));
    if (manualBtn) manualBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Type sample code to show preview
  await page.keyboard.type('Kopi Susu');
  await new Promise(r => setTimeout(r, 600));

  const pManual = path.join(artifactDir, '46-barcode-scanner-manual-input.png');
  await page.screenshot({ path: pManual });
  fs.copyFileSync(pManual, path.join(docsDir, '46-barcode-scanner-manual-input.png'));
  console.log('Captured 46-barcode-scanner-manual-input.png');

  // Switch to Unggah Foto Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const uploadBtn = btns.find(b => b.textContent && b.textContent.includes('Unggah Foto'));
    if (uploadBtn) uploadBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const pUpload = path.join(artifactDir, '47-barcode-scanner-upload-tab.png');
  await page.screenshot({ path: pUpload });
  fs.copyFileSync(pUpload, path.join(docsDir, '47-barcode-scanner-upload-tab.png'));
  console.log('Captured 47-barcode-scanner-upload-tab.png');

  await browser.close();
}
captureTabs().catch(console.error);
