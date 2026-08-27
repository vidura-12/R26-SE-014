const Detection = require("../models/Detection");
const { runYOLO } = require("../Services/yoloService");
const fs = require("fs");
const supabase = require("../config/supabase");

// =====================
// Upload Image
// =====================
exports.uploadImage = async (req, res) => {
  try {
   const imagePath = req.file.path;

  const fileName = `${Date.now()}-${req.file.originalname}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(`images/${fileName}`, fs.readFileSync(imagePath), {
      contentType: req.file.mimetype,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrl } = supabase.storage
    .from("uploads")
    .getPublicUrl(`images/${fileName}`);

  // Call YOLO service using temporary file
  const result = await runYOLO(imagePath);

    console.log("JWT User:", req.user);

    // Save to DB
    const newDetection = new Detection({
      userId: req.user.id,

      image: publicUrl.publicUrl,
      status: result.status,
      final_grade: result.final_grade,
      details: result.details,

      market_price_forecast:
        result.market_price_forecast || null,
    });

    console.log("Detection Before Save:");
    console.log(newDetection);

    await newDetection.save();

    console.log("Detection Saved:");
    console.log(newDetection);

    res.json({
      message: "Saved successfully",
      data: result,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message || "Something went wrong",
      raw: error.raw || null,
    });

  }
};

// =====================
// Detection History
// =====================
exports.getDetectionHistory = async (req, res) => {
  try {

    console.log("History User:", req.user);

    const detections = await Detection.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    console.log("History Count:", detections.length);

    res.status(200).json(detections);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Latest Detection
// =====================
exports.getCurrentDetection = async (req, res) => {
  try {

    const detection = await Detection.findOne({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!detection) {
      return res.status(404).json({
        message: "No detections found.",
      });
    }

    res.status(200).json(detection);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Compare Detection
// =====================
exports.compareDetection = async (req, res) => {
  try {

    const latestDetection = await Detection.findOne({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    const selectedDetection = await Detection.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!latestDetection || !selectedDetection) {
      return res.status(404).json({
        message: "Detection not found.",
      });
    }

    res.status(200).json({
      latest: latestDetection,
      selected: selectedDetection,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message,
    });

  }
};