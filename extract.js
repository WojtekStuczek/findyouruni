import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const publicPhotoDir = path.join(process.cwd(), 'public', 'photo');

if (!fs.existsSync(publicPhotoDir)) {
  fs.mkdirSync(publicPhotoDir, { recursive: true });
}

const files = fs.readdirSync(process.cwd());
const zipFiles = files.filter(f => f.endsWith('.zip'));

for (const zipFile of zipFiles) {
  console.log(`Extracting ${zipFile}...`);
  const zip = new AdmZip(zipFile);
  
  zip.getEntries().forEach(entry => {
    if (!entry.isDirectory) {
      // Extract file directly to publicPhotoDir without subdirectories
      const fileName = path.basename(entry.entryName);
      const destPath = path.join(publicPhotoDir, fileName);
      
      // Read file content
      const content = zip.readFile(entry);
      if (content) {
        fs.writeFileSync(destPath, content);
      }
    }
  });
}

console.log('Extraction complete.');
