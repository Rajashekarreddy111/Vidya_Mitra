// Quiz controller: generate quiz, evaluate answers, and keep history
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { extractJsonFromText } = require("../utils/aiParser");
const { generateGeminiText } = require("../utils/geminiRequest");

const toLetter = (value) => {
  const str = String(value || "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(str)) return str;

  const n = Number(str);
  if (!Number.isNaN(n) && n >= 1 && n <= 4) {
    return String.fromCharCode(64 + n);
  }
  return "";
};

const normalizeQuiz = (payload, fallbackTopic, fallbackCount) => {
  const topic = String(payload?.topic || fallbackTopic || "").trim() || "General";
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];

  const normalized = questions
    .map((item, index) => {
      const optionsRaw = Array.isArray(item?.options) ? item.options : [];
      const options = optionsRaw.slice(0, 4).map((opt) => String(opt ?? "").trim()).filter(Boolean);
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }

      let correctAnswer = toLetter(item?.correctAnswer);
      if (!correctAnswer && item?.correctAnswer) {
        const byOptionText = options.findIndex(
          (opt) => opt.toLowerCase() === String(item.correctAnswer).trim().toLowerCase()
        );
        if (byOptionText !== -1) {
          correctAnswer = String.fromCharCode(65 + byOptionText);
        }
      }
      if (!correctAnswer) correctAnswer = "A";

      return {
        question: String(item?.question || `Question ${index + 1}`).trim(),
        options,
        correctAnswer,
        explanation: String(item?.explanation || "No explanation provided").trim(),
      };
    })
    .filter((q) => q.question);

  if (normalized.length === 0) {
    return null;
  }

  return {
    topic,
    questions: normalized.slice(0, Number(fallbackCount) || normalized.length),
  };
};

const buildFallbackQuiz = (topic, numQuestions) => {
  const total = Math.min(Math.max(Number(numQuestions) || 5, 3), 15);
  const questions = Array.from({ length: total }).map((_, index) => {
    const n = index + 1;
    return {
      question: `Which statement best describes core concept ${n} in ${topic}?`,
      options: [
        `A practical definition of concept ${n}`,
        `An unrelated idea from another domain`,
        `A partially correct but incomplete explanation`,
        `A common misconception about concept ${n}`,
      ],
      correctAnswer: "A",
      explanation: `Option A is correct because it reflects the core definition and practical use of concept ${n}.`,
    };
  });

  return { topic, questions };
};

const generateQuizWithGemini = async (topic, numQuestions) => {
  const prompt = `
Create a high quality multiple choice quiz with ${numQuestions} questions on the topic "${topic}". The quiz should start from basic concepts and gradually include intermediate and advanced questions suitable for job preparation.

Questions must be clear practical and relevant to real world understanding. Provide 4 meaningful options for each question. Ensure only one correct answer. Provide a short explanation that teaches the concept.

Return JSON only in this format:
{
  "topic": "${topic}",
  "questions": [
    {
      "question": "text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "short explanation"
    }
  ]
}

Requirements
Mix easy medium and hard questions.
Avoid duplicate or vague questions.
Focus on conceptual understanding and practical knowledge.`;

  const strictPrompt = `${prompt}

Strict output rules:
- Output valid JSON only, no markdown code fences.
- Do not include any text before or after JSON.
- "questions" must be an array with exactly ${numQuestions} items.
- "correctAnswer" must be one of: "A", "B", "C", "D".`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const text = await generateGeminiText(attempt === 0 ? prompt : strictPrompt);
    const parsed = extractJsonFromText(text);
    const normalized = normalizeQuiz(parsed, topic, numQuestions);
    if (normalized && Array.isArray(normalized.questions) && normalized.questions.length > 0) {
      return normalized;
    }
  }

  // Graceful fallback so UI does not fail when provider returns malformed output.
  return buildFallbackQuiz(topic, numQuestions);
};

const normalizeAnswer = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim().toUpperCase();
};

