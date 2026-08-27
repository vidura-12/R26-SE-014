const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getAllUsers,
    getAllDetections,
    deleteUser,
    deleteDetection,
    dashboard
} = require("../controllers/adminController");

router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("admin"),
    dashboard
);

router.get(
    "/users",
    authMiddleware,
    roleMiddleware("admin"),
    getAllUsers
);

router.get(
    "/detections",
    authMiddleware,
    roleMiddleware("admin"),
    getAllDetections
);

router.delete(
    "/users/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteUser
);

router.delete(
    "/detections/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteDetection
);

module.exports = router;