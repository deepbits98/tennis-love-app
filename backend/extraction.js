const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(today) {
  return `You are a tennis match journal assistant. Today's date is ${today}.
A player has recorded a voice note after a match. The transcript may be in English, Hindi, Marathi, Tamil, or Telugu, or a mix.
Extract the following fields and return ONLY valid JSON with these exact keys:
{
  "match_date": "YYYY-MM-DD or empty — infer from 'today', 'yesterday', 'Monday' etc using today's date",
  "opponent_first": "",
  "opponent_last": "",
  "outcome": "win" or "loss" or "",
  "score": "",
  "city": "",
  "venue": "",
  "surface": "hard" or "clay" or "grass" or "",
  "session_type": "practice" or "tournament" or "",
  "tournament_level": "U-14 or U-16 or U-18 or AITA or ATF or ITF or UTR or TPL or empty",
  "went_well": "",
  "didnt_work": "",
  "mood_hint": "elated" or "happy" or "okay" or "meh" or "low" or "frustrated" or ""
}
IMPORTANT: ALL field values must be in English regardless of what language the player spoke. Translate everything to English.
If a field is not mentioned, leave it as empty string.
Return ONLY the JSON object, no explanation.`;
}

async function extractFields(transcript, today = new Date().toISOString().split('T')[0]) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Transcript: "${transcript}"`,
      },
    ],
    system: buildPrompt(today),
  });

  const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('JSON parse failed:', e.message, '| raw was:', raw);
    return {};
  }
}

module.exports = { extractFields };
