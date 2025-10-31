const path = require('path');
const { execFile } = require('child_process');
const Tesseract = require('tesseract.js');


function convertPdfToImage(pdfPath, outputImagePath) {
  return new Promise((resolve, reject) => {
    const args = ['-jpeg', '-f', '1', '-l', '1', '-scale-to', '1024', pdfPath, outputImagePath];

    // Detectar ruta del ejecutable pdftocairo
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';

    const command = isMac ? '/opt/homebrew/bin/pdftocairo' : 'pdftocairo';

    execFile(command, args, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function extractTextFromScannedPDF(pdfPath) {
  const outputDir = path.dirname(pdfPath);
  const outputImage = path.join(outputDir, 'page');

  await convertPdfToImage(pdfPath, outputImage);

  const result = await Tesseract.recognize(`${outputImage}-1.jpg`, 'eng');
  return result.data.text;
}

module.exports = { extractTextFromScannedPDF };