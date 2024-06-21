const formidable = require("formidable");
const FileUploadModel = require("../models/FileUploadModel");
const db = require("../config/connection");
const fs = require("fs");
const os = require("os");
const path = require("path");
const FileUploadController = {};
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const EmailModel = require("../models/EmailModel");
const TicketGen = require("../helper/TicketGen");

FileUploadController.uploadSTNK = async (req, res) => {
    try {
        const id_session = req.cookies.id_user;
        const { plate_num, filename, id_row } =
            await FileUploadModel.uploadFile(req, "stnk");
        const nump = await FileUploadModel.submitSTNK(
            plate_num,
            filename,
            id_row,
            id_session
        );
        res.status(200).send({
            message: nump + " is Uploaded",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.uploadSIM = async (req, res) => {
    try {
        const id_session = req.cookies.id_user;
        let dataUp = await FileUploadModel.uploadSIM(req, "license");
        dataUp.id_session = id_session;
        const nump = await FileUploadModel.submitSIM(dataUp);
        res.status(200).send({
            message: nump + " is Uploaded",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.getFileSTNK = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, vhcl_id, foto_stnk FROM mst_vehicle WHERE uuid = $1",
                [id_row]
            );
            const file_name = rows[0].foto_stnk;
            let new_path = "";
            if (os.platform() === "win32") {
                new_path =
                    path.join(path.resolve(), "public\\" + "stnk") +
                    "\\" +
                    file_name;
            } else {
                new_path =
                    path.join(path.resolve(), "/public/" + "stnk") +
                    "/" +
                    file_name;
            }
            const fileStream = fs.createReadStream(new_path);
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file_name}"`
            );
            fileStream.pipe(res);
            res.status(200);
            fileStream.on("end", () => {
                res.end(); // End the response stream
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

FileUploadController.getFileSIM = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, foto_sim FROM mst_driver WHERE uuid = $1",
                [id_row]
            );
            const file_name = rows[0].foto_sim;
            let new_path = "";
            if (os.platform() === "win32") {
                new_path =
                    path.join(path.resolve(), "public\\" + "license") +
                    "\\" +
                    file_name;
            } else {
                new_path =
                    path.join(path.resolve(), "/public/" + "license") +
                    "/" +
                    file_name;
            }
            const fileStream = fs.createReadStream(new_path);
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file_name}"`
            );
            fileStream.pipe(res);
            res.status(200);
            fileStream.on("end", () => {
                res.end(); // End the response stream
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

FileUploadController.getFotoDriver = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, foto_driver FROM mst_driver WHERE uuid = $1",
                [id_row]
            );
            const file_name = rows[0].foto_driver;
            let new_path = "";
            if (os.platform() === "win32") {
                new_path =
                    path.join(path.resolve(), "public\\" + "license") +
                    "\\" +
                    file_name;
            } else {
                new_path =
                    path.join(path.resolve(), "/public/" + "license") +
                    "/" +
                    file_name;
            }
            const fileStream = fs.createReadStream(new_path);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file_name}"`
            );
            fileStream.pipe(res);
            res.status(200);
            fileStream.on("end", () => {
                res.end(); // End the response stream
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

FileUploadController.getDataSTNK = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, vhcl_id, foto_stnk FROM mst_vehicle WHERE uuid = $1",
                [id_row]
            );
            res.status(200).send({
                vhcl_id: rows[0].vhcl_id,
                foto_stnk: rows[0].foto_stnk,
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

FileUploadController.getDataSIM = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `SELECT uuid as id, driver_id, driver_name, alamat, tempat_lahir, ct.city, tanggal_lahir,
                no_telp, foto_sim, is_send
                 FROM mst_driver drv
                 LEFT JOIN mst_cities ct ON drv.tempat_lahir = ct.code 
                 WHERE uuid = $1`,
                [id_row]
            );

            res.status(200).send({
                ...rows[0],
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

FileUploadController.deleteDataSTNK = async (req, res) => {
    try {
        // console.log(req.body);
        const id_row = req.body.id;
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                "DELETE FROM MST_VEHICLE WHERE uuid = $1 RETURNING foto_stnk, vhcl_id",
                [id_row]
            );
            const file_name = rows[0].foto_stnk;
            if (os.platform() == "linux") {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public/stnk") + "/" + file_name
                );
            } else {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public\\stnk") + "\\" + file_name
                );
            }
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: rows[0].vhcl_id + " Data Deleted",
            });
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
};

FileUploadController.deleteDataSIM = async (req, res) => {
    try {
        // console.log(req.body);
        const id_row = req.body.id;
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                "DELETE FROM MST_DRIVER WHERE uuid = $1 RETURNING foto_sim, driver_id",
                [id_row]
            );
            const file_name = rows[0].foto_sim;
            if (os.platform() == "linux") {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public/license") +
                        "/" +
                        file_name
                );
            } else {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public\\license") +
                        "\\" +
                        file_name
                );
            }
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: rows[0].driver_id + " Data Deleted",
            });
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
};

