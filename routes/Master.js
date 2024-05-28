const MasterController = require("../controllers/MasterController");
const express = require("express");
const router = express.Router();

router.get("/comp", MasterController.getComp);
router.get("/driver", MasterController.getDriver2);
router.get("/truck", MasterController.getTruck2);
router.get("/do", MasterController.getSOData);
router.get("/cust", MasterController.getDataCustDB);
router.get("/ven", MasterController.getDataVenDB);
router.get("/oscust", MasterController.getOSDataCust);
router.get("/oscustwb", MasterController.getOSDataCustWB);
router.get("/sloc", MasterController.getDataSLoc);
router.get("/valtype", MasterController.getDataValTypeDB);
router.get("/dolist", MasterController.getDataDOList);
router.get("/frcdolist", MasterController.getDataDOFrc);
router.get("/stolist", MasterController.getDataSTOList);
router.get("/seedcust", MasterController.seedDataCust);
router.get("/seedven", MasterController.seedDataVen);
router.get("/updatecust", MasterController.upDataCust);
router.get("/updateven", MasterController.upDataVen);
router.get("/vhcl", MasterController.getVehicleDataDB);
router.get("/drvr", MasterController.getDriverDataDB);
router.get("/city", MasterController.getDataCities);
router.get("/plt", MasterController.getCompanyPlant);
router.get("/mediatp", MasterController.getMediaTP);
router.get("/checksto", MasterController.getSTOData);

module.exports = router;
