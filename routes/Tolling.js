const express = require("express");
const router = express.Router();
const AuthManager = require("../middleware/AuthManager");
const TollingController = require("../controllers/TollingController");

router.get("/stotol", TollingController.getSTOTolling);
router.get("/", TollingController.AllTollReq);
router.get("/id", TollingController.GetById);
router.get("/tesgentol", TollingController.TestTollingGen);
router.post(
    "/savetol",
    AuthManager.authSession,
    TollingController.SaveRequestTolling
);
router.post("/osreq", TollingController.GetOSReqTolling);
router.get("/ossto", TollingController.GetOSSTOTolling);
router.get("/oscust", TollingController.GetOSCustTolling);
router.post("/approvetol", TollingController.ApproveTollingReq);

module.exports = router;
