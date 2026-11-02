// config/s3.js
// This file sets up the connection to AWS S3 using your credentials

const { S3Client } = require("@aws-sdk/client-s3");

// Load environment variables from .env file
require("dotenv").config();

// Validate that all required environment variables are present
const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET_NAME",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1); // Stop the server if config is missing
  }
});

// Create and export the S3 client — this is reused across the whole app
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Export the bucket name so controllers can use it easily
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

module.exports = { s3Client, BUCKET_NAME };