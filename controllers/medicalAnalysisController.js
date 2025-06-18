const MedicalAnalysis = require('../models/MedicalAnalysis');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.analyzeMedicalHistory = async (req, res) => {
  const { userId, text, date } = req.body;
  if (!userId || !text || !date) {
    return res.status(400).json({ error: 'userId, text, and date are required.' });
  }

  const prompt = `
      You are a medical assistant. A patient record follows:

      """
      ${text.trim()}
      """

      List any potential health concerns or red flags (e.g. "Possible diabetes", "High blood pressure"), one per line. If none, reply "No concerns detected."
      `;

  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 150,
      temperature: 0.0,
    });

    const raw = completion.data.choices[0].text || '';
    const alerts = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Save record to MongoDB
    const record = await MedicalAnalysis.create({
      userId,
      entryDate: new Date(date),
      text,
      alerts,
    });

    return res.json(record);
  } catch (error) {
    console.error('Medical analysis error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to analyze and save medical history.' });
  }
};
