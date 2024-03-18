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
router.get("/", LoadNote.showAll);
router.get("/id", LoadNote.getById);
router.get("/sloc", LoadNote.showSLoc);

module.exports = router;
