const express = require("express");
const router = express.Router();
const LoadNote = require("../controllers/LoadingNoteController");
const SubmissionLN = require("../middleware/SubmissionLN");

router.post(
    "/save",
    SubmissionLN.checkSubmitValidity,
    LoadNote.SaveLoadingNoteDB
);
router.post("/pushsap", SubmissionLN.checkSubmitValidity, LoadNote.SubmitSAP);
router.post("/pushmultisap", LoadNote.SubmitSAP_2);
router.get("/", LoadNote.showAll);
router.get("/id", LoadNote.getById);
router.get("/sloc", LoadNote.showSLoc);
router.post("/osreq", LoadNote.showOSReqLN2);
router.get("/osdo", LoadNote.getOSLoadingNoteNum);
router.get("/lnuser", LoadNote.getAllDataLNbyUser);

module.exports = router;
