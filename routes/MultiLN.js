const express = require("express");
const router = express.Router();
const MultiLNController = require("../controllers/MultiLNController");
const AuthManager = require("../middleware/AuthManager");

router.post(
    "/savedb",
    AuthManager.authSession,
    MultiLNController.SaveMultiLNDB
);
router.get("/showcust", MultiLNController.ShowDataUser);
router.post("/tolog", MultiLNController.SendToLog);

module.exports = router;
