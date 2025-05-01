const express = require("express");
const router = express.Router();
const MultiLNController = require("../controllers/MultiLNController");
const PDFController = require("../controllers/PDFController");
const AuthManager = require("../middleware/AuthManager");

router.post(
    "/savedb",
    AuthManager.authSession,
    MultiLNController.SaveMultiLNDB
);
router.get("/showcust", MultiLNController.ShowDataUser);
router.get("/id/:id", AuthManager.authSession, MultiLNController.GetReqbyID);
router.post("/tolog", MultiLNController.SendToLog);
router.get("/osreq", MultiLNController.GetOSPushReq);
router.get("/printreq", MultiLNController.GetPrintReq);
router.post(
    "/pushsapmulti",
    AuthManager.authSAP,
    MultiLNController.SubmitPushMultiLN
);
router.post("/exportsj", PDFController.exportSuratJalanMulti);

module.exports = router;
