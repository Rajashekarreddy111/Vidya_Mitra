import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("vidyamitra_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || "Something went wrong";
    const normalizedError = new Error(message);
    normalizedError.status = error?.response?.status;
    return Promise.reject(normalizedError);
  }
);

const unwrap = async (promise) => {
  const response = await promise;
  return response.data;
};

export const api = {
  baseUrl: API_BASE_URL,
  auth: {
    register: (payload) => unwrap(http.post("/api/auth/register", payload)),
    verifyOtp: (payload) => unwrap(http.post("/api/auth/verify-otp", payload)),
    login: (payload) => unwrap(http.post("/api/auth/login", payload)),
    forgotPassword: (payload) => unwrap(http.post("/api/auth/forgot-password", payload)),
    resetPassword: (payload) => unwrap(http.post("/api/auth/reset-password", payload)),
    getMe: () => unwrap(http.get("/api/auth/me")),
    updateMe: (payload) => unwrap(http.patch("/api/auth/me", payload)),
    logout: () => unwrap(http.post("/api/auth/logout")),
  },
  resume: {
    upload: (formData) =>
      unwrap(
        http.post("/api/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ),
    getMyResumes: () => unwrap(http.get("/api/resume/me")),
  },
  roadmap: {
    generate: (payload) => unwrap(http.post("/api/roadmap/generate", payload)),
    getMine: () => unwrap(http.get("/api/roadmap/me")),
    updateTopic: (topicId, payload) => unwrap(http.patch(`/api/roadmap/topic/${topicId}`, payload)),
  },
  quiz: {
    generate: (payload) => unwrap(http.post("/api/quiz/generate", payload)),
    evaluate: (payload) => unwrap(http.post("/api/quiz/evaluate", payload)),
    history: () => unwrap(http.get("/api/quiz/history")),
  },
  interview: {
    generate: (payload) => unwrap(http.post("/api/interview/generate", payload)),
    evaluate: (payload) => unwrap(http.post("/api/interview/evaluate", payload)),
    history: () => unwrap(http.get("/api/interview/history")),
  },
  progress: {
    dashboard: () => unwrap(http.get("/api/progress/dashboard")),
  },
  youtube: {
    search: (topic) => unwrap(http.get("/api/youtube/search", { params: { topic } })),
  },
  companyPreparation: {
    search: (payload) => unwrap(http.post("/api/company-preparation/search", payload)),
    history: () => unwrap(http.get("/api/company-preparation/history")),
  },
};
