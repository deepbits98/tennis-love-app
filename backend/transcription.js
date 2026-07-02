const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Swap this function only when moving to Sarvam AI later
async function transcribeAudio(filePath) {
  const response = await openai.audio.translations.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    // Always translates to English regardless of spoken language
  });
  return response.text;
}

module.exports = { transcribeAudio };
