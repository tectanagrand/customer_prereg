const MasterController = require("../controllers/MasterController");
const express = require("express");
const router = express.Router();

router.get("/comp", MasterController.getComp);
router.get("/driver", MasterController.getDriver);
router.get("/truck", MasterController.getTruck);
router.get("/do", MasterController.getSOData);

module.exports = router;
