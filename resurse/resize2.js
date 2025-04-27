const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputFolder = "./ceva";  // Folderul cu poze deja redimensionate
const outputFolder = "./resized2";         // Folderul pentru poze redimensionate

const targetWidth = 300;                  // Lățimea dorită pentru redimensionare

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

fs.readdir(inputFolder, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        const inputPath = path.join(inputFolder, file);
        const outputPath = path.join(outputFolder, file);

        // Verifică dimensiunea actuală a imaginii și redimensionează doar dacă este necesar
        sharp(inputPath)
            .metadata()
            .then(meta => {
                const aspectRatio = meta.width / meta.height;

                if (meta.width !== targetWidth) {
                    // Dacă lățimea nu este deja 300px, redimensionează imaginea
                    return sharp(inputPath)
                        .resize({ width: targetWidth })  // Menține raportul de aspect
                        .toFile(outputPath);
                } else {
                    // Dacă este deja la dimensiunea dorită, doar copiaza fișierul
                    fs.copyFileSync(inputPath, outputPath);
                    console.log(`✅ Copied ${file} without resizing`);
                }
            })
            .then(() => {
                console.log(`✅ Resized or Copied ${file}`);
            })
            .catch(err => {
                console.error(`❌ Failed to process ${file}:`, err.message);
            });
    });
});
