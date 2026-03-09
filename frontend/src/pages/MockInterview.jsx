import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Mic, MicOff, Users, Award, ArrowRight, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import "../styles/pages/Interview.css";

const toArray = (value) => (Array.isArray(value) ? value : []);

const speakText = (text) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
};

const MockInterview = () => {
  const [activeTab, setActiveTab] = useState("technical");
  const [jobRole, setJobRole] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);
  const [interviewId, setInterviewId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const canStartInterview = activeTab === "soft-skill" || jobRole.trim().length > 0;

  const loadHistory = async () => {
    try {
      const data = await api.interview.history();
      setHistory(toArray(data?.history));
    } catch (_error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const startInterview = async () => {
    if (activeTab === "technical" && !jobRole.trim()) {
      toast.error("Please enter a job role first.");
      return;
    }

    try {
      setLoading(true);
      const type = activeTab === "soft-skill" ? "soft-skill" : "technical";
      const roleForApi = activeTab === "soft-skill" ? "General Communication Skills" : jobRole.trim();
      const data = await api.interview.generate({ jobRole: roleForApi, type });
      const generatedQuestions = toArray(data?.interview?.questions).map((item) => item?.question).filter(Boolean);

      if (generatedQuestions.length === 0) {
        throw new Error("Interview generation returned no questions");
      }

      setInterviewId(data?.interviewId || "");
      setQuestions(generatedQuestions);
      setStarted(true);
      setFinished(false);
      setCurrentQ(0);
      setTranscript([]);
      setAllAnswers([]);
      setEvaluation(null);
      toast.success(`${type === "technical" ? "Technical" : "Soft Skill"} interview started!`);
      setTimeout(() => speakText(generatedQuestions[0]), 300);
    } catch (err) {
      toast.error(err.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) setTranscript((prev) => [...prev, finalTranscript]);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const nextQuestion = async () => {
    const answer = transcript.join(" ").trim();
    const updatedAnswers = [...allAnswers, { question: questions[currentQ], answer }];
    setAllAnswers(updatedAnswers);

    if (currentQ < questions.length - 1) {
      const nextIdx = currentQ + 1;
      setCurrentQ(nextIdx);
      setTranscript([]);
      setTimeout(() => speakText(questions[nextIdx]), 200);
      return;
    }

    try {
      setLoading(true);
      stopListening();
      window.speechSynthesis.cancel();
      const data = await api.interview.evaluate({
        interviewId,
        answers: updatedAnswers.map((item) => item.answer || ""),
      });
      setEvaluation(data?.evaluation || null);
      setFinished(true);
      loadHistory();
      toast.success("Interview complete!");
    } catch (err) {
      toast.error(err.message || "Failed to evaluate interview");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setCurrentQ(0);
    setTranscript([]);
    setAllAnswers([]);
    setInterviewId("");
    setQuestions([]);
    setEvaluation(null);
    window.speechSynthesis.cancel();
  };

  const details = toArray(evaluation?.details);
  const totalScore = Number(evaluation?.score) || 0;

  const viewHistory = (item) => {
    const restoredQuestions = toArray(item?.questions);
    const restoredAnswers = toArray(item?.answers).map((answer, index) => ({
      question: restoredQuestions[index] || `Question ${index + 1}`,
      answer: String(answer || ""),
    }));

    setActiveTab(item?.interviewType === "soft-skill" ? "soft-skill" : "technical");
    setJobRole(item?.jobRole || "");
    setStarted(true);
    setFinished(true);
    setCurrentQ(0);
    setTranscript([]);
    setInterviewId(item?.id || "");
    setQuestions(restoredQuestions);
    setAllAnswers(restoredAnswers);
    setEvaluation(item?.evaluation || { score: Number(item?.score) || 0, details: [], overallTips: [] });
    window.speechSynthesis.cancel();
  };

  return (
    <DashboardLayout title="Mock Interview">
      <div className="page-header">
        <h1>Mock Interview</h1>
        <p>Practice with AI-generated role-based interviews</p>
      </div>

      {!started && (
        <div className="interview-tabs">
          <button className={`tab-btn ${activeTab === "technical" ? "active" : ""}`} onClick={() => setActiveTab("technical")}>
            <Mic size={16} /> Technical
          </button>
          <button className={`tab-btn ${activeTab === "soft-skill" ? "active" : ""}`} onClick={() => setActiveTab("soft-skill")}>
            <Users size={16} /> Soft Skills
          </button>
        </div>
      )}

      {!started ? (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="card interview-card" style={{ maxWidth: 600, margin: "0 auto" }}>
            {activeTab === "technical" ? (
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", textAlign: "left", marginBottom: 8 }}>Target Job Role</label>
                <input placeholder="e.g. Frontend Developer" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
              </div>
            ) : null}
            <div className="icon">{activeTab === "technical" ? <Mic size={48} /> : <Users size={48} />}</div>
            <h3>Ready to start?</h3>
            <p style={{ color: "var(--secondary-color)", marginBottom: "2rem" }}>You will get AI-generated interview questions.</p>
            <button className="btn-primary" style={{ margin: "0 auto" }} onClick={startInterview} disabled={!canStartInterview || loading}>
              {loading ? "Starting..." : "Start Interview"}
            </button>
          </div>

          {history.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Recent Interview History</h3>
              {history.slice(0, 6).map((item) => (
                <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>{item?.jobRole || "Interview"}</strong>
                    <span>{Math.round(Number(item?.score) || 0)}/100</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ backgroundColor: "#eef2ff", color: "#1e3a8a" }}
                    onClick={() => viewHistory(item)}
                  >
                    View Full Result
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : finished ? (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="card score-card" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Award size={48} style={{ color: "var(--primary-color)", margin: "0 auto 1rem" }} />
            <h2>{totalScore}/100</h2>
            <p>Overall Performance Score</p>
            <button className="btn-primary" style={{ margin: "1.5rem auto 0" }} onClick={reset}>
              <RotateCcw size={16} /> Try Again
            </button>
          </div>

          <h3 style={{ marginBottom: "1rem" }}>Detailed Feedback</h3>
          {details.map((item, i) => (
            <div className="card" key={i} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>Q{i + 1}. {item?.question || allAnswers[i]?.question}</h4>
                <span className={`feedback-score ${Number(item?.score) >= 70 ? "score-high" : Number(item?.score) >= 40 ? "score-mid" : "score-low"}`}>
                  {Number(item?.score) || 0}/100
                </span>
              </div>
              <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--secondary-color)", marginBottom: 12 }}>
                "{allAnswers[i]?.answer || "No answer recorded"}"
              </p>
              <p style={{ marginBottom: 8 }}><strong>Feedback:</strong> {item?.feedback || "No feedback provided"}</p>
              <p><strong>Improvement Tip:</strong> {item?.improvementTip || "No tip provided"}</p>
            </div>
          ))}

          {toArray(evaluation?.overallTips).length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 8 }}>Overall Improvement Tips</h4>
              <ul style={{ paddingLeft: 18 }}>
                {evaluation.overallTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Question {currentQ + 1} of {questions.length}</span>
              <div className="progress-bar-container" style={{ width: 150, marginTop: 0 }}>
                <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / Math.max(questions.length, 1)) * 100}%` }} />
              </div>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>{questions[currentQ]}</h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn-primary" style={{ backgroundColor: isListening ? "var(--error-color)" : "var(--primary-color)" }} onClick={toggleListening}>
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening ? "Stop Recording" : "Start Recording"}
              </button>
              <button className="btn-primary" style={{ backgroundColor: "#2563eb" }} onClick={nextQuestion} disabled={loading}>
                <ArrowRight size={18} /> {currentQ === questions.length - 1 ? "Finish" : "Next"}
              </button>
              <button className="btn-primary" style={{ backgroundColor: "#f1f5f9", color: "#1e293b" }} onClick={() => speakText(questions[currentQ])}>
                <Volume2 size={18} /> Repeat
              </button>
            </div>
            {isListening && (
              <div className="recording-indicator">
                <div className="pulse-dot" /> Listening...
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: 14, color: "var(--secondary-color)", marginBottom: "1rem" }}>Your Transcript</h3>
            <div className="transcript-area">
              {transcript.length === 0 ? <p style={{ color: "var(--border-color)", fontStyle: "italic" }}>Your speech will appear here...</p> : transcript.map((line, i) => <div className="transcript-line" key={i}>{line}</div>)}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MockInterview;
