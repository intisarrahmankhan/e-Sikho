import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const htmlPath = path.join(root, 'e-shikho-testing-complete-study-sheet.html');
const pdfPath = path.join(root, 'e-shikho-testing-complete-study-sheet.pdf');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
});

await browser.close();

console.log(pdfPath);
