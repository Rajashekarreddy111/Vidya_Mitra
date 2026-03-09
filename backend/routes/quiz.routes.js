// Quiz routes
const express = require("express");
const { generateQuiz, evaluateQuiz, getQuizHistory } = require("../controllers/quiz.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { quizSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/generate", protect, validate(quizSchemas.generate), generateQuiz);
router.post("/evaluate", protect, validate(quizSchemas.evaluate), evaluateQuiz);
router.get("/history", protect, getQuizHistory);

module.exports = router;
