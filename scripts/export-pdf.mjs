import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const htmlFile = process.argv[2];
const pdfFile = process.argv[3];

if (!htmlFile || !pdfFile) {
  console.error("Uso: node export-pdf.mjs <ruta-html> <ruta-pdf>");
  process.exit(1);
}

const htmlPath = path.resolve(htmlFile);
const pdfPath = path.resolve(pdfFile);

async function exportPDF() {
  console.log('Iniciando Puppeteer para exportar PDF limpio...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: pdfPath,
    printBackground: true,
    width: '1080px',
    height: '1350px',
    displayHeaderFooter: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log('PDF generado exitosamente en:', pdfPath);
}

exportPDF().catch(console.error);
