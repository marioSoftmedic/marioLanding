import puppeteer from 'puppeteer';
import path from 'path';

const htmlFile = process.argv[2];
const pngFile = process.argv[3];

const htmlPath = path.resolve(htmlFile);
const pngPath = path.resolve(pngFile);

async function exportPNG() {
  console.log('Iniciando Puppeteer para exportar cover 1080x1350...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });

  await browser.close();
  console.log('Cover generado exitosamente en:', pngPath);
}

exportPNG().catch(console.error);
