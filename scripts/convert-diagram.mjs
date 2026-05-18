import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const htmlPath = args[0] ? path.resolve(process.cwd(), args[0]) : path.resolve(__dirname, '../public/img/blog/fonasa-mle-architecture.html');
const pngPath = args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(__dirname, '../public/img/blog/fonasa-mle-mcp.png');

async function convert() {
  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    // Extraer el SVG del HTML generado por la skill architecture-diagram
    const svgMatch = htmlContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
    
    if (!svgMatch) {
      throw new Error("No se encontró una etiqueta <svg> en el archivo HTML");
    }

    const svgBuffer = Buffer.from(svgMatch[0]);

    await sharp(svgBuffer)
      .resize(1200, 630, { 
        fit: 'contain',
        background: { r: 2, g: 6, b: 23, alpha: 1 } // Fondo var(--bg) Slate-950
      })
      .png()
      .toFile(pngPath);
      
    console.log('✅ Diagrama convertido a PNG exitosamente usando sharp');
  } catch (err) {
    console.error('❌ Error convirtiendo imagen:', err);
  }
}

convert();
