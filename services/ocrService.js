const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, "eng");
  return result.data.text;
};

const extractTextFromPDF = async (fileBuffer) => {
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(fileBuffer);
  return data.text;
};

const extractText = async ({ filePath, buffer, mimetype }) => {
  if (mimetype === "application/pdf") {
    return extractTextFromPDF(buffer);
  }

  if (mimetype.startsWith("image/")) {
    return extractTextFromImage(filePath);
  }

  throw new Error("Unsupported file type");
};

// =============================
// OCR MAIN ENTRY
// =============================
exports.extractText = async ({ filePath, buffer, mimetype }) => {
  try {
    // =============================
    // PDF → TEXT
    // =============================
    if (mimetype === "application/pdf") {
      const dataBuffer = buffer || fs.readFileSync(filePath);

      const data = await pdfParse(dataBuffer);

      return data.text;
    }

    // =============================
    // IMAGE → OCR
    // =============================
    if (mimetype.startsWith("image/")) {
      const {
        data: { text },
      } = await Tesseract.recognize(filePath || buffer, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return text;
    }

    throw new Error("Unsupported file type");
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract text from file");
  }
};

module.exports = { extractText };
