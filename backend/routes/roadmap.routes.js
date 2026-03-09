// Roadmap routes
const express = require("express");
const {
  generateRoadmap,
  getMyRoadmaps,
  updateTopicCompletion,
} = require("../controllers/roadmap.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { roadmapSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/generate", protect, validate(roadmapSchemas.generate), generateRoadmap);
router.get("/me", protect, getMyRoadmaps);
router.patch("/topic/:topicId", protect, validate(roadmapSchemas.updateTopic), updateTopicCompletion);

module.exports = router;
