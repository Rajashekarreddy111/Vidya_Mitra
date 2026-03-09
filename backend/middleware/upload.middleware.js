// Multer setup for accepting resume files in memory
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExts = new Set([".pdf", ".txt", ".doc", ".docx"]);
  const isGenericMimeDoc = file.mimetype === "application/octet-stream" && allowedExts.has(ext);

  if (allowed.includes(file.mimetype) || isGenericMimeDoc) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
