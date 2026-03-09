import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Upload, CheckCircle, AlertTriangle, ThumbsUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import "../styles/pages/Resume.css";

const iconMap = {
  good: { icon: ThumbsUp, color: "var(--success-color)", bg: "#ecfdf5", label: "What's Good" },
  lacking: { icon: AlertTriangle, color: "var(--error-color)", bg: "#fee2e2", label: "What's Lacking" },
  improvement: { icon: Lightbulb, color: "#f59e0b", bg: "#fef3c7", label: "Improvements Needed" },
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeAnalysis = (analysis) => {
  const strengths = toArray(analysis?.strengths || analysis?.good).map((text) => ({ type: "good", text: String(text) }));
  const missingSkills = toArray(analysis?.missingSkills || analysis?.missing_skills || analysis?.lacking).map((text) => ({
    type: "lacking",
    text: String(text),
  }));
  const improvements = toArray(analysis?.improvements || analysis?.suggestions || analysis?.improvement).map((text) => ({
    type: "improvement",
    text: String(text),
  }));
  return [...strengths, ...missingSkills, ...improvements];
};

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestResume, setLatestResume] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);

  const loadResumes = async () => {
    try {
      const data = await api.resume.getMyResumes();
      const allResumes = toArray(data?.resumes);
      setResumeHistory(allResumes);
      const latest = allResumes[0];
      if (latest) {
        setLatestResume(latest);
        setAnalysis(normalizeAnalysis(latest.analysis));
      }
    } catch (_error) {
      // Keep screen usable even if history fails.
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a resume file before analyzing.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", file);
      const uploadData = await api.resume.upload(formData);
      const resume = uploadData?.resume;
      setLatestResume(resume);
      setAnalysis(normalizeAnalysis(resume?.analysis));
      loadResumes();
      setFile(null);
      toast.success("Resume uploaded and analyzed!");
    } catch (err) {
      toast.error(err.message || "Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  const groupedAnalysis = {
    good: analysis.filter((a) => a.type === "good"),
    lacking: analysis.filter((a) => a.type === "lacking"),
    improvement: analysis.filter((a) => a.type === "improvement"),
  };

  const viewResume = (resume) => {
    setLatestResume(resume);
    setAnalysis(normalizeAnalysis(resume?.analysis));
    setFile(null);
  };

  return (
    <DashboardLayout title="Resume">
      <div className="page-header">
        <h1>Resume Analysis</h1>
        <p>Upload your resume to get detailed AI-powered feedback</p>
      </div>

      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <>
          <div className="upload-area" onClick={() => document.getElementById("file-input").click()}>
            <Upload size={36} style={{ color: "var(--primary-color)" }} />
            <p>{file ? file.name : "Click to upload your resume (PDF, DOCX, DOC, TXT)"}</p>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={handleUpload} disabled={loading}>
            <Upload size={16} />
            {loading ? "Uploading..." : "Upload & Analyze"}
          </button>
          {latestResume && (
            <div className="survey-completed" style={{ marginTop: "1rem" }}>
              <CheckCircle size={48} style={{ color: "var(--success-color)", margin: "0 auto 1rem" }} />
              <h3>Latest Resume Analysis</h3>
              <p className="subtitle">{file?.name || latestResume?.filename || latestResume?.resume_url || "Uploaded resume"}</p>
            </div>
          )}
        </>
      </div>

      {resumeHistory.length > 0 && (
        <div className="card" style={{ maxWidth: "600px", margin: "1rem auto 0" }}>
          <h3 style={{ marginBottom: 10 }}>Uploaded Resumes</h3>
          {resumeHistory.slice(0, 10).map((resume) => (
            <div key={resume.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>{resume?.filename || resume?.resume_url || "Resume"}</span>
              <button className="btn-primary" style={{ backgroundColor: "#eef2ff", color: "#1e3a8a" }} onClick={() => viewResume(resume)}>
                View Analysis
              </button>
            </div>
          ))}
        </div>
      )}

      {latestResume && (
        <div className="analysis-group" style={{ maxWidth: "600px", margin: "2rem auto 0" }}>
          {["good", "lacking", "improvement"].map((type) => {
            const config = iconMap[type];
            const items = groupedAnalysis[type];
            const Icon = config.icon;
            return (
              <div className="analysis-card" key={type}>
                <div className="analysis-header">
                  <div className="analysis-icon" style={{ background: config.bg }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <h3>{config.label}</h3>
                </div>
                <ul className="analysis-list">
                  {items.length > 0 ? items.map((item, i) => <li key={i}>{item.text}</li>) : <li>No data available yet.</li>}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ResumeUpload;
