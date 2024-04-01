const db = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const TRANS = require("../config/transaction");
const ExcelJS = require("exceljs");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const noderfc = require("node-rfc");
const INDICATOR = require("../config/IndicateRFC");
const moment = require("moment");
noderfc.setIniFileDirectory("../customer_prereg");
const poolRFC = require("../config/rfcconnection");
const EmailModel = require("../models/EmailModel");

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
            const payloadHeader = {
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
                    cre_date: rows.loading_date,
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
            const { rows, rowCount } = await client.query(
                `SELECT HD.HD_ID,
                HD.ID_DO,
                HD.CUR_POS,
                CONCAT(HD.MATERIAL, ' - ', HD.DESC_CON) AS MATERIAL,
                HD.PLANT,
                USR.EMAIL,
                CONCAT(CUS.KUNNR,
            
                    ' - ',
                    CUS.NAME_1) AS CUSTOMER
            FROM LOADING_NOTE_HD HD
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUS ON USR.SAP_CODE = CUS.KUNNR
            WHERE HD.HD_ID = $1`,
                [id_header]
            );
            const dataEmail = rows[0];
            const { rows: dataLogistic } = await client.query(
                `SELECT USR.EMAIL FROM MST_USER USR
                LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = USR.ROLE
                WHERE RL.ROLE_NAME = 'LOGISTIC'`
            );
            const email_target = dataLogistic
                .map(item => item.email)
                .join(", ");
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
                email_target,
                cc_target
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

LoadingNoteModel.finalizeLoadingNote = async (params, session) => {
    const client = await db.connect();
    const rfcclient = new noderfc.Client({ dest: "Q13" });
    const today = new Date();
    // let que, val;
    const idLoad = params.uuid;
    try {
        await client.query(TRANS.BEGIN);
        await rfcclient.open();
        const is_draft = params.is_draft;
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
            factory_plt: params.fac_plant,
            factory_sloc: params.fac_store_loc,
            oth_factory_plt: params.oth_plant,
            oth_factory_sloc: params.oth_store_loc,
            factory_batch: params.fac_batch,
            oth_party_batch: params.oth_batch,
            factory_valtype: params.fac_val_type,
            oth_party_valtype: params.oth_val_type,
            is_paid: params.is_paid,
            driver_name: params.driver_name,
            company_code: params.company_code,
            media_tp: params.media_tp,
            update_at: today,
            update_by: session.id_user,
        };
        const param = {
            I_RECORD_REGISTRA: {
                BUKRS: params.company_code,
                UPLOADID: "1",
                DOTYPE: "S",
                ITEMRULE: params.rules,
                VBELN_REF: params.do_num,
                POSNR: "000010",
                EBELN_REF: "",
                CREDAT: moment(params.loading_date).format("DD.MM.YYYY"),
                MATNR: "",
                PLN_LFIMG: params.planned_qty.toString(),
                DWERKS: params.fac_plant,
                DLGORT: params.fac_store_loc,
                RWERKS: params.oth_plant,
                RLGORT: params.oth_store_loc,
                ZZTRANSP_TYPE: params.media_tp,
                WANGKUTAN: "",
                WNOSIM: params.driver,
                WNOPOLISI: params.vehicle,
                L_LFIMG: "0",
                OP_LFIMG: "0",
                DOPLINE: "0000",
                VSLCD: "",
                VOYNR: "",
                DCHARG_1: params.company_code,
                RCHARG_1: params.do_num,
                RBWTAR_1: params.oth_val_type,
            },
        };
        if (is_draft) {
            payload.cur_pos = "FINA";
        } else {
            const sapPush = await rfcclient.call(
                "ZRFC_PRE_REGISTRA_CUST",
                param
            );
            if (INDICATOR.hasOwnProperty(sapPush.RFC_TEXT)) {
                throw new Error(sapPush.RFC_TEXT);
            } else if (sapPush.RFC_TEXT.includes("is not allowed")) {
                throw new Error(sapPush.RFC_TEXT);
            } else {
                const loadingNoteNum = sapPush.RFC_TEXT.replace(
                    /[^0-9]/g,
                    ""
                ).trim();
                payload.id_loadnote = loadingNoteNum;
            }
            payload.cur_pos = "END";
        }
        const [que, val] = crud.updateItem(
            "loading_note",
            payload,
            { uuid: idLoad },
            "id_loadnote"
        );
        const { rows } = await client.query(que, val);
        await client.query(TRANS.COMMIT);
        return rows[0].id_loadnote;
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

LoadingNoteModel.showSLoc = async plant => {
    try {
        const rfcclient = new noderfc.Client({ dest: "Q13" });
        await rfcclient.open();
        try {
            const { I_PLANT, I_SLOC } = await rfcclient.call(
                "ZRFC_PRE_REGISTRA_STORELOC",
                {
                    I_PLANT: plant,
                }
            );
            const dataSloc = I_SLOC.map(item => ({
                value: item.LGORT,
                label: item.LGORT,
            }));
            return dataSloc;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.getById = async id_header => {
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
            const detail = rows.map(item => ({
                id_detail: item.det_id,
                vehicle: { value: item.vhcl_id, label: item.vhcl_id },
                driver: {
                    value: item.driver_id,
                    label: item.driver_id + " - " + item.driver_name,
                },
                loading_date: item.cre_date,
                planned_qty: item.plan_qty,
                media_tp: item.media_tp,
            }));
            const hd_dt = rows[0];
            const resp = {
                do_num: hd_dt.id_do,
                inv_type: hd_dt.invoice_type,
                inv_type_tol_from: hd_dt.tol_from,
                inv_type_tol_to: hd_dt.tol_to,
                incoterms: hd_dt.inco_1 + "-" + hd_dt.inco_2,
                rules: hd_dt.rules,
                con_num: hd_dt.con_num,
                material: hd_dt.material,
                con_qty: hd_dt.con_qty,
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
            console.log(rows);
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

LoadingNoteModel.getRequestedLoadNote2 = async (filters = []) => {
    try {
        const client = await db.connect();
        try {
            let filter_que = [];
            let filter_val = [];
            let filterStr = "";
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
                HD.PLANT,
                HD.RULES,
                HD.company,
                HD.material,
                DET.fac_plant,
                DET.oth_plant,
                DET.media_tp,
                DET.driver_id,
                USR.SAP_CODE as cust_code,
                CUST.name_1 as cust_name,
                CONCAT(DET.DRIVER_ID,

                    ' - ',
                    DET.DRIVER_NAME) AS DRIVER,
                DET.VHCL_ID,
                TO_CHAR(DET.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE,
                DET.cre_date as CREATE_DATE,
                DET.PLAN_QTY,
                HD.UOM
            FROM LOADING_NOTE_HD HD
            LEFT JOIN LOADING_NOTE_DET DET ON HD.HD_ID = DET.HD_FK
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUST ON CUST.kunnr = USR.SAP_CODE
            LEFT JOIN MST_KEY MKY ON MKY.key_item = DET.media_tp
            WHERE DET.ln_num IS NULL AND DET.PUSH_SAP_DATE IS NULL AND HD.CUR_POS = 'FINA'`;
            const que = `SELECT * FROM (${baseQ}) A ${filterStr} ;`;
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

LoadingNoteModel.finalizeLoadingNote_2 = async (params, session) => {
    try {
        const client = await db.connect();
        let rfcclient = await poolRFC.acquire();
        let dbpromise = [];
        let loading_note = new Map();
        let failed_case = new Map();
        const today = new Date();
        const uploadData = params.selected_req;
        const fac_sloc = params.fac_sloc;
        const fac_valtype = params.fac_valtype;
        const oth_sloc = params.oth_sloc;
        const oth_valtype = params.oth_valtype;
        try {
            await client.query(TRANS.BEGIN);
            let index = 0;
            for (item of uploadData) {
                const param = {
                    I_RECORD_REGISTRA: {
                        BUKRS: item.company,
                        UPLOADID: "1",
                        DOTYPE: "S",
                        ITEMRULE: item.rules,
                        VBELN_REF: item.id_do,
                        POSNR: "10",
                        EBELN_REF: "",
                        CREDAT: moment(item.create_date).format("DD.MM.YYYY"),
                        MATNR: item.material,
                        PLN_LFIMG: item.plan_qty,
                        DWERKS: item.fac_plant,
                        DLGORT: fac_sloc,
                        RWERKS: item.oth_plant,
                        RLGORT: oth_sloc,
                        ZZTRANSP_TYPE: item.media_tp,
                        WANGKUTAN: "",
                        WNOSIM: item.driver_id,
                        WNOPOLISI: item.vhcl_id,
                        L_LFIMG: "0",
                        OP_LFIMG: "0",
                        DOPLINE: "0000",
                        VSLCD: "",
                        VOYNR: "",
                        DCHARG_1: item.company,
                        RCHARG_1: item.id_do,
                        RBWTAR_1: oth_valtype,
                    },
                };
                const data = await rfcclient.call(
                    "ZRFC_PRE_REGISTRA_CUST",
                    param
                );
                if (
                    data?.RFC_TEXT &&
                    data?.RFC_TEXT.includes("successfully created")
                ) {
                    loading_note.set(
                        uploadData[index].id,
                        data?.RFC_TEXT.replace(/[^0-9]/g, "").trim()
                    );
                } else {
                    failed_case.set(
                        `${uploadData[index].id_do}-${uploadData[index].vhcl_id}-${uploadData[index].id}`,
                        data?.RFC_TEXT
                    );
                }
                index++;
            }
            loading_note.forEach((value, key) => {
                const payload = {
                    ln_num: value,
                    is_pushed: true,
                    fac_sloc: fac_sloc,
                    oth_sloc: oth_sloc,
                    fac_valtype: fac_valtype,
                    oth_valtype: oth_valtype,
                    update_at: today,
                    update_by: session.id_user,
                };
                const [que, val] = crud.updateItem(
                    "loading_note_det",
                    payload,
                    { det_id: key },
                    "ln_num"
                );
                dbpromise.push(client.query(que, val));
            });
            const resultDb = await Promise.all(dbpromise);
            // console.log(resultDb);
            await client.query(TRANS.COMMIT);
            return {
                loading_note: Object.fromEntries(loading_note.entries()),
                failed: Object.fromEntries(failed_case.entries()),
            };
        } catch (error) {
            console.log(error);
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
            poolRFC.release(rfcclient);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

LoadingNoteModel.finalizeLoadingNote_3 = async (params, session) => {
    try {
        const client = await db.connect();
        const oraclient = await ora.getConnection();
        const today = new Date();
        const uploadData = params.selected_req;
        const fac_sloc = params.fac_sloc;
        const fac_valtype = params.fac_valtype;
        const oth_sloc = params.oth_sloc;
        const oth_valtype = params.oth_valtype;
        try {
            await client.query(TRANS.BEGIN);
            for (item of uploadData) {
                const { rowCount } = await client.query(
                    `SELECT * FROM loading_note_det WHERE det_id = $1 and push_sap_date is not null`,
                    [item.id]
                );
                if (rowCount > 0) {
                    throw new Error("Request already pushed");
                }
                const param = {
                    HEAD_ID: item.hd_id,
                    DET_ID: item.id,
                    BUKRS: item.company,
                    UPLOADID: "1",
                    DOTYPE: "S",
                    ITEMRULE: item.rules,
                    VBELN_REF: item.id_do,
                    POSNR: "000010",
                    EBELN_REF: "",
                    // CREDAT: moment(item.create_date).format("DD.MM.YYYY"),
                    CREDAT: `TO_DATE('${moment(item.create_date).format("YYYY-MM-DD")}', 'yyyy-mm-dd')`,
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
                    DCHARG_1: item.company,
                    RCHARG_1: item.id_do,
                    RBWTAR_1: oth_valtype,
                    CREATE_BY: session.id_user,
                    CREATE_AT: `TO_DATE('${moment(today).format("YYYY-MM-DD")}', 'yyyy-mm-dd')`,
                    ISACTIVE: "TRUE",
                    FLAG: "I",
                    ISRETRIVEDBYSAP: "FALSE",
                    USERSAP: session.id_sap,
                };
                const [queIns, valIns] = crud.insertItemOra(
                    "PREREG_LOADING_NOTE_SAP",
                    param
                );
                const paramDb = {
                    push_sap_date: today,
                    update_by: session.id_user,
                    fac_sloc: fac_sloc,
                    oth_sloc: oth_sloc,
                    fac_valtype: fac_valtype,
                    oth_valtype: oth_valtype,
                    plan_qty: parseInt(item.plan_qty),
                };
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
            }
            // console.log(resultDb);
            await client.query(TRANS.COMMIT);
            await oraclient.commit();
            return {
                message: "Loading Note request staged to SAP",
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

LoadingNoteModel.getAllDataLNbyUser_2 = async (session, isallow) => {
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
            CONCAT(HD.CON_QTY,
                HD.UOM) AS CON_QTY,
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
                    GROUP BY HD_FK
                ) DET ON HD.HD_ID = DET.HD_FK
                LEFT JOIN (
                    SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM LOADING_NOTE_DET DET
                            LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                            WHERE DET.LN_NUM IS NOT NULL
                            GROUP BY HD_FK
                ) LNU ON HD.HD_ID = LNU.HD_FK `;
                whereClause = `WHERE HD.CREATE_BY = $1 AND LNU.CTRLN IS NULL ORDER BY HD.CREATE_AT DESC`;
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
                whereClause = `WHERE HD.CUR_POS = 'FINA' AND DET.CTROS IS NOT NULL AND LNU.CTRLN IS NULL`;
            }

            if (isallow) {
                const getDataSess = `${que_par} ${leftJoin} ${whereClause}`;
                console.log(getDataSess);
                const { rows } = await client.query(getDataSess, [
                    session.id_user,
                ]);
                parentRow = rows;
            } else {
                const getDataSess = `${que_par} ${leftJoin} ${whereClause}`;
                const { rows } = await client.query(getDataSess);
                parentRow = rows;
            }

            for (const row of parentRow) {
                const que_ch = `SELECT 
                TO_CHAR(DET.CRE_DATE,
            
                    'MM-DD-YYYY') AS CRE_DATE,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                MKY.key_desc as media_tp,
                CONCAT(DET.PLAN_QTY, ' ', HD.UOM) AS PLAN_QTY,
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

LoadingNoteModel.getSSRecap = async (filters, customer_id) => {
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
        WHERE DET.LN_NUM IS NOT NULL `;
    let where = [];
    let whereVal = [];
    let ltindex = 0;
    let whereQue = "";
    filters.forEach((item, index) => {
        let value = item.value;
        let id = item.id;
        if (item.id === "Incoterms") {
            value = item.value.split("-")[0].trim();
            id = "inco_1";
        } else if (item.id === "Customer") {
            value = item.value.split("-")[0].trim();
            id = "kunnr";
        } else if (item.id === "Contract Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "con_qty";
        } else if (item.id === "Planning Quantity") {
            value = item.value.split(" ")[0].trim();
            id = "plan_qty";
        }
        where.push(`${id} = $${index + 1}`);
        ltindex++;
        whereVal.push(value);
    });
    if (customer_id !== "") {
        where.push(`kunnr = $${ltindex}`);
        whereVal.push(customer_id);
    }
    if (where.length != 0) {
        whereQue = `AND ${where.join(" AND ")}`;
    }
    let que = `${getRecapData} ${whereQue}`;
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

LoadingNoteModel.generateExcel = async (filters, customer_id) => {
    try {
        const rowData = await LoadingNoteModel.getSSRecap(filters, customer_id);
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

module.exports = LoadingNoteModel;
