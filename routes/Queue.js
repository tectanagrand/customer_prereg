const express = require("express");
const router = express.Router();
const QueueController = require("../controllers/QueueController");

router.get("/push", QueueController.pushNewQueue);
router.get("/show", QueueController.showQueue);

module.exports = router;
