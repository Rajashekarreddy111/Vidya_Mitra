// Global error handlers for not found routes and unexpected errors
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err?.name === "MulterError") {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(statusCode).json({
      message: err.code === "LIMIT_FILE_SIZE" ? "File too large. Max allowed size is 5MB." : err.message,
    });
  }

  if (typeof err?.message === "string" && err.message.includes("Only PDF, DOC, DOCX, and TXT files are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  const statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
};

module.exports = { notFound, errorHandler };
