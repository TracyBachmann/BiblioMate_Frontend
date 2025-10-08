import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputDir = join(__dirname, '../src/assets');
const outputDir = join(__dirname, '../src/assets-optimized');

// Créer le dossier de sortie
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log('🖼️  Optimisation des images...');

// Optimiser JPG
await imagemin([`${inputDir}/**/*.{jpg,jpeg}`], {
  destination: outputDir,
  plugins: [
    imageminMozjpeg({ quality: 80 })
  ]
});

// Optimiser PNG
await imagemin([`${inputDir}/**/*.png`], {
  destination: outputDir,
  plugins: [
    imageminPngquant({ quality: [0.6, 0.8] })
  ]
});

// Convertir en WebP (meilleure compression)
await imagemin([`${inputDir}/**/*.{jpg,jpeg,png}`], {
  destination: `${outputDir}/webp`,
  plugins: [
    imageminWebp({ quality: 75 })
  ]
});

console.log('✅ Images optimisées dans src/assets-optimized/');
console.log('📊 Gains estimés : 70-80% de réduction de taille');
