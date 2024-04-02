const express = require("express");
const FileUploadController = require("../controllers/FileUploadController");
const router = express.Router();

router.post("/stnk", FileUploadController.uploadSTNK);
router.get("/stnk", FileUploadController.getDataSTNK);
router.get("/filestnk", FileUploadController.getFileSTNK);
router.post("/deletestnk", FileUploadController.deleteDataSTNK);

module.exports = router;
