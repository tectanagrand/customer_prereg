const db = require("../config/connection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const { hashPassword, validatePassword } = require("../helper/hashpass");
const Mailer = require("../helper/Emailer");
const OTP = require("../helper/OTPHandler");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const UserModel = {};

UserModel.registerNew = async ({
    full_name,
    username,
    email,
    phone_num,
    password,
    sap_code,
}) => {
    const client = await db.connect();
    try {
        await client.query(TRANS.BEGIN);
        const { rows, rowCount } = await client.query(
            "SELECT * FROM mst_user where email = $1 OR username = $2",
            [email, username]
        );
        if (rowCount > 0) {
            throw new Error("CRED EXIST");
        }
        const hashedPass = await hashPassword(password);
        const now = new Date();
        const id_user = uuid.uuid();
        const payload = {
            fullname: full_name,
            username: username,
            email: email,
            phone_num: phone_num,
            sap_code: sap_code,
            password: hashedPass,
            created_date: moment(now).format(),
            is_active: false,
            id_user: id_user,
        };
        const [otpCode, encodedOTP, validUntil] = OTP.createOTP();
        const [otpQue, otpVal] = crud.insertItem("otp_transaction", {
            id_user: id_user,
            otp_code: encodedOTP,
            created_date: moment(now).format(),
            email: email,
            valid_until: validUntil,
        });
        const [userQue, userVal] = crud.insertItem("mst_user", payload);
        const insertUser = await client.query(userQue, userVal);
        const otpTransIn = await client.query(otpQue, otpVal);
        const emailer = new Mailer();
        await emailer.otpVerifyNew(otpCode, email);
        await client.query(TRANS.COMMIT);
        return { id_user: id_user };
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.newUserVerify = async ({ email, otp_input }) => {
    const client = await db.connect();
    try {
        const validateOTP = await OTP.validateOTP(otp_input, email);
        await client.query(TRANS.BEGIN);
        const setActiveUser = await client.query(
            "UPDATE mst_user SET is_active = true WHERE email = $1",
            [email]
        );
        const deleteOTPTrans = await client.query(
            "DELETE FROM otp_transaction WHERE email = $1",
            [email]
        );
        await client.query(TRANS.COMMIT);
        return "User Validated";
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.resendOTP = async ({ email, type }) => {
    const client = await db.connect();
    try {
        await client.query(TRANS.BEGIN);
        const { rows: userData, rowCount: dataCount } = await client.query(
            "SELECT * FROM mst_user where email = $1",
            [email]
        );
        console.log(type);
        if (userData[0].is_active && type == "new") {
            throw new Error("USER ALREADY REG");
        }
        if (dataCount <= 0) {
            throw new Error("USER NOT EXIST");
        }
        const [otpCode, encodedOTP, validUntil] = OTP.createOTP();
        const now = moment().format();
        const untilValid = moment(validUntil).format();
        const deleteOTPTrans = await client.query(
            "DELETE FROM otp_transaction WHERE email = $1",
            [email]
        );
        const [query, val] = crud.insertItem(
            "otp_transaction",
            {
                id_user: userData[0].id_user,
                otp_code: encodedOTP,
                created_date: now,
                email: email,
                valid_until: untilValid,
                type: type,
            },
            "email"
        );
        const insertNewOTP = await client.query(query, val);
        const emailer = new Mailer();
        await client.query(TRANS.COMMIT);
        await emailer.otpVerifyNew(otpCode, email);
        return {
            id_user: userData[0].id_user,
        };
    } catch (error) {
        console.error(error);
        await client.query(TRANS.ROLLBACK);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.login = async ({ uemail, password }) => {
    const client = await db.connect();
    try {
        await client.query(TRANS.BEGIN);
        const { rows: userData, rowCount } = await client.query(
            ` SELECT fullname, email, username, id_user, rl.role_name as role, rl.role_id, password, sap_code FROM mst_user usr
            LEFT JOIN mst_role rl on usr.role = rl.role_id
            WHERE email = $1 OR username = $2`,
            [uemail, uemail]
        );
        if (rowCount <= 0) {
            throw new Error("NOT EXIST");
        }
        const verifPass = await validatePassword(
            password,
            userData[0].password
        );
        if (!verifPass) {
            throw new Error("LOGIN NOTVALID");
        }
        const accessToken = jwt.sign(
            {
                id: userData[0].id_user,
                username: userData[0].username,
                email: userData[0].email,
            },
            process.env.TOKEN_KEY,
            { expiresIn: "30s" }
        );
        const refreshToken = jwt.sign(
            {
                id: userData[0].id_user,
                username: userData[0].username,
                email: userData[0].email,
            },
            process.env.TOKEN_KEY,
            { expiresIn: "6h" }
        );
        const [queIns, valIns] = crud.updateItem(
            "mst_user",
            { refresh_token: refreshToken },
            { id_user: userData[0].id_user },
            "id_user"
        );
        delete userData[0].password;
        const insertData = await client.query(queIns, valIns);
        await client.query(TRANS.COMMIT);
        return {
            data: { ...userData[0] },
            accessToken: accessToken,
        };
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.showAllUser = async () => {
    const client = await db.connect();
    try {
        const { rows: userData } = await client.query(`
        SELECT USR.fullname, USR.username, USR.email, RL.role_name, USR.created_date, USR.id_user, USR.id_user as id, USR.is_active
        FROM MST_USER USR
        LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = USR.ROLE
        `);
        return userData;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.getAllAuth = async role_id => {
    const client = await db.connect();
    const authData = new Map();
    try {
        const { rows: getDataAuth } = await client.query(
            `SELECT mpa.page_id, mpa.fcreate, mpa.fread, mpa.fupdate, mpa.fdelete, mp.menu_page FROM mst_page_access mpa  
            LEFT JOIN mst_page mp on mpa.page_id = mp.menu_id and mp.is_active = true
            WHERE role_id = $1`,
            [role_id]
        );
        getDataAuth.map(item => {
            authData.set(item.menu_page, item);
        });
        return Object.fromEntries(authData);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.submitUser = async params => {
    const client = await db.connect();
    let que, val;
    const typeAct = params.type;
    delete params.type;
    try {
        await client.query(TRANS.BEGIN);
        const now = moment().format();
        params["updated_date"] = now;
        params["is_active"] = true;
        if (params.hasOwnProperty("password")) {
            const hashedPass = await hashPassword(params.password);
            params.password = hashedPass;
        }
        if (typeAct === "update") {
            [que, val] = crud.updateItem(
                "mst_user",
                params,
                { id_user: params.id_user },
                "id_user"
            );
        } else {
            const { rowCount: emailCount } = await client.query(
                "SELECT * FROM mst_user WHERE email = $1",
                [params.email]
            );
            if (emailCount > 0) {
                throw new Error("Email has taken");
            }
            const { rowCount: userNameCount } = await client.query(
                "SELECT * FROM mst_user WHERE username = $1",
                [params.username]
            );
            if (userNameCount > 0) {
                throw new Error("Username has taken");
            }

            params["created_date"] = now;
            params["id_user"] = uuid.uuid();
            params["pre_reg"] = false;
            [que, val] = crud.insertItem("mst_user", params, "id_user");
        }
        const upUser = await client.query(que, val);
        await client.query(TRANS.COMMIT);
        const messageRet =
            typeAct === "insert"
                ? `${params.username} is created`
                : `${params.username} is updated`;
        return messageRet;
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.showRoleGroup = async role_id => {
    const client = await db.connect();
    try {
        const { rows: roleName, rowCount } = await client.query(
            "SELECT role_name from mst_role where role_id = $1",
            [role_id]
        );
        const { rows: dataRoleAcs } = await client.query(
            `SELECT PG.MENU_ID AS "id",
        PG.MENU_PAGE,
        CASE
                        WHEN ACS.FCREATE THEN ACS.FCREATE
                        ELSE FALSE
        END AS "fcreate",
        CASE
                        WHEN ACS.FREAD THEN ACS.FREAD
                        ELSE FALSE
        END AS "fread",
        CASE
                        WHEN ACS.FUPDATE THEN ACS.FUPDATE
                        ELSE FALSE
        END AS "fupdate",
        CASE
                        WHEN ACS.FDELETE THEN ACS.FDELETE
                        ELSE FALSE
        END AS "fdelete"
    FROM MST_PAGE PG
    LEFT JOIN MST_PAGE_ACCESS ACS ON ACS.PAGE_ID = PG.MENU_ID
    AND ACS.ROLE_ID = $1
    ORDER BY PG.PARENT_ID ASC`,
            [role_id]
        );
        return {
            role_name: rowCount === 0 ? "" : roleName[0].role_name,
            data: dataRoleAcs,
        };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

UserModel.submitRoleGroup = async (role_id, accesses, id_user, role_name) => {
    const client = await db.connect();
    let created_date, created_by, updated_date, updated_by;
    let roleid = role_id;
    let promises = [];
    try {
        if (role_id !== "") {
            const { rows: lastData } = await client.query(
                "SELECT created_date, created_by FROM mst_page_access WHERE role_id = $1",
                [role_id]
            );
            const { created_date: cdate, created_by: cby } = lastData[0];
            created_date = cdate;
            created_by = cby;
            updated_date = moment().format();
            updated_by = id_user;
        } else {
            created_date = moment().format();
            created_by = id_user;
            updated_date = moment().format();
            updated_by = id_user;
        }
        await client.query(TRANS.BEGIN);
        if (role_id !== "") {
            roleid = role_id;
            const dataRole = {
                updated_by: updated_by,
                updated_date: updated_date,
                role_name: role_name,
            };
            await client.query(
                `delete from mst_page_access where role_id = $1 ;`,
                [role_id]
            );
            const [roleUp, valUp] = crud.updateItem(
                "mst_role",
                dataRole,
                { role_id: roleid },
                "role_id"
            );
            const upRole = await client.query(roleUp, valUp);
        } else {
            roleid = uuid.uuid();
            const dataRole = {
                role_id: roleid,
                role_name: role_name,
                created_date: created_date,
                created_by: created_by,
                updated_by: updated_by,
                updated_date: updated_date,
                is_active: true,
            };
            const [roleQue, roleVal] = crud.insertItem(
                "mst_role",
                dataRole,
                "role_name"
            );
            const insertNewRole = await client.query(roleQue, roleVal);
        }
        accesses.forEach(item => {
            const insertItem = {
                role_id: roleid,
                page_id: item.id,
                fcreate: item.fcreate,
                fread: item.fread,
                fupdate: item.fupdate,
                fdelete: item.fdelete,
                created_by: created_by,
                updated_by: updated_by,
                created_date: created_date,
                updated_date: updated_date,
            };
            const [query, val] = crud.insertItem(
                "mst_page_access",
                insertItem,
                "role_id"
            );
            promises.push(client.query(query, val));
        });
        const upPageAcs = await Promise.all(promises);
        await client.query(TRANS.COMMIT);
        return {
            role_id: roleid,
            message: `${role_name} is initiated`,
        };
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};
module.exports = UserModel;
