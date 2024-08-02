const db = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const TRANS = require("../config/transaction");
const ExcelJS = require("exceljs");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const ncrypt = require("ncrypt-js");
// const noderfc = require("node-rfc");
// const INDICATOR = require("../config/IndicateRFC");
const moment = require("moment");
// noderfc.setIniFileDirectory(process.env.SAPINIFILE);
// const poolRFC = require("../config/rfcconnection");
const axios = require("axios");
const EmailModel = require("../models/EmailModel");
const { Pool, sqls } = require("../config/sqlservconn");

const LoadingNoteModel = {};

LoadingNoteModel.saveLoadingNoteDB = async (params, session) => {
    const client = await db.connect();
    let que, val;
    const idLoad = params.uuid !== "" ? params.uuid : uuid.uuid();
    try {
        await client.query(TRANS.BEGIN);
        const method = params.method;
        const is_draft = params.is_draft;
        const today = new Date();
        const payload = {
            id_do: params.do_num,
            inv_type: params.inv_type,
            inv_tol_from: params.inv_type_tol_from,
            inv_tol_to: params.inv_type_tol_to,
            incoterms_1: params.incoterms_1,
            incoterms_2: params.incoterms_2,
            item_rule: params.rules,
            con_num: params.con_num,
            material_code: params.material,
            os_deliv: params.os_deliv,
            plant: params.plant,
            description: params.description,
            uom: params.uom,
            driver_id: params.driver,
            vhcl_num: params.vehicle,
            created_date: params.loading_date,
            pl_load_qty: params.planned_qty,
            factory_plt: params.plant,
            factory_sloc: params.fac_store_loc,
            oth_factory_plt: params.plant,
            oth_factory_sloc: params.oth_store_loc,
            factory_batch: params.company_code,
            oth_party_batch: params.do_num,
            factory_valtype: params.fac_val_type,
            oth_party_valtype: params.oth_val_type,
            is_paid: params.is_paid,
            driver_name: params.driver_name,
            uuid: idLoad,
            company_code: params.company_code,
            media_tp: params.media_tp,
            created_by: session.id_user,
        };
        if (is_draft) {
            payload.cur_pos = "INIT";
        } else {
            payload.cur_pos = "FINA";
        }
        if (method == "insert") {
            payload.created_at = today;
            [que, val] = crud.insertItem("loading_note", payload, "id_do");
        } else {
            delete payload.uuid;
            [que, val] = crud.updateItem(
                "loading_note",
                payload,
                { uuid: idLoad },
                "id_do"
            );
        }
        const { rows } = await client.query(que, val);
        await client.query(TRANS.COMMIT);
        return {
            is_draft: is_draft,
            uuid: idLoad,
            data: rows[0],
        };
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

LoadingNoteModel.refSaveLoadingNoteDB = async (params, session) => {
    try {
        const client = await db.connect();
        let que, val;
        const promises = [];
        let detailId = {};
        let deleteIdx = [];
        try {
            await client.query(TRANS.BEGIN);
            const is_draft = params.is_draft;
            const today = new Date();
            const details = params.load_detail;
            const id_header =
                params.id_header !== "" ? params.id_header : uuid.uuid();
            let payloadHeader = {
                hd_id: id_header,
                id_do: params.do_num,
                invoice_type: params.inv_type,
                tol_from: params.inv_type_tol_from,
                tol_to: params.inv_type_tol_to,
                inco_1: params.incoterms_1,
                inco_2: params.incoterms_2,
                rules: params.rules,
                con_num: params.con_num,
                material: params.material,
                con_qty: params.con_qty,
                uom: params.uom,
                plant: params.plant,
                company: params.company,
                desc_con: params.description,
                create_at: today,
                create_by: session.id_user,
                is_active: true,
                is_paid: params.is_paid,
                cur_pos: "INIT",
            };
            if (params.sto_num && params.sto_num !== "") {
                payloadHeader.id_sto = params.sto_num;
                payloadHeader.trans_type = params.trans_type;
            }
            if (params.id_header === "") {
                [que, val] = crud.insertItem(
                    "loading_note_hd",
                    payloadHeader,
                    "hd_id"
                );
            } else {
                [que, val] = crud.updateItem(
                    "loading_note_hd",
                    payloadHeader,
                    { hd_id: id_header },
                    "hd_id"
                );
            }
            await client.query(que, val);
            details.forEach((rows, index) => {
                const id_detail =
                    rows.id_detail !== "" ? rows.id_detail : uuid.uuid();
                const payloadDetail = {
                    hd_fk: id_header,
                    det_id: id_detail,
                    driver_id: rows.driver_id,
                    driver_name: rows.driver_name,
                    vhcl_id: rows.vehicle,
                    media_tp: rows.media_tp,
                    cre_date: moment().format("YYYY-MM-DD"),
                    tanggal_surat_jalan: rows.loading_date,
                    plan_qty: rows.planned_qty,
                    fac_plant: params.plant,
                    oth_plant: params.plant,
                    fac_batch: params.company,
                    oth_batch: params.do_num,
                    fac_sloc: "",
                    oth_sloc: "",
                    create_at: today,
                    create_by: session.id_user,
                    is_active: true,
                    is_pushed: false,
                    is_multi: rows.is_multi,
                    multi_do: rows.multi_do,
                };
                if (rows.id_detail === "") {
                    [que, val] = crud.insertItem(
                        "loading_note_det",
                        payloadDetail,
                        "det_id"
                    );
                    detailId[index] = id_detail;
                    promises.push(client.query(que, val));
                } else {
                    if (rows.method === "delete") {
                        deleteIdx.push(index);
                        promises.push(
                            client.query(
                                "DELETE FROM loading_note_det WHERE det_id = $1",
                                [rows.id_detail]
                            )
                        );
                    } else {
                        [que, val] = crud.updateItem(
                            "loading_note_det",
                            payloadDetail,
                            { det_id: id_detail },
                            "det_id"
                        );
                        promises.push(client.query(que, val));
                    }
                }
            });
            await Promise.all(promises);
            await client.query(TRANS.COMMIT);
            return {
                detailId: detailId,
                deleteIdx: deleteIdx,
                id_header: id_header,
            };
        } catch (error) {
            console.error(error);
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

LoadingNoteModel.sendToLogistic = async id_header => {
    try {
        const client = await db.connect();
        try {
            let tabledet = [];
            const { rows: hostname } = await client.query(
                `SELECT hostname from hostname where phase = 'development'`
            );
            const { rows, rowCount } = await client.query(
                `SELECT HD.HD_ID,
                HD.ID_DO,
                HD.CUR_POS,
                CONCAT(HD.MATERIAL, ' - ', HD.DESC_CON) AS MATERIAL,
                HD.PLANT,
                HD.UOM,
                EM.EMAIL,
                CONCAT(CUS.KUNNR,
            
                    ' - ',
                    CUS.NAME_1) AS CUSTOMER
            FROM LOADING_NOTE_HD HD
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUS ON USR.USERNAME = CUS.KUNNR
            LEFT JOIN
            (
                SELECT STRING_AGG(EM.EMAIL, ', ') AS EMAIL, US.id_user FROM MST_USER US
                LEFT JOIN MST_EMAIL EM ON EM.ID_USER = US.ID_USER
                LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = US.ROLE
                GROUP BY US.id_user
            ) EM ON EM.id_user = USR.id_user
            WHERE HD.HD_ID = $1`,
                [id_header]
            );
            const { rows: dataDetail } = await client.query(
                `SELECT DRIVER_NAME, DRIVER_ID, VHCL_ID, 
                TO_CHAR(CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE, PLAN_QTY FROM LOADING_NOTE_DET
                WHERE HD_FK = $1`,
                [id_header]
            );
            const dataEmail = rows[0];
            for (d of dataDetail) {
                tabledet.push(`
                <tr>
                    <td>${d.driver_name} (${d.driver_id})</td>
                    <td>${d.vhcl_id}</td>
                    <td>${d.cre_date}</td>
                    <td>${d.plan_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )} ${dataEmail.uom}</td>
                </tr>
                `);
            }
            const { rows: dataLogistic } = await client.query(
                `SELECT STRING_AGG(EM.EMAIL, ', ') AS EMAIL, RL.ROLE_NAME FROM MST_EMAIL EM
                LEFT JOIN MST_USER US ON EM.ID_USER = US.ID_USER
                LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = US.ROLE
                WHERE RL.ROLE_NAME = 'LOGISTIC'
                GROUP BY RL.ROLE_NAME`
            );
            const email_target = dataLogistic[0].email;
            const cc_target = rows[0].email;
            if (rowCount < 0) {
                throw new Error("Loading Note Header not Found");
            } else if (rows[0].cur_pos !== "INIT") {
                throw new Error("Loading Note not in Customer position");
            }
            const dataHeader = rows[0];
            const [queUp, valUp] = crud.updateItem(
                "LOADING_NOTE_HD",
                { CUR_POS: "FINA" },
                { hd_id: id_header },
                "hd_id"
            );
            const updateData = await client.query(queUp, valUp);
            await EmailModel.notifyRequestSend(
                dataEmail.id_do,
                dataEmail.customer,
                dataEmail.material,
                dataEmail.plant,
                tabledet.join(" "),
                email_target,
                cc_target,
                hostname[0].hostname
            );
            return {
                message: "Success updating loading note ",
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

LoadingNoteModel.showAllLoadNote = async () => {
    const client = await db.connect();
    try {
        const { rows } = await client.query(`SELECT ID_LOADNOTE,
        ID_DO,
        PLANT,
        co.name,
        CONCAT(PL_LOAD_QTY,
      
          ' ',
          UOM) AS PLANNED_QTY,
        IS_PAID,
        CUR_POS,
        UUID as id,
        TO_CHAR(CREATED_DATE, 'YYYY/MM/DD') as CREATED_DATE
      FROM LOADING_NOTE lnt
      LEFT JOIN mst_company co on lnt.company_code = co.sap_code `);
        return rows;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

// LoadingNoteModel.finalizeLoadingNote = async (params, session) => {
//     const client = await db.connect();
//     const rfcclient = new noderfc.Client({ dest: "Q13" });
//     const today = new Date();
//     // let que, val;
//     const idLoad = params.uuid;
//     try {
//         await client.query(TRANS.BEGIN);
//         await rfcclient.open();
//         const is_draft = params.is_draft;
//         const payload = {
//             id_do: params.do_num,
//             inv_type: params.inv_type,
//             inv_tol_from: params.inv_type_tol_from,
//             inv_tol_to: params.inv_type_tol_to,
//             incoterms_1: params.incoterms_1,
//             incoterms_2: params.incoterms_2,
//             item_rule: params.rules,
//             con_num: params.con_num,
//             material_code: params.material,
//             os_deliv: params.os_deliv,
//             plant: params.plant,
//             description: params.description,
//             uom: params.uom,
//             driver_id: params.driver,
//             vhcl_num: params.vehicle,
//             created_date: params.loading_date,
//             pl_load_qty: params.planned_qty,
//             factory_plt: params.fac_plant,
//             factory_sloc: params.fac_store_loc,
//             oth_factory_plt: params.oth_plant,
//             oth_factory_sloc: params.oth_store_loc,
//             factory_batch: params.fac_batch,
//             oth_party_batch: params.oth_batch,
//             factory_valtype: params.fac_val_type,
//             oth_party_valtype: params.oth_val_type,
//             is_paid: params.is_paid,
//             driver_name: params.driver_name,
//             company_code: params.company_code,
//             media_tp: params.media_tp,
//             update_at: today,
//             update_by: session.id_user,
//         };
//         const param = {
//             I_RECORD_REGISTRA: {
//                 BUKRS: params.company_code,
//                 UPLOADID: "1",
//                 DOTYPE: "S",
//                 ITEMRULE: params.rules,
//                 VBELN_REF: params.do_num,
//                 POSNR: "000010",
//                 EBELN_REF: "",
//                 CREDAT: moment(params.loading_date).format("DD.MM.YYYY"),
//                 MATNR: "",
//                 PLN_LFIMG: params.planned_qty.toString(),
//                 DWERKS: params.fac_plant,
//                 DLGORT: params.fac_store_loc,
//                 RWERKS: params.oth_plant,
//                 RLGORT: params.oth_store_loc,
//                 ZZTRANSP_TYPE: params.media_tp,
//                 WANGKUTAN: "",
//                 WNOSIM: params.driver,
//                 WNOPOLISI: params.vehicle,
//                 L_LFIMG: "0",
//                 OP_LFIMG: "0",
//                 DOPLINE: "0000",
//                 VSLCD: "",
//                 VOYNR: "",
//                 DCHARG_1: params.company_code,
//                 RCHARG_1: params.do_num,
//                 RBWTAR_1: params.oth_val_type,
//             },
//         };
//         if (is_draft) {
//             payload.cur_pos = "FINA";
//         } else {
//             const sapPush = await rfcclient.call(
//                 "ZRFC_PRE_REGISTRA_CUST",
//                 param
//             );
//             if (INDICATOR.hasOwnProperty(sapPush.RFC_TEXT)) {
//                 throw new Error(sapPush.RFC_TEXT);
//             } else if (sapPush.RFC_TEXT.includes("is not allowed")) {
//                 throw new Error(sapPush.RFC_TEXT);
//             } else {
//                 const loadingNoteNum = sapPush.RFC_TEXT.replace(
//                     /[^0-9]/g,
//                     ""
//                 ).trim();
//                 payload.id_loadnote = loadingNoteNum;
//             }
//             payload.cur_pos = "END";
//         }
//         const [que, val] = crud.updateItem(
//             "loading_note",
//             payload,
//             { uuid: idLoad },
//             "id_loadnote"
//         );
//         const { rows } = await client.query(que, val);
//         await client.query(TRANS.COMMIT);
//         return rows[0].id_loadnote;
//     } catch (error) {
//         await client.query(TRANS.ROLLBACK);
//         console.error(error);
//         throw error;
//     } finally {
//         client.release();
//     }
// };

// LoadingNoteModel.showSLoc = async plant => {
//     try {
//         const rfcclient = new noderfc.Client({ dest: "Q13" });
//         await rfcclient.open();
//         try {
//             const { I_PLANT, I_SLOC } = await rfcclient.call(
//                 "ZRFC_PRE_REGISTRA_STORELOC",
//                 {
//                     I_PLANT: plant,
//                 }
//             );
//             const dataSloc = I_SLOC.map(item => ({
//                 value: item.LGORT,
//                 label: item.LGORT,
//             }));
//             return dataSloc;
//         } catch (error) {
//             throw error;
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// };

// LoadingNoteModel.getById = async id_header => {
//     try {
//         const client = await db.connect();
//         const rfcclient = new noderfc.Client({ dest: "Q13" });
//         await rfcclient.open();
//         try {
//             const { rows } = await client.query(
//                 `SELECT HD.*,
//                 DET.*
//             FROM LOADING_NOTE_HD HD
//             LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
//             WHERE HD.hd_id = $1`,
//                 [id_header]
//             );
//             let plan_qty_con = 0;
//             const detail = rows.map(item => {
//                 plan_qty_con += parseFloat(item.plan_qty);
//                 return {
//                     id_detail: item.det_id,
//                     vehicle: { value: item.vhcl_id, label: item.vhcl_id },
//                     driver: {
//                         value: item.driver_id,
//                         label: item.driver_id + " - " + item.driver_name,
//                     },
//                     loading_date: item.cre_date,
//                     planned_qty: item.plan_qty,
//                     media_tp: item.media_tp,
//                     multi_do: item.multi_do,
//                     is_multi: item.is_multi,
//                 };
//             });
//             console.log(plan_qty_con);
//             const hd_dt = rows[0];
//             const rfcResponse = await rfcclient.call("ZRFC_PRE_REGISTRA_SLIP", {
//                 I_VBELN: hd_dt.id_do,
//             });
//             let totalFromSAP = 0;
//             rfcResponse.I_OUTDELIVERY.map(item => {
//                 let planning = parseFloat(item.PLN_LFIMG);
//                 let real = parseFloat(item.L_LFIMG);
//                 totalFromSAP += real === 0 ? planning : real;
//             });
//             const { rows: tempLoadingNote } = await client.query(
//                 `SELECT SUM(PLAN_QTY) AS plan_qty
//                 FROM LOADING_NOTE_DET DET
//                 LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
//                 WHERE HD.ID_DO = $1
//                 AND DET.IS_ACTIVE = TRUE
//                 AND DET.LN_NUM IS NULL`,
//                 [hd_dt.id_do]
//             );
//             const resp = {
//                 do_num: hd_dt.id_do,
//                 inv_type: hd_dt.invoice_type,
//                 inv_type_tol_from: hd_dt.tol_from,
//                 inv_type_tol_to: hd_dt.tol_to,
//                 incoterms: hd_dt.inco_1 + "-" + hd_dt.inco_2,
//                 rules: hd_dt.rules,
//                 con_num: hd_dt.con_num,
//                 material: hd_dt.material,
//                 con_qty: hd_dt.con_qty,
//                 os_qty:
//                     parseFloat(hd_dt.con_qty) -
//                     totalFromSAP -
//                     parseFloat(tempLoadingNote[0].plan_qty) +
//                     plan_qty_con,
//                 totalspend:
//                     totalFromSAP +
//                     parseFloat(tempLoadingNote[0].plan_qty) -
//                     plan_qty_con,
//                 plan_qty_con: plan_qty_con,
//                 plant: hd_dt.plant,
//                 description: hd_dt.desc_con,
//                 uom: hd_dt.uom,
//                 company: hd_dt.company,
//                 load_detail: detail,
//                 fac_plant: hd_dt.fac_plant,
//                 fac_store_loc: hd_dt.fac_sloc,
//                 fac_batch: hd_dt.fac_batch,
//                 fac_val_type: hd_dt.fac_valtype,
//                 oth_plant: hd_dt.oth_plant,
//                 oth_store_loc: hd_dt.oth_sloc,
//                 oth_batch: hd_dt.oth_batch,
//                 oth_val_type: hd_dt.oth_valtype,
//             };
//             return {
//                 data: resp,
//                 id_header: hd_dt.hd_id,
//                 cur_pos: hd_dt.cur_pos,
//                 is_paid: hd_dt.is_paid,
//                 cur_planqty: tempLoadingNote[0].plan_qty,
//             };
//         } catch (error) {
//             throw error;
//         } finally {
//             client.release();
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// };

LoadingNoteModel.getById2 = async id_header => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `SELECT HD.*,
                DET.*
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
            WHERE HD.hd_id = $1`,
                [id_header]
            );
            let plan_qty_con = 0;
            const detail = rows.map(item => {
                plan_qty_con += parseFloat(item.plan_qty);
                return {
                    id_detail: item.det_id,
                    vehicle: { value: item.vhcl_id, label: item.vhcl_id },
                    driver: {
                        value: item.driver_id,
                        label: item.driver_id + " - " + item.driver_name,
                    },
                    loading_date: item.cre_date,
                    planned_qty: item.plan_qty,
                    media_tp: item.media_tp,
                    multi_do: item.multi_do,
                    is_multi: item.is_multi,
                };
            });
            const hd_dt = rows[0];
            const { rows: qtyExcept } = await client.query(
                `SELECT sum(det.plan_qty) as qty
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
            WHERE HD.hd_id <> $1 AND HD.ID_DO = $2 AND DET.is_active = true AND det.ln_num is null`,
                [id_header, hd_dt.id_do]
            );
            const { data: I_OUTDELIVERY } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/OUTDELIVSet?$filter=(Vbeln%20eq%20%27${hd_dt.id_do}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            let totalFromSAP = 0;
            I_OUTDELIVERY.d.results.map(item => {
                let planning = parseFloat(item.PlnLfimg);
                let real = parseFloat(item.LLfimg);
                totalFromSAP += real === 0 ? planning : real;
            });

            const { data: DOTRXDELETE } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELETESet?$filter=(VbelnRef%20eq%20%27${hd_dt.id_do}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            // console.log("deleted sap:");
            let deletedLN = 0;
            if (DOTRXDELETE.d.results.length > 0) {
                DOTRXDELETE.d.results.map(item => {
                    deletedLN += parseFloat(item.PlnLfimg);
                    totalFromSAP -= parseFloat(item.PlnLfimg);
                });
            }
            const { rows: tempLoadingNote } = await client.query(
                `SELECT SUM(PLAN_QTY) AS plan_qty
                FROM LOADING_NOTE_DET DET
                LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                WHERE HD.ID_DO = $1
                AND DET.IS_ACTIVE = TRUE
                AND DET.LN_NUM IS NULL`,
                [hd_dt.id_do]
            );

            const qtyTemp = tempLoadingNote[0].plan_qty
                ? parseFloat(tempLoadingNote[0].plan_qty)
                : 0;
            const resp = {
                do_num: hd_dt.id_do,
                sto_num: hd_dt.id_sto,
                trans_type: hd_dt.trans_type,
                inv_type: hd_dt.invoice_type,
                inv_type_tol_from: hd_dt.tol_from,
                inv_type_tol_to: hd_dt.tol_to,
                incoterms: hd_dt.inco_1 + "-" + hd_dt.inco_2,
                rules: hd_dt.rules,
                con_num: hd_dt.con_num,
                material: hd_dt.material,
                con_qty: hd_dt.con_qty,
                os_qty: parseFloat(hd_dt.con_qty) - totalFromSAP - qtyTemp,
                totalspend: totalFromSAP + qtyTemp - plan_qty_con,
                totalSAP: totalFromSAP,
                remaining:
                    parseFloat(hd_dt.con_qty) - totalFromSAP - qtyExcept[0].qty,
                plan_qty_con: plan_qty_con,
                plant: hd_dt.plant,
                description: hd_dt.desc_con,
                uom: hd_dt.uom,
                company: hd_dt.company,
                load_detail: detail,
                fac_plant: hd_dt.fac_plant,
                fac_store_loc: hd_dt.fac_sloc,
                fac_batch: hd_dt.fac_batch,
                fac_val_type: hd_dt.fac_valtype,
                oth_plant: hd_dt.oth_plant,
                oth_store_loc: hd_dt.oth_sloc,
                oth_batch: hd_dt.oth_batch,
                oth_val_type: hd_dt.oth_valtype,
            };
            return {
                data: resp,
                id_header: hd_dt.hd_id,
                cur_pos: hd_dt.cur_pos,
                is_paid: hd_dt.is_paid,
                cur_planqty: qtyTemp,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.getRequestedLoadNote = async (
    filters = [],
    pagination = { pageIndex: 0, pageSize: 10 },
    sorting = { id: "id", desc: "true" }
) => {
    try {
        const client = await db.connect();
        try {
            let filter_que = [];
            let filter_val = [];
            let filterStr = "";
            let sortQue = `ORDER BY ${sorting.id} ${sorting.desc ? "DESC" : "ASC"}`;
            let pagiQue = `LIMIT ${pagination.pageSize} OFFSET ${pagination.pageSize * pagination.pageIndex}`;

            if (filters.length !== 0) {
                filters.forEach((item, index) => {
                    filter_que.push(`${item.id} LIKE $${index + 1}`);
                    filter_val.push(`%${item.value}%`);
                });
                filterStr = "WHERE " + filter_que.join(" AND ");
            }
            const baseQ = `SELECT DET.det_id as id,
                HD.hd_id,
                HD.ID_DO,
                HD.PLANT,
                USR.SAP_CODE as cust_code,
                CONCAT(DET.DRIVER_ID,

                    ' - ',
                    DET.DRIVER_NAME) AS DRIVER,
                DET.VHCL_ID,
                TO_CHAR(DET.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE,
                DET.PLAN_QTY,
                HD.UOM
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            WHERE HD.CUR_POS = 'FINA'`;
            const que = `SELECT * FROM (${baseQ}) A ${filterStr} ${sortQue} ${pagiQue} ;`;
            const { rows } = await client.query(que, filter_val);
            return {
                limit: pagination.limit,
                offset: pagination.offset,
                data: rows,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getRequestedLoadNote2 = async (filters = [], who) => {
    try {
        const client = await db.connect();
        try {
            let filter_que = [];
            let filter_val = [];
            let filterStr = "";
            let whoFilter = "";
            if (who !== "wb") {
                whoFilter = `WHERE DET.ln_num IS NULL AND DET.PUSH_SAP_DATE IS NULL AND HD.CUR_POS = 'FINA' AND DET.IS_ACTIVE = true`;
            } else {
                whoFilter = `WHERE DET.PUSH_SAP_DATE IS NOT NULL AND DET.LN_NUM IS NOT NULL AND HD.CUR_POS = 'FINA' AND DET.IS_ACTIVE = true`;
            }
            if (filters.length !== 0) {
                let idx = 1;
                filters.forEach((item, index) => {
                    if (item.value !== "") {
                        filter_que.push(`${item.id} = $${idx}`);
                        filter_val.push(`${item.value}`);
                        idx++;
                    }
                });
                if (filter_que.length !== 0) {
                    filterStr = "WHERE " + filter_que.join(" AND ");
                }
            }
            const baseQ = `SELECT DET.det_id as id,
                HD.hd_id,
                HD.ID_DO,
                HD.ID_STO,
                HD.TRANS_TYPE,
                HD.PLANT,
                HD.RULES,
                HD.company,
                HD.material,
                HD.desc_con,
                DET.fac_plant,
                DET.oth_plant,
                DET.fac_sloc,
                DET.fac_sloc_desc,
                DET.oth_sloc,
                DET.oth_sloc_desc,
                DET.fac_valtype,
                DET.oth_valtype,
                DET.fac_batch,
                DET.oth_batch,
                DET.media_tp,
                DET.driver_id,
                DET.create_by,
                DET.ln_num,
                CUST.KUNNR as cust_code,
                CUST.name_1 as cust_name,
                VEN.LIFNR as ven_code,
                VEN.name_1 as ven_name,
                INT.kunnr as intr_code,
                INT.name_1 as intr_name,
                CONCAT(DET.DRIVER_ID,
                    ' - ',
                    DET.DRIVER_NAME) AS DRIVER,
                DET.VHCL_ID,
                TO_CHAR(DET.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
                DET.cre_date as CREATE_DATE,
                DET.PLAN_QTY,
                HD.UOM
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUST ON CUST.kunnr = USR.USERNAME
            LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
            LEFT JOIN MST_INTERCO INT ON INT.kunnr = USR.USERNAME
            LEFT JOIN MST_KEY MKY ON MKY.key_item = DET.media_tp
            ${whoFilter}
            `;
            const que = `SELECT * FROM (${baseQ}) A ${filterStr} ;`;
            // console.log(que);
            const { rows } = await client.query(que, filter_val);
            return {
                data: rows,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getOSLoadingNoteNum = async (limit, offset, q) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `SELECT distinct hd.id_do FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
                WHERE hd.id_do like $1 AND det.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'
                LIMIT $2 OFFSET $3`,
                [`%${q}%`, limit, offset]
            );
            const { rows } = await client.query(
                `SELECT count(distinct hd.id_do) as ctr FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
                WHERE hd.id_do like $1 AND det.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'`,
                [`%${q}%`]
            );
            return {
                data: dataComp,
                count: rows[0].ctr,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getOSLoadingNoteNum2 = async (limit, offset, cust) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `
                SELECT distinct hd.id_do FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_vendor mv on mv.lifnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE det.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'
                AND( c.kunnr = $1 or mv.lifnr = $2 or mi.kunnr = $3) AND det.is_active = true
                LIMIT $4 OFFSET $5
                `,
                [cust, cust, cust, limit, offset]
            );
            const { rows, rowCount } = await client.query(
                `SELECT distinct hd.id_do FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_vendor mv on mv.lifnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE det.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'
                AND( c.kunnr = $1 or mv.lifnr = $2 or mi.kunnr = $3) AND det.is_active = true`,
                [cust, cust, cust]
            );
            return {
                data: dataComp,
                count: rowCount,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getOSLoadingNoteNumWB = async (limit, offset, cust) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `
                SELECT distinct hd.id_do FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
                LEFT JOIN mst_vendor v on v.lifnr = u.username
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE  
                DET.PUSH_SAP_DATE IS NOT NULL 
                AND (c.kunnr = $1 or v.lifnr = $2 or mi.kunnr = $3)
                AND DET.LN_NUM IS NOT NULL
                AND hd.cur_pos = 'FINA'
                AND det.is_active = true 
                LIMIT $4 OFFSET $5
                `,
                [cust, cust, cust, limit, offset]
            );
            const { rows, rowCount } = await client.query(
                ` SELECT distinct hd.id_do FROM loading_note_hd hd
                LEFT JOIN loading_note_det det on hd.hd_id = det.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
                LEFT JOIN mst_vendor v on v.lifnr = u.username
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE  
                DET.PUSH_SAP_DATE IS NOT NULL 
                AND (c.kunnr = $1 or v.lifnr = $2 or mi.kunnr = $3)
                AND DET.LN_NUM IS NOT NULL
                AND hd.cur_pos = 'FINA'
                AND det.is_active = true `,
                [cust, cust, cust]
            );
            return {
                data: dataComp,
                count: rowCount,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};
// LoadingNoteModel.finalizeLoadingNote_2 = async (params, session) => {
//     try {
//         const client = await db.connect();
//         let rfcclient = await poolRFC.acquire();
//         let dbpromise = [];
//         let loading_note = new Map();
//         let failed_case = new Map();
//         const today = new Date();
//         const uploadData = params.selected_req;
//         const fac_sloc = params.fac_sloc;
//         const fac_sloc_desc = params.fac_sloc_desc;
//         const fac_valtype = params.fac_valtype;
//         const oth_sloc = params.oth_sloc;
//         const oth_sloc_desc = params.oth_sloc_desc;
//         const oth_valtype = params.oth_valtype;
//         try {
//             await client.query(TRANS.BEGIN);
//             let index = 0;
//             for (item of uploadData) {
//                 const param = {
//                     I_RECORD_REGISTRA: {
//                         BUKRS: item.company,
//                         UPLOADID: "1",
//                         DOTYPE: "S",
//                         ITEMRULE: item.rules,
//                         VBELN_REF: item.id_do,
//                         POSNR: "10",
//                         EBELN_REF: "",
//                         CREDAT: moment(item.create_date).format("DD.MM.YYYY"),
//                         MATNR: item.material,
//                         PLN_LFIMG: item.plan_qty,
//                         DWERKS: item.fac_plant,
//                         DLGORT: fac_sloc,
//                         RWERKS: item.oth_plant,
//                         RLGORT: oth_sloc,
//                         ZZTRANSP_TYPE: item.media_tp,
//                         WANGKUTAN: "",
//                         WNOSIM: item.driver_id,
//                         WNOPOLISI: item.vhcl_id,
//                         L_LFIMG: "0",
//                         OP_LFIMG: "0",
//                         DOPLINE: "0000",
//                         VSLCD: "",
//                         VOYNR: "",
//                         DCHARG_1: item.company,
//                         RCHARG_1: item.id_do,
//                         RBWTAR_1: oth_valtype,
//                     },
//                 };
//                 const data = await rfcclient.call(
//                     "ZRFC_PRE_REGISTRA_CUST",
//                     param
//                 );
//                 if (
//                     data?.RFC_TEXT &&
//                     data?.RFC_TEXT.includes("successfully created")
//                 ) {
//                     loading_note.set(
//                         uploadData[index].id,
//                         data?.RFC_TEXT.replace(/[^0-9]/g, "").trim()
//                     );
//                 } else {
//                     failed_case.set(
//                         `${uploadData[index].id_do}-${uploadData[index].vhcl_id}-${uploadData[index].id}`,
//                         data?.RFC_TEXT
//                     );
//                 }
//                 index++;
//             }
//             loading_note.forEach((value, key) => {
//                 const payload = {
//                     ln_num: value,
//                     is_pushed: true,
//                     fac_sloc: fac_sloc,
//                     oth_sloc: oth_sloc,
//                     fac_sloc_desc: fac_sloc_desc,
//                     oth_sloc_desc: oth_sloc_desc,
//                     fac_valtype: fac_valtype,
//                     oth_valtype: oth_valtype,
//                     update_at: today,
//                     update_by: session.id_user,
//                 };
//                 const [que, val] = crud.updateItem(
//                     "loading_note_det",
//                     payload,
//                     { det_id: key },
//                     "ln_num"
//                 );
//                 dbpromise.push(client.query(que, val));
//             });
//             const resultDb = await Promise.all(dbpromise);
//             // console.log(resultDb);
//             await client.query(TRANS.COMMIT);
//             return {
//                 loading_note: Object.fromEntries(loading_note.entries()),
//                 failed: Object.fromEntries(failed_case.entries()),
//             };
//         } catch (error) {
//             console.log(error);
//             await client.query(TRANS.ROLLBACK);
//             throw error;
//         } finally {
//             client.release();
//             poolRFC.release(rfcclient);
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// };

LoadingNoteModel.finalizeLoadingNote_3 = async (params, session) => {
    try {
        const client = await db.connect();
        const oraclient = await ora.getConnection();
        const today = new Date();
        const uploadData = params.selected_req;
        const fac_sloc = params.fac_sloc;
        const fac_sloc_desc = params.fac_sloc_desc;
        const fac_valtype = params.fac_valtype;
        const oth_sloc = params.oth_sloc;
        const oth_sloc_desc = params.oth_sloc_desc;
        const oth_valtype = params.oth_valtype;
        const fac_batch = params.fac_batch;
        const oth_batch = params.oth_batch;
        let queIns, valIns;
        let det_id_pushed = [];
        try {
            await client.query(TRANS.BEGIN);
            for (item of uploadData) {
                let method = "";
                const { rowCount } = await client.query(
                    `SELECT * FROM loading_note_det WHERE det_id = $1 and push_sap_date is not null`,
                    [item.id]
                );
                if (rowCount > 0) {
                    method = "update";
                    // throw new Error("Request already pushed");
                } else {
                    method = "insert";
                }
                const splitdt = item.tanggal_surat_jalan.split("-");
                const param = {
                    HEAD_ID: item.hd_id,
                    DET_ID: item.id,
                    BUKRS: item.company,
                    UPLOADID: "1",
                    DOTYPE: item?.trans_type === "M" ? "T" : "S",
                    ITEMRULE: item.rules,
                    VBELN_REF: item.id_do,
                    EBELN_REF: item.id_sto,
                    POSNR: "000010",
                    // CREDAT: moment(item.create_date).format("DD.MM.YYYY"),
                    CREDAT: new Date(
                        `${splitdt[2]}-${splitdt[1]}-${splitdt[0]}T00:00:00`
                    ),
                    MATNR: item.material,
                    PLN_LFIMG: parseInt(item.plan_qty),
                    DWERKS: item.fac_plant,
                    DLGORT: fac_sloc,
                    RWERKS: item.oth_plant,
                    RLGORT: oth_sloc,
                    ZZTRANSP_TYPE: item.media_tp,
                    WANGKUTAN: "",
                    WNOSIM: item.driver_id,
                    WNOPOLISI: item.vhcl_id,
                    L_LFIMG: 0,
                    OP_LFIMG: 0,
                    DOPLINE: "0000",
                    VSLCD: "",
                    VOYNR: "",
                    DCHARG_1: fac_batch,
                    RCHARG_1: oth_batch,
                    RBWTAR_1: oth_valtype,
                    DBWTAR: fac_valtype,
                    CREATE_BY: session.id_user,
                    CREATE_AT: new Date(),
                    ISACTIVE: "TRUE",
                    FLAG: "I",
                    ISRETRIVEDBYSAP: "FALSE",
                    USERSAP: session.username,
                };
                if (method === "insert") {
                    [queIns, valIns] = crud.insertItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        param
                    );
                } else {
                    param.FLAG = "U";
                    [queIns, valIns] = crud.updateItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        param,
                        {
                            DET_ID: item.id,
                        }
                    );
                }
                let paramDb = {
                    is_pushed: true,
                    push_sap_date: today,
                    update_by: session.id_user,
                    fac_sloc: fac_sloc,
                    oth_sloc: oth_sloc,
                    fac_sloc_desc: fac_sloc_desc,
                    oth_sloc_desc: oth_sloc_desc,
                    fac_valtype: fac_valtype,
                    oth_valtype: oth_valtype,
                    fac_batch: fac_batch,
                    oth_batch: oth_batch,
                    plan_qty: parseInt(item.plan_qty),
                };
                if (method === "update") {
                    paramDb.is_wb_edit = 1;
                }
                const whereDb = {
                    det_id: item.id,
                };
                const [upDb, valDb] = crud.updateItem(
                    "loading_note_det",
                    paramDb,
                    whereDb,
                    "det_id"
                );
                const uptoDb = await client.query(upDb, valDb);
                const insertToStage = await oraclient.execute(queIns, valIns);
                det_id_pushed.push(item.id);
            }
            // console.log(resultDb);
            await client.query(TRANS.COMMIT);
            await oraclient.commit();
            return {
                message: "Loading Note request staged to SAP",
                data: det_id_pushed.join(","),
            };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            client.release();
            oraclient.close();
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.cancelLoadingNote = async (params, session) => {
    try {
        let client;
        client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const canceledData = params.selected_cancel;
            let cancelledRows = [];
            let target = new Set();
            const remarks = params.cancel_remark;
            const today = new Date();
            const [queDel, valDel] = crud.updateItem(
                "loading_note_hd",
                { cancel_msg: remarks },
                { hd_id: canceledData[0].hd_id },
                "hd_id"
            );
            await client.query(queDel, valDel);
            for (const data of canceledData) {
                // const {rows} = await client.query('SELECT ln_num WHERE det_id = $1', [data.id]) ;
                // console.log(data.create_by);
                target.add(data.create_by);
                cancelledRows.push(`
                <tr>
                    <td>${data.driver}</td>
                    <td>${data.vhcl_id}</td>
                    <td>${data.cre_date}</td>
                    <td>${data.desc_con} (${data.material})</td>
                    <td>${data.plan_qty.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )} ${data.uom}</td>
                </tr> 
                `);
                const [queCh, valCh] = crud.updateItem(
                    "loading_note_det",
                    {
                        is_active: false,
                        update_by: session.id_user,
                        update_at: today,
                    },
                    { det_id: data.id },
                    "det_id"
                );
                await client.query(queCh, valCh);
            }
            let arrayOfUser = Array.from(target).map(item => `${item}`);
            // console.log(arrayOfUser);
            const { rows } = await client.query(
                `SELECT STRING_AGG(EMAIL, ',') AS EMAIL FROM MST_EMAIL WHERE ID_USER IN ($1)`,
                [arrayOfUser.join(",")]
            );
            const finalTarget = rows.map(item => item.email).join(",");
            await EmailModel.CancelLoadingNote(
                remarks,
                cancelledRows.join(" "),
                finalTarget
            );
            await client.query(TRANS.COMMIT);
            return {
                message: "Loading Note Cancelled",
            };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.getAllDataLNbyUser = async session => {
    try {
        const client = await db.connect();
        try {
            const que = `SELECT HD.HD_ID,
            DET.DET_ID,
                HD.ID_DO,
                HD.RULES,
                HD.CON_NUM,
                CONCAT(HD.CON_QTY,
            
                    HD.UOM),
                HD.PLANT,
                HD.COMPANY,
                TO_CHAR(DET.CRE_DATE,
            
                    'MM-DD-YYYY'),
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                DET.MEDIA_TP,
                DET.LN_NUM,
                CASE 
                    WHEN HD.CUR_POS = 'INIT' THEN 'CUSTOMER'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NULL OR DET.PUSH_SAP_DATE = '') THEN 'LOGISTIC'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NOT NULL OR DET.PUSH_SAP_DATE <> '') AND (DET.LN_NUM IS NULL OR DET.LN_NUM == '')  THEN 'PUSHED SAP'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.LN_NUM IS NOT NULL OR DET.LN_NUM <> '') THEN 'SUCCESS'
                    ELSE ''
                END
                AS CURRENT_POS
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON DET.HD_FK = HD.HD_ID`;
            const getDataSess = `${que} WHERE DET.CREATE_BY = $1`;
            const { rows } = await client.query(getDataSess, [session.id_user]);
            return rows;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getAllDataLNbyUser_2 = async (session, isallow, type) => {
    try {
        const client = await db.connect();
        let finaData = [];
        let parentRow;
        let leftJoin;
        let whereClause;
        const que_par = `SELECT HD.HD_ID,
            HD.ID_DO,
            HD.RULES,
            HD.CON_NUM,
            HD.CON_QTY,
            HD.UOM,
            HD.PLANT,
            HD.COMPANY,
            DET.CTROS,
            HD.CUR_POS
        FROM LOADING_NOTE_HD HD`;
        try {
            if (isallow) {
                leftJoin = `LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTROS FROM LOADING_NOTE_DET DET
                    LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                    WHERE DET.LN_NUM IS NULL AND DET.PUSH_SAP_DATE IS NULL AND HD.CUR_POS <> 'FINA' AND DET.IS_ACTIVE = true
                    GROUP BY HD_FK
                ) DET ON HD.HD_ID = DET.HD_FK
                LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM LOADING_NOTE_DET DET
                            LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                            WHERE DET.LN_NUM IS NOT NULL and DET.TANGGAL_SURAT_JALAN + interval '7' day > now () AND DET.IS_ACTIVE = true
                            GROUP BY HD_FK
                ) LNU ON HD.HD_ID = LNU.HD_FK 
                 LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLOG FROM LOADING_NOTE_DET DET
                    LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                    WHERE DET.LN_NUM IS NULL  AND HD.CUR_POS = 'FINA' and DET.CREATE_AT + interval '7' day > now ()
                    GROUP BY HD_FK
                ) LOG ON HD.HD_ID = LOG.HD_FK`;
                whereClause = `WHERE HD.CREATE_BY = $1 AND HD.INCO_1 LIKE '%${type}%' AND ( DET.CTROS IS NOT NULL OR LNU.CTRLN IS NOT NULL OR LOG.CTRLOG IS NOT NULL )
                ORDER BY DET.CTROS asc, HD.CREATE_AT desc ;`;
            } else {
                leftJoin = `LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTROS FROM LOADING_NOTE_DET DET
                    LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                    WHERE DET.LN_NUM IS NULL AND DET.PUSH_SAP_DATE IS NOT NULL AND HD.CUR_POS = 'FINA' 
                    GROUP BY HD_FK
                ) DET ON HD.HD_ID = DET.HD_FK
                LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM LOADING_NOTE_DET DET
                            LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                            WHERE DET.LN_NUM IS NOT NULL
                            GROUP BY HD_FK
                ) LNU ON HD.HD_ID = LNU.HD_FK`;
                whereClause = `WHERE HD.CUR_POS = 'FINA' AND HD.INCO_1 LIKE '%${type}%' AND DET.CTROS IS NOT NULL AND LNU.CTRLN IS NULL`;
            }

            const getDataSess = `${que_par} ${leftJoin} ${whereClause}`;
            // console.log(getDataSess);
            // console.log(session);
            if (isallow) {
                const { rows } = await client.query(getDataSess, [
                    session.id_user,
                ]);
                parentRow = rows;
            } else {
                const { rows } = await client.query(getDataSess);
                parentRow = rows;
            }

            for (const row of parentRow) {
                const que_ch = `SELECT 
                TO_CHAR(DET.CRE_DATE,
                    'MM-DD-YYYY') AS CRE_DATE,
                TO_CHAR(DET.TANGGAL_SURAT_JALAN,
                    'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                MKY.key_desc as media_tp,
                DET.PLAN_QTY,
                HD.UOM,
                DET.ERROR_MSG,
                CASE 
                    WHEN HD.CUR_POS = 'INIT' THEN 'CUSTOMER'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NULL) THEN 'LOGISTIC'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NOT NULL ) AND (DET.LN_NUM IS NULL OR DET.LN_NUM = '')  THEN 'PUSHED SAP'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.LN_NUM IS NOT NULL OR DET.LN_NUM <> '') THEN 'SUCCESS'
                    ELSE ''
                END
                AS CURRENT_POS
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON DET.HD_FK = HD.HD_ID
            LEFT JOIN MST_KEY MKY ON MKY.key_item = DET.media_tp
                `;
                const getDataCh = `${que_ch} WHERE HD.create_by = $1 AND HD.HD_ID = $2`;
                const { rows: rowCh } = await client.query(getDataCh, [
                    session.id_user,
                    row.hd_id,
                ]);
                finaData.push({ ...row, sub_table: rowCh });
            }

            return finaData;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getAllDataLNbyUser_FRC = async (session, isallow) => {
    try {
        const client = await db.connect();
        let finaData = [];
        let parentRow;
        let leftJoin;
        let whereClause;
        const que_par = `SELECT HD.HD_ID,
            HD.ID_DO,
            HD.RULES,
            HD.CON_NUM,
            HD.CON_QTY,
            HD.UOM,
            HD.PLANT,
            HD.COMPANY,
            DET.CTROS,
            HD.CUR_POS
        FROM LOADING_NOTE_HD HD`;
        try {
            if (isallow) {
                leftJoin = `LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTROS FROM LOADING_NOTE_DET DET
                    LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                    WHERE DET.LN_NUM IS NULL AND DET.PUSH_SAP_DATE IS NULL AND HD.CUR_POS <> 'FINA'
                    and now() < tanggal_surat_jalan + interval '7' day
                    GROUP BY HD_FK, tanggal_surat_jalan
                ) DET ON HD.HD_ID = DET.HD_FK
                LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM LOADING_NOTE_DET DET
                            LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                            WHERE DET.LN_NUM IS NOT NULL
                            GROUP BY HD_FK
                ) LNU ON HD.HD_ID = LNU.HD_FK `;
                whereClause = `WHERE HD.CREATE_BY = $1 AND HD.INCO_1 LIKE '%FRC%' AND ((DET.CTROS IS NOT NULL) OR (LNU.CTRLN IS NULL AND DET.CTROS IS NULL AND cur_pos = 'FINA') OR (LNU.CTRLN IS NOT NULL) )
                ORDER BY HD.CREATE_AT DESC`;
            } else {
                leftJoin = `LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTROS FROM LOADING_NOTE_DET DET
                    LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                    WHERE DET.LN_NUM IS NULL AND DET.PUSH_SAP_DATE IS NOT NULL AND HD.CUR_POS = 'FINA' 
                    GROUP BY HD_FK
                ) DET ON HD.HD_ID = DET.HD_FK
                LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM LOADING_NOTE_DET DET
                            LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                            WHERE DET.LN_NUM IS NOT NULL
                            GROUP BY HD_FK
                ) LNU ON HD.HD_ID = LNU.HD_FK`;
                whereClause = `WHERE HD.CUR_POS = 'FINA' AND HD.INCO_1 LIKE '%FRC%' AND DET.CTROS IS NOT NULL AND LNU.CTRLN IS NULL`;
            }

            const getDataSess = `${que_par} ${leftJoin} ${whereClause}`;
            if (isallow) {
                const { rows } = await client.query(getDataSess, [
                    session.id_user,
                ]);
                parentRow = rows;
            } else {
                const { rows } = await client.query(getDataSess);
                parentRow = rows;
            }

            for (const row of parentRow) {
                const que_ch = `SELECT 
                TO_CHAR(DET.CRE_DATE,
                    'MM-DD-YYYY') AS CRE_DATE,
                TO_CHAR(DET.TANGGAL_SURAT_JALAN,
                    'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                MKY.key_desc as media_tp,
                DET.PLAN_QTY,
                HD.UOM,
                DET.ERROR_MSG,
                CASE 
                    WHEN HD.CUR_POS = 'INIT' THEN 'CUSTOMER'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NULL) THEN 'LOGISTIC'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NOT NULL ) AND (DET.LN_NUM IS NULL OR DET.LN_NUM = '')  THEN 'PUSHED SAP'
                    WHEN HD.CUR_POS = 'FINA' AND (DET.LN_NUM IS NOT NULL OR DET.LN_NUM <> '') THEN 'SUCCESS'
                    ELSE ''
                END
                AS CURRENT_POS
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON DET.HD_FK = HD.HD_ID
            LEFT JOIN MST_KEY MKY ON MKY.key_item = DET.media_tp
                `;
                const getDataCh = `${que_ch} WHERE HD.create_by = $1 AND HD.HD_ID = $2`;
                const { rows: rowCh } = await client.query(getDataCh, [
                    session.id_user,
                    row.hd_id,
                ]);
                finaData.push({ ...row, sub_table: rowCh });
            }

            return finaData;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getDataOSUser = async session => {
    const que = `SELECT 
    HD.ID_DO,
    HD.desc_con,
    CONCAT(DET.DRIVER_ID, '-', DET.DRIVER_NAME) AS DRIVER,
    DET.VHCL_ID,
    CONCAT(DET.PLAN_QTY, ' ', UOM) AS PLAN_QTY,
    CASE 
        WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NULL) THEN 'LOGISTIC'
        WHEN HD.CUR_POS = 'FINA' AND (DET.PUSH_SAP_DATE IS NOT NULL ) AND (DET.LN_NUM IS NULL OR DET.LN_NUM = '')  THEN 'PUSHED SAP'
        ELSE ''
    END AS STATUS
    FROM LOADING_NOTE_HD HD 
    LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
    WHERE HD.CUR_POS = 'FINA' AND DET.LN_NUM IS NULL AND HD.CREATE_BY = $1
    `;
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(que, [session.id_user]);
            return rows;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.getDataLastReq = async () => {
    try {
        const client = await db.connect();
        let finaData = [];
        try {
            const que_par = `SELECT HD.HD_ID,
                HD.ID_DO,
                HD.RULES,
                HD.CON_NUM,
                CONCAT(HD.CON_QTY,
                    HD.UOM) AS CON_QTY,
                HD.PLANT,
                HD.COMPANY,
                CONCAT(CUST.KUNNR, '-', CUST.NAME_1) AS CUSTOMER
            FROM LOADING_NOTE_HD HD
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUST ON CUST.KUNNR = USR.SAP_CODE
            LEFT JOIN (
                SELECT HD_FK, COUNT(DET_ID) AS CTR FROM loading_note_det WHERE PUSH_SAP_DATE IS NULL
                AND LN_NUM IS NULL
                GROUP BY HD_FK 
            ) DET ON HD.HD_ID = DET.HD_FK `;
            const getDataSess = `${que_par} WHERE HD.cur_pos = 'FINA' AND DET.CTR > 0`;
            const { rows: parentRow } = await client.query(getDataSess);

            for (const row of parentRow) {
                const que_ch = `SELECT 
                TO_CHAR(DET.CRE_DATE,
            
                    'MM-DD-YYYY') AS CRE_DATE,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                DET.MEDIA_TP,
                CONCAT(DET.PLAN_QTY, HD.UOM) AS PLAN_QTY
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON DET.HD_FK = HD.HD_ID
                `;
                const getDataCh = `${que_ch} WHERE HD.HD_ID = $1 AND PUSH_SAP_DATE IS NULL`;
                const { rows: rowCh } = await client.query(getDataCh, [
                    row.hd_id,
                ]);
                finaData.push({ ...row, sub_table: rowCh });
            }
            return finaData;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getRecap = async customer_id => {
    const getRecapData = `SELECT 
            DET.LN_NUM,
            HD.ID_DO,
            HD.INCO_1,
            HD.INCO_2,
            HD.COMPANY,
            HD.PLANT,
            HD.DESC_CON,
            HD.CON_QTY,
            CUST.KUNNR,
            CUST.NAME_1,
            DET.HD_FK,
            DET.DET_ID AS ID,
            DET.DRIVER_ID,
            DET.DRIVER_NAME,
            DET.VHCL_ID,
            DET.PLAN_QTY,
            HD.UOM,
            DET.BRUTO,
            DET.TARRA,
            DET.NETTO,
            DET.RECEIVE,
            DET.DEDUCTION
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = DET.HD_FK
        LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.SAP_CODE = CUST.KUNNR
        WHERE DET.LN_NUM IS NOT NULL ;`;
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(getRecapData);
            return rows;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getSSRecap = async (filters, customer_id, skipid = false) => {
    const getRecapData = `SELECT
            DET.LN_NUM,
            HD.ID_DO,
            HD.INCO_1,
            HD.INCO_2,
            HD.COMPANY,
            HD.PLANT,
            HD.DESC_CON,
            HD.CON_QTY,
            CASE 
                WHEN CUST.KUNNR IS NOT NULL THEN CUST.KUNNR
                WHEN VEN.LIFNR IS NOT NULL THEN VEN.LIFNR
                WHEN INT.KUNNR IS NOT NULL THEN INT.KUNNR
                ELSE ''
                END AS KUNNR,
            CASE
                WHEN CUST.NAME_1 IS NOT NULL THEN CUST.NAME_1
                WHEN VEN.NAME_1 IS NOT NULL THEN VEN.NAME_1
                WHEN INT.NAME_1 IS NOT NULL THEN INT.NAME_1
                ELSE ''
                END AS NAME_1,
           ${!skipid ? "DET.DET_ID AS ID," : ""}
            DET.DRIVER_ID,
            DET.DRIVER_NAME,
            DET.VHCL_ID,
            DET.PLAN_QTY,
            TO_CHAR(DET.CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE,
            TO_CHAR(DET.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
            TO_CHAR(DET.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE_MOMENT,
            TO_CHAR(DET.TANGGAL_SURAT_JALAN, 'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN_MOMENT,
            HD.UOM,
            DET.BRUTO,
            DET.TARRA,
            DET.NETTO,
            DET.RECEIVE,
            DET.DEDUCTION,
            COALESCE(DET.print_count, 0) as print_count
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = DET.HD_FK
        LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
        WHERE DET.LN_NUM IS NOT NULL`;
    let where = [];
    let whereVal = [];
    let ltindex = 0;
    let whereQue = "";
    filters.forEach((item, index) => {
        let value = item.value;
        let id = item.id;
        let date = false;
        if (item.id === "Incoterms") {
            value = item.value.split("-")[0].trim();
            id = "inco_1";
        } else if (item.id === "Customer") {
            value = item.value.split("-")[0].trim();
            id = ["cust.kunnr", "ven.lifnr", "int.kunnr"];
        } else if (item.id === "Contract Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "con_qty";
        } else if (item.id === "Planning Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "plan_qty";
        } else if (item.id === "cre_date") {
            value = `TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "cre_date";
            date = true;
        } else if (item.id === "tanggal_surat_jalan") {
            value = `= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "tanggal_surat_jalan";
            date = true;
        } else if (item.id === "start_tsj") {
            value = `>= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "tanggal_surat_jalan";
            date = true;
        } else if (item.id === "end_tsj") {
            value = `<= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "tanggal_surat_jalan";
            date = true;
        }
        if (!date) {
            if (item.id === "Customer") {
                where.push(
                    `(${id[0]} = $${ltindex + 1} OR ${id[1]} = $${ltindex + 2} OR ${id[2]} = $${ltindex + 3})`
                );
                whereVal.push(...[value, value, value]);
                ltindex += 3;
            } else {
                where.push(`${id} = $${ltindex + 1}`);
                whereVal.push(value);
                ltindex++;
            }
        } else {
            where.push(`${id} ${value}`);
        }
    });
    if (customer_id !== "") {
        // where.push(`kunnr = $${ltindex + 1}`);
        where.push(
            `(cust.kunnr = $${ltindex + 1} OR ven.lifnr = $${ltindex + 2} OR int.kunnr =  $${ltindex + 3} )`
        );
        whereVal.push(...[customer_id, customer_id, customer_id]);
    }
    if (where.length != 0) {
        whereQue = `AND ${where.join(" AND ")}`;
    }
    let que = `${getRecapData} ${whereQue} ORDER BY DET.LN_NUM DESC`;
    let val = whereVal;
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(que, val);
            return rows;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getReportLN = async (filters, customer_id, limit, offset) => {
    const getRecapData = `SELECT
            DET.LN_NUM,
            HD.ID_DO,
            HD.INCO_1,
            HD.INCO_2,
            HD.COMPANY,
            HD.PLANT,
            HD.DESC_CON,
            HD.CON_QTY,
            CASE 
                WHEN CUST.KUNNR IS NOT NULL THEN CUST.KUNNR
                WHEN VEN.LIFNR IS NOT NULL THEN VEN.LIFNR
                WHEN INT.KUNNR IS NOT NULL THEN INT.KUNNR
                ELSE ''
                END AS KUNNR,
            CASE
                WHEN CUST.NAME_1 IS NOT NULL THEN CUST.NAME_1
                WHEN VEN.NAME_1 IS NOT NULL THEN VEN.NAME_1
                WHEN INT.NAME_1 IS NOT NULL THEN INT.NAME_1
                ELSE ''
                END AS NAME_1,
            DET.DRIVER_ID,
            DET.DRIVER_NAME,
            DET.VHCL_ID,
            TO_CHAR(DET.CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE,
            TO_CHAR(DET.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
            TO_CHAR(DET.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE_MOMENT,
            TO_CHAR(DET.TANGGAL_SURAT_JALAN, 'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN_MOMENT,
            HD.UOM,
            DET.BRUTO,
            DET.TARRA,
            DET.NETTO,
            DET.RECEIVE,
            DET.DEDUCTION,
            det.posted,
            hd.uom,
            case
                when det.posted = true then det.receive 
                else 0
            end
            as receive_posted,
            case
                when det.posted = false or det.posted is null then det.receive 
                else 0
            end
            as receive_unposted,
            case
                when det.ln_num is null then det.plan_qty
                else 0
            end 
            as pending_plan_qty,
            case
                when det.ln_num is not null then det.plan_qty
                else 0
            end 
            as plan_qty,
            coalesce(det.plan_qty_sap, 0) as plan_qty_sap,
             coalesce(det.fac_qty_sap, 0) as fac_qty_sap,
            COALESCE(DET.print_count, 0) as print_count
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = DET.HD_FK
        LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
        WHERE DET.is_active = true`;

    const getCountData = `SELECT
    COUNT(DET.*) as count_rows,
    MAX(det.tanggal_surat_jalan) as max_tgl_muat,
    MIN(det.tanggal_surat_jalan) as min_tgl_muat,
    coalesce(SUM(det.bruto), 0) as bruto,
    coalesce(SUM(det.tarra), 0) as tarra,
    coalesce(SUM(det.netto), 0) as netto,
    coalesce(SUM(det.deduction), 0) as deduction,
    coalesce(SUM(det.receive), 0) as receive,
    coalesce(SUM(det.plan_qty_sap), 0) as plan_qty_sap,
    coalesce(SUM(det.fac_qty_sap), 0) as fac_qty_sap
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = DET.HD_FK
        LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
        WHERE  DET.is_active = true`;

    const pendingQty = `select coalesce(sum(det.plan_qty), 0) as plan_qty from loading_note_det det
    left join loading_note_hd hd on hd.hd_id = det.hd_fk
    LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
    LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
    LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
    LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
    where  det.is_active = true and det.ln_num is null `;

    const planQtyWeb = `select sum(det.plan_qty) as plan_qty from loading_note_det det
    left join loading_note_hd hd on hd.hd_id = det.hd_fk
    LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
    where  det.is_active = true and det.ln_num is not null `;

    const totalPosted = `select sum(det.receive) as receive from loading_note_det det
    left join loading_note_hd hd on hd.hd_id = det.hd_fk
    LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
    where  det.is_active = true and det.posted = true `;
    const totalunPosted = `select sum(det.receive) as receive from loading_note_det det
    left join loading_note_hd hd on hd.hd_id = det.hd_fk
    LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
        LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
        LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
        LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
    where  det.is_active = true and (det.posted = false or det.posted is null) `;
    let where = [];
    let whereVal = [];
    let ltindex = 0;
    let whereQue = "";
    filters.forEach((item, index) => {
        let value = item.value;
        let id = item.id;
        let date = false;
        if (item.id === "Incoterms") {
            value = item.value.split("-")[0].trim();
            id = "inco_1";
        } else if (item.id === "Customer") {
            value = item.value.split("-")[0].trim();
            id = ["cust.kunnr", "ven.lifnr", "int.kunnr"];
        } else if (item.id === "Contract Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "con_qty";
        } else if (item.id === "Planning Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "plan_qty";
        } else if (item.id === "cre_date") {
            value = `= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "cre_date";
            date = true;
        } else if (item.id === "tanggal_surat_jalan") {
            value = `= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "tanggal_surat_jalan";
            date = true;
        } else if (item.id === "start_tsj") {
            value = `>= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "cre_date";
            date = true;
        } else if (item.id === "end_tsj") {
            value = `<= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
            id = "cre_date";
            date = true;
        }
        if (!date) {
            if (item.id === "Customer") {
                where.push(
                    `(${id[0]} = $${ltindex + 1} OR ${id[1]} = $${ltindex + 2} OR ${id[2]} = $${ltindex + 3})`
                );
                whereVal.push(...[value, value, value]);
                ltindex += 3;
            } else {
                where.push(`${id} = $${ltindex + 1}`);
                whereVal.push(value);
                ltindex++;
            }
        } else {
            where.push(`${id} ${value}`);
        }
    });
    if (customer_id !== "") {
        // where.push(`kunnr = $${ltindex + 1}`);
        where.push(
            `(cust.kunnr = $${ltindex + 1} OR ven.lifnr = $${ltindex + 2} OR int.kunnr =  $${ltindex + 3} )`
        );
        whereVal.push(...[customer_id, customer_id, customer_id]);
    }
    if (where.length != 0) {
        whereQue = `AND ${where.join(" AND ")}`;
    }
    let que = `${getRecapData} ${whereQue} ORDER BY DET.CRE_DATE ASC ${limit && limit !== "" ? `LIMIT ${limit} OFFSET ${offset}` : ""} `;
    let countData = `${getCountData} ${whereQue}`;
    let postedTotal = `${totalPosted} ${whereQue}`;
    let unpostedTotal = `${totalunPosted} ${whereQue}`;
    let quependingQty = `${pendingQty} ${whereQue}`;
    let quePlanQtyWeb = `${planQtyWeb} ${whereQue}`;
    let contractQue = `select con_qty from loading_note_hd where id_do = $1`;
    let val = whereVal;
    try {
        const client = await db.connect();
        try {
            const { rows, rowCount } = await client.query(que, val);
            const { rows: dataCount } = await client.query(countData, val);
            const { rows: postTot } = await client.query(postedTotal, val);
            const { rows: unpostTot } = await client.query(unpostedTotal, val);
            const { rows: pendingQty } = await client.query(quependingQty, val);
            const { rows: planQty } = await client.query(quePlanQtyWeb, val);
            const do_number = filters.find(row => row.id === "id_do");
            let returnData = {
                data: rows,
                limit: rowCount,
                count: dataCount[0].count_rows,
                sum_data: {
                    ...dataCount[0],
                    uom: rows[0].uom,
                    plan_qty: planQty[0].plan_qty,
                    pending_qty: pendingQty[0].plan_qty,
                    postedTotal: postTot[0].receive,
                    unpostedTotal: unpostTot[0].receive,
                },
            };
            if (do_number) {
                const { rows: contractData } = await client.query(contractQue, [
                    do_number.value,
                ]);
                const { os_sap } = await LoadingNoteModel.getOSQtySAP(
                    moment(dataCount[0].max_tgl_muat)
                        .add(1, "days")
                        .format("YYYY-MM-DD"),
                    do_number.value
                );
                const { osposted, osunposted } =
                    await LoadingNoteModel.getOSQtyWB(
                        moment(dataCount[0].max_tgl_muat)
                            .add(1, "days")
                            .format("YYYY-MM-DD"),
                        do_number.value
                    );
                const osweb = os_sap - parseFloat(pendingQty[0].plan_qty);
                returnData = {
                    ...returnData,
                    contract: {
                        con_qty: contractData[0].con_qty,
                    },
                    outstanding: {
                        os_sap: os_sap,
                        osposted: osposted,
                        osunposted: osunposted,
                        osweb: osweb,
                    },
                };
            }
            return returnData;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getChoiceSync = async (id_user, role) => {
    try {
        const client = await db.connect();
        try {
            //get years
            //get by user
            let whereuser = "";
            let valuser = [];
            if (!["CUSTOMER", "ADMIN", "COMMERCIAL"].includes(role)) {
                whereuser = "and lnd.create_by = $1";
                valuser = [id_user];
            }
            const { rows } = await client.query(
                `select
                    distinct lnh.company, to_char(tanggal_surat_jalan,
                    'YYYY') as year_choice,to_char(tanggal_surat_jalan,
                    'MM') as month_choice
                from
                    loading_note_det lnd
                left join loading_note_hd lnh on lnd.hd_fk = lnh.hd_id 
                where
                    lnd.is_active = true
                    and tanggal_surat_jalan is not null ${whereuser}
                order by company asc, year_choice asc, month_choice asc`,
                valuser
            );
            const choices = {};
            for (const row of rows) {
                let companyChoices = choices[row.company];
                if (!companyChoices) {
                    choices[row.company] = {
                        [row.year_choice]: [row.month_choice],
                    };
                } else {
                    if (!choices[row.company][row.year_choice]) {
                        choices[row.company] = {
                            ...choices[row.company],
                            [row.year_choice]: [row.month_choice],
                        };
                    } else {
                        choices[row.company] = {
                            ...choices[row.company],
                            [row.year_choice]: [
                                ...choices[row.company][row.year_choice],
                                row.month_choice,
                            ],
                        };
                    }
                }
            }
            return choices;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.generateExcel = async (filters, customer_id) => {
    try {
        const rowData = await LoadingNoteModel.getSSRecap(
            filters,
            customer_id,
            true
        );
        const bookRecap = new ExcelJS.Workbook();
        const recapSheet = bookRecap.addWorksheet("Recap Loading Note");
        const firstData = rowData[0];
        const col = Object.keys(firstData).map(item => ({
            header: item.toUpperCase(),
            key: item,
            width: 20,
        }));
        recapSheet.columns = col;
        recapSheet.addRows(rowData);
        return bookRecap;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

LoadingNoteModel.generateExcelv2 = async (filters, customer_id) => {
    try {
        const excelData = await LoadingNoteModel.getReportLN(
            filters,
            customer_id
        );
        // console.log(excelData);
        const dataCount = excelData.data.length;
        const filtersmap = new Map();
        filters.map(item => {
            filtersmap.set(item.id, item.value);
        });
        const do_number = filters.find(row => row.id == "id_do");
        const reportBook = new ExcelJS.Workbook();
        const recapSheet = reportBook.addWorksheet(
            "Report DO " + do_number.value
        );
        const tableHeader = new Map([
            [
                "A",
                {
                    value: "cre_date_moment",
                    label: "Tanggal Pembuatan",
                    width: 20,
                },
            ],
            [
                "B",
                {
                    value: "tanggal_surat_jalan_moment",
                    label: "Tanggal Muat",
                    width: 20,
                },
            ],
            [
                "C",
                {
                    value: "company",
                    label: "Company",
                    width: 10,
                },
            ],
            [
                "D",
                {
                    value: "plant",
                    label: "Plant",
                    width: 10,
                },
            ],
            [
                "E",
                {
                    value: "name_1",
                    label: "Customer",
                    width: 20,
                },
            ],
            [
                "F",
                {
                    value: "id_do",
                    label: "SO Number",
                    width: 15,
                },
            ],
            [
                "G",
                {
                    value: "ln_num",
                    label: "Loading Note Number",
                    width: 20,
                },
            ],
            [
                "H",
                {
                    value: "inco_1",
                    label: "Incoterm",
                    width: 10,
                },
            ],
            [
                "I",
                {
                    value: "desc_con",
                    label: "Material",
                    width: 30,
                },
            ],
            [
                "J",
                {
                    value: "driver_name",
                    label: "Driver",
                    width: 30,
                },
            ],
            [
                "K",
                {
                    value: "vhcl_id",
                    label: "Vehicle",
                    width: 12,
                },
            ],
            [
                "L",
                {
                    value: "plan_qty",
                    label: "Planning Quantity",
                    width: 16,
                },
            ],
            [
                "M",
                {
                    value: "bruto",
                    label: "Bruto",
                    width: 16,
                },
            ],
            [
                "N",
                {
                    value: "tarra",
                    label: "Tarra",
                    width: 16,
                },
            ],
            [
                "O",
                {
                    value: "netto",
                    label: "Netto",
                    width: 16,
                },
            ],
            [
                "P",
                {
                    value: "receive",
                    label: "Receive",
                    width: 16,
                },
            ],
            [
                "Q",
                {
                    value: "deduction",
                    label: "Deduction",
                    width: 16,
                },
            ],
            [
                "R",
                {
                    value: "uom",
                    label: "UOM",
                    width: 5,
                },
            ],
            [
                "S",
                {
                    value: "posted",
                    label: "Post",
                    width: 5,
                },
            ],
        ]);
        //Date
        recapSheet.getCell("A1").value = "Date";
        recapSheet.getCell("C1").value = moment(
            excelData.sum_data.min_tgl_muat
        ).format("DD/MM/YYYY");
        recapSheet.getCell("D1").value = "-";
        recapSheet.getCell("E1").value = moment(
            excelData.sum_data.max_tgl_muat
        ).format("DD/MM/YYYY");
        //SONumber
        recapSheet.getCell("A2").value = "SO Number";
        recapSheet.getCell("C2").value = do_number.value;
        //contractqty
        recapSheet.getCell("A3").value = "Contract Quantity";
        recapSheet.getCell("C3").value = parseInt(excelData.sum_data.con_qty);
        recapSheet.getCell("C3").numFmt = "#,##0";
        let tableStart = 4;
        for (const [cell, header] of tableHeader) {
            recapSheet.getCell(cell + tableStart).value = header.label;
            recapSheet.getColumn(cell).width = header.width;
            recapSheet.getCell(cell + tableStart).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "ffffcc00" },
            };
            recapSheet.getCell(cell + tableStart).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        }
        tableStart = tableStart + 1;
        for (let i = tableStart; i <= dataCount + tableStart - 1; i++) {
            const dataRow = excelData.data[i - tableStart];
            console.log(i - tableStart);
            console.log(dataRow);
            for (const [cell, header] of tableHeader) {
                if (
                    header.value === "cre_date_moment" ||
                    header.value === "tanggal_surat_jalan_moment"
                ) {
                    let dataOnRow;
                    dataOnRow = moment(dataRow[header.value]).format(
                        "YYYY-MM-DD"
                    );
                    if (dataRow[header.value] !== null) {
                        recapSheet.getCell(cell + i).numFmt = "dd/mm/yyyy";
                        recapSheet.getCell(cell + i).value = new Date(
                            dataOnRow
                        );
                    }
                } else if (
                    header.value === "plan_qty" ||
                    header.value === "bruto" ||
                    header.value === "tarra" ||
                    header.value === "netto" ||
                    header.value === "receive" ||
                    header.value === "deduction"
                ) {
                    if (dataRow[header.value] !== null) {
                        recapSheet.getCell(cell + i).value = parseInt(
                            dataRow[header.value]
                        );
                        recapSheet.getCell(cell + i).numFmt = "#,##0";
                    }
                } else if (header.value === "posted") {
                    if (
                        dataRow[header.value] &&
                        dataRow[header.value] !== null
                    ) {
                        recapSheet.getCell(cell + i).value = dataRow[
                            header.value
                        ]
                            ? "v"
                            : "";
                    }
                } else if (
                    dataRow[header.value] &&
                    dataRow[header.value] !== null
                ) {
                    recapSheet.getCell(cell + i).value = {
                        richText: [
                            {
                                text:
                                    typeof dataRow[header.value] !== "string"
                                        ? dataRow[header.value].toString()
                                        : dataRow[header.value],
                            },
                        ],
                    };
                }
                recapSheet.getCell(cell + i).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            }
        }
        tableStart += dataCount;

        return reportBook;
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.syncDataWB = async () => {
    try {
        const client = await db.connect();
        try {
            let updatedLN = [];
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(`
            SELECT det_id, ln_num FROM loading_note_det WHERE ln_num is not null 
            AND bruto is null
            and tarra is null
            and netto is null
            and ffa is null
            and moist is null
            and dirt is null`);
            for (const row of rows) {
                // console.log(row.ln_num);
                // console.log(
                //     `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/QQWBSet?$filter=(Zdconr%20eq%20%27${row.ln_num}%27)&$format=json`
                // );
                const { data: WBData } = await axios.get(
                    `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/QQWBSet?$filter=(Zdconr%20eq%20%27${row.ln_num}%27)&$format=json`,
                    {
                        auth: {
                            username: process.env.UNAMESAP,
                            password: process.env.PWDSAP,
                        },
                    }
                );
                // console.log(WBData);
                if (WBData.d.results.length === 0) {
                    continue;
                }
                const dataWB = WBData.d.results[0];
                const payload = {
                    bruto: dataWB.Wbrutopb,
                    tarra: dataWB.Wtarrapb,
                    netto: dataWB.Wnettopb2,
                    receive: dataWB.Wnettopb1,
                    deduction: dataWB.Wtotpot,
                    bruto_oth: dataWB.Wbrutokb,
                    tarra_oth: dataWB.Wtarrakb,
                    netto_oth: dataWB.Wnettokb,
                    ffa: dataWB.Ffa,
                    moist: dataWB.Moist,
                    dirt: dataWB.Dirt,
                };
                const [queVal, insVal] = crud.updateItem(
                    "loading_note_det",
                    payload,
                    { ln_num: row.ln_num },
                    "ln_num"
                );
                const { rows: UpWB } = await client.query(queVal, insVal);
                updatedLN.push(UpWB[0].ln_num);
            }
            // console.log(updatedLN);
            await client.query(TRANS.COMMIT);
            return updatedLN;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

LoadingNoteModel.showHistoricalLoadingNote = async (
    q,
    limit,
    offset,
    date_start,
    date_end,
    id_user,
    role
) => {
    let whereVal = [];
    let whereQ = [];
    let index = 1;
    if (role !== "ADMIN" || role !== "LOGISTIC") {
        whereVal.push(id_user);
        whereQ.push(`lnd.create_by = $${index}`);
        index++;
    }
    if (q !== "" && q) {
        let que = "";
        whereVal.push(`${q}:*`);
        que += `( lnd.search_vector @@ to_tsquery('english', $${index})`;
        index++;
        whereVal.push(`${q}:*`);
        que += ` or lnh.search_vector @@ to_tsquery('english', $${index}) )`;
        index++;
        whereQ.push(que);
    }
    if (date_start) {
        whereQ.push(
            `lnd.create_at >= to_date('${moment(date_start).format("YYYY-MM-DD")}', 'YYYY-MM-DD')`
        );
    }
    if (date_end) {
        whereQ.push(
            `lnd.create_at <= to_date('${moment(date_end).format("YYYY-MM-DD")}', 'YYYY-MM-DD')`
        );
    }
    try {
        const client = await db.connect();
        try {
            const quer = `
            select
            lnd.det_id ,
            TO_CHAR(lnd.cre_date, 'DD-MM-YYYY') AS cre_date,
            lnh.inco_1,
            TO_CHAR(tanggal_surat_jalan, 'DD-MM-YYYY') as tanggal_surat_jalan,
            lnh.id_do,
            driver_id,
            driver_name,
            vhcl_id,
            mtp.tp_desc as media_tp,
            plan_qty,
            lnh.uom,
            lnh.plant,
            fac_plant,
            oth_plant,
            fac_batch,
            oth_batch,
            fac_valtype ,
            oth_valtype ,
            ln_num,
            lnd.is_active,
            lnd.create_by
        from
            loading_note_det lnd
        left join loading_note_hd lnh on
            lnh.hd_id = lnd.hd_fk
        left join (select distinct tp, tp_desc from master_tp) mtp on mtp.tp = lnd.media_tp
        ${whereQ.length > 0 && "where " + whereQ.join(" and ")}
        order by lnd.cre_date desc 
        limit ${limit} offset ${offset} ;
        `;
            const { rows } = await client.query(quer, whereVal);
            const { rowCount } = await client.query(
                `
                select
                lnd.det_id,
                lnd.cre_date,
                lnh.inco_1,
                tanggal_surat_jalan,
                lnh.id_do,
                driver_id,
                driver_name,
                vhcl_id,
                mtp.tp_desc as media_tp,
                plan_qty,
                lnh.uom,
                lnh.plant,
                fac_plant,
                oth_plant,
                fac_batch,
                oth_batch,
                fac_valtype ,
                oth_valtype ,
                ln_num,
                lnd.is_active,
                lnd.create_by
            from
                loading_note_det lnd
            left join loading_note_hd lnh on
                lnh.hd_id = lnd.hd_fk
            left join (select distinct tp, tp_desc from master_tp) mtp on mtp.tp = lnd.media_tp
            ${whereQ.length > 0 && "where " + whereQ.join(" and ")}
            order by lnd.cre_date desc ;
            `,
                whereVal
            );
            return {
                data: rows,
                count: rowCount,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.showCreatedLN = async (q, limit, offset, id_user, role) => {
    let whereVal = [];
    let whereQ = [];
    let index = 1;
    // console.log(role);
    if (role !== "ADMIN" && role !== "LOGISTIC") {
        whereVal.push(id_user);
        whereQ.push(`lnd.create_by = $${index}`);
        index++;
    } else {
        whereVal.push(true);
        whereQ.push(
            `lnd.delete_req = $${index} and lnd.respon_del is null and lnd.is_active = true `
        );
        index++;
    }
    if (q !== "" && q) {
        let que = "";
        whereVal.push(`${q}:*`);
        que += `( lnd.search_vector @@ to_tsquery('english', $${index})`;
        index++;
        whereVal.push(`${q}:*`);
        que += ` or lnh.search_vector @@ to_tsquery('english', $${index}) )`;
        index++;
        whereQ.push(que);
    }
    try {
        const client = await db.connect();
        try {
            const quer = `
            select
            lnd.det_id as id,
            TO_CHAR(lnd.cre_date, 'DD-MM-YYYY') AS cre_date,
            lnh.inco_1,
            TO_CHAR(tanggal_surat_jalan, 'DD-MM-YYYY') as tanggal_surat_jalan,
            driver_id,
            driver_name,
            vhcl_id,
            mtp.tp_desc as media_tp,
            plan_qty,
            lnh.uom,
            lnh.plant,
            lnh.company,
            fac_plant,
            oth_plant,
            fac_batch,
            oth_batch,
            fac_valtype ,
            oth_valtype ,
            ln_num,
            lnd.is_active,
            lnd.create_by,
            lnd.delete_req,
            lnd.remark_delete
                from
                    loading_note_det lnd
                left join loading_note_hd lnh on
                    lnh.hd_id = lnd.hd_fk
                left join (select distinct tp, tp_desc from master_tp) mtp on mtp.tp = lnd.media_tp
                where lnd.tanggal_surat_jalan + interval '7' day > now() and lnd.ln_num is not null ${whereQ.length > 0 && " and " + whereQ.join(" and ")}
                order by lnh.plant asc, lnd.cre_date desc 
            `;
            // console.log(quer);
            const { rows } = await client.query(
                quer + (limit ? ` limit ${limit} offset ${offset} ;` : ";"),
                whereVal
            );
            const { rowCount } = await client.query(quer, whereVal);
            return {
                data: rows,
                count: rowCount,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

LoadingNoteModel.requestDelete = async (selected, remark, id_user) => {
    try {
        const client = await db.connect();
        const loadNote = [];
        const phase =
            process.env.NODE_ENV === "production" ||
            process.env.NODE_ENV === "sandbox"
                ? "production"
                : "development";
        try {
            await client.query(TRANS.BEGIN);
            const { rows: hostname } = await client.query(
                `select hostname from hostname where phase = $1`,
                [process.env.NODE_ENV]
            );
            const { rows: userLog } = await client.query(`select
                string_agg(me.email,
                ',') as email
            from
                mst_email me
            left join mst_user mu on
                me.id_user = mu.id_user
            left join mst_role mr on mr.role_id = mu."role" 
            where mr.role_name = 'LOGISTIC'`);
            const { rows: emailuser } = await client.query(
                `
                select
                    string_agg(me.email,
                    ',') as email
                from
                    mst_email me
                left join mst_user mu on
                    me.id_user = mu.id_user
                where mu.id_user = $1
                `,
                [id_user]
            );
            let link = hostname[0].hostname + `/dashboard/approvedel`;
            for (const d of selected) {
                payload = {
                    delete_req: true,
                    remark_delete: remark,
                };
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
                const [upQue, upVal] = crud.updateItem(
                    "loading_note_det",
                    payload,
                    {
                        ln_num: d.ln_num,
                    },
                    "ln_num"
                );
                await client.query(upQue, upVal);
            }
            await EmailModel.RequestDeleteLN(
                userLog[0].email,
                emailuser[0].email,
                loadNote,
                remark,
                link
            );
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getDataWB = async () => {
    try {
        const config = {
            user: "sa",
            password: "admin",
            server: `localhost\\MSSQLSERVER01`,
            database: "WBSYSTEM_PS",
        };
        const sqlsclient = await Pool.newPool(config).connect();
        try {
            const result = await sqlsclient
                .request()
                .query("SELECT top 10 * from [dbo].wb_transaction ");
            return result;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.syncDataWBNET = async () => {
    try {
        const client = await db.connect();
        const ln_num_synced = [];
        const ncry = new ncrypt(process.env.TOKEN_KEY);
        try {
            //group by plant
            const { rows: plants } = await client.query(`select
                lnh.plant, lnd.ln_num
            from
                loading_note_hd lnh
            left join loading_note_det lnd on
                lnh.hd_id = lnd.hd_fk
            where
               ( lnd.posted = false or lnd.posted is null
                or lnd.receive is null)
                and ln_num is not null
            order by plant
            `);
            const plt = new Map();
            for (const pl of plants) {
                if (!plt.get(pl.plant)) {
                    plt.set(pl.plant, [`'${pl.ln_num}'`]);
                } else {
                    plt.set(pl.plant, [...plt.get(pl.plant), `'${pl.ln_num}'`]);
                }
            }
            for (const [key, value] of plt) {
                try {
                    const { rows: credent } = await client.query(
                        `select ip_host, username, password, dbase from mst_wbnet_conn where plant = $1`,
                        [key]
                    );
                    if (credent.length < 1) {
                        continue;
                    }
                    const conf = {
                        user: credent[0].username,
                        password: ncry.decrypt(credent[0].password),
                        server: credent[0].ip_host,
                        database: credent[0].dbase,
                    };
                    const sqlsclient = await Pool.newPool(conf).connect();
                    await client.query(TRANS.BEGIN);
                    try {
                        const { recordsets } = await sqlsclient.request()
                            .query(`select
                            wtd.[Ref],
                            wtd.internal_number ,
                            wtd.Bruto ,
                            wtd.Tarra ,
                            wtd.Netto ,
                            wt.received ,
                            wt.deduction,
                            wt.posted
                        from
                            wb_transDO wtd
                        left join wb_transaction wt on
                            wtd.[Ref] = wt.[Ref]
                        where
                            wtd.internal_number in (${value.join(",")})`);
                        if (recordsets[0].length > 0) {
                            for (const d of recordsets[0]) {
                                const payload = {
                                    bruto: d.Bruto,
                                    tarra: d.Tarra,
                                    netto: d.Netto,
                                    receive: d.received,
                                    deduction: d.deduction,
                                    posted: d.posted === "Y" ? true : false,
                                };
                                const [que, val] = crud.updateItem(
                                    "loading_note_det",
                                    payload,
                                    { ln_num: d.internal_number },
                                    "ln_num"
                                );
                                await client.query(que, val);
                                ln_num_synced.push(d.internal_number);
                            }
                        }
                    } catch (error) {
                        throw error;
                    } finally {
                        sqlsclient.close();
                    }
                } catch (error) {
                    throw error;
                }
            }
            await client.query(TRANS.COMMIT);
            console.log("WBNET Synced");
            console.log(ln_num_synced);
            return {
                message: "WBNET Synced",
            };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getLNDataSAP = async (dateStart, dateEnd, do_num) => {
    try {
        const { data } = await axios.get(
            `
            ${process.env.ODATADOM}:${process.env.ODATAPORT}//sap/opu/odata/sap/ZGW_REGISTRA_SRV/QTYPLANSet?$filter=(Erdat%20ge%20datetime%27${dateStart}T00:00:00%27)and(Erdat%20le%20datetime%27${dateEnd}T00:00:00%27)and(VbelnRef%20eq%20%27${do_num}%27)&$format=json
            `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const resultodata = data.d.results;
        const result = resultodata.map(row => {
            let str = row.Erdat;
            let unix = str.match(/\d+/)[0];
            return {
                ln_num: row.Zdconr,
                planning_qty: row.PlnLfimg,
                erdat: moment(new Date(parseInt(unix))).format("YYYY-MM-DD"),
            };
        });
        return result;
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.syncLNDataSAP = async () => {
    try {
        const client = await db.connect();
        const ln_num_synced = [];
        try {
            await client.query(TRANS.BEGIN);
            const { rows: do_num } =
                await client.query(`select distinct id_do from loading_note_hd hd
                left join loading_note_det det on hd.hd_id = det.hd_fk
                where( det.plan_qty_sap is null or det.fac_qty_sap is null) and det.ln_num is not null
                `);
            for (const dt of do_num) {
                const que = `select TO_CHAR(max(cre_date), 'YYYY-MM-DD') as max_erdat, TO_CHAR(min(cre_date), 'YYYY-MM-DD') as min_erdat from loading_note_det det
                    left join loading_note_hd hd on hd.hd_id = det.hd_fk
                    where hd.id_do = $1`;
                let startDate;
                let endDate;
                const { rows: dateRangeLast } = await client.query(
                    `${que} and (det.plan_qty_sap is not null or det.fac_qty_sap is not null) and ln_num is not null
                    `,
                    [dt.id_do]
                );

                if (dateRangeLast[0].min_erdat === null) {
                    const { rows: dateRange } = await client.query(
                        `${que} and ln_num is not null`,
                        [dt.id_do]
                    );
                    startDate = moment(dateRange[0].min_erdat).format(
                        "YYYY-MM-DD"
                    );
                    endDate = moment(dateRange[0].max_erdat).format(
                        "YYYY-MM-DD"
                    );
                } else {
                    startDate = moment(dateRangeLast[0].min_erdat)
                        .add(1, "days")
                        .format("YYYY-MM-DD");
                    endDate = moment(dateRangeLast[0].max_erdat)
                        .add(1, "days")
                        .format("YYYY-MM-DD");
                }
                const { data } = await axios.get(
                    `
                    ${process.env.ODATADOM}:${process.env.ODATAPORT}//sap/opu/odata/sap/ZGW_REGISTRA_SRV/QTYPLANSet?$filter=(Erdat%20ge%20datetime%27${startDate}T00:00:00%27)and(Erdat%20le%20datetime%27${endDate}T00:00:00%27)and(VbelnRef%20eq%20%27${dt.id_do}%27)&$format=json
                    `,
                    {
                        auth: {
                            username: process.env.UNAMESAP,
                            password: process.env.PWDSAP,
                        },
                    }
                );
                const resultodata = data.d.results;
                for (const row of resultodata) {
                    const payload = {
                        plan_qty_sap: parseInt(row.PlnLfimg),
                        fac_qty_sap: parseInt(row.LLfimg),
                    };
                    const [queUp, valUp] = crud.updateItem(
                        "loading_note_det",
                        payload,
                        { ln_num: row.Zdconr },
                        "ln_num"
                    );
                    await client.query(queUp, valUp);
                    ln_num_synced.push(row.Zdconr);
                }
            }
            await client.query(TRANS.COMMIT);
            console.log("LN SAP Synced :");
            console.log(ln_num_synced);
            return ln_num_synced;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getOSQtySAP = async (beforeDate, do_num) => {
    try {
        const { data } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${do_num}')&$format=json
        `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        // console.log(beforeDate);
        const conData = data.d.results[0];
        const con_qty = parseFloat(conData.Kwmeng);
        // console.log(
        //     `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/QTYPLANSet?$filter=(Erdat%20le%20datetime%27${beforeDate}T00:00:00%27)and(VbelnRef%20eq%20%27${do_num}%27)&$format=json`
        // );
        const { data: planQty } = await axios.get(
            `
            ${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/QTYPLANSet?$filter=(Erdat%20le%20datetime%27${beforeDate}T00:00:00%27)and(VbelnRef%20eq%20%27${do_num}%27)&$format=json
            `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        let totalQuantity = 0;
        let totalDeleted = 0;
        const { data: DOTRXDELETE } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELETESet?$filter=(VbelnRef%20eq%20%27${do_num}%27)&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        if (DOTRXDELETE.d.results.length > 0) {
            DOTRXDELETE.d.results.map(item => {
                totalDeleted += parseFloat(item.PlnLfimg);
            });
        }
        for (const d of planQty.d.results) {
            const planQty = parseFloat(d.PlnLfimg);
            const actualQty = parseFloat(d.LLfimg);
            if (actualQty == 0) {
                totalQuantity += planQty;
            } else {
                totalQuantity += actualQty;
            }
        }
        console.log(totalQuantity);
        console.log(con_qty);
        return {
            os_sap: con_qty - (totalQuantity - totalDeleted),
        };
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.getOSQtyWB = async (beforeDate, do_num) => {
    try {
        const client = await db.connect();
        try {
            const { rows: postedData } = await client.query(
                `select coalesce(sum(receive), 0) as receive from loading_note_det det
                left join loading_note_hd hd on det.hd_fk = hd.hd_id
                where hd.id_do = $1 and cre_date < TO_DATE('${beforeDate}', 'YYYY-MM-DD')
                and posted = true
                ;`,
                [do_num]
            );
            const { rows: unpostedData } = await client.query(
                `select coalesce(sum(receive), 0) as receive from loading_note_det det
                left join loading_note_hd hd on det.hd_fk = hd.hd_id 
                where hd.id_do = $1 and cre_date < TO_DATE('${beforeDate}', 'YYYY-MM-DD')
                and (posted = false or posted is null)
                ;`,
                [do_num]
            );
            const { data } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${do_num}')&$format=json
            `,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            const conData = data.d.results[0];
            const con_qty = parseFloat(conData.Kwmeng);
            console.log(con_qty);
            const qtyposted = parseFloat(postedData[0].receive);
            console.log(qtyposted);
            const qtyunposted = parseFloat(unpostedData[0].receive);
            return {
                osposted: con_qty - qtyposted,
                osunposted: con_qty - qtyunposted,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

LoadingNoteModel.syncDataStagingWBNET = async (comp, month, year) => {
    let oraclient;
    let psqlclient;
    try {
        oraclient = await ora.getConnection();
        psqlclient = await db.connect();
        let updatedLN = [];
        try {
            await psqlclient.query(TRANS.BEGIN);
            const qGetStaging = `
                SELECT
                    INTERNAL_NUMBER AS LOADING_NOTE,
                    GROSS,
                    TARE,
                    RECEIVED,
                    DEDUCTION,
                    NET,
                    POSTED,
                    LOADING_QTY
                FROM
                    WBNET_DATA_TRX wdt
                WHERE
                    TO_CHAR(REPORT_DATE, 'MM') = :monthfil
                    AND to_char(REPORT_DATE, 'YYYY') = :yearfil
                    AND COY = :compfil
            `;
            const { metadata, rows: data_staging } = await oraclient.execute(
                qGetStaging,
                {
                    monthfil: month,
                    yearfil: year,
                    compfil: comp,
                }
            );
            const { rows: data_prereg } = await psqlclient.query(
                `
                select
                lnd.ln_num,
                lnd.netto,
                lnd.posted,
                lnd.plan_qty 
            from
                loading_note_det lnd
            left join loading_note_hd lnh on
                lnd.hd_fk = lnh.hd_id
            where TO_CHAR(lnd.tanggal_surat_jalan,
                'MM') = $1
                and TO_CHAR(lnd.tanggal_surat_jalan,
                'YYYY') = $2
                and lnh.company = $3
                and ln_num is not null`,
                [month, year, comp]
            );
            const prereg_loadnote = new Map();

            for (const row of data_prereg) {
                prereg_loadnote.set(row.ln_num, {
                    netto: row.netto,
                    posted: row.posted,
                    plan_qty: row.plan_qty,
                });
            }

            for (const row of data_staging) {
                const loadnote = row[0];
                const preg = prereg_loadnote.get(loadnote);
                if (preg) {
                    let payload;
                    const posted_prereg =
                        preg.posted === null ? "" : preg.posted ? "Y" : "N";
                    if (posted_prereg !== row[6]) {
                        payload = {
                            bruto: row[1],
                            tarra: row[2],
                            netto: row[5],
                            receive: row[3],
                            deduction: row[4],
                            posted: row[6] === "Y" ? true : false,
                        };
                        const [queUp, valUp] = crud.updateItem(
                            "loading_note_det",
                            payload,
                            {
                                ln_num: loadnote,
                            },
                            "ln_num"
                        );
                        const { rows: upLN } = await psqlclient.query(
                            queUp,
                            valUp
                        );
                        updatedLN.push(upLN[0].ln_num);
                    }
                }
            }
            await psqlclient.query(TRANS.COMMIT);
            /*
            [0] => LOADING_NOTE
            [1] => BRUTO
            [2] => TARE
            [3] => RECEIVED
            [4] => DEDUCTION
            [5] => NET
            [6] => POSTED
            [7] => LOADING_QTY
            */
            return updatedLN;
        } catch (error) {
            await psqlclient.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            if (psqlclient) {
                psqlclient.release();
            }
            if (oraclient) {
                oraclient.release();
            }
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};
module.exports = LoadingNoteModel;
