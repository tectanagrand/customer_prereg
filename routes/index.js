const express = require("express");
const router = express.Router();
const User = require("./User");
const Page = require("./Page");
const Master = require("./Master");
const LoadNote = require("./LoadingNote");
const SAPGetter = require("../controllers/SAPGetterController");
const ExcelJS = require("exceljs");

router.use("/api/user", User);
router.use("/api/page", Page);
router.use("/api/master", Master);
router.use("/api/ln", LoadNote);

router.get("/api/oratest", SAPGetter.LoadingNoteSync);

module.exports = router;
