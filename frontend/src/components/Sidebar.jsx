import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Map, HelpCircle, BarChart3, Mic, GraduationCap, User, Building2 } from "lucide-react";
import "../styles/components/Layout.css";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/quiz", label: "Quiz", icon: HelpCircle },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/interview", label: "Interview", icon: Mic },
  { to: "/company-preparation", label: "Company Preparation", icon: Building2 },
  { to: "/profile", label: "Profile", icon: User },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <GraduationCap size={28} />
        <h2>VidyaMitra</h2>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;



