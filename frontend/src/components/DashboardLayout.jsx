import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/pages/Dashboard.css";

const DashboardLayout = ({ title, children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="layout-content">
        <Navbar title={title} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;



