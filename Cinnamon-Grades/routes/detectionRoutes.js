const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const supabase = require("../config/supabase");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  uploadImage,
  getDetectionHistory,
  getCurrentDetection,
  compareDetection,
} = require("../controllers/detectionController");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload Image
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware("user", "admin"),
  upload.single("image"),
  uploadImage
);

// Detection History
router.get(
  "/history",
  authMiddleware,
  roleMiddleware("user", "admin"),
  getDetectionHistory
);

// Latest Detection
router.get(
  "/current",
  authMiddleware,
  roleMiddleware("user", "admin"),
  getCurrentDetection
);

// Compare Detection
router.get(
  "/compare/:id",
  authMiddleware,
  roleMiddleware("user", "admin"),
  compareDetection
);

module.exports = router;