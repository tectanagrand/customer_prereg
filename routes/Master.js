const MasterController = require("../controllers/MasterController");
const express = require("express");
const router = express.Router();

router.get("/comp", MasterController.getComp);
router.get("/driver", MasterController.getDriver);
router.get("/truck", MasterController.getTruck);
router.get("/do", MasterController.getSOData);
router.get("/cust", MasterController.getDataCustDB);
router.get("/oscust", MasterController.getOSDataCust);
router.get("/sloc", MasterController.getDataSLocDB);
router.get("/valtype", MasterController.getDataValTypeDB);
router.get("/dolist", MasterController.getDataDOList);
router.get("/seedcust", MasterController.seedDataCust);
router.get("/vhcl", MasterController.getVehicleDataDB);

module.exports = router;
