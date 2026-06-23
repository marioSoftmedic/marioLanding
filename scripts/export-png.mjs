import puppeteer from 'puppeteer';
import path from 'path';

const htmlFile = process.argv[2];
const pngFile = process.argv[3];

if (!htmlFile || !pngFile) {
  console.error("Uso: node export-png.mjs <ruta-html> <ruta-png>");
  process.exit(1);
}

const htmlPath = path.resolve(htmlFile);
const pngPath = path.resolve(pngFile);

async function exportPNG() {
  console.log('Iniciando Puppeteer para exportar PNG...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1200, height: 630 } });

  await browser.close();
  console.log('PNG generado exitosamente en:', pngPath);
}

exportPNG().catch(console.error);
