import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Map, Sparkles, ChevronDown, ChevronRight, Youtube, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import "../styles/pages/Roadmap.css";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRoadmap = (roadmapRecord) => {
  if (!roadmapRecord) return { role: "", sections: [] };

  const role = roadmapRecord.job_role || roadmapRecord.role || roadmapRecord.roadmap_json?.jobRole || "Career Track";
  const topics = ensureArray(roadmapRecord.roadmap_topics || roadmapRecord.topics);
  const grouped = topics.reduce((acc, topic) => {
    const level = topic.level || "Beginner";
    if (!acc[level]) acc[level] = [];
    acc[level].push({
      id: topic.id,
      name: topic.title || topic.name || "Untitled Topic",
      completed: Boolean(topic.is_completed),
      difficulty: level,
      youtubeUrl: null,
      youtubeLoading: false,
    });
    return acc;
  }, {});

  const sectionOrder = ["Beginner", "Intermediate", "Advanced"];
  const sections = [
    ...sectionOrder.filter((level) => grouped[level]).map((level) => ({ title: `${level} Topics`, expanded: false, topics: grouped[level] })),
    ...Object.keys(grouped)
      .filter((level) => !sectionOrder.includes(level))
      .map((level) => ({ title: `${level} Topics`, expanded: false, topics: grouped[level] })),
  ];

  return { role, sections };
};

const Roadmap = () => {
  const [role, setRole] = useState("");
  const [sections, setSections] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshRoadmap = async () => {
    const data = await api.roadmap.getMine();
    const latest = ensureArray(data?.roadmaps)[0];
    if (!latest) {
      setSections([]);
      setGenerated(false);
      return;
    }
    const normalized = normalizeRoadmap(latest);
    setSections(normalized.sections);
    setRole(normalized.role);
    setGenerated(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refreshRoadmap();
      } catch (_error) {
        // User may not have generated roadmap yet.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchYoutubeForTopic = async (topicName) => {
    const data = await api.youtube.search(topicName);
    return data?.videos?.[0]?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName)}+tutorial`;
  };

  const toggleSection = async (sectionIndex) => {
    const updated = sections.map((s, i) => (i === sectionIndex ? { ...s, expanded: !s.expanded } : s));
    setSections(updated);

    const section = updated[sectionIndex];
    if (!section.expanded) return;

    const missingTopics = section.topics.filter((topic) => !topic.youtubeUrl);
    if (missingTopics.length === 0) return;

    const settled = await Promise.allSettled(
      missingTopics.map(async (topic) => ({
        topicId: topic.id,
        url: await fetchYoutubeForTopic(topic.name),
      }))
    );

    const urlByTopicId = {};
    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        urlByTopicId[result.value.topicId] = result.value.url;
      }
    });

    setSections((prev) =>
      prev.map((s, si) =>
        si === sectionIndex
          ? {
              ...s,
              topics: s.topics.map((t) => (urlByTopicId[t.id] ? { ...t, youtubeUrl: urlByTopicId[t.id] } : t)),
            }
          : s
      )
    );
  };

  const generateRoadmap = async () => {
    if (!role.trim()) return;
    try {
      setLoading(true);
      await api.roadmap.generate({ jobRole: role.trim() });
      await refreshRoadmap();
      toast.success("Roadmap generated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = async (sectionIndex, topicIndex) => {
    const topic = sections[sectionIndex]?.topics?.[topicIndex];
    if (!topic?.id) return;

    const newStatus = !topic.completed;
    setSections((prev) =>
      prev.map((s, si) =>
        si === sectionIndex
          ? {
              ...s,
              topics: s.topics.map((t, ti) => (ti === topicIndex ? { ...t, completed: newStatus } : t)),
            }
          : s
      )
    );

    try {
      await api.roadmap.updateTopic(topic.id, { isCompleted: newStatus });
      if (newStatus) toast.success(`Completed: ${topic.name}`);
    } catch (err) {
      toast.error(err.message || "Failed to update topic");
      setSections((prev) =>
        prev.map((s, si) =>
          si === sectionIndex
            ? {
                ...s,
                topics: s.topics.map((t, ti) => (ti === topicIndex ? { ...t, completed: !newStatus } : t)),
              }
            : s
        )
      );
    }
  };

  const getSectionProgress = (section) => {
    const completed = section.topics.filter((t) => t.completed).length;
    return { completed, total: section.topics.length };
  };

  const getTotalProgress = () => {
    const allTopics = sections.flatMap((s) => s.topics);
    const completed = allTopics.filter((t) => t.completed).length;
    return { completed, total: allTopics.length };
  };

  return (
    <DashboardLayout title="Roadmap">
      <div className="page-header">
        <h1>Career Roadmap</h1>
        <p>Enter a job role to generate a detailed learning roadmap from basics to advanced</p>
      </div>

      <div className="card" style={{ maxWidth: 700, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="e.g. Frontend Developer, Data Scientist"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateRoadmap()}
          />
          <button className="btn-primary" onClick={generateRoadmap} disabled={loading}>
            <Sparkles size={16} />
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {generated && (
        <div className="roadmap-container">
          <div className="card roadmap-header-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Map size={20} style={{ color: "var(--primary-color)" }} />
              <h3 style={{ fontSize: 16 }}>Roadmap for: {role}</h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary-color)" }}>
                {getTotalProgress().completed} / {getTotalProgress().total} completed
              </span>
              <div className="progress-bar-container" style={{ width: 150 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(getTotalProgress().completed / Math.max(getTotalProgress().total, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {sections.map((section, si) => {
            const progress = getSectionProgress(section);
            return (
              <div key={si} className="card section-card">
                <div className="section-header" onClick={() => toggleSection(si)}>
                  <div className="section-title">
                    {section.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h3 style={{ fontSize: 15 }}>{section.title}</h3>
                  </div>
                  <div className="section-progress">
                    <div className="progress-bar-container" style={{ width: 100, marginTop: 0 }}>
                      <div className="progress-bar-fill" style={{ width: `${(progress.completed / Math.max(progress.total, 1)) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--secondary-color)" }}>
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                </div>

                {section.expanded && (
                  <div className="topic-table">
                    <div className="topic-row-header">
                      <span>Status</span>
                      <span>Topic</span>
                      <span style={{ textAlign: "center" }}>Video</span>
                      <span style={{ textAlign: "center" }}>Level</span>
                    </div>

                    {section.topics.map((topic, ti) => (
                      <div key={topic.id || `${si}-${ti}`} className={`topic-row ${topic.completed ? "completed" : ""}`}>
                        <div
                          onClick={() => toggleTopic(si, ti)}
                          style={{ cursor: "pointer", color: topic.completed ? "var(--success-color)" : "var(--border-color)" }}
                        >
                          {topic.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <span className="topic-name">{topic.name}</span>
                        <div className="youtube-link">
                          <a
                            href={topic.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.name)}+tutorial`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Youtube size={18} />
                          </a>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span className={`difficulty-badge badge-${String(topic.difficulty || "Beginner").toLowerCase()}`}>
                            {topic.difficulty || "Beginner"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Roadmap;
