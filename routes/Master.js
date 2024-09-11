const MasterController = require("../controllers/MasterController");
const express = require("express");
const router = express.Router();

router.get("/comp", MasterController.getComp);
router.get("/driver", MasterController.getDriver2);
router.get("/truck", MasterController.getTruck2);
router.get("/do", MasterController.getSOData);
router.get("/doups", MasterController.getSODataUPS);
router.get("/cust", MasterController.getDataCustDB);
router.get("/ven", MasterController.getDataVenDB);
router.get("/inter", MasterController.getDataInterDB);
router.get("/oscust", MasterController.getOSDataCust);
router.get("/oscustwb", MasterController.getOSDataCustWB);
router.get("/sloc", MasterController.getDataSLoc);
router.get("/valtype", MasterController.getDataValtype);
router.get("/valtypedb", MasterController.getDataValTypeDB);
router.get("/dolist", MasterController.getDataDOList);
router.get("/frcdolist", MasterController.getDataDOFrc);
router.get("/frcdocgrp", MasterController.getDataDOFRCByCGRP);
router.get("/stolist", MasterController.getDataSTOList);
router.get("/seedcust", MasterController.seedDataCust);
router.get("/seedven", MasterController.seedDataVen);
router.get("/updatecust", MasterController.upDataCust);
router.get("/updateven", MasterController.upDataVen);
router.get("/updatecustbydate", MasterController.upMstCustbyDate);
router.get("/updatevenbydate", MasterController.upMstVenbyDate);
router.get("/updateintrbydate", MasterController.upMstIntrbyDate);
router.get("/updateven", MasterController.upDataVen);
router.get("/updateintrc", MasterController.upDataInterco);
router.get("/vhcl", MasterController.getVehicleDataDB);
router.get("/drvr", MasterController.getDriverDataDB);
router.get("/city", MasterController.getDataCities);
router.get("/plt", MasterController.getCompanyPlant);
router.get("/mstplt", MasterController.getCompanyPlantMst);
router.get("/mediatp", MasterController.getMediaTP);
router.get("/checksto", MasterController.getSTOData);
router.get("/checkstolcfrc", MasterController.getSTOLCFRCData);
router.get("/slocdb", MasterController.SlocDB);
router.get("/batchdb", MasterController.BatchByComp);
router.get("/reqdrvveh", MasterController.getReqDrvVehLog);
router.get("/checkstobydo", MasterController.getStobyDo);
router.get("/transpwbnet", MasterController.getTransporterWBNET);
router.get("/plantwbnet", MasterController.plantWBNET);
router.get("/dodb", MasterController.getDoDB);

//Master Types
router.get("/incoterm", MasterController.getIncoterms);
//Master Contract
router.get("/getmstcon", MasterController.getAllMasterContract);
router.get("/getconbydo", MasterController.getDODBbyID);
router.post("/savemstcon", MasterController.createMasterContract);
router.post("/deletemstcon", MasterController.deleteMasterContract);
router.post("/deactmstcon", MasterController.deactivateMasterContract);
router.get("/getsap", MasterController.getCodeSAP);

module.exports = router;
