const axios = require("axios");
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { extractJsonFromText } = require("../utils/aiParser");
const { generateAIText } = require("../utils/geminiRequest");

const stripHtml = (html) =>
  String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const decodeDuckduckgoUrl = (href) => {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  const match = href.match(/[?&]uddg=([^&]+)/i);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch (_error) {
    return "";
  }
};

const fetchSearchSnippets = async (companyName) => {
  const query = encodeURIComponent(`${companyName} interview questions hiring process`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const html = response?.data || "";
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)];

  return matches.slice(0, 6).map((match, index) => ({
    title: stripHtml(match[2]),
    url: decodeDuckduckgoUrl(match[1]),
    snippet: stripHtml(snippets[index]?.[1] || ""),
  }));
};

const buildFallback = (companyName, sources) => ({
  companyName,
  interviewQuestions: [
    `Tell me about yourself and why you want to join ${companyName}.`,
    `Describe a challenging project you worked on and your impact.`,
    "Explain a technical decision you made and its tradeoffs.",
    "How do you handle deadlines and conflicting priorities?",
    "Walk through a time you handled production/debugging issues.",
  ],
  selectionProcess: [
    "Resume screening",
    "Online assessment / coding or aptitude round",
    "Technical interview round(s)",
    "Behavioral/managerial interview",
    "HR discussion and final offer",
  ],
  sources: (sources || []).map((item) => ({
    title: item.title,
    url: item.url,
  })),
});

const buildPrompt = (companyName, sources) => `
You are a career preparation assistant.

Company: ${companyName}

Use ONLY the source snippets below to generate realistic interview preparation output. Do not invent company-specific claims if not present in sources.

Source data:
${JSON.stringify(sources)}

Return valid JSON only in this exact format:
{
  "companyName": "${companyName}",
  "interviewQuestions": ["question1", "question2", "question3", "question4", "question5"],
  "selectionProcess": ["stage1", "stage2", "stage3", "stage4"],
  "sources": [
    { "title": "source title", "url": "https://..." }
  ]
}

Rules:
- Provide 8 to 12 interviewQuestions.
- Provide 4 to 8 selectionProcess stages.
- Keep questions practical and job-interview style.
- Include at least 3 sources from the input list when available.
`;

const searchCompanyPreparation = asyncHandler(async (req, res) => {
  const companyName = String(req.body.companyName || "").trim();
  if (!companyName) {
    return res.status(400).json({ message: "companyName is required" });
  }

  let sources = [];
  try {
    sources = await fetchSearchSnippets(companyName);
  } catch (_error) {
    sources = [];
  }

  let result = null;
  if (sources.length > 0) {
    try {
      const responseText = await generateAIText(buildPrompt(companyName, sources));
      result = extractJsonFromText(responseText);
    } catch (_error) {
      result = null;
    }
  }

  const payload =
    result &&
    Array.isArray(result.interviewQuestions) &&
    Array.isArray(result.selectionProcess)
      ? {
          companyName: result.companyName || companyName,
          interviewQuestions: result.interviewQuestions,
          selectionProcess: result.selectionProcess,
          sources: Array.isArray(result.sources) ? result.sources : [],
        }
      : buildFallback(companyName, sources);

  const { error: saveError } = await supabase.from("company_preparations").insert([
    {
      user_id: req.user.id,
      company_name: payload.companyName || companyName,
      result_json: payload,
    },
  ]);
  if (saveError) throw new Error(saveError.message);

  res.json({ message: "Company preparation fetched successfully", data: payload });
});

const getCompanyPreparationHistory = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("company_preparations")
    .select("id, company_name, result_json, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const history = (data || []).map((item) => ({
    id: item.id,
    companyName: item.company_name,
    created_at: item.created_at,
    data: item.result_json,
  }));

  res.json({ history });
});

module.exports = { searchCompanyPreparation, getCompanyPreparationHistory };
