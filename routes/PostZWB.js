const express = require("express");
const router = express.Router();
const PostZWBController = require("../controllers/PostZWBController");
const AuthManager = require("../middleware/AuthManager");

router.get("/", PostZWBController.GetCurrentOS);
router.get("/cust", PostZWBController.GetCustomers);
router.post("/post", AuthManager.authSAP, PostZWBController.PostZWBStart);

module.exports = router;
