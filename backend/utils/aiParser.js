// Extracts and parses JSON from AI responses.
// Handles common non-strict issues like markdown fences and trailing commas.
const stripCodeFences = (text) =>
  String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

const removeTrailingCommas = (text) => text.replace(/,\s*([}\]])/g, "$1");

const findBalancedJsonObject = (text) => {
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
      if (depth < 0) {
        depth = 0;
        start = -1;
      }
    }
  }

  return null;
};

const tryParse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
};

const extractJsonFromText = (text) => {
  if (!text) return null;

  const cleaned = stripCodeFences(text);

  // 1) Direct parse first.
  const direct = tryParse(cleaned);
  if (direct) return direct;

  // 2) Parse first balanced object from response.
  const objectText = findBalancedJsonObject(cleaned);
  if (!objectText) return null;

  const parsedObject = tryParse(objectText);
  if (parsedObject) return parsedObject;

  // 3) Retry after minimal sanitation (most common model formatting issue).
  const sanitized = removeTrailingCommas(objectText);
  return tryParse(sanitized);
};

module.exports = { extractJsonFromText };
