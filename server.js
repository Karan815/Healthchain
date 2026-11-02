// server.js
// Entry point — sets up Express and starts the server

require("dotenv").config(); // Load .env variables first

const express = require("express");
const cors = require("cors");

const app = express(); // ✅ Create app FIRST

// ✅ Enable CORS (VERY IMPORTANT for frontend)
app.use(cors());

// Import routes and middleware
const fileRoutes = require("./routes/fileRoutes");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data (non-file fields)
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "✅ S3 Media API is running!",
    endpoints: {
      upload: "POST   /api/files/upload",
      list: "GET    /api/files/files",
      delete: "DELETE /api/files/file/:key",
      getUrl: "GET    /api/files/file/:key",
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/files", fileRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route "${req.method} ${req.path}" not found.`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 S3 Bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
  console.log(`🌍 Region:    ${process.env.AWS_REGION}\n`);
});