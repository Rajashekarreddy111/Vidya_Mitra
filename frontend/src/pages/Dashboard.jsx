import DashboardLayout from "../components/DashboardLayout";
import { Link } from "react-router-dom";
import { FileText, Map, HelpCircle, BarChart3, Mic, ArrowRight } from "lucide-react";
import "../styles/pages/Dashboard.css";

const features = [
  { to: "/resume", label: "Resume Analysis", desc: "Upload and analyze your resume", icon: FileText, color: "#ecfdf5", iconColor: "#065f46" },
  { to: "/roadmap", label: "Career Roadmap", desc: "Generate learning roadmaps", icon: Map, color: "#fffbeb", iconColor: "#92400e" },
  { to: "/quiz", label: "Topic Quiz", desc: "Test your knowledge", icon: HelpCircle, color: "#eff6ff", iconColor: "#1e40af" },
  { to: "/progress", label: "Progress", desc: "Track your learning", icon: BarChart3, color: "#f5f3ff", iconColor: "#5b21b6" },
  { to: "/interview", label: "Mock Interview", desc: "Practice interviews", icon: Mic, color: "#fff1f2", iconColor: "#9f1239" },
];

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="page-header">
        <h1>Welcome to VidyaMitra 👋</h1>
        <p>Your AI-powered career guidance companion</p>
      </div>

      <div className="card-grid">
        {features.map((f) => (
          <Link key={f.to} to={f.to} style={{ textDecoration: "none" }}>
            <div className="card feature-card">
              <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: f.color }}>
                  <f.icon size={22} style={{ color: f.iconColor }} />
                </div>
                <div className="card-info">
                  <h3>{f.label}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
              <div className="card-footer">
                Open <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
