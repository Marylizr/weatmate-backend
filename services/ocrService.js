const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractTextFromPDF = async (filePath) => {
  if (!filePath) {
    throw new Error("PDF file path is required.");
  }

  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return data?.text || "";
};

const extractText = async (file) => {
  if (!file) {
    return "";
  }

  const filePath = file.path;
  const mimeType = file.mimetype || "";

  if (mimeType === "application/pdf") {
    return extractTextFromPDF(filePath);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};

module.exports = {
  extractText,
  extractTextFromPDF,
};
