// Interview controller: question generation and AI answer evaluation
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { extractJsonFromText } = require("../utils/aiParser");
const { generateGeminiText } = require("../utils/geminiRequest");

const generateInterviewQuestionsWithGemini = async (jobRole, type) => {
  const prompt = `
Generate realistic interview questions for the job role "${jobRole}" for the interview type "${type}" where type can be technical or soft skill. Questions must be similar to real interview questions asked by companies and suitable for job preparation.

Include beginner intermediate and advanced level questions. Expected points should clearly describe what a good answer should contain so it can be used for evaluation.

Return JSON only in this format:
{
  "jobRole": "${jobRole}",
  "type": "${type}",
  "questions": [
    {
      "question": "text",
      "expectedPoints": ["point 1", "point 2"]
    }
  ]
}

Requirements
Generate exactly 8 questions.
Ensure questions are practical role specific and non repetitive.
Expected points should help score the user answer easily.
  `;

  const text = await generateGeminiText(prompt);
  const parsed = extractJsonFromText(text);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid interview questions format from Gemini");
  }
  return parsed;
};

const evaluateInterviewAnswersWithGemini = async (interviewJson, answers) => {
  const questions = Array.isArray(interviewJson?.questions) ? interviewJson.questions : [];
  const payload = questions.map((q, index) => ({
    question: q?.question || "",
    expectedPoints: q?.expectedPoints || [],
    candidateAnswer: answers[index] || "",
  }));

  const prompt = `
Evaluate the candidate interview answers for the provided interview questions. Score the answers based on correctness clarity depth communication and relevance to the job role. Compare answers with expected points and judge how well the candidate covered them.

Provide constructive feedback and practical improvement tips for each question. Also provide overall improvement suggestions for the candidate.

Return JSON only in this format:
{
  "score": 0,
  "details": [
    {
      "question": "text",
      "score": 0,
      "feedback": "feedback text",
      "improvementTip": "tip text"
    }
  ],
  "overallTips": ["tip1", "tip2"]
}

Requirements
Total score must be out of 100.
Give realistic scoring and helpful feedback.
Focus on learning and improvement rather than criticism.

Interview data:
${JSON.stringify(payload)}
  `;

  const text = await generateGeminiText(prompt);
  const parsed = extractJsonFromText(text);
  if (!parsed) throw new Error("Invalid interview evaluation format from Gemini");
  return parsed;
};

const insertInterviewAttempt = async (payload) => {
  const attempts = [
    {
      interview_id: payload.interview_id,
      user_id: payload.user_id,
      score: payload.score,
      result_json: payload.result_json,
      submitted_answers: payload.submitted_answers,
    },
    {
      interview_id: payload.interview_id,
      user_id: payload.user_id,
      score: payload.score,
      result_json: payload.result_json,
    },
  ];

  let lastError = null;
  for (const record of attempts) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase.from("interview_attempts").insert([record]).select("*").single();
    if (!error) return data;
    lastError = error;
  }

  throw new Error(lastError?.message || "Failed to save interview attempt");
};

const generateInterviewQuestions = asyncHandler(async (req, res) => {
  const { jobRole, type = "technical" } = req.body;
  if (!jobRole) {
    return res.status(400).json({ message: "jobRole is required" });
  }
  if (!["technical", "soft-skill"].includes(type)) {
    return res.status(400).json({ message: "type must be technical or soft-skill" });
  }

  const interviewJson = await generateInterviewQuestionsWithGemini(jobRole, type);

  const { data: interview, error } = await supabase
    .from("interviews")
    .insert([
      {
        user_id: req.user.id,
        job_role: jobRole,
        interview_type: type,
        interview_json: interviewJson,
      },
    ])
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  res.status(201).json({
    message: "Interview questions generated",
    interviewId: interview.id,
    interview: interviewJson,
  });
});

const evaluateInterviewAnswers = asyncHandler(async (req, res) => {
  const { interviewId, answers } = req.body;
  if (!interviewId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "interviewId and answers are required" });
  }

  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!interview) return res.status(404).json({ message: "Interview not found" });

  const normalizedAnswers = answers.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return item.answer || "";
    return "";
  });

  const evaluation = await evaluateInterviewAnswersWithGemini(interview.interview_json, normalizedAnswers);

  const attempt = await insertInterviewAttempt({
    interview_id: interview.id,
    user_id: req.user.id,
    score: evaluation.score || 0,
    result_json: evaluation,
    submitted_answers: normalizedAnswers,
  });

  res.json({
    message: "Interview answers evaluated",
    attempt,
    evaluation,
  });
});

const getInterviewHistory = asyncHandler(async (req, res) => {
  const selectCandidates = [
    "id, score, created_at, result_json, submitted_answers, interviews!inner(id, job_role, interview_type, interview_json)",
    "id, score, created_at, result_json, interviews!inner(id, job_role, interview_type, interview_json)",
    "id, score, created_at, interviews!inner(id, job_role, interview_type, interview_json)",
  ];

  let data = null;
  let error = null;
  for (const selectText of selectCandidates) {
    // eslint-disable-next-line no-await-in-loop
    const result = await supabase
      .from("interview_attempts")
      .select(selectText)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (!result.error) {
      data = result.data || [];
      error = null;
      break;
    }
    error = result.error;
  }

  if (error) throw new Error(error.message);

  const history = (data || []).map((attempt) => {
    const details = Array.isArray(attempt?.result_json?.details) ? attempt.result_json.details : [];
    const questions = Array.isArray(attempt?.interviews?.interview_json?.questions)
      ? attempt.interviews.interview_json.questions.map((q) => q.question)
      : details.map((item) => item?.question).filter(Boolean);

    const answers = Array.isArray(attempt?.submitted_answers)
      ? attempt.submitted_answers
      : details.map((item) => item?.candidateAnswer || "").filter((item) => item !== "");

    return {
      id: attempt.id,
      score: Number(attempt.score) || Number(attempt?.result_json?.score) || 0,
      created_at: attempt.created_at,
      interviewType: attempt?.interviews?.interview_type || "technical",
      jobRole: attempt?.interviews?.job_role || "General",
      questions,
      answers,
      evaluation: attempt?.result_json || null,
    };
  });

  res.json({ history });
});

module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  getInterviewHistory,
};
