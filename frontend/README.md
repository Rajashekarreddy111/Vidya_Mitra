# VidyaMitra Frontend

React + Vite frontend integrated with the VidyaMitra Node.js backend.

## Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Run Frontend

```bash
npm install
npm run dev
```

Default frontend URL: `http://localhost:8080` (or Vite-assigned local port).

## Full App Run (Frontend + Backend)

1. In `backend`, configure `.env` with:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `JWT_SECRET`
   - `GOOGLE_API_KEY` (Gemini)
   - `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `YOUTUBE_API_KEY`
2. Start backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