FileUploadController.sendEmailCreateDrvnVeh = async (req, res) => {
    try {
        const client = await db.connect();
        const plant_code = req.body.plant;
        const driverData = req.body.driver;
        let driverHTML = [];
        let driverAtth = [];
        const vehData = req.body.vehicle;
        let vehHTML = [];
        let vehAtth = [];
        try {
            await client.query(TRANS.BEGIN);
            if (driverData.length > 0) {
                for (const d of driverData) {
                    let idDriver = d.id;
                    const [que, val] = crud.updateItem(
                        "mst_driver",
                        { is_send: true },
                        { uuid: idDriver },
                        "driver_id"
                    );
                    await client.query(que, val);
                    driverHTML.push(`
                    <tr>
                        <td>${d.driver_id}</td>
                        <td>${d.driver_name}</td>
                        <td>${d.tempat_lahir}</td>
                        <td>${d.tanggal_lahir}</td>
                        <td>${d.no_telp}</td>
                        <td>${d.alamat}</td>
                    </tr>
                    `);
                    let pathStream = "";
                    if (os.platform() === "win32") {
                        pathStream =
                            path.join(path.resolve(), "public\\license") +
                            "\\" +
                            d.foto_sim;
                    } else {
                        pathStream =
                            path.join(path.resolve(), "public/license") +
                            "/" +
                            d.foto_sim;
                    }
                    driverAtth.push({
                        filename: d.foto_sim,
                        content: fs.createReadStream(pathStream),
                    });
                }
            }
            if (vehData.length > 0) {
                for (const v of vehData) {
                    let idVeh = v.id;
                    const [que, val] = crud.updateItem(
                        "mst_vehicle",
                        { is_send: true },
                        { uuid: idVeh },
                        "vhcl_id"
                    );
                    await client.query(que, val);
                    vehHTML.push(`
                    <tr>
                        <td>${v.vhcl_id}</td>
                    </tr>
                    `);
                    let pathStream = "";
                    if (os.platform() === "win32") {
                        pathStream =
                            path.join(path.resolve(), "public\\stnk") +
                            "\\" +
                            v.foto_stnk;
                    } else {
                        pathStream =
                            path.join(path.resolve(), "public/stnk") +
                            "/" +
                            v.foto_stnk;
                    }
                    vehAtth.push({
                        filename: v.foto_stnk,
                        content: fs.createReadStream(pathStream),
                    });
                }
            }
            const { rows } = await client.query(
                `
            SELECT STRING_AGG(E.EMAIL, ', ') as EMAIL, R.ROLE_NAME FROM MST_EMAIL E
            LEFT JOIN MST_USER U ON E.ID_USER = U.ID_USER
            LEFT JOIN MST_ROLE R ON R.ROLE_ID = U.ROLE
            WHERE R.ROLE_NAME = 'ADMIN' OR R.ROLE_NAME = 'LOGISTIC' OR U.PLANT_CODE = $1
            GROUP BY R.ROLE_NAME
            `,
                [plant_code]
            );
            const emailTarget = rows.map(item => item.email).join(", ");
            await EmailModel.NotifyCreateDriverNVehi(
                driverHTML.join(""),
                vehHTML.join(""),
                emailTarget,
                driverAtth,
                vehAtth
            );
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: "Email Sent",
            });
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
};

