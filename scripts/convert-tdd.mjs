import sharp from 'sharp';
import fs from 'fs';

const svgPath = '/Users/marioinostroza/repos/marioLanding_blog/public/diagramas/tdd-agentes-ia.svg';
const pngPath = '/Users/marioinostroza/repos/marioLanding_blog/public/diagramas/tdd-agentes-ia.png';

async function convert() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(1200, 630) // Tamaño estándar para LinkedIn Open Graph
      .extend({
        top: 0, bottom: 0, left: 0, right: 0,
        background: { r: 2, g: 6, b: 23, alpha: 1 } // El fondo Slate-950
      })
      .png()
      .toFile(pngPath);
    console.log('✅ Diagrama TDD convertido a PNG exitosamente');
  } catch (err) {
    console.error('❌ Error convirtiendo imagen:', err);
  }
}

convert();
