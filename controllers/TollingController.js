const TicketGen = require("../helper/TicketGen");
const Tolling = require("../models/TollingModel");
const db = require("../config/connection");
const TRANS = require("../config/transaction");
const EmailModel = require("../models/EmailModel");
const fs = require("fs");
const path = require("path");
const TollingController = {};

TollingController.getSTOTolling = async (req, res) => {
    try {
        const { sto } = req.query;
        const dataSTO = await Tolling.GetSTOTolling(sto);
        res.status(200).send({
            data: dataSTO,
        });
    } catch (error) {
        console.error(error);
        let err_msg = error.message.trim();
        if (err_msg === "Error") {
            err_msg = "STO is not Tolling";
        }
        res.status(500).send({
            message: err_msg,
        });
    }
};

TollingController.SaveRequestTolling = async (req, res) => {
    try {
        const { payload } = req.body;
        const session = req.cookies;
        const saveTolling = await Tolling.SaveRequestTolling(payload, session);
        res.status(200).send({
            message: "Data Saved Successfully",
            data: saveTolling,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
            cause: error.cause,
        });
    }
};

TollingController.DeleteByCust = async (req, res) => {
    try {
        const { id } = req.body;
        await Tolling.DeleteRequestTolling(id);
        res.status(200).send({
            message: "Tolling Request Deleted",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.TestTollingGen = async (req, res) => {
    try {
        const { username, lasttolreq } = req.query;
        const tolling_req = TicketGen.GenTollingReq(username, lasttolreq);
        res.status(200).send(tolling_req);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.AllTollReq = async (req, res) => {
    try {
        const session = req.cookies;
        const c_grp = req.query.cgrp;
        const data_req = await Tolling.AllReqToll(session, c_grp);
        res.status(200).send({
            data: data_req,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetById = async (req, res) => {
    try {
        const { id } = req.query;
        const data = await Tolling.GetById(id);
        res.status(200).send({
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSReqTolling = async (req, res) => {
    try {
        const { filters } = req.body;
        const dataosreq = await Tolling.GetOSReqTolling(filters);
        res.status(200).send(dataosreq);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSCustTolling = async (req, res) => {
    const { limit, offset, q } = req.query;
    try {
        const data = await Tolling.GetOSCust(limit, offset, q);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSSTOTolling = async (req, res) => {
    const { limit, offset, cust } = req.query;
    try {
        if (!cust) {
            throw new Error("Please Provide Customer Code");
        }
        const data = await Tolling.GetOSSTOReq(limit, offset, cust);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.ApproveTollingReq = async (req, res) => {
    const { data_req } = req.body;
    const session = req.cookies;

    try {
        const created_ln = await Tolling.ApproveTollingReq(data_req, session);
        res.status(200).send({
            created: created_ln,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetPrintTolling = async (req, res) => {
    try {
        const { filters } = req.body;
        const { id_user, role } = req.cookies;
        let customer_id = "";
        if (!["ADMIN", "LOGISTIC", "COMMERCIAL"].includes(role)) {
            customer_id = id_user;
        }
        const result = await Tolling.GetPrintTol(filters, customer_id);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetPrintTollingv2 = async (req, res) => {
    try {
        const { filters } = req.body;
        let customer_id = "";
        if (Object.keys(req.cookies).length > 0) {
            const { username, role } = req.cookies;
            if (!["ADMIN", "LOGISTIC", "COMMERCIAL"].includes(role)) {
                customer_id = username;
            }
        }
        const result = await Tolling.GetPrintTolv2(filters, customer_id);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.PrintTolling = async (req, res) => {
    try {
        const { id } = req.body;
        const { doc, id_sto } = await Tolling.PrintTolling(id);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="SuratJalan_DO-${id_sto}.pdf"`
        );
        doc.pipe(res);
        res.status(200);
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.PrintTollingv2 = async (req, res) => {
    try {
        const { id } = req.body;
        const { doc, batch_code } = await Tolling.PrintTollingv2(id);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="SuratJalanTolling_BATCH-${batch_code}.pdf"`
        );
        doc.pipe(res);
        res.status(200);
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.PrintTollingv3 = async (req, res) => {
    try {
        const { id } = req.body;
        const { batch_code } = await Tolling.PrintTollingv3(id);
        const zipPath = path.join(path.resolve(), `/${batch_code}_Tolling.zip`);
        const folderPath = path.join(path.resolve(), `/${batch_code}`);

        // Send the file for download
        await res.download(zipPath, `${batch_code}_Tolling.zip`, async err => {
            if (err) {
                console.error("Error downloading the file: ", err);
                res.status(500).send({
                    message: "Error downloading the file",
                });
                return;
            }

            // Clean up the ZIP file and folder after the download
            try {
                fs.unlinkSync(zipPath); // Delete the ZIP file
                fs.rmSync(folderPath, { recursive: true, force: true }); // Delete the folder and its contents
                console.log("Cleaned up ZIP and folder successfully");
            } catch (cleanupError) {
                console.error("Error cleaning up files: ", cleanupError);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.ReqDeleteLNTol = async (req, res) => {
    const { selected, remarks } = req.body;
    const { id_user, username } = req.cookies;

    try {
        const delete_data = await Tolling.requestDelete(
            selected,
            remarks,
            id_user
        );
        res.status(200).send({
            message: "Delete Loading Note Requested",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.ProcessDeleteReq = async (req, res) => {
    try {
        const { selected, remark_reject, action } = req.body;
        const { id_user } = req.cookies;
        let target, cc;
        const create_by = selected[0].create_by;
        const plant = selected[0].plant;
        let payload;
        let loadNote = [];
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            if (action === "APPROVE") {
                const { rows: emailCust } = await client.query(
                    `select string_agg(me.email, ',') as email from mst_email me where id_user = $1 `,
                    [create_by]
                );
                const { rows: emailKrani } = await client.query(
                    `select 
                case 
                    when string_agg(me.email, ',') is not null then string_agg(me.email, ',')
                    else (select string_agg(me.email, ',') from mst_email me
                left join mst_user mu on me.id_user = mu.id_user 
                left join mst_role mr on mr.role_id = mu."role" 
                where mr.role_name = 'KRANIWB')
                end as email from mst_email me
                left join mst_user mu on me.id_user = mu.id_user 
                where mu.plant_code = $1; `,
                    [plant]
                );
                const { rows: emailLog } = await client.query(
                    `select string_agg(me.email, ',') as email from mst_email me where id_user = $1 `,
                    [id_user]
                );
                target = [emailCust[0].email, emailKrani[0].email];
                cc = emailLog[0].email;
                payload = {
                    key: "is_active",
                    value: false,
                };
            } else if (action === "REJECT") {
                const { rows: emailCust } = await client.query(
                    `select string_agg(me.email, ',') as email from mst_email me where id_user = $1 `,
                    [create_by]
                );
                const { rows: emailLog } = await client.query(
                    `select string_agg(me.email, ',') as email from mst_email me where id_user = $1 `,
                    [id_user]
                );
                target = emailCust[0].email;
                cc = emailLog[0].email;
                payload = {
                    key: "respon_del",
                    value: remark_reject,
                };
            }
            for (const d of selected) {
                const { rows } = await client.query(
                    `update tolling set ${payload.key} = $1 where det_id = $2`,
                    [payload.value, d.id]
                );
                loadNote.push(
                    `
                        <tr>
                         <td>${d.ln_num}</td>
                         <td>${d.tanggal_surat_jalan}</td>
                         <td>${d.plant}</td>
                         <td>${d.driver_id} - ${d.driver_name}</td>
                         <td>${d.vhcl_id}</td>
                         <td>${d.plan_qty.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${d.uom}</td>
                        </tr>
                        `
                );
            }
            if (action === "APPROVE") {
                await EmailModel.ApproveDeleteReq(target, cc, loadNote);
            } else if (action === "REJECT") {
                await EmailModel.RejectDeleteReq(
                    target,
                    cc,
                    loadNote,
                    remark_reject
                );
            }
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: "Request have been processed",
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
        //process delete
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.ShowCreatedLN = async (req, res) => {
    try {
        const { q, limit, offset } = req.query;
        const { id_user, role } = req.cookies;
        const data = await Tolling.ShowCreatedLN(
            q,
            limit,
            offset,
            id_user,
            role
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.SyncTollingWBNET = async (req, res) => {
    try {
        const data = await Tolling.SyncTollingWBNET();
        let message = "";
        if (!data.length > 0) {
            message = "Sync clear";
        } else {
            message = "Data synced";
        }
        res.status(200).send({
            data: data,
            message: message,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = TollingController;
