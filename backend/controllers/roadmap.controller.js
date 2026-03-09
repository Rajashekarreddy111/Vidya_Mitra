// Roadmap controller: generate with Gemini, save in DB, fetch and update completion
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { extractJsonFromText } = require("../utils/aiParser");
const { generateGeminiText } = require("../utils/geminiRequest");

const normalizeSubtopics = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeLevel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "beginner") return "Beginner";
  if (normalized === "intermediate") return "Intermediate";
  if (normalized === "advanced") return "Advanced";
  return "Beginner";
};

const normalizeRoadmap = (payload, fallbackRole) => {
  const jobRole = String(payload?.jobRole || fallbackRole || "").trim() || "Career Track";
  const rawTopics = Array.isArray(payload?.topics) ? payload.topics : [];

  const topics = rawTopics
    .map((topic, index) => ({
      title: String(topic?.title || topic?.name || `Topic ${index + 1}`).trim(),
      level: normalizeLevel(topic?.level),
      subtopics: normalizeSubtopics(topic?.subtopics),
    }))
    .filter((topic) => topic.title);

  if (topics.length === 0) return null;
  return { jobRole, topics };
};

const insertRoadmapRecord = async (userId, roadmapData, requestedRole) => {
  const roleValue = roadmapData.jobRole || requestedRole;
  const candidates = [
    {
      user_id: userId,
      role: roleValue,
      job_role: roleValue,
      roadmap_json: roadmapData,
    },
    {
      user_id: userId,
      role: roleValue,
      roadmap_json: roadmapData,
    },
    {
      user_id: userId,
      job_role: roleValue,
      roadmap_json: roadmapData,
    },
  ];

  let lastError = null;
  for (const payload of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase.from("roadmaps").insert([payload]).select("*").single();
    if (!error && data) return data;
    lastError = error;
  }

  throw new Error(lastError?.message || "Failed to create roadmap");
};

const generateRoadmapData = async (jobRole) => {
  const prompt = `
give a structured roadmap for the ${jobRole} role. pin to pin that means each and every topic to learn in detail with pinpoint details to become a java backend developer

Return JSON only in this format:
{
  "jobRole": "${jobRole}",
  "topics": [
   {
      "title": "Topic name",
      "level": "Beginner|Intermediate|Advanced",
      "subtopics": ["sub1", "sub2", "sub3"]
   }
  ]
}

provide at least 50 topics with subtopics and levels. if you can't find 50 topics, provide as many as you can but make sure to cover the role comprehensively.
  `;

  const text = await generateGeminiText(prompt);
  const parsed = extractJsonFromText(text);
  const normalized = normalizeRoadmap(parsed, jobRole);
  if (!normalized || !Array.isArray(normalized.topics) || normalized.topics.length === 0) {
    throw new Error("Gemini returned invalid roadmap format");
  }

  return normalized;
};

const generateRoadmap = asyncHandler(async (req, res) => {
  const { jobRole } = req.body;
  if (!jobRole) {
    return res.status(400).json({ message: "jobRole is required" });
  }

  const roadmapData = await generateRoadmapData(jobRole);

  const roadmap = await insertRoadmapRecord(req.user.id, roadmapData, jobRole);

  const topicsRows = roadmapData.topics.map((topic, index) => ({
    roadmap_id: roadmap.id,
    topic_order: index + 1,
    title: topic.title,
    level: topic.level || "Beginner",
    subtopics: topic.subtopics || [],
    is_completed: false,
  }));

  const { error: topicsError } = await supabase.from("roadmap_topics").insert(topicsRows);
  if (topicsError) {
    throw new Error(topicsError.message);
  }

  res.status(201).json({
    message: "Roadmap generated successfully",
    roadmapId: roadmap.id,
    roadmap: roadmapData,
  });
});

const getMyRoadmaps = asyncHandler(async (req, res) => {
  const { data: roadmaps, error } = await supabase
    .from("roadmaps")
    .select("id, role, job_role, created_at, roadmap_topics(*)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  res.json({ roadmaps });
});

const updateTopicCompletion = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { isCompleted } = req.body;

  if (typeof isCompleted !== "boolean") {
    return res.status(400).json({ message: "isCompleted must be true or false" });
  }

  const { data: topic, error: topicError } = await supabase
    .from("roadmap_topics")
    .select("id, roadmap_id, roadmaps!inner(user_id)")
    .eq("id", topicId)
    .eq("roadmaps.user_id", req.user.id)
    .maybeSingle();

  if (topicError) throw new Error(topicError.message);
  if (!topic) return res.status(404).json({ message: "Topic not found" });

  const { data: updated, error: updateError } = await supabase
    .from("roadmap_topics")
    .update({ is_completed: isCompleted })
    .eq("id", topicId)
    .select("*")
    .single();

  if (updateError) throw new Error(updateError.message);
  res.json({ message: "Topic status updated", topic: updated });
});

module.exports = {
  generateRoadmap,
  getMyRoadmaps,
  updateTopicCompletion,
};
