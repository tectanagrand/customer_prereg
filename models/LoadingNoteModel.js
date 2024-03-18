const db = require("../config/connection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const noderfc = require("node-rfc");
const INDICATOR = require("../config/IndicateRFC");
const moment = require("moment");
noderfc.setIniFileDirectory("c:/customer_prereg");

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

module.exports = LoadingNoteModel;
