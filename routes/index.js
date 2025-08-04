const express = require("express");
const router = express.Router();
const User = require("./User");
const Page = require("./Page");
const Master = require("./Master");
const LoadNote = require("./LoadingNote");
const File = require("./File");
const Tolling = require("./Tolling");
const MultiLN = require("./MultiLN");
const Queue = require("./Queue");
const PostZWB = require("./PostZWB");

router.use("/api/user", User);
router.use("/api/page", Page);
router.use("/api/master", Master);
router.use("/api/ln", LoadNote);
router.use("/api/file", File);
router.use("/api/queue", Queue);
router.use("/api/tol", Tolling);
router.use("/api/multi", MultiLN);
router.use("/api/postzwb", PostZWB);

module.exports = router;
