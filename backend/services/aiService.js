// Gemini AI triage service. Never exposes the API key to the client.
// Returns { category, priority, summary } or throws on failure/timeout.

const VALID_CATEGORIES = ['Billing', 'Technical', 'Account', 'Order', 'Refund', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

async function triageTicket({ subject, description }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY or API_KEY not configured');

  const prompt = `You are a support ticket triage assistant. Analyze the ticket and respond ONLY with a JSON object.
Valid category values: ${VALID_CATEGORIES.join(', ')}
Valid priority values: ${VALID_PRIORITIES.join(', ')}

Ticket subject: ${subject}
Ticket description: ${description}

Respond in this exact JSON format:
{"category": "<one of the categories>", "priority": "<one of the priorities>", "summary": "<one short sentence>"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: controller.signal,
      }
    );

    if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`);

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(' ') ||
      '';

    const parsed = extractJson(text);
    if (!parsed) throw new Error('Could not parse Gemini response');

    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
    const priority = VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';
    const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim().slice(0, 300)
      : 'No summary available.';

    return { category, priority, summary };
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(text) {
  if (!text) return null;
  // Strip code fences and find the first JSON object.
  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

module.exports = { triageTicket };
