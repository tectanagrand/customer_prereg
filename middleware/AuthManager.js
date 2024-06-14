const jwt = require("jsonwebtoken");
const db = require("../config/connection");
const ncrypt = require("ncrypt-js");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const axios = require("axios");

const AuthManager = {
    authSession: async (req, res, next) => {
        let headers = req.headers.Authorization || req.headers.authorization;
        let token = headers?.split(" ")[1];
        let decode;
        if (!(req.headers.authorization || req.headers.Authorization)) {
            res.status(401).send({
                message: "Access Denied",
            });
        } else {
            try {
                if (token !== undefined) {
                    decode = jwt.verify(token, process.env.TOKEN_KEY);
                } else {
                    const exception = new Error();
                    exception.name = "Unauthorized";
                    exception.response = {
                        status: 401,
                        data: {
                            message: "Unauthorized",
                        },
                    };
                    throw exception;
                }
                req.useridSess = decode.id;
                next();
            } catch (err) {
                if (err?.response?.status === 401) {
                    res.status(401).send({
                        message: err.response.data.message,
                    });
                } else if (err.name == "TokenExpiredError") {
                    res.status(403).send({
                        message: err.message,
                    });
                } else {
                    res.status(500).send({
                        message: err.stack,
                    });
                }
            }
        }
    },

    authSAP: async (req, res, next) => {
        try {
            const client = await db.connect();
            const id_user = req.cookies.id_user;
            if (req.cookies.role !== "LOGISTIC") {
                throw new Error("Role Not Authorized");
            }
            const ncryption = new ncrypt(process.env.TOKEN_KEY);
            try {
                await client.query(TRANS.BEGIN);
                const { rows: sessionSAP } = await client.query(
                    `select id_user, enc_pwd, refresh_token from session_sap where id_user = $1`,
                    [id_user]
                );
                if (!sessionSAP.length > 0) {
                    const password = req.body.password;
                    if (!password) {
                        throw new Error("Provide password");
                    }
                    try {
                        const { data } = await axios.get(
                            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/SOSTOSet?$filter=(Bednr%20eq%20%271001003364%27)&$format=json`,
                            {
                                auth: {
                                    username: req.cookies.username,
                                    password: password,
                                },
                            }
                        );
                    } catch (error) {
                        if (error.response.status === 401) {
                            throw new Error("SAP Credential Not Valid");
                        }
                    }
                    const { rows: userData } = await client.query(
                        `select refresh_token from mst_user where id_user = $1`,
                        [id_user]
                    );
                    const payload = {
                        id_user: id_user,
                        refresh_token: userData[0].refresh_token,
                        enc_pwd: ncryption.encrypt(password),
                    };
                    const [queSess, valSess] = Crud.insertItem(
                        "session_sap",
                        payload,
                        "id_user"
                    );
                    const { rows: insertSession } = await client.query(
                        queSess,
                        valSess
                    );
                    await client.query(TRANS.COMMIT);
                    next();
                } else {
                    try {
                        const verify = jwt.verify(
                            sessionSAP[0].refresh_token,
                            process.env.TOKEN_KEY
                        );
                    } catch (error) {
                        if (error.name === "TokenExpiredError") {
                            //delete session
                            await client.query(
                                "delete from session_sap where id_user = $1",
                                [id_user]
                            );
                            await client.query(TRANS.COMMIT);
                            throw new Error("Session Expired");
                        }
                    }
                    req.body.password = ncryption.decrypt(
                        sessionSAP[0].enc_pwd
                    );
                    await client.query(TRANS.COMMIT);
                    next();
                }
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
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
    },
};

module.exports = AuthManager;
