import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem", color: "var(--primary-color)" }}>404</h1>
        <p style={{ fontSize: "1.25rem", color: "var(--secondary-color)", marginBottom: "2rem" }}>Oops! Page not found</p>
        <Link to="/" style={{ fontSize: "1rem", fontWeight: 600, color: "var(--primary-color)", textDecoration: "underline" }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
