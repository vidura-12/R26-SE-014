const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");

router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("user", "admin"),
  getProfile
);

router.put(
  "/profile",
  authMiddleware,
  roleMiddleware("user", "admin"),
  updateProfile
);

router.put(
  "/change-password",
  authMiddleware,
  roleMiddleware("user", "admin"),
  changePassword
);

router.delete(
  "/delete-account",
  authMiddleware,
  roleMiddleware("user", "admin"),
  deleteAccount
);

module.exports = router;