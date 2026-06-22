import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../public/img/blog/convenios-b2b-salud-base-datos-carrusel.html');
const pdfPath = path.resolve('/Users/marioinostroza/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/_raw/carruseles/2026-06-19-convenios-b2b-salud-base-datos.pdf');

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
    displayHeaderFooter: false, // EXPLICITAMENTE FALSE
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }
  });

  await browser.close();
  console.log('PDF generado exitosamente sin headers en:', pdfPath);
}

exportPDF().catch(console.error);