FileUploadController.sendToLog = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const driverData = req.body.driver;
            const vehData = req.body.vehicle;
            const idUser = req.cookies.id_user;
            let envvar;
            if (process.env.NODE_ENV === "local") {
                envvar = "local_fe";
            } else if (process.env.node_env === "development") {
                envvar = "server_dev";
            } else {
                envvar = "production";
            }
            const { rows: getHost } = await client.query(
                `select hostname from hostname where phase = $1`,
                [envvar]
            );
            const hostname = getHost[0].hostname;
            const {
                ticketNum,
                ticket_id,
                driverAtth,
                driverHTML,
                vehHTML,
                vehAtth,
            } = await FileUploadModel.newReqDrvVeh(driverData, vehData, idUser);
            const linkapprove =
                hostname +
                `/approval/reqdrvveh?action=approve&ticket_id=${ticket_id}`;
            const linkreject =
                hostname +
                `/approval/reqdrvveh?action=reject&ticket_id=${ticket_id}`;
            const { rows } = await client.query(
                `
            SELECT STRING_AGG(E.EMAIL, ', ') as EMAIL, R.ROLE_NAME FROM MST_EMAIL E
            LEFT JOIN MST_USER U ON E.ID_USER = U.ID_USER
            LEFT JOIN MST_ROLE R ON R.ROLE_ID = U.ROLE
            WHERE R.ROLE_NAME = 'LOGISTIC'
            GROUP BY R.ROLE_NAME
            `
            );
            const emailTarget = rows.map(item => item.email).join(", ");
            await EmailModel.ApprovalRequest(
                driverHTML.join(""),
                vehHTML.join(""),
                emailTarget,
                driverAtth,
                vehAtth,
                ticketNum,
                linkapprove,
                linkreject
            );
            res.status(200).send({
                message: `${ticketNum} Approval Request has been created`,
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

FileUploadController.downloadFile = async (req, res) => {
    const filename = req.body.filename;
    const type = req.body.type;
    let pathDwn = "";
    if (os.platform() === "linux") {
        pathDwn = `${path.resolve()}/public/${type}/${filename}`;
    } else {
        pathDwn = `${path.resolve()}\\public\\${type}\\${filename}`;
    }
    res.download(pathDwn, err => {
        if (err) {
            // Handle errors here
            console.error("Error during download:", err);
            res.status(500).send({
                message: "error during download",
            });
        } else {
            // Download was successful
            console.log("File downloaded successfully");
        }
    });
};

FileUploadController.getDataReqDrvVeh = async (req, res) => {
    try {
        const client = await db.connect();
        const req_id = req.query.ticket_id;
        try {
            const { rows } = await client.query(
                `
            select
            uuid,
            request_id,
            case 
                when expired_at > now() then false
                else true
            end as is_expired,
            expired_at,
            mu.fullname,
            position,
            rdv.is_active,
            me.email
        from
            req_drvr_vhcl rdv
        left join mst_user mu on
            mu.id_user = rdv.create_by
        left join (
            select
                string_agg(email,
                ',') as email,
                id_user
            from
                mst_email
            group by
                id_user) me on
            me.id_user = rdv.create_by
            where rdv.uuid = $1 `,
                [req_id]
            );
            res.status(200).send(rows[0]);
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

FileUploadController.ApproveReqDrvVeh = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const action = req.body.action;
            const driver = req.body.driver;
            const vehicle = req.body.vehicle;
            const id_user = req.cookies.id_user;
            const reasonReject = req.body.reject_remark;
            const plant = req.body.plant;
            const id = req.body.id;
            const result = await FileUploadModel.processDrvVeh({
                id: id,
                plant: plant,
                driverData: driver,
                vehData: vehicle,
                id_user: id_user,
                action: action,
                reject_remark: reasonReject,
            });
            const { rows: getEmailCC } = await client.query(
                `select string_agg(email, ',') as email from mst_email
            where id_user in ($1, $2)`,
                [result.create_by, id_user]
            );
            const { rows: getEmailTarget } = await client.query(
                `select string_agg(me.email, ',') as email from mst_email me 
            left join mst_user mu on mu.id_user = me.id_user 
            where mu.plant_code = $1`,
                [plant]
            );
            await EmailModel.RequestCreateDrvVeh(
                result.driverHTML,
                result.vehHTML,
                getEmailCC[0].email,
                getEmailTarget[0].email,
                result.driverAtth,
                result.vehAtth,
                result.notDriver,
                result.notVeh,
                result.ticketNum,
                reasonReject
            );
            res.status(200).send({
                message: `Request ${result.ticketNum} Approved`,
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

FileUploadController.RejectReqDrvVeh = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const action = req.body.action;
            const reject_remark = req.body.reject_remark;
            const id = req.body.id;
            const id_user = req.cookies.id_user;
            const result = await FileUploadModel.processDrvVeh({
                id: id,
                id_user: id_user,
                action: action,
                reject_remark: reject_remark,
            });
            const { rows: getEmailCC } = await client.query(
                `select string_agg(email, ',') as email from mst_email
            where id_user = $1`,
                [id_user]
            );
            const { rows: getEmailTarget } = await client.query(
                `select string_agg(email, ',') as email from mst_email
            where id_user = $1`,
                [result.create_by]
            );
            await EmailModel.RejectRequestDrvVeh(
                getEmailCC[0].email,
                getEmailTarget[0].email,
                reject_remark,
                result.nodriver,
                result.noveh,
                result.ticket_num
            );
            res.status(200).send({
                message: `Request ${result.ticket_num} rejected`,
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

FileUploadController.CreatedKrani = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const req_uuid = req.body.req_uuid;
            const { create_by, ticket_num, driver, vehicle } =
                await FileUploadModel.CreatedKrani({ req_uuid: req_uuid });
            const { rows: getEmailTarget } = await client.query(
                `select string_agg(email, ',') as email from mst_email
            where id_user = $1`,
                [create_by]
            );
            const { rows: getEmailCC } = await client.query(
                `select
                    string_agg(me.email, ',') as email 
                from
                    mst_email me
                left join mst_user mu on
                    me.id_user = mu.id_user
                left join mst_role mr on
                    mu."role" = mr.role_id
                where
                    mr.role_name = 'LOGISTIC'`
            );
            EmailModel.ProcessedKrani(
                getEmailTarget[0].email,
                getEmailCC[0].email,
                driver,
                vehicle,
                ticket_num
            );
            res.status(200).send({
                message: "Success created driver and vehicle",
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
module.exports = FileUploadController;
