# VidyaMitra Backend

Simple beginner-friendly backend using Node.js, Express, Supabase, Groq AI, Brevo, Cloudinary, and YouTube Data API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and fill all keys.
   - For AI, set `GROQ_API_KEY` (required).
   - Optional overrides: `GROQ_MODEL`, `GROQ_API_URL`, `GROQ_TIMEOUT_MS`.
3. Run SQL from `sql/supabase_schema.sql` in Supabase SQL editor.
4. Start server:
   ```bash
   npm run dev
   ```

## Folder Structure

```
backend/
  server.js
  config/
  controllers/
  middleware/
  routes/
  utils/
  sql/
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (protected)
- `POST /api/auth/logout` (protected)

### Resume
- `POST /api/resume/upload` (protected, form-data key: `resume`, optional `resumeText`)
- `GET /api/resume/me` (protected)

### Roadmap
- `POST /api/roadmap/generate` (protected)
- `GET /api/roadmap/me` (protected)
- `PATCH /api/roadmap/topic/:topicId` (protected)

### Quiz
- `POST /api/quiz/generate` (protected)
- `POST /api/quiz/evaluate` (protected)
- `GET /api/quiz/history` (protected)

### Interview
- `POST /api/interview/generate` (protected)
- `POST /api/interview/evaluate` (protected)
- `GET /api/interview/history` (protected)

### Progress
- `GET /api/progress/dashboard` (protected)

### YouTube
- `GET /api/youtube/search?topic=...` (protected)

### Company Preparation
- `POST /api/company-preparation/search` (protected)
