import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const htmlPath = args[0] ? path.resolve(process.cwd(), args[0]) : path.resolve(__dirname, '../public/img/blog/fonasa-mle-architecture.html');
const pngPath = args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(__dirname, '../public/img/blog/fonasa-mle-mcp.png');

async function convert() {
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Error: El archivo HTML no existe en la ruta: ${htmlPath}`);
    process.exit(1);
  }

  let browser;
  try {
    console.log(`⏳ Convirtiendo ${path.basename(htmlPath)} a PNG con Puppeteer...`);
    
    // Iniciar browser en modo headless
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Setear viewport al tamaño exacto de OpenGraph (1200x630)
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 }); // ScaleFactor 2 para mayor nitidez
    
    // Cargar el HTML como file URL
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Esperar un poco extra para asegurarse que las fuentes web (JetBrains Mono) carguen
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sacar pantallazo
    await page.screenshot({ 
      path: pngPath,
      type: 'png'
    });
      
    console.log(`✅ Diagrama convertido a PNG exitosamente usando Puppeteer: ${path.basename(pngPath)}`);
  } catch (err) {
    console.error('❌ Error convirtiendo imagen:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

convert();