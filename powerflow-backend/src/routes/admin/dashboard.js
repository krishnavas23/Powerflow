const express = require("express");
const router = express.Router();
const { getAdminDashboard } = require("../../controllers/admin/dashboardController");
const auth = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");

router.get("/", auth, requireAdmin, getAdminDashboard);

module.exports = router;
