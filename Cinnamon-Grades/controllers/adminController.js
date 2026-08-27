const User = require("../models/User");
const Detection = require("../models/Detection");

// =====================
// Dashboard
// =====================
exports.dashboard = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();

    const totalDetections = await Detection.countDocuments();

    const recentDetections = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email");

    res.status(200).json({
      totalUsers,
      totalDetections,
      recentDetections,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Get All Users
// =====================
exports.getAllUsers = async (req, res) => {
  try {

    const users = await User.find().select("-password");

    res.status(200).json(users);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Get All Detections
// =====================
exports.getAllDetections = async (req, res) => {
  try {

    const detections = await Detection.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(detections);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Delete User
// =====================
exports.deleteUser = async (req, res) => {
  try {

    await Detection.deleteMany({
      userId: req.params.id,
    });

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================
// Delete Detection
// =====================
exports.deleteDetection = async (req, res) => {
  try {

    const detection = await Detection.findByIdAndDelete(req.params.id);

    if (!detection) {
      return res.status(404).json({
        message: "Detection not found",
      });
    }

    res.status(200).json({
      message: "Detection deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};