const { extractText } = require("./ocrService");
const { parseMedicalText } = require("./aiMedicalParser");

exports.processMedicalFile = async (file) => {
  const text = await extractText({
    filePath: file.path,
    buffer: file.buffer,
    mimetype: file.mimetype,
  });

  const parsed = await parseMedicalText(text);

  return parsed;
};
