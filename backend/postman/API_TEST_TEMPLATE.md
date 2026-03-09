# VidyaMitra API Test Template (Fill and Test in Postman)

Base URL:
`http://localhost:5000/api`

Use this header for protected APIs:
`Authorization: Bearer <PASTE_JWT_TOKEN>`

---

## 1) Auth APIs

### Register User
- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Body (raw JSON):
```json
{
  "name": "YOUR_NAME",
  "email": "YOUR_EMAIL",
  "password": "YOUR_PASSWORD"
}
```

### Verify OTP
- Method: `POST`
- URL: `http://localhost:5000/api/auth/verify-otp`
- Body:
```json
{
  "email": "YOUR_EMAIL",
  "otp": "OTP_FROM_EMAIL"
}
```

### Login
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Body:
```json
{
  "email": "YOUR_EMAIL",
  "password": "YOUR_PASSWORD"
}
```

### Get Me (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/auth/me`

### Forgot Password
- Method: `POST`
- URL: `http://localhost:5000/api/auth/forgot-password`
- Body:
```json
{
  "email": "YOUR_EMAIL"
}
```

### Reset Password
- Method: `POST`
- URL: `http://localhost:5000/api/auth/reset-password`
- Body:
```json
{
  "email": "YOUR_EMAIL",
  "otp": "RESET_OTP_FROM_EMAIL",
  "newPassword": "YOUR_NEW_PASSWORD"
}
```

---

## 2) Resume APIs

### Upload Resume (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/resume/upload`
- Body type: `form-data`
- Fields:
  - `resume` (File)
  - `resumeText` (Text, optional)

### Get My Resumes (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/resume/me`

---

## 3) Roadmap APIs

### Generate Roadmap (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/roadmap/generate`
- Body:
```json
{
  "jobRole": "Backend Developer"
}
```

### Get My Roadmaps (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/roadmap/me`

### Update Topic Completion (Protected)
- Method: `PATCH`
- URL: `http://localhost:5000/api/roadmap/topic/TOPIC_ID_HERE`
- Body:
```json
{
  "isCompleted": true
}
```

---

## 4) Quiz APIs

### Generate Quiz (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/quiz/generate`
- Body:
```json
{
  "topic": "JavaScript Basics",
  "numQuestions": 5
}
```

### Evaluate Quiz (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/quiz/evaluate`
- Body:
```json
{
  "quizId": "QUIZ_ID_HERE",
  "answers": ["A", "B", "C", "D", "A"]
}
```

### Get Quiz History (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/quiz/history`

---

## 5) Interview APIs

### Generate Interview Questions (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/interview/generate`
- Body:
```json
{
  "jobRole": "Backend Developer",
  "type": "technical"
}
```

### Evaluate Interview Answers (Protected)
- Method: `POST`
- URL: `http://localhost:5000/api/interview/evaluate`
- Body:
```json
{
  "interviewId": "INTERVIEW_ID_HERE",
  "answers": [
    { "questionIndex": 0, "answer": "Sample answer 1" },
    { "questionIndex": 1, "answer": "Sample answer 2" }
  ]
}
```

### Get Interview History (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/interview/history`

---

## 6) Progress API

### Get Dashboard Analytics (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/progress/dashboard`

---

## 7) YouTube API

### Search Learning Videos (Protected)
- Method: `GET`
- URL: `http://localhost:5000/api/youtube/search?topic=Node.js%20authentication`

