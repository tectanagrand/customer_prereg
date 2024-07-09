const express = require("express");
const UserController = require("../controllers/UserController");
const AuthMiddleware = require("../middleware/AuthManager");
const router = express.Router();

// router.post("/register", UserController.registerUser);
router.post("/register", UserController.registerNewUser);
router.post("/edituser", UserController.editUser);
router.post("/validatenew", UserController.validateNewUser);
router.post("/setpwdnew", UserController.setNewPassword);
router.post("/verifotp", UserController.verifNewUser);
router.post("/resendotp", UserController.resendOTP);
router.post("/login", UserController.login);
router.get("/validatetoken", AuthMiddleware.authSession, (req, res) => {
    res.status(200).send({ message: "User validated" });
});
router.get("/refresh", UserController.refreshToken);
router.get("/show", UserController.showAllUser);
router.get("/preform", UserController.preFormData);
router.get("/showbyid", UserController.showById);
router.post("/submit", UserController.submitUser);
router.post("/role", UserController.showRoleGroup);
router.post("/role/submit", UserController.submitRoleGroup);
router.get("/allrole", UserController.showAllRole);
router.post("/getauth", UserController.getAllAuth);
router.post("/email", UserController.sendEmailCredentials2);
router.post("/delete", UserController.deleteUser);
router.post("/isroleup", UserController.isRoleUp);
module.exports = router;
