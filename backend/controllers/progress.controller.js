// Progress controller for dashboard analytics
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [topicsRes, quizRes, interviewRes] = await Promise.all([
    supabase.from("roadmap_topics").select("id, is_completed, roadmaps!inner(user_id)").eq("roadmaps.user_id", userId),
    supabase.from("quiz_attempts").select("id, score, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("interview_attempts").select("id, score, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  if (topicsRes.error) throw new Error(topicsRes.error.message);
  if (quizRes.error) throw new Error(quizRes.error.message);
  if (interviewRes.error) throw new Error(interviewRes.error.message);

  const topics = topicsRes.data || [];
  const quizAttempts = quizRes.data || [];
  const interviewAttempts = interviewRes.data || [];

  const totalTopics = topics?.length || 0;
  const completedTopics = topics?.filter((t) => t.is_completed).length || 0;
  const roadmapCompletionPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  res.json({
    roadmapCompletionPercentage,
    totalTopics,
    completedTopics,
    quizScoresHistory: quizAttempts || [],
    interviewScoresHistory: interviewAttempts || [],
  });
});

module.exports = { getDashboardAnalytics };
