// YouTube learning routes
const express = require("express");
const { getTopicVideos } = require("../controllers/youtube.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { youtubeSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/search", protect, validate(youtubeSchemas.search), getTopicVideos);

module.exports = router;
