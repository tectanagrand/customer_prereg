const express = require("express");
const router = express.Router();
const LoadNote = require("../controllers/LoadingNoteController");

router.post("/save", LoadNote.SaveLoadingNoteDB);
router.post("/pushsap", LoadNote.SubmitSAP);
router.get("/", LoadNote.showAll);
router.get("/id", LoadNote.getById);

module.exports = router;
