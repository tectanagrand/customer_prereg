const MasterController = require("../controllers/MasterController");
const express = require("express");
const router = express.Router();

router.get("/comp", MasterController.getComp);
router.get("/driver", MasterController.getDriver);
router.get("/truck", MasterController.getTruck);
router.get("/do", MasterController.getSOData);
router.get("/cust", MasterController.getDataCustDB);
router.get("/oscust", MasterController.getOSDataCust);
router.get("/oscustwb", MasterController.getOSDataCustWB);
router.get("/sloc", MasterController.getDataSLoc);
router.get("/valtype", MasterController.getDataValTypeDB);
router.get("/dolist", MasterController.getDataDOList);
router.get("/seedcust", MasterController.seedDataCust);
router.get("/vhcl", MasterController.getVehicleDataDB);
router.get("/drvr", MasterController.getDriverDataDB);
router.get("/city", MasterController.getDataCities);
router.get("/plt", MasterController.getCompanyPlant);
router.get("/mediatp", MasterController.getMediaTP);

module.exports = router;
