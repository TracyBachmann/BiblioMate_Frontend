import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '../src');

// Liste des extensions de fichiers à modifier
const fileExtensions = ['.html', '.ts', '.scss', '.css'];

// Extensions d'images à remplacer
const imageExtensions = ['.jpg', '.jpeg', '.png'];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (fileExtensions.includes(extname(file))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function replaceImagesInFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // Remplacer .jpg, .jpeg, .png par .webp
  imageExtensions.forEach(ext => {
    const regex = new RegExp(`(assets/[^"'\\s]+)\\${ext}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, '$1.webp');
      modified = true;
    }
  });

  // Ajouter loading="lazy" aux images qui ne l'ont pas
  const imgRegex = /<img(?![^>]*loading=)[^>]*>/g;
  if (imgRegex.test(content)) {
    content = content.replace(imgRegex, match => {
      // Éviter de dupliquer loading="lazy"
      if (match.includes('loading=')) return match;
      return match.replace('<img', '<img loading="lazy"');
    });
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modifié: ${filePath.replace(__dirname, '.')}`);
    return 1;
  }

  return 0;
}

console.log('🔄 Remplacement des références d\'images...\n');

const allFiles = getAllFiles(srcDir);
let modifiedCount = 0;

allFiles.forEach(file => {
  modifiedCount += replaceImagesInFile(file);
});

console.log(`\n✨ ${modifiedCount} fichier(s) modifié(s)`);
console.log('📊 Changements effectués:');
console.log('   - .jpg/.jpeg/.png → .webp');
console.log('   - Ajout de loading="lazy" sur toutes les images');
