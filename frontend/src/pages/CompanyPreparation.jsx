import { useEffect, useState } from "react";
import { Building2, Search, ListChecks, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../lib/api";
import "../styles/pages/CompanyPreparation.css";

const toArray = (value) => (Array.isArray(value) ? value : []);

const CompanyPreparation = () => {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const data = await api.companyPreparation.history();
      setHistory(toArray(data?.history));
    } catch (_error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onSearch = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name.");
      return;
    }

    try {
      setLoading(true);
      const data = await api.companyPreparation.search({ companyName: companyName.trim() });
      setResult(data?.data || null);
      loadHistory();
    } catch (error) {
      toast.error(error.message || "Failed to fetch company preparation data");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = (item) => {
    setCompanyName(item?.companyName || "");
    setResult(item?.data || null);
  };

  return (
    <DashboardLayout title="Company Preparation">
      <div className="page-header">
        <h1>Company Preparation</h1>
        <p>Search a company to view likely interview questions and hiring process stages.</p>
      </div>

      <div className="card company-search-card">
        <div className="company-search-row">
          <input
            placeholder="e.g. Google, Microsoft, Infosys"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button className="btn-primary" onClick={onSearch} disabled={loading}>
            <Search size={16} />
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card company-search-card" style={{ marginTop: 12 }}>
          <h3 style={{ marginBottom: 10 }}>Recent Company Preparation</h3>
          {history.slice(0, 8).map((item) => (
            <button
              key={item.id}
              type="button"
              className="btn-primary"
              style={{ marginRight: 8, marginBottom: 8, backgroundColor: "#eef2ff", color: "#1e3a8a" }}
              onClick={() => viewHistory(item)}
            >
              {item.companyName}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="company-results-grid">
          <div className="card company-section-card">
            <div className="company-section-header">
              <Building2 size={18} />
              <h3>{result.companyName || companyName}</h3>
            </div>
            <p className="company-hint">Results are compiled from internet sources and normalized for preparation.</p>
          </div>

          <div className="card company-section-card">
            <div className="company-section-header">
              <FileQuestion size={18} />
              <h3>Model Interview Questions</h3>
            </div>
            <ul className="company-list">
              {toArray(result.interviewQuestions).map((item, index) => (
                <li key={`q-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="card company-section-card">
            <div className="company-section-header">
              <ListChecks size={18} />
              <h3>Selection Process / Hiring Stages</h3>
            </div>
            <ol className="company-list company-list-ordered">
              {toArray(result.selectionProcess).map((item, index) => (
                <li key={`s-${index}`}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="card company-section-card">
            <div className="company-section-header">
              <Search size={18} />
              <h3>Internet Sources</h3>
            </div>
            <ul className="company-sources">
              {toArray(result.sources).map((source, index) => (
                <li key={`src-${index}`}>
                  <a href={source?.url} target="_blank" rel="noopener noreferrer">
                    {source?.title || source?.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CompanyPreparation;
