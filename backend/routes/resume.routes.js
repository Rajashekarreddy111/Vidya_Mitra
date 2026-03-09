// Resume routes
const express = require("express");
const { uploadResume, getMyResumes } = require("../controllers/resume.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

const parseResumeUpload = (req, res, next) => {
  upload.single("resume")(req, res, (error) => {
    if (error) return next(error);
    return next();
  });
};

router.post("/upload", protect, parseResumeUpload, uploadResume);
router.get("/me", protect, getMyResumes);

module.exports = router;
