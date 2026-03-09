// Gemini API setup
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(apiKey);
const geminiModel = genAI.getGenerativeModel({ model: modelName });

module.exports = geminiModel;
