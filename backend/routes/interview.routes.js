// Interview routes
const express = require("express");
const {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  getInterviewHistory,
} = require("../controllers/interview.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { interviewSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/generate", protect, validate(interviewSchemas.generate), generateInterviewQuestions);
router.post("/evaluate", protect, validate(interviewSchemas.evaluate), evaluateInterviewAnswers);
router.get("/history", protect, getInterviewHistory);

module.exports = router;
