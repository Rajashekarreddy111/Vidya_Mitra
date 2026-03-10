// Entry point of VidyaMitra backend
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
dotenv.config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth.routes");
const resumeRoutes = require("./routes/resume.routes");
const roadmapRoutes = require("./routes/roadmap.routes");
const quizRoutes = require("./routes/quiz.routes");
const interviewRoutes = require("./routes/interview.routes");
const progressRoutes = require("./routes/progress.routes");
const youtubeRoutes = require("./routes/youtube.routes");
const companyPreparationRoutes = require("./routes/companyPreparation.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
const defaultCorsOrigins = ["http://localhost:5173", "http://localhost:8080", "https://vidya-mitra-knd6.onrender.com"];
const envCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = Array.from(new Set([...defaultCorsOrigins, ...envCorsOrigins]));
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (localhostRegex.test(origin)) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "VidyaMitra backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/company-preparation", companyPreparationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