const evaluateQuizLocally = (quizJson, answers) => {
  const questions = Array.isArray(quizJson?.questions) ? quizJson.questions : [];
  const totalQuestions = questions.length;

  // Supports:
  // 1) ["A", "B", "C"]
  // 2) [{ questionIndex: 0, selectedAnswer: "A" }]
  const answerMap = {};
  answers.forEach((item, index) => {
    if (typeof item === "object" && item !== null) {
      const qIndex = Number(item.questionIndex ?? item.index);
      if (!Number.isNaN(qIndex)) {
        answerMap[qIndex] = item.selectedAnswer ?? item.answer ?? "";
      }
    } else {
      answerMap[index] = item;
    }
  });

  const details = questions.map((question, index) => {
    const studentAnswer = normalizeAnswer(answerMap[index]);
    const correctAnswer = normalizeAnswer(question.correctAnswer);
    const isCorrect = studentAnswer !== "" && studentAnswer === correctAnswer;

    return {
      question: question.question,
      studentAnswer,
      correctAnswer,
      isCorrect,
      explanation: question.explanation || "No explanation provided",
    };
  });

  const correctCount = details.filter((item) => item.isCorrect).length;
  const percentage = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let summary = "Keep practicing regularly.";
  if (percentage >= 80) summary = "Great performance. Continue with advanced topics.";
  else if (percentage >= 60) summary = "Good attempt. Revise weak topics and try again.";
  else summary = "Focus on basics first and reattempt the quiz.";

  return {
    score: correctCount,
    totalQuestions,
    percentage,
    details,
    summary,
  };
};

const getQuizPayloadFromRow = (quizRow) => {
  if (!quizRow) return null;
  if (quizRow.quiz_json && typeof quizRow.quiz_json === "object") return quizRow.quiz_json;

  // Legacy schema compatibility: some databases store quiz content under `questions`.
  if (quizRow.questions) {
    if (Array.isArray(quizRow.questions)) {
      return { topic: quizRow.topic || "General", questions: quizRow.questions };
    }
    if (typeof quizRow.questions === "object") {
      return quizRow.questions;
    }
  }
  return null;
};

const insertQuizRecord = async (userId, topic, quizJson) => {
  const candidates = [
    {
      user_id: userId,
      topic: quizJson.topic || topic,
      questions: quizJson.questions,
      quiz_json: quizJson,
    },
    {
      user_id: userId,
      topic: quizJson.topic || topic,
      questions: quizJson.questions,
    },
    {
      user_id: userId,
      topic: quizJson.topic || topic,
      quiz_json: quizJson,
    },
  ];

  let lastError = null;
  for (const payload of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase.from("quizzes").insert([payload]).select("*").single();
    if (!error && data) return data;
    lastError = error;
  }

  throw new Error(lastError?.message || "Failed to create quiz");
};

const generateQuiz = asyncHandler(async (req, res) => {
  const { topic, numQuestions = 5 } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "topic is required" });
  }

  const quizJson = await generateQuizWithGemini(topic, Number(numQuestions));

  const quiz = await insertQuizRecord(req.user.id, topic, quizJson);

  res.status(201).json({
    message: "Quiz generated successfully",
    quizId: quiz.id,
    quiz: quizJson,
  });
});

const evaluateQuiz = asyncHandler(async (req, res) => {
  const { quizId, answers } = req.body;
  if (!quizId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "quizId and answers array are required" });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (quizError) throw new Error(quizError.message);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const quizPayload = getQuizPayloadFromRow(quiz);
  if (!quizPayload) {
    return res.status(500).json({ message: "Stored quiz data is invalid" });
  }

  const evaluation = evaluateQuizLocally(quizPayload, answers);

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert([
      {
        quiz_id: quiz.id,
        user_id: req.user.id,
        score: evaluation.percentage || 0,
        result_json: evaluation,
      },
    ])
    .select("*")
    .single();

  if (attemptError) throw new Error(attemptError.message);

  res.json({
    message: "Quiz evaluated successfully",
    attempt,
    evaluation,
  });
});

const getQuizHistory = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, score, created_at, result_json, quizzes!inner(id, topic, quiz_json, questions)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const history = (data || []).map((attempt) => {
    const quizPayload = getQuizPayloadFromRow(attempt.quizzes);
    const resultDetails = Array.isArray(attempt?.result_json?.details) ? attempt.result_json.details : [];

    const questions = (quizPayload?.questions || []).map((question, index) => {
      const detail = resultDetails[index] || {};
      return {
        question: question.question || detail.question || `Question ${index + 1}`,
        options: Array.isArray(question.options) ? question.options : [],
        yourAnswer: normalizeAnswer(detail.studentAnswer),
        correctAnswer: normalizeAnswer(detail.correctAnswer || question.correctAnswer),
        isCorrect: Boolean(detail.isCorrect),
        explanation: detail.explanation || question.explanation || "No explanation provided",
      };
    });

    return {
      id: attempt.id,
      created_at: attempt.created_at,
      score: attempt.score,
      topic: attempt?.quizzes?.topic || quizPayload?.topic || "General",
      quizId: attempt?.quizzes?.id || null,
      questions,
    };
  });

  res.json({ history });
});

module.exports = { generateQuiz, evaluateQuiz, getQuizHistory };
