const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an experienced clinical pathologist. Your task is to analyze laboratory test reports and generate a "Clinical Significance" section.

Guidelines:
- Write in clear, simple medical language (understandable by doctors and patients)
- Do NOT give a final diagnosis
- Highlight abnormal values first
- Explain what each abnormal parameter may indicate
- If all values are normal, clearly state that
- Keep it concise (5-8 lines max)
- Avoid unnecessary medical jargon
- Do NOT mention reference ranges again in output
- Use a professional and reassuring tone

Output Format (use these exact headings):
Summary:
Key Findings:
Possible Clinical Indications:
Recommendation:`;

/**
 * Build the user prompt from report data
 */
function buildUserPrompt(testName, parameters) {
  const paramLines = parameters
    .filter((p) => p.value != null && p.value !== "")
    .map((p) => {
      const parts = [`- ${p.name}: ${p.value}`];
      if (p.unit) parts.push(p.unit);
      if (p.referenceRange) parts.push(`(Ref: ${p.referenceRange})`);
      if (p.status && p.status !== "normal") parts.push(`[${p.status.toUpperCase()}]`);
      return parts.join(" ");
    })
    .join("\n");

  return `Test Name: ${testName}\n\nParameters:\n${paramLines}`;
}

/**
 * Generate clinical significance interpretation using OpenAI
 * @param {string} testName - Name of the test(s)
 * @param {Array} parameters - Array of { name, value, unit, referenceRange, status }
 * @returns {Promise<{summary: string, keyFindings: string, clinicalIndications: string, recommendation: string, raw: string}>}
 */
async function generateInterpretation(testName, parameters) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Please set it in your .env file.");
  }

  const userPrompt = buildUserPrompt(testName, parameters);

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content || "";

  // Parse structured output
  const sections = {
    summary: "",
    keyFindings: "",
    clinicalIndications: "",
    recommendation: "",
  };

  const lines = raw.split("\n");
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith("summary:")) {
      currentSection = "summary";
      sections.summary = trimmed.replace(/^summary:\s*/i, "");
    } else if (lower.startsWith("key findings:")) {
      currentSection = "keyFindings";
      sections.keyFindings = trimmed.replace(/^key findings:\s*/i, "");
    } else if (lower.startsWith("possible clinical indications:")) {
      currentSection = "clinicalIndications";
      sections.clinicalIndications = trimmed.replace(/^possible clinical indications:\s*/i, "");
    } else if (lower.startsWith("recommendation:")) {
      currentSection = "recommendation";
      sections.recommendation = trimmed.replace(/^recommendation:\s*/i, "");
    } else if (currentSection && trimmed) {
      sections[currentSection] += (sections[currentSection] ? " " : "") + trimmed;
    }
  }

  return {
    ...sections,
    raw,
    model: completion.model,
    tokens: completion.usage?.total_tokens || 0,
  };
}

module.exports = {
  generateInterpretation,
};
