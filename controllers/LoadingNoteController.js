const LoadNote = require("../models/LoadingNoteModel");
const CleanUp = require("../helper/Cleanup");
const db = require("../config/connection");
const axios = require("axios");
const q = require("../helper/Q");
const fs = require("fs");
const Crud = require("../helper/crudquery");
const TRANS = require("../config/transaction");
const EmailGen = require("../helper/EmailGen");
const EmailModel = require("../models/EmailModel");

const LoadingNoteController = {};

LoadingNoteController.SaveLoadingNoteDB = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const insertData = await LoadNote.refSaveLoadingNoteDB(
            payload,
            session
        );
        const message = payload.is_draft
            ? "Draft Saved"
            : "Loading Note Requested";
        res.status(200).send({
            message: message,
            ...insertData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.sendToLogistic = async (req, res) => {
    try {
        const id_header = req.body.id_header;
        const insertData = await LoadNote.sendToLogistic(id_header);
        res.status(200).send({
            message: insertData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP = async (req, res) => {
    try {
        const payload = req.body;
        const isDraft = req.body.is_draft;
        const session = req.cookies;

        const insertSAP = await LoadNote.finalizeLoadingNote(payload, session);
        const message = !isDraft
            ? "Loading Note " + insertSAP + " is created"
            : "Draft Saved";
        res.status(200).send({
            message: message,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.cancelReqLN = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const cancelLN = await LoadNote.cancelLoadingNote(payload, session);
        res.status(200).send({
            message: cancelLN,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showAll = async (req, res) => {
    try {
        const data = await LoadNote.showAllLoadNote();
        res.status(200).send({
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: message,
        });
    }
};

LoadingNoteController.getById = async (req, res) => {
    const idloadnote = req.query.idloadnote;
    const client = await db.connect();
    try {
        const result = await LoadNote.getById2(idloadnote);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

LoadingNoteController.showSLoc = async (req, res) => {
    try {
        const plant = req.query.plant;
        const sLoc = await LoadNote.showSLoc(plant);
        res.status(200).send(sLoc);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showOSReqLN = async (req, res) => {
    // filters :
    /*
   [
    id : <key>,
    value : value
   ]
    pagination : 
    {
       pageIndex :
       pageSize :
    }

    sorting : {
       id : <key> , desc : bool
    }
    */

    try {
        const filter = req.body.filter;
        const pagination = req.body.pagination;
        const sorting = req.body.sorting;
        const data = await LoadNote.getRequestedLoadNote(
            filter,
            pagination,
            sorting
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showOSReqLN2 = async (req, res) => {
    try {
        const filter = req.body.filters;
        const who = req.body.who;
        const data = await LoadNote.getRequestedLoadNote2(filter, who);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getOSLoadingNoteNum = async (req, res) => {
    try {
        const cust = req.query.cust;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const who = req.query.who;
        const dataLN = await LoadNote.getOSLoadingNoteNum2(limit, offset, cust);
        res.status(200).send(dataLN);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getOSLoadingNoteNumWB = async (req, res) => {
    try {
        const cust = req.query.cust;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const who = req.query.who;
        const dataLN = await LoadNote.getOSLoadingNoteNumWB(
            limit,
            offset,
            cust
        );
        res.status(200).send(dataLN);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP_2 = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const insertSAP = await LoadNote.finalizeLoadingNote_2(
            payload,
            session
        );
        res.status(200).send(insertSAP);
    } catch (error) {
        console.error(error.stack);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP_3 = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const password = req.body.password;
        const insertSAP = await LoadNote.finalizeLoadingNote_3(
            payload,
            session
        );
        q.pushJob(
            new Promise(async (reject, resolve) => {
                try {
                    const { data } = await axios.get(
                        `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXSet?&$format=json`,
                        {
                            auth: {
                                username: session.username,
                                password: password,
                            },
                        }
                    );
                    resolve("Success Push");
                } catch (error) {
                    reject(error.response?.data.message);
                }
            })
        );
        res.status(200).send({
            message: "Data Pushed to SAP",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getAllDataLNbyUser = async (req, res) => {
    try {
        const session = req.cookies;
        const isallow = req.query.isallow === "true" ? true : false;
        const data = await LoadNote.getAllDataLNbyUser_2(
            session,
            isallow,
            "LCO"
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getAllDataLNbyUserFRC = async (req, res) => {
    try {
        const session = req.cookies;
        const isallow = req.query.isallow === "true" ? true : false;
        const data = await LoadNote.getAllDataLNbyUser_2(
            session,
            isallow,
            "FRC"
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getDataOSUser = async (req, res) => {
    try {
        const session = req.cookies;
        const data = await LoadNote.getDataOSUser(session);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getDataLastReq = async (req, res) => {
    try {
        const data = await LoadNote.getDataLastReq();
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getDataRecap = async (req, res) => {
    try {
        const data = await LoadNote.getRecap();
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getDataRecapSS = async (req, res) => {
    try {
        const filters = req.body.filters;
        let customer_id = req.cookies.username;
        if (req.cookies.role === "ADMIN" || req.cookies.role === "LOGISTIC") {
            customer_id = "";
        }
        const data = await LoadNote.getSSRecap(filters, customer_id);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            messsage: error.message,
        });
    }
};

LoadingNoteController.generateExcel = async (req, res) => {
    try {
        const filters = req.body.filters;
        let customer_id = req.cookies.username;
        if (req.cookies.role === "ADMIN" || req.cookies.role === "LOGISTIC") {
            customer_id = "";
        }
        const data = await LoadNote.generateExcel(filters, customer_id);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "data.xlsx"
        );
        await data.xlsx.write(res);
        res.status(200);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send({
            messsage: error.message,
        });
    }
};

LoadingNoteController.getDefValtypeSloc = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const plantcode = req.query.plant;
            const { rows } = await client.query(
                `SELECT fac_sloc, oth_sloc, fac_valtype, oth_valtype, fac_sloc_desc, oth_sloc_desc from MST_DEFAULT_SLOC_VALTYPE WHERE plant = $1`,
                [plantcode]
            );
            res.status(200).send(rows[0]);
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

LoadingNoteController.LoadingNoteDashboard = async (req, res) => {
    const id_user = req.cookies.id_user;
    const do_num = req.query.do_num;
    const limit = req.query.limit;
    const offset = req.query.offset;
    try {
        const client = await db.connect();
        try {
            const { rows: dataLn } = await client.query(
                `SELECT ln_num, plan_qty, actual_qty, bruto, tarra, netto, ffa, moist, dirt, hd.uom, tanggal_surat_jalan, TO_CHAR(TANGGAL_SURAT_JALAN, 'Month') as current_month, hd.id_do from loading_note_det det
            left join loading_note_hd hd on det.hd_fk = hd.hd_id
            where hd.create_by = $1
            and hd.id_do = $2
            LIMIT ${limit} OFFSET ${offset}`,
                [id_user, do_num]
            );
            const { rowCount } = await client.query(
                `SELECT ln_num, plan_qty, actual_qty, bruto, tarra, netto, ffa, moist, dirt, hd.uom, tanggal_surat_jalan, TO_CHAR(TANGGAL_SURAT_JALAN, 'Month') as current_month, hd.id_do from loading_note_det det
            left join loading_note_hd hd on det.hd_fk = hd.hd_id
            where hd.create_by = $1
            and hd.id_do = $2`,
                [id_user, do_num]
            );
            res.status(200).send({
                data: dataLn,
                size: rowCount,
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

LoadingNoteController.ChartDashboard = async (req, res) => {
    const year = req.query.year;
    const id_do = req.query.id_do;
    try {
        const client = await db.connect();
        const startyear = `${year}-01-01`;
        const endyear = `${year}-12-01`;
        try {
            const { rows } = await client.query(
                `
                SELECT
                TO_CHAR(GENERATE_SERIES, 'MM') AS CTR,
                SUBSTR(TO_CHAR(GENERATE_SERIES, 'Month'), 1, 3) AS MTH,
                COALESCE(VAL_DET.PLAN_QTY, 0) AS PLAN_QTY,
                COALESCE(VAL_DET.ACTUAL_QTY, 0) AS ACTUAL_QTY,
                COALESCE(VAL_DET.FFA, 0) AS FFA,
                COALESCE(VAL_DET.MOIST, 0) AS MOIST,
                COALESCE(VAL_DET.DIRT, 0) AS DIRT
            FROM GENERATE_SERIES($1::date, $2::date, '1 month'::interval)
            LEFT JOIN (
                SELECT 
                    TO_CHAR(TANGGAL_SURAT_JALAN, 'MM') AS CTR,
                    SUBSTR(TO_CHAR(TANGGAL_SURAT_JALAN, 'Month'), 1, 3) AS MTH,
                    COALESCE(SUM(PLAN_QTY), 0) AS PLAN_QTY,
                    COALESCE(SUM(ACTUAL_QTY), 0) AS ACTUAL_QTY,
                    COALESCE(AVG(FFA), 0) AS FFA,
                    COALESCE(AVG(MOIST), 0) AS MOIST,
                    COALESCE(AVG(DIRT), 0) AS DIRT
                FROM LOADING_NOTE_DET DET
                LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                WHERE DET.LN_NUM IS NOT NULL AND TO_CHAR(TANGGAL_SURAT_JALAN, 'YYYY') = $3 AND HD.id_do = $4
                GROUP BY MTH, CTR
            ) AS VAL_DET ON VAL_DET.CTR = TO_CHAR(GENERATE_SERIES, 'MM');
            `,
                [startyear, endyear, year, id_do]
            );
            res.status(200).send(rows);
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

LoadingNoteController.syncDataWB = async (req, res) => {
    try {
        const syncedData = await LoadNote.syncDataWB();
        res.status(200).send({
            message: "Updated Successfully",
            data: syncedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.cleanUpLN = async (req, res) => {
    try {
        await CleanUp.loadingNoteClean();
        res.status(200).send({
            message: "Loading Note Cleaned",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showHistoricalLN = async (req, res) => {
    try {
        const { role, id_user } = req.cookies;
        const { limit, offset, start, end, q } = req.query;
        const result = await LoadNote.showHistoricalLoadingNote(
            q,
            limit,
            offset,
            start,
            end,
            id_user,
            role
        );
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showCreatedLN = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = req.query.limit;
        const offset = req.query.offset;

        const result = await LoadNote.showCreatedLN(
            q,
            limit,
            offset,
            req.cookies.id_user,
            req.cookies.role
        );
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.deleteRequest = async (req, res) => {
    try {
        const { selected, remark_delete } = req.body;
        const requestDel = LoadNote.requestDelete(selected, remark_delete);
        res.status(200).send({
            message: "Delete Request Successfully Sent",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.processDelete = async (req, res) => {
    try {
        const { selected, remark_reject, action, password } = req.body;
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
                if (action === "APPROVE") {
                    const { data } = await axios.get(
                        `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELDOCSet?$filter=(Bukrs eq '${d.company}')and(Zdconr eq '${d.ln_num}')&$format=json`,
                        {
                            auth: {
                                username: req.cookies.username,
                                password: password,
                            },
                        }
                    );
                }
                const { rows } = await client.query(
                    `update loading_note_det set ${payload.key} = $1 where det_id = $2`,
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

module.exports = LoadingNoteController;
