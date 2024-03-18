const express = require("express");
const UserController = require("../controllers/UserController");
const router = express.Router();

router.post("/register", UserController.registerUser);
router.post("/verifotp", UserController.verifNewUser);
router.post("/resendotp", UserController.resendOTP);
router.post("/login", UserController.login);
router.get("/refresh", UserController.refreshToken);
router.get("/show", UserController.showAllUser);
router.get("/preform", UserController.preFormData);
router.get("/showbyid", UserController.showById);
router.post("/submit", UserController.submitUser);
router.post("/role", UserController.showRoleGroup);
router.post("/role/submit", UserController.submitRoleGroup);
router.get("/allrole", UserController.showAllRole);
router.post("/getauth", UserController.getAllAuth);
module.exports = router;
