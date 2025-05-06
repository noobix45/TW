const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputFolder = "../../../../../temp";  // Your folder with images
const outputFolder = "../../../../../rez";         // Output folder

const squareSize = 386;                   // For square images
const rectWidth = 386, rectHeight = 513;  // For rectangular images

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

fs.readdir(inputFolder, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        const inputPath = path.join(inputFolder, file);
        const outputPath = path.join(outputFolder, file);

        sharp(inputPath)
            .metadata()
            .then(meta => {
                const aspectRatio = meta.width / meta.height;

                if (Math.abs(aspectRatio - 1) < 0.1) {
                    // 🟨 Square-ish images
                    return sharp(inputPath)
                        .resize({
                            width: squareSize,
                            height: squareSize,
                            fit: "contain", // 👈 No cropping
                            background: { r: 255, g: 255, b: 255, alpha: 1 } // white padding
                        })
                        .toFile(outputPath);
                } else {
                    // 🟦 Rectangular (taller) images
                    return sharp(inputPath)
                        .resize({
                            width: rectWidth,
                            height: rectHeight,
                            fit: "contain", // 👈 No cropping
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        })
                        .toFile(outputPath);
                }
            })
            .then(() => {
                console.log(`✅ Resized ${file}`);
            })
            .catch(err => {
                console.error(`❌ Failed to resize ${file}:`, err.message);
            });
    });
});
