// scripts/convert-images.mjs
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR = "src/assets/images";
const OUT_DIR = "src/assets/images"; // on réécrit à côté des originaux

const SIZES = [ 640, 1280, 1920 ]; // adapte si besoin

const isRaster = f => /\.(png|jpe?g)$/i.test(f);

const files = (await fs.readdir(SRC_DIR))
  .filter(isRaster);

for (const file of files) {
  const src = path.join(SRC_DIR, file);
  const base = path.parse(file).name;

  for (const w of SIZES) {
    await sharp(src).resize({ width: w }).webp({ quality: 72 })
      .toFile(path.join(OUT_DIR, `${base}-${w}.webp`));
    await sharp(src).resize({ width: w }).avif({ quality: 38, effort: 4 })
      .toFile(path.join(OUT_DIR, `${base}-${w}.avif`));
  }
  console.log(`✔ ${file} → ${base}-{640,1280,1920}.{webp,avif}`);
}
