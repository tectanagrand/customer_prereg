const db = require("../config/connection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const noderfc = require("node-rfc");
const INDICATOR = require("../config/IndicateRFC");
const moment = require("moment");
noderfc.setIniFileDirectory("../customer_prereg");

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
            };
            if (is_draft) {
                payloadHeader.cur_pos = "INIT";
            } else {
                payloadHeader.cur_pos = "FINA";
            }
            console.log(payloadHeader);
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
                POSNR: "10",
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
            console.log(sapPush);
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

LoadingNoteModel.getRequestedLoadNote = async () => {};

module.exports = LoadingNoteModel;
