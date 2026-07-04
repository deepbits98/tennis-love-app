const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildAnalysisPrompt(d) {
  const stat = (val, unit = '') => (val != null && val !== '') ? `${val}${unit}` : 'not recorded';
  return `You are a professional tennis coach analyzing post-match data for a junior competitive player on the Indian AITA circuit.

MATCH DATA:
Outcome: ${d.outcome || 'unknown'} | Score: ${d.score || 'not recorded'}
Surface: ${d.surface || 'unknown'} | Session: ${d.sessionType || 'match'}${d.tournamentLevel ? ` (${d.tournamentLevel})` : ''}
Mood after match: ${d.mood}/100

IN-MATCH STATS:
First serve %: ${stat(d.firstServePct, '%')}
Double faults: ${stat(d.doubleFaults)}
Unforced errors: ${stat(d.unforcedErrors)}

WHAT WENT WELL:
Shots: ${d.wentWellShots || 'not noted'}
Mentality: ${d.wentWellMentality || 'not noted'}
Physicality: ${d.wentWellPhysical || 'not noted'}
Tactics: ${d.wentWellTactics || 'not noted'}

WHAT NEEDS IMPROVEMENT:
Shots: ${d.didntWorkShots || 'not noted'}
Mentality: ${d.didntWorkMentality || 'not noted'}
Physicality: ${d.didntWorkPhysical || 'not noted'}
Tactics: ${d.didntWorkTactics || 'not noted'}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "summary": "2-3 sentence technical summary of this match performance. Be direct and honest.",
  "keyObservations": [
    "Observation 1 — data-driven (e.g. 4 double faults = 1 break of serve on average)",
    "Observation 2",
    "Observation 3"
  ],
  "priorityFixes": [
    { "area": "Short area name", "issue": "Specific technical problem", "fix": "Concrete actionable fix in one sentence" },
    { "area": "...", "issue": "...", "fix": "..." },
    { "area": "...", "issue": "...", "fix": "..." }
  ],
  "drills": [
    { "name": "Drill name", "description": "Step-by-step drill instructions — be specific (targets, reps, court zones)", "duration": "e.g. 15 min", "frequency": "e.g. every session" },
    { "name": "...", "description": "...", "duration": "...", "frequency": "..." },
    { "name": "...", "description": "...", "duration": "...", "frequency": "..." },
    { "name": "...", "description": "...", "duration": "...", "frequency": "..." }
  ],
  "fitness": [
    { "name": "Exercise name", "description": "Exact instructions — why this helps this player specifically", "sets": "e.g. 3 × 30s" },
    { "name": "...", "description": "...", "sets": "..." },
    { "name": "...", "description": "...", "sets": "..." }
  ],
  "tacticalAdjustments": [
    "Specific tactical change 1 with reason",
    "Specific tactical change 2 with reason",
    "Specific tactical change 3 with reason"
  ],
  "weekFocus": "Single most important thing to fix in the next 7 days of practice — one sentence, specific."
}

Coaching rules:
- Flag: first serve % below 55% is critical. Double faults above 3 is costly. Unforced errors above 20 needs attention.
- Be technical: say 'hit to the T on deuce side' not 'aim better'. Say 'low-to-high swing path' not 'fix your forehand'.
- Tailor drills to the surface (clay = heavy spin, net clearance; hard = flat + kick; grass = low bounce, net play).
- Do NOT repeat the same point twice across sections.
- Give exactly 3 priority fixes, 4 drills, 3 fitness items, 3 tactical adjustments.`;
}

async function analyzeMatch(matchData) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: 'Analyze this match.' }],
    system: buildAnalysisPrompt(matchData),
  });

  const text = message.content[0].text;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in analysis response');
  return JSON.parse(text.slice(start, end + 1));
}

module.exports = { analyzeMatch };
