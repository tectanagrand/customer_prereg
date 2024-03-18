const express = require("express");
const router = express.Router();
const PageController = require("../controllers/PageController");
const AuthManager = require("../middleware/AuthManager");

router.use("/showall", AuthManager.authSession, PageController.showAll);

module.exports = router;
