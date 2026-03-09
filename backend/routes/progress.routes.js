// Progress routes
const express = require("express");
const { getDashboardAnalytics } = require("../controllers/progress.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/dashboard", protect, getDashboardAnalytics);

module.exports = router;
