import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { HelpCircle, Play, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import "../styles/pages/Quiz.css";

const toArray = (value) => (Array.isArray(value) ? value : []);
const optionLetter = (index) => String.fromCharCode(65 + index);

const normalizeQuizQuestions = (quizData) => {
  const questions = toArray(quizData?.questions);
  return questions.map((q) => ({
    question: q.question || "Question unavailable",
    options: toArray(q.options),
    correctAnswer: String(q.correctAnswer || "").trim().toUpperCase(),
    explanation: q.explanation || "No explanation provided",
  }));
};

const normalizeHistoryToEvaluation = (historyItem) => {
  const historyQuestions = toArray(historyItem?.questions);
  const details = historyQuestions.map((question) => ({
    question: question?.question || "Question unavailable",
    studentAnswer: question?.yourAnswer || "",
    correctAnswer: question?.correctAnswer || "",
    isCorrect: Boolean(question?.isCorrect),
    explanation: question?.explanation || "No explanation provided",
  }));
  const score = details.filter((d) => d.isCorrect).length;
  const totalQuestions = details.length;
  const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

  return {
    score,
    totalQuestions,
    percentage,
    summary: "",
    details,
  };
};

const Quiz = () => {
  const [topic, setTopic] = useState("");
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const data = await api.quiz.history();
      setHistory(toArray(data?.history));
    } catch (_error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const startQuiz = async () => {
    if (!topic.trim()) return;

    try {
      setLoading(true);
      const data = await api.quiz.generate({ topic: topic.trim(), numQuestions: 5 });
      const parsedQuestions = normalizeQuizQuestions(data?.quiz);
      setQuizId(data?.quizId || "");
      setQuestions(parsedQuestions);
      setAnswers({});
      setStarted(true);
      setSubmitted(false);
      setEvaluation(null);
      toast.success(`Quiz started: ${topic}`);
    } catch (err) {
      toast.error(err.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, optIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionLetter(optIndex) }));
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const payloadAnswers = questions.map((_, i) => answers[i] || "");
      const data = await api.quiz.evaluate({
        quizId,
        answers: payloadAnswers,
      });

      const result = data?.evaluation || {};
      const details = toArray(result.details);
      const fallbackScore = details.filter((d) => d.isCorrect).length;
      const totalQuestions = Number(result.totalQuestions) || questions.length;

      setEvaluation({
        percentage: Number(result.percentage) || 0,
        score: Number(result.score) || fallbackScore,
        totalQuestions,
        details,
        summary: result.summary || "",
      });
      setSubmitted(true);
      toast.success(`Quiz completed! Score: ${Number(result.score) || fallbackScore}/${totalQuestions}`);
      loadHistory();
    } catch (err) {
      toast.error(err.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setSubmitted(false);
    setTopic("");
    setAnswers({});
    setEvaluation(null);
    setQuestions([]);
    setQuizId("");
  };

  const viewHistoryAttempt = (item) => {
    const restoredQuestions = toArray(item?.questions).map((q) => ({
      question: q?.question || "Question unavailable",
      options: toArray(q?.options),
      correctAnswer: String(q?.correctAnswer || "").toUpperCase(),
      explanation: q?.explanation || "No explanation provided",
    }));

    setTopic(item?.topic || "Topic");
    setQuizId(item?.quizId || "");
    setQuestions(restoredQuestions);
    setAnswers({});
    setEvaluation(normalizeHistoryToEvaluation(item));
    setStarted(true);
    setSubmitted(true);
  };

  const totalSelected = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <DashboardLayout title="Quiz">
      <div className="page-header">
        <h1>Topic Quiz</h1>
        <p>Test your knowledge on any topic</p>
      </div>

      {!started ? (
        <>
          <div className="card" style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="e.g. JavaScript, React, Python"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startQuiz()}
              />
              <button className="btn-primary" onClick={startQuiz} disabled={loading}>
                <Play size={16} />
                {loading ? "Loading..." : "Start"}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="card" style={{ maxWidth: 700, margin: "1rem auto 0" }}>
              <h3 style={{ marginBottom: "0.75rem" }}>Recent Quiz History</h3>
              {history.slice(0, 5).map((item) => (
                <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <span>{item?.topic || item?.quizzes?.topic || "Topic"}</span>
                    <strong>{Math.round(Number(item.score) || 0)}%</strong>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ marginBottom: 8, backgroundColor: "#eef2ff", color: "#1e3a8a" }}
                    onClick={() => viewHistoryAttempt(item)}
                  >
                    View Full Result
                  </button>
                  {toArray(item?.questions).slice(0, 3).map((question, index) => (
                    <div key={`${item.id}-${index}`} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Q{index + 1}: {question?.question || "Question unavailable"} | Your: {question?.yourAnswer || "-"} | Correct: {question?.correctAnswer || "-"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="quiz-container">
          {submitted ? (
            <>
              <div className="card card-constrained score-card">
                <HelpCircle size={48} style={{ color: "var(--primary-color)" }} />
                <h2>
                  {evaluation?.score}/{evaluation?.totalQuestions}
                </h2>
                <p>
                  You scored {evaluation?.percentage || 0}% on {topic}
                </p>
                {evaluation?.summary && <p style={{ marginTop: 8 }}>{evaluation.summary}</p>}
                <button className="btn-primary" style={{ margin: "1.5rem auto 0" }} onClick={reset}>
                  <RotateCcw size={16} />
                  Try Another Quiz
                </button>
              </div>

              <h3 style={{ margin: "2rem 0 1rem" }}>Answer Review</h3>
              {toArray(evaluation?.details).map((detail, qi) => {
                const isCorrect = Boolean(detail?.isCorrect);
                const question = questions[qi];
                return (
                  <div key={qi} className="quiz-question" style={{ borderLeft: `4px solid ${isCorrect ? "var(--success-color)" : "var(--error-color)"}` }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {isCorrect ? <CheckCircle size={20} style={{ color: "var(--success-color)" }} /> : <XCircle size={20} style={{ color: "var(--error-color)" }} />}
                      <h3 style={{ margin: 0 }}>Q{qi + 1}. {detail?.question || question?.question}</h3>
                    </div>
                    <div className="quiz-options">
                      {toArray(question?.options).map((opt, oi) => {
                        const letter = optionLetter(oi);
                        const isSelected = detail?.studentAnswer === letter;
                        const isCorrectOpt = detail?.correctAnswer === letter;
                        let borderColor = "var(--border-color)";
                        let bgColor = "white";
                        if (isCorrectOpt) {
                          borderColor = "var(--success-color)";
                          bgColor = "#f0fdf4";
                        } else if (isSelected) {
                          borderColor = "var(--error-color)";
                          bgColor = "#fef2f2";
                        }
                        return (
                          <div key={oi} className="quiz-option" style={{ borderColor, backgroundColor: bgColor, cursor: "default" }}>
                            <div className="option-badge">{letter}</div>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    <div className="explanation-box">
                      <strong>Explanation:</strong> {detail?.explanation || question?.explanation}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {questions.map((q, qi) => (
                <div className="quiz-question" key={qi}>
                  <h3>Q{qi + 1}. {q.question}</h3>
                  <div className="quiz-options">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`quiz-option ${answers[qi] === optionLetter(oi) ? "selected" : ""}`} onClick={() => selectAnswer(qi, oi)}>
                        <div className="option-badge">{optionLetter(oi)}</div>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn-primary" style={{ margin: "2rem auto 0", width: "100%" }} onClick={submitQuiz} disabled={totalSelected < questions.length || loading}>
                {loading ? "Submitting..." : "Submit Quiz"}
              </button>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Quiz;
