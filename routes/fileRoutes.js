// routes/fileRoutes.js
// Maps HTTP endpoints to controller functions

const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const {
  uploadFile,
  listFiles,
  deleteFile,
  getSignedFileUrl,
} = require("../controllers/fileController");

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /upload
// Upload a single file (field name must be "file" in the form-data)
// upload.single("file") runs first → validates & stores file in memory
// then uploadFile() sends it to S3
router.post("/upload", upload.single("file"), uploadFile);

// GET /files
// Returns a list of all files in the bucket
router.get("/files", listFiles);

// DELETE /file/:key
// Deletes the file with the given key from S3
// Example: DELETE /file/1713800000000-a1b2c3d4.jpg
router.delete("/file/:key", deleteFile);

// GET /file/:key
// Returns a signed (temporary) URL for viewing or downloading the file
// Example: GET /file/1713800000000-a1b2c3d4.jpg
router.get("/file/:key", getSignedFileUrl);

module.exports = router;