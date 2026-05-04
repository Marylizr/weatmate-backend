const fs = require("fs");
const path = require("path");

const pdfParseModule = require("pdf-parse");

const resolvePdfParser = () => {
  if (typeof pdfParseModule === "function") {
    return {
      type: "function",
      parser: pdfParseModule,
    };
  }

  if (pdfParseModule && typeof pdfParseModule.default === "function") {
    return {
      type: "function",
      parser: pdfParseModule.default,
    };
  }

  if (pdfParseModule && typeof pdfParseModule.pdfParse === "function") {
    return {
      type: "function",
      parser: pdfParseModule.pdfParse,
    };
  }

  if (pdfParseModule && typeof pdfParseModule.parse === "function") {
    return {
      type: "function",
      parser: pdfParseModule.parse,
    };
  }

  if (pdfParseModule && typeof pdfParseModule.PDFParse === "function") {
    return {
      type: "class",
      parser: pdfParseModule.PDFParse,
    };
  }

  return null;
};

const extractTextFromPDF = async (filePath) => {
  const resolvedParser = resolvePdfParser();

  if (!resolvedParser) {
    throw new Error(
      "PDF parser is not available. Check pdf-parse installation/export.",
    );
  }

  if (!filePath) {
    throw new Error("PDF file path is required.");
  }

  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF file not found: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);

  if (resolvedParser.type === "function") {
    const data = await resolvedParser.parser(buffer);
    return data?.text || "";
  }

  if (resolvedParser.type === "class") {
    const PDFParse = resolvedParser.parser;

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }

    return result?.text || "";
  }

  return "";
};

const extractTextFromImage = async (filePath) => {
  if (!filePath) {
    throw new Error("Image file path is required.");
  }

  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found: ${absolutePath}`);
  }

  return "";
};

const extractText = async ({ filePath, mimetype }) => {
  if (!filePath) {
    throw new Error("filePath is required for text extraction.");
  }

  if (!mimetype) {
    throw new Error("mimetype is required for text extraction.");
  }

  if (mimetype === "application/pdf") {
    return extractTextFromPDF(filePath);
  }

  if (
    mimetype === "image/jpeg" ||
    mimetype === "image/jpg" ||
    mimetype === "image/png" ||
    mimetype === "image/webp"
  ) {
    return extractTextFromImage(filePath);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
};

module.exports = {
  extractText,
  extractTextFromPDF,
  extractTextFromImage,
};
