const express = require("express");
const FileUploadController = require("../controllers/FileUploadController");
const router = express.Router();

router.post("/stnk", FileUploadController.uploadSTNK);
router.get("/stnk", FileUploadController.getDataSTNK);
router.get("/filestnk", FileUploadController.getFileSTNK);
router.post("/deletestnk", FileUploadController.deleteDataSTNK);
router.post("/sim", FileUploadController.uploadSIM);
router.get("/sim", FileUploadController.getDataSIM);
router.get("/filesim", FileUploadController.getFileSIM);
router.post("/deletesim", FileUploadController.deleteDataSIM);

module.exports = router;
