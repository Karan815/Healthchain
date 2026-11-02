// middleware/upload.js
// Multer handles multipart/form-data (file uploads) before they reach our controller

const multer = require("multer");

// ── File type validation ──────────────────────────────────────────────────────
// Only allow specific image and video formats
const ALLOWED_MIME_TYPES = [
  "image/jpeg",  // .jpg / .jpeg
  "image/png",   // .png
  "video/mp4",   // .mp4
  "video/quicktime", // .mov
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file with a descriptive error
    cb(
      new Error(
        `❌ Invalid file type: "${file.mimetype}". Allowed types: jpg, png, mp4, mov`
      ),
      false
    );
  }
};

// ── Storage: keep file in memory (buffer), not on disk ───────────────────────
// We use memoryStorage because we send the file directly to S3
// without saving it to the server's hard drive first
const storage = multer.memoryStorage();

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB in bytes
  },
});

module.exports = upload;