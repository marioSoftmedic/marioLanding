import fs from 'fs';
import sharp from 'sharp';

async function run() {
    try {
        const svgBuffer = fs.readFileSync('/Users/marioinostroza/Desktop/05_Archivos_Temporales/ocr-routing-arquitectura-examya.svg');
        await sharp(svgBuffer).resize(1200, 630).png().toFile('/Users/marioinostroza/Desktop/05_Archivos_Temporales/ocr-routing-arquitectura-examya.png');
        console.log('Conversion done successfully.');
    } catch(err) {
        console.error('Error during conversion:', err);
    }
}
run();