const express = require("express");
const router = express.Router();
const AuthManager = require("../middleware/AuthManager");
const TollingController = require("../controllers/TollingController");

router.get("/stotol", TollingController.getSTOTolling);
router.get("/", TollingController.AllTollReq);
router.get("/id", TollingController.GetById);
router.get("/tesgentol", TollingController.TestTollingGen);
router.post("/deletereq", TollingController.DeleteByCust);
router.post(
    "/savetol",
    AuthManager.authSession,
    TollingController.SaveRequestTolling
);
router.post("/osreq", TollingController.GetOSReqTolling);
router.get("/ossto", TollingController.GetOSSTOTolling);
router.get("/oscust", TollingController.GetOSCustTolling);
router.post("/approvetol", TollingController.ApproveTollingReq);
router.post("/getprint", TollingController.GetPrintTolling);
router.post("/getprintv2", TollingController.GetPrintTollingv2);
router.post("/print", TollingController.PrintTolling);
router.post("/printv2", TollingController.PrintTollingv2);
router.post("/reqdeltol", TollingController.ReqDeleteLNTol);
router.post("/apprreqdel", TollingController.ProcessDeleteReq);
router.get("/createdtol", TollingController.ShowCreatedLN);
router.get("/synctolwbnet", TollingController.SyncTollingWBNET);

module.exports = router;
