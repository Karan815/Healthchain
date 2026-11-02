// middleware/errorHandler.js
// Central error handler — catches errors thrown anywhere in the app

const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  // Handle Multer-specific errors (file size, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File is too large. Maximum allowed size is 50MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }

  // Handle our custom file type validation error
  if (err.message && err.message.startsWith("❌ Invalid file type")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Generic / unexpected server errors
  return res.status(500).json({
    success: false,
    error: err.message || "An unexpected error occurred.",
  });
};

module.exports = errorHandler;