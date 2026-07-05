const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  "first_serve_pct": "first serve percentage as a number 0-100, or empty — e.g. player says 'got 65% first serves in' → 65",
  "double_faults": "number of double faults as a number, or empty — e.g. 'had 3 double faults' → 3",
  "unforced_errors": "number of unforced errors as a number, or empty — e.g. 'made about 20 unforced errors' → 20",
  "shots_well": "specific shots/strokes that worked well (forehand, backhand, serve, return, volley, smash etc)",
  "mentality_well": "positive mental aspects: focus, composure, pressure handling, confidence, decision-making",
  "physical_well": "positive physical aspects: fitness, speed, movement, stamina, agility",
  "tactics_well": "tactical/strategic positives: game plan, patterns, court positioning, use of angles",
  "shots_improve": "shots/strokes that need improvement — be specific about which shot and why",
  "mentality_improve": "mental aspects to work on: losing focus, nerves, frustration, poor decisions under pressure",
  "physical_improve": "physical aspects to improve: tired quickly, slow feet, late to shots",
  "tactics_improve": "tactical areas to improve: predictable patterns, wrong shot selection, poor positioning",
  "mood_hint": "elated" or "happy" or "okay" or "meh" or "low" or "frustrated" or ""
}
IMPORTANT:
- ALL field values must be in English regardless of what language the player spoke. Translate everything to English.
- For the 8 performance sub-fields: extract ONLY what is clearly stated in that specific area. Do not invent or assume.
- Be concise but specific — "first serve percentage was low" is better than "serve needs work".
- If a field is not mentioned, leave it as empty string.
Return ONLY the JSON object, no explanation.`;
}

async function extractFields(transcript, today = new Date().toISOString().split('T')[0]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: buildPrompt(today) },
      { role: 'user', content: `Transcript: "${transcript}"` },
    ],
  });

  const raw = response.choices[0].message.content.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('JSON parse failed:', e.message, '| raw was:', raw);
    return {};
  }
}

module.exports = { extractFields };
