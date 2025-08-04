const express = require("express");
const router = express.Router();
const PostZWBController = require("../controllers/PostZWBController");

router.get("/", PostZWBController.GetCurrentOS);
router.get("/cust", PostZWBController.GetCustomers);
router.post("/post", PostZWBController.PostZWBStart);

module.exports = router;
