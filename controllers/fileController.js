// controllers/fileController.js
// All the business logic for interacting with AWS S3

const {
  PutObjectCommand,    // Upload a file
  ListObjectsV2Command, // List all files
  DeleteObjectCommand, // Delete a file
  GetObjectCommand,    // Get a file (used for signed URL)
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const { s3Client, BUCKET_NAME } = require("../config/s3");

// ── Helper: build a unique file name ─────────────────────────────────────────
// Example: "my photo.jpg" → "1713800000000-a1b2c3d4.jpg"
// Using UUID + timestamp avoids name collisions in the bucket
const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase(); // e.g. ".jpg"
  const uniqueId = uuidv4().split("-")[0];              // short unique string
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
};

// ── 1. POST /upload ───────────────────────────────────────────────────────────
// Uploads a single file to S3
const uploadFile = async (req, res, next) => {
  try {
    // Multer attaches the file to req.file (buffer in memory)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided. Send a file using the "file" field.',
      });
    }

    const { originalname, mimetype, buffer, size } = req.file;

    // Generate a unique key (path/name inside the bucket)
    const key = generateUniqueFileName(originalname);

    // Build the S3 upload command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,              // File name in S3
      Body: buffer,          // File content (raw bytes)
      ContentType: mimetype, // Tells S3 (and browsers) what kind of file this is
    });

    // Send the file to S3
    await s3Client.send(command);

    // Respond with details about the uploaded file
    res.status(201).json({
      success: true,
      message: "File uploaded successfully!",
      data: {
        key,                          // Use this key for delete / signed URL
        originalName: originalname,
        mimeType: mimetype,
        sizeBytes: size,
        sizeMB: (size / (1024 * 1024)).toFixed(2),
      },
    });
  } catch (err) {
    // Pass errors to the central error handler
    next(err);
  }
};

// ── 2. GET /files ─────────────────────────────────────────────────────────────
// Lists all files stored in the S3 bucket
const listFiles = async (req, res, next) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);

    // response.Contents is an array of file metadata objects
    // If the bucket is empty, it may be undefined — default to []
    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      sizeBytes: item.Size,
      sizeMB: (item.Size / (1024 * 1024)).toFixed(2),
      lastModified: item.LastModified,
    }));

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

// ── 3. DELETE /file/:key ──────────────────────────────────────────────────────
// Deletes a single file from S3 by its key
const deleteFile = async (req, res, next) => {
  try {
    // The key comes from the URL parameter, e.g. /file/1713800000000-a1b2c3d4.jpg
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "File key is required.",
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    // Note: S3 returns success even if the key didn't exist — this is expected behaviour
    res.status(200).json({
      success: true,
      message: `File "${key}" deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

// ── 4. GET /file/:key ─────────────────────────────────────────────────────────
// Generates a temporary signed URL to view or download the file
// The URL expires after 60 minutes by default
const getSignedFileUrl = async (req, res, next) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "File key is required.",
      });
    }

    // How long (in seconds) before the signed URL expires
    // 3600 seconds = 1 hour
    const EXPIRY_SECONDS = 3600;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // getSignedUrl creates a time-limited, pre-authenticated URL
    // Anyone with this URL can access the file for the expiry period
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRY_SECONDS,
    });

    res.status(200).json({
      success: true,
      data: {
        key,
        url,
        expiresInMinutes: EXPIRY_SECONDS / 60,
        note: "This URL will expire. Generate a new one if needed.",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile, listFiles, deleteFile, getSignedFileUrl };