import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { BarChart3, BookOpen, HelpCircle, Mic } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { api } from "../lib/api";
import "../styles/pages/Progress.css";

const toArray = (value) => (Array.isArray(value) ? value : []);

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await api.progress.dashboard();
        setDashboardData(data);
      } catch (_error) {
        setDashboardData({
          roadmapCompletionPercentage: 0,
          totalTopics: 0,
          completedTopics: 0,
          quizScoresHistory: [],
          interviewScoresHistory: [],
        });
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const roadmapProgress = Number(dashboardData?.roadmapCompletionPercentage) || 0;
  const quizHistory = toArray(dashboardData?.quizScoresHistory);
  const interviewHistory = toArray(dashboardData?.interviewScoresHistory);

  const avgQuizScore = useMemo(() => {
    if (quizHistory.length === 0) return 0;
    const total = quizHistory.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    return Math.round(total / quizHistory.length);
  }, [quizHistory]);

  const avgInterviewScore = useMemo(() => {
    if (interviewHistory.length === 0) return 0;
    const total = interviewHistory.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    return Math.round(total / interviewHistory.length);
  }, [interviewHistory]);

  const pieData = [
    { name: "Completed", value: roadmapProgress },
    { name: "Remaining", value: Math.max(0, 100 - roadmapProgress) },
  ];

  const quizChartData = quizHistory.slice(-7).map((item, index) => ({
    name: `Q${index + 1}`,
    score: Math.round(Number(item.score) || 0),
  }));

  const interviewChartData = interviewHistory.slice(-7).map((item, index) => ({
    name: `I${index + 1}`,
    score: Math.round(Number(item.score) || 0),
  }));

  return (
    <DashboardLayout title="Progress">
      <div className="page-header">
        <h1>Your Progress</h1>
        <p>Track your roadmap completion, quiz performance, and interview performance</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen size={22} />
            </div>
            <div className="stat-info">
              <h3>{loading ? "-" : `${roadmapProgress}%`}</h3>
              <p>Roadmap Completion</p>
            </div>
          </div>
          <div className="progress-bar-container" style={{ marginTop: 16 }}>
            <div className="progress-bar-fill" style={{ width: `${roadmapProgress}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <HelpCircle size={22} />
            </div>
            <div className="stat-info">
              <h3>{loading ? "-" : quizHistory.length}</h3>
              <p>Quizzes Taken</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <BarChart3 size={22} />
            </div>
            <div className="stat-info">
              <h3>{loading ? "-" : `${avgQuizScore}%`}</h3>
              <p>Average Quiz Score</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#ffe4e6", color: "#be123c" }}>
              <Mic size={22} />
            </div>
            <div className="stat-info">
              <h3>{loading ? "-" : `${avgInterviewScore}%`}</h3>
              <p>Average Interview Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Roadmap Completion</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  <Cell fill="var(--primary-color)" />
                  <Cell fill="var(--border-color)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Quiz Scores</h3>
          {quizChartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quizChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="score" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ textAlign: "center", padding: 40, color: "var(--secondary-color)" }}>No quiz data yet</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Interview Scores</h3>
        {interviewChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={interviewChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: "center", padding: 40, color: "var(--secondary-color)" }}>No interview data yet</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Progress;

