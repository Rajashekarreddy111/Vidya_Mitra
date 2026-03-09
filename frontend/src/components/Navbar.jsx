import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, FileText, Map, HelpCircle, BarChart3, Mic, GraduationCap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles/components/Layout.css";

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <span className="navbar-title">{title}</span>
      <div className="navbar-right">
        <span className="navbar-user">Hi, {user?.name || user?.email}</span>
        <button className="btn-logout" onClick={logout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;



