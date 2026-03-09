// Shared AI request helper using Groq API.
const axios = require("axios");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTextFromResponse = (payload) => {
  const choiceText = payload?.choices?.[0]?.message?.content;
  if (typeof choiceText === "string" && choiceText.trim()) return choiceText.trim();

  const candidates = [
    payload?.response,
    payload?.output_text,
    payload?.output,
    payload?.text,
    payload?.content,
    payload?.result,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
};

const buildGroqError = (error) => {
  const status = error?.response?.status;
  const apiMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "";
  const message = String(apiMessage).toLowerCase();

  const err = new Error("Groq request failed");
  err.statusCode = 503;

  if (status === 401 || message.includes("api key") || message.includes("unauthorized")) {
    err.statusCode = 401;
    err.message = "Groq API key is invalid. Check GROQ_API_KEY in .env.";
    return err;
  }

  if (status === 429 || message.includes("rate limit") || message.includes("quota")) {
    err.message = "Groq quota/rate limit exceeded. Please retry later.";
    return err;
  }

  if (status === 404 || message.includes("model")) {
    err.statusCode = 500;
    err.message = "Configured Groq model is unavailable. Check GROQ_MODEL in .env.";
    return err;
  }

  err.message = "Groq service error. Please try again.";
  return err;
};

const buildRequestBody = (prompt, model) => ({
  model,
  messages: [{ role: "user", content: prompt }],
  temperature: 0.2,
  stream: false,
  max_tokens: 3500,
});

const buildHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

const generateWithGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const apiUrl = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
  const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS) || 45000;

  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is required");
    err.statusCode = 500;
    throw err;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await axios.post(apiUrl, buildRequestBody(prompt, model), {
        headers: buildHeaders(apiKey),
        timeout: timeoutMs,
      });
      const text = getTextFromResponse(response?.data);
      if (!text) {
        const err = new Error("Groq returned empty response");
        err.statusCode = 503;
        throw err;
      }
      return text;
    } catch (error) {
      const status = error?.response?.status;
      if (attempt === 0 && (status === 429 || status >= 500 || !status)) {
        await sleep(3000);
        continue;
      }
      throw buildGroqError(error);
    }
  }

  const err = new Error("Groq service unavailable");
  err.statusCode = 503;
  throw err;
};

const generateGeminiText = async (prompt) => generateWithGroq(prompt);
const generateAIText = async (prompt) => generateWithGroq(prompt);

module.exports = { generateGeminiText, generateAIText };
