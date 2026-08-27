const express = require("express");
const router = express.Router();

const {
  register,
  login,
} = require("../controllers/authController");

// User Registration
router.post("/register", register);

// User/Admin Login
router.post("/login", login);

module.exports = router;