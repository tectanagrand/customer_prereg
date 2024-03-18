const User = require("../models/UserModel");
const Page = require("../models/PageModel");
const db = require("../config/connection");
const jwt = require("jsonwebtoken");

const UserController = {};
UserController.registerUser = async (req, res) => {
    const payload = req.body;
    try {
        const regUser = await User.registerNew(payload);
        res.status(200).send({
            message: "User Registered, OTP Sent",
            id_user: regUser.id_user,
        });
    } catch (error) {
        console.error(error);
        if (error.message === "CRED EXIST") {
            res.status(400).send({
                message:
                    "User already registered, please verify OTP or resend new OTP",
            });
        } else {
            res.status(500).send({ message: error.message });
        }
    }
};

UserController.verifNewUser = async (req, res) => {
    const payload = req.body;
    try {
        const verif = await User.newUserVerify(payload);
        res.status(200).send({
            message: "User Verified",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.resendOTP = async (req, res) => {
    const payload = req.body;
    try {
        const verif = await User.resendOTP(payload);
        console.log(verif);
        res.status(200).send({
            id_user: verif.id_user,
            message: "OTP sent",
        });
    } catch (error) {
        console.error(error);
        if (error.message === "USER ALREADY REG") {
            res.status(400).send({
                message: "User already registered",
            });
        } else if (error.message === "USER NOT EXIST") {
            res.status(400).send({
                message: "User not registered, please register",
            });
        } else {
            res.status(500).send({
                message: error.message,
            });
        }
    }
};

UserController.login = async (req, res) => {
    const usernameoremail = req.body.unemail;
    const password = req.body.password;
    try {
        const { data, accessToken } = await User.login({
            uemail: usernameoremail,
            password: password,
        });
        const authorize = await Page.showAll(data.role_id);
        const auth = await User.getAllAuth(data.role_id);
        res.status(200).send({
            ...data,
            access_token: accessToken,
            permission: authorize,
            auth: auth,
        });
    } catch (error) {
        console.error(error);
        if (error.message === "NOT EXIST") {
            res.status(400).send({
                message: "User not exist",
            });
        } else if (error.message === "LOGIN NOTVALID") {
            res.status(400).send({
                message: "Credential not valid",
            });
        } else {
            res.status(500).send({
                message: error,
            });
        }
    }
};

UserController.refreshToken = async (req, res) => {
    const client = await db.connect();
    const cookies = req.cookies;
    if (!cookies?.access_token) {
        return res.status(401).send({
            message: "Unauthorized",
        });
    }
    try {
        const { rows: getrefToken } = await client.query(
            "SELECT refresh_token FROM mst_user WHERE id_user = $1",
            [cookies.id_user]
        );
        const refToken = getrefToken[0].refresh_token;
        const verif = jwt.verify(refToken, process.env.TOKEN_KEY);
        const newAct = jwt.sign(
            {
                id: cookies.user_id,
                username: cookies.username,
                email: cookies.email,
            },
            process.env.TOKEN_KEY,
            {
                expiresIn: "30s",
            }
        );
        res.status(200).send({
            access_token: newAct,
        });
    } catch (error) {
        console.log(error);
        res.status(401).send({
            message: "Login Expired",
        });
    } finally {
        client.release();
    }
};

UserController.showAllUser = async (req, res) => {
    try {
        const userData = await User.showAllUser();
        res.status(200).send(userData);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

UserController.showById = async (req, res) => {
    const id_user = req.query.id_user;
    const client = await db.connect();
    try {
        const { rows: userData } = await client.query(
            "SELECT fullname, username, email, phone_num, role, id_user FROM mst_user WHERE id_user = $1",
            [id_user]
        );
        res.status(200).send(userData[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

UserController.preFormData = async (req, res) => {
    const client = await db.connect();
    try {
        const { rows: roleData } = await client.query(
            "SELECT role_id, role_name FROM mst_role"
        );
        res.status(200).send({
            role: roleData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

UserController.submitUser = async (req, res) => {
    const params = req.body;
    try {
        const result = await User.submitUser(params);
        res.status(200).send({
            message: result,
        });
    } catch (error) {
        console.error(error);
        if (
            error.message === "Email has taken" ||
            error.message === "Username has taken"
        ) {
            res.status(400).send({
                message: error.message,
            });
        } else {
            res.status(500).send({
                message: error.message,
            });
        }
    }
};

UserController.showRoleGroup = async (req, res) => {
    const role_id = req.body.role_id;
    try {
        const dataRole = await User.showRoleGroup(role_id);
        res.status(200).send(dataRole);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

UserController.submitRoleGroup = async (req, res) => {
    const role_id = req.body.role_id;
    const role_name = req.body.role_name;
    const accesses = req.body.accesses;
    const id_user = req.body.id_user;
    try {
        const submitRole = await User.submitRoleGroup(
            role_id,
            accesses,
            id_user,
            role_name
        );
        res.status(200).send(submitRole);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.showAllRole = async (req, res) => {
    const client = await db.connect();
    try {
        const { rows: roles } = await client.query(
            "SELECT * FROM mst_role where is_active = true"
        );
        res.status(200).send(roles);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

UserController.getAllAuth = async (req, res) => {
    const role_id = req.body.role_id;
    try {
        const { data: authData } = await User.getAllAuth(role_id);
        res.status(200).send(authData);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};
module.exports = UserController;
