const User = require("../models/UserModel");
const Page = require("../models/PageModel");
const db = require("../config/connection");
const jwt = require("jsonwebtoken");
const ncrypt = require("ncrypt-js");
const EmailModel = require("../models/EmailModel");
const crud = require("../helper/crudquery");
const OTP = require("../helper/OTPHandler");
const { hashPassword } = require("../helper/hashpass");

const UserController = {};
// UserController.registerUser = async (req, res) => {
//     const payload = req.body;
//     try {
//         const regUser = await User.registerNew(payload);
//         res.status(200).send({
//             message: "User Registered, OTP Sent",
//             id_user: regUser.id_user,
//         });
//     } catch (error) {
//         console.error(error);
//         if (error.message === "CRED EXIST") {
//             res.status(400).send({
//                 message:
//                     "User already registered, please verify OTP or resend new OTP",
//             });
//         } else {
//             res.status(500).send({ message: error.message });
//         }
//     }
// };

UserController.registerNewUser = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const registerNew = await User.registerNew_2({
            ...payload,
            session: session,
        });
        res.status(200).send({
            message: "New User Registered",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.validateNewUser = async (req, res) => {
    try {
        const username = req.body.username;
        const otp = req.body.otp;
        const validateUser = await OTP.validateNewOTP(otp, username);
        res.cookie("newpass", validateUser, {
            httpOnly: true,
            secure: false,
            sameSite: false,
        });
        res.status(200).send({
            message: "OTP Validated",
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

UserController.setNewPassword = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const username = req.body.username;
            const password = req.body.newpass;
            const newpassToken = req.cookies.newpass;
            const { username: tokenUname } = jwt.verify(
                newpassToken,
                process.env.TOKEN_KEY
            );
            if (tokenUname !== username) {
                throw new Error("Token invalid");
            }
            const { rows } = await client.query(
                "SELECT otp_value FROM MST_USER WHERE username = $1",
                [username]
            );
            if (!rows[0].otp_value) {
                throw new Error("OTP not requested");
            }
            const hashPass = await hashPassword(password);
            const payloadNewPass = {
                password: hashPass,
                is_active: true,
                otp_value: null,
                otp_validto: null,
            };
            const [queUp, valUp] = crud.updateItem(
                "mst_user",
                payloadNewPass,
                { username: username },
                "id_user"
            );
            const updatePass = await client.query(queUp, valUp);
            res.status(200).send({
                message: "Password Set",
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.editUser = async (req, res) => {
    const payload = req.body;
    console.log(payload);
    const session = req.cookies;
    try {
        const verif = await User.editUser(payload, session);
        res.status(200).send({
            message: "User Edited",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
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
            username: usernameoremail,
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
            `SELECT USERNAME,
            FULLNAME,
            TO_CHAR(U.CREATED_DATE,
        
                'YYYY-MM-DD T HH24:MI:SS') AS CREATED_DATE,
            RL.ROLE_NAME,
            U.ROLE,
            EM.EMAIL,
            TE.TELF,
            U.PLANT_CODE
        FROM MST_USER U
        LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = U.ROLE
        LEFT JOIN 
        (SELECT STRING_AGG(EMAIL, ',') AS EMAIL, ID_USER FROM MST_EMAIL GROUP BY ID_USER) EM ON EM.ID_USER = U.ID_USER 
        LEFT JOIN (SELECT STRING_AGG(TELF, ',') AS TELF, ID_USER FROM MST_TELF GROUP BY ID_USER) TE ON TE.ID_USER = U.ID_USER
        WHERE U.id_user = $1`,
            [id_user]
        );
        const dataUser = userData[0];
        const responseData = {
            fullname: dataUser.fullname,
            role: dataUser.role,
            username: dataUser.username,
            plant_code: dataUser.plant_code,
            email: dataUser.email?.split(",").map(item => item.trim()) ?? [],
            telf: dataUser.telf?.split(",").map(item => item.trim()) ?? [],
        };
        res.status(200).send(responseData);
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

UserController.sendEmailCredentials = async (req, res) => {
    try {
        const client = await db.connect();
        const id_user = req.body.id_user;
        const ncryption = new ncrypt(process.env.TOKEN_KEY);
        try {
            const { rows } = await client.query(
                "SELECT username, email, enc_pwd, url_web FROM mst_user where id_user = $1",
                [id_user]
            );
            const dataUser = rows[0];
            let password = dataUser.enc_pwd;
            if (password !== null) {
                password = ncryption.decrypt(dataUser.enc_pwd);
            }
            await EmailModel.newUserNotify(
                dataUser.email,
                dataUser.username,
                password,
                dataUser.url_web
            );
            res.status(200).send({
                message: "Email sent",
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.sendEmailCredentials2 = async (req, res) => {
    try {
        const client = await db.connect();
        const id_user = req.body.id_user;
        try {
            const { rows } = await client.query(
                `SELECT STRING_AGG(EM.EMAIL, ',') AS EMAIL, US.ID_USER, US.username FROM MST_EMAIL EM
            LEFT JOIN MST_USER US ON US.id_user = EM.id_user
            WHERE US.id_user = $1
            GROUP BY US.ID_USER, US.username `,
                [id_user]
            );
            const emailTarget = rows[0].email;
            const usernameTarget = rows[0].username;
            const [otpCode, encodedOTP, validUntil] = OTP.createOTP(15, {
                digits: true,
                lowerCaseAlphabets: true,
                upperCaseAlphabets: true,
                specialChars: true,
            });
            const payload = {
                otp_value: encodedOTP,
                otp_validto: validUntil,
            };
            const [que, val] = crud.updateItem(
                "mst_user",
                payload,
                { id_user: id_user },
                "url_web"
            );
            const { rows: dataReset } = await client.query(que, val);
            await EmailModel.resetPasswordNotify(
                emailTarget,
                usernameTarget,
                otpCode,
                dataReset[0].url_web
            );
            res.status(200).send({
                message: "Reset Request Send",
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

UserController.deleteUser = async (req, res) => {
    try {
        const client = await db.connect();
        const id_user = req.body.id_user;
        try {
            const { rows } = await client.query(
                "SELECT * FROM MST_USER WHERE id_user = $1",
                [id_user]
            );
            if (rows.length < 0) {
                throw error("User not found");
            }
            const deleteUser = await client.query(
                "DELETE FROM MST_USER WHERE id_user = $1",
                [id_user]
            );
            res.status(200).send({
                message: `User ${rows[0].username} deleted`,
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};
module.exports = UserController;
