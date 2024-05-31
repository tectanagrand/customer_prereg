const express = require("express");
const router = express.Router();
const LoadNote = require("../controllers/LoadingNoteController");
const PDF = require("../controllers/PDFController");
const SubmissionLN = require("../middleware/SubmissionLN");

router.post(
    "/save",
    SubmissionLN.checkSubmitValidity,
    LoadNote.SaveLoadingNoteDB
);
router.post("/pushsap", SubmissionLN.checkSubmitValidity, LoadNote.SubmitSAP);
router.post("/pushmultisap", LoadNote.SubmitSAP_3);
router.post("/cancel", LoadNote.cancelReqLN);
router.get("/", LoadNote.showAll);
router.get("/id", LoadNote.getById);
router.get("/sloc", LoadNote.showSLoc);
router.post("/osreq", LoadNote.showOSReqLN2);
router.get("/osdo", LoadNote.getOSLoadingNoteNum);
router.get("/osdowb", LoadNote.getOSLoadingNoteNumWB);
router.get("/lnuser", LoadNote.getAllDataLNbyUser);
router.get("/lnuserfrc", LoadNote.getAllDataLNbyUserFRC);
router.post("/tolog", LoadNote.sendToLogistic);
router.get("/lastos", LoadNote.getDataOSUser);
router.get("/lastreq", LoadNote.getDataLastReq);
router.get("/recap", LoadNote.getDataRecap);
router.post("/recapss", LoadNote.getDataRecapSS);
router.post("/genxls", LoadNote.generateExcel);
router.post("/pdf", PDF.exportSuratJalan);
router.get("/defslocvtp", LoadNote.getDefValtypeSloc);
router.get("/dash", LoadNote.LoadingNoteDashboard);
router.get("/chartdash", LoadNote.ChartDashboard);
router.get("/syncwb", LoadNote.syncDataWB);
router.get("/cleanln", LoadNote.cleanUpLN);

module.exports = router;
