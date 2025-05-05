const db = require("../config/connection");
const { getConnection } = require("../config/oracleconnectionv2");
const TRANS = require("../config/transaction");
const LoadingNoteModel = require("./LoadingNoteModel");
const uuid = require("uuidv4");
const moment = require("moment");
const crud = require("../helper/crudquery");
const OSCheck = require("../helper/OSCheck");

const MultiLoadingNoteModel = {};

MultiLoadingNoteModel.SaveMultiDB = async ({ params, session }) => {
    try {
        const client = await db.connect();
        try {
            let id_dos = new Map();
            let action_hd = "update";
            let today = moment();
            await client.query(TRANS.BEGIN);
            let hd_id = params.hd_id;
            if (!hd_id) {
                action_hd = "insert";
                hd_id = uuid.uuid();
            }
            const ticket_no = await LoadingNoteModel.GetLatestNoTicket(
                session.id_user
            );
            const header_data = {
                tanggal_surat_jalan: params.tanggal_surat_jalan,
                driver_id: params.driver_id,
                driver_name: params.driver_name,
                vehicle_id: params.vehicle_id,
                media_tp: params.media_tp,
                ticket_no: ticket_no.new_created_ticket,
                cur_pos: "INIT",
            };
            switch (action_hd) {
                case "insert":
                    header_data.hd_id = hd_id;
                    header_data.tanggal_pembuatan = today.format("YYYY-MM-DD");
                    header_data.create_at = today.format("YYYY-MM-DDTHH:mm:ss");
                    header_data.create_by = session.id_user;
                    const [insQue, insVal] = crud.insertItem(
                        "multi_ln_hd",
                        header_data
                    );
                    await client.query(insQue, insVal);
                    break;

                case "update":
                    header_data.update_at = today.format("YYYY-MM-DDTHH:mm:ss");
                    header_data.update_by = session.id_user;
                    const [upQue, upVal] = crud.updateItem(
                        "multi_ln_hd",
                        header_data,
                        {
                            hd_id: hd_id,
                        }
                    );
                    await client.query(upQue, upVal);
                    break;
            }
            for (const det of params.requests) {
                await LoadingNoteModel.CheckIsExceedOS(det.id_do, det);
                if (!id_dos.get(det.id_do)) {
                    id_dos.set(det.id_do, 0);
                } else {
                    throw new Error("DO cannot be duplicate in a request");
                }
                let action_det = "update";
                let det_id = det.det_id;
                if (!det_id) {
                    action_det = "insert";
                    det_id = uuid.uuid();
                }
                const detail_data = {
                    hd_id: hd_id,
                    id_do: det.id_do,
                    id_so: det.id_so,
                    id_sto: det.id_sto,
                    inco_1: det.inco_1,
                    inco_2: det.inco_2,
                    invoice_type: det.invoice_type,
                    tol_from: det.tol_from.replace("%", "").trim(),
                    tol_to: det.tol_to.replace("%", "").trim(),
                    rules: det.rules,
                    con_num: det.con_num,
                    material: det.material,
                    desc_mat: det.desc_mat,
                    con_qty: det.con_qty,
                    uom: det.uom,
                    plant: det.plant,
                    company: det.company,
                    is_paid: det.is_paid,
                    trans_type: det.trans_type,
                    trg_cust: det.trg_cust,
                    planned_qty: det.planned_qty,
                    is_paid: det.is_paid,
                    fac_plant: det.fac_plant,
                    oth_plant: det.oth_plant,
                    fac_batch: det.company,
                    oth_batch: det.oth_batch,
                    ref_id_do: det.ref_id_do,
                    buyer_name: det.buyer_name,
                };
                switch (action_det) {
                    case "insert":
                        detail_data.det_id = det_id;
                        detail_data.create_at = today.format(
                            "YYYY-MM-DDTHH:mm:ss"
                        );
                        detail_data.create_by = session.id_user;
                        const [insQue, insVal] = crud.insertItem(
                            "multi_ln_det",
                            detail_data
                        );
                        await client.query(insQue, insVal);
                        break;

                    case "update":
                        detail_data.update_at = today.format(
                            "YYYY-MM-DDTHH:mm:ss"
                        );
                        detail_data.update_by = session.id_user;
                        const [upQue, upVal] = crud.updateItem(
                            "multi_ln_det",
                            detail_data,
                            {
                                det_id: det_id,
                            }
                        );
                        await client.query(upQue, upVal);
                        break;
                }
            }
            await client.query(TRANS.COMMIT);
            return {
                driver: params.driver_id,
                vehicle: params.vehicle_id,
                do: Array.from(id_dos.keys()),
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

MultiLoadingNoteModel.GetReqbyID = async ({ id }) => {
    try {
        const client = await db.connect();
        try {
            const { rows: data_req } = await client.query(
                `
                select
                    mlh.hd_id,
                    mlh.driver_name,
                    mlh.driver_id,
                    TO_CHAR(mlh.tanggal_surat_jalan, 'yyyy-mm-dd') as tanggal_surat_jalan,
                    TO_CHAR(mlh.tanggal_pembuatan, 'yyyy-mm-dd') as tanggal_pembuatan,
                    mlh.vehicle_id,
                    mlh.media_tp,
                    mld.det_id,
                    mld.id_do,
                    mld.id_so,
                    mld.id_sto,
                    mld.inco_1,
                    mld.inco_2,
                    mld.invoice_type,
                    mld.tol_from,
                    mld.tol_to,
                    mld.rules,
                    mld.con_num,
                    mld.material,
                    mld.desc_mat,
                    mld.con_qty,
                    mld.uom,
                    mld.plant,
                    mld.company,
                    mld.is_paid,
                    mld.planned_qty,
                    mld.fac_plant,
                    mld.oth_plant,
                    mld.fac_batch,
                    mld.oth_batch,
                    mld.ref_id_do,
                    mld.buyer_name
                from
                    multi_ln_hd mlh
                left join multi_ln_det mld on
                    mld.hd_id = mlh.hd_id
                where mlh.hd_id = $1
                `,
                [id]
            );
            let result = {
                tanggal_surat_jalan: data_req[0].tanggal_surat_jalan,
                tanggal_pembuatan: data_req[0].tanggal_pembuatan,
                driver_id: data_req[0].driver_id,
                driver_name: data_req[0].driver_name,
                vehicle_id: data_req[0].vehicle_id,
                media_tp: data_req[0].media_tp,
                requests: data_req.map(item => {
                    return {
                        det_id: item.det_id,
                        id_do: item.id_do,
                        id_so: item.id_so,
                        id_sto: item.id_sto,
                        inco_1: item.inco_1,
                        inco_2: item.inco_2,
                        invoice_type: item.invoice_type,
                        tol_from: item.tol_from,
                        tol_to: item.tol_to,
                        rules: item.rules,
                        con_num: item.con_num,
                        material: item.material,
                        description: item.desc_mat,
                        con_qty: item.con_qty,
                        uom: item.uom,
                        plant: item.plant,
                        company: item.company,
                        is_paid: item.is_paid,
                        trans_type: item.trans_type,
                        trg_cust: item.trg_cust,
                        plan_qty: item.planned_qty,
                        fac_plant: item.fac_plant,
                        oth_plant: item.oth_plant,
                        fac_batch: item.company,
                        oth_batch: item.id_do,
                        ref_do_num: item.ref_id_do,
                        buyer_name: item.buyer_name,
                        isB2B: item.ref_id_do ? true : false,
                    };
                }),
            };
            for (const index in data_req) {
                const data = result.requests[index];
                const os_check = await OSCheck.CheckOSCust(data.id_do);
                result.requests[index].os_qty =
                    os_check.ConQty -
                    (os_check.TotalSAP -
                        os_check.TotalDeleted +
                        os_check.TotalTemp -
                        parseInt(data.plan_qty));
                result.requests[index].os_sap_qty =
                    os_check.ConQty -
                    (os_check.TotalSAP - os_check.TotalDeleted);
                result.requests[index].os_remaining =
                    os_check.ConQty -
                    (os_check.TotalSAP -
                        os_check.TotalDeleted +
                        os_check.TotalTemp -
                        parseInt(data.plan_qty));
            }
            return result;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

MultiLoadingNoteModel.ShowDataUser = async ({ user_id }) => {
    try {
        const client = await db.connect();
        try {
            const q = `
            select
                mlh.hd_id,
                TO_CHAR(tanggal_pembuatan,
                'dd-mm-yyyy') as tanggal_pembuatan,
                TO_CHAR(tanggal_surat_jalan,
                'dd-mm-yyyy') as tanggal_surat_jalan ,
                driver_id,
                driver_name,
                vehicle_id,
                cur_pos,
                mk.key_desc as media_tp
            from
                multi_ln_hd mlh
            left join mst_key mk on mk.key_item = mlh.media_tp and type = 'MEDTP'
            where
                ((mlh.cur_pos <> 'END')
                or (mlh.tanggal_surat_jalan + interval '7' day > now ()
                    and mlh.cur_pos = 'END')) AND mlh.create_by = $1`;
            const { rows: data_head } = await client.query(q, [user_id]);
            for (let i = 0; i < data_head.length; i++) {
                const q = `
                    select
                        det_id ,
                        id_do,
                        id_so,
                        id_sto,
                        ln_num,
                        inco_1,
                        company ,
                        plant ,
                        desc_mat ,
                        planned_qty,
                        uom
                    from
                        multi_ln_det
                    where hd_id = $1
                `;
                const { rows: data_det } = await client.query(q, [
                    data_head[i].hd_id,
                ]);
                data_head[i]["sub_table"] = data_det;
            }
            return data_head;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

MultiLoadingNoteModel.SendToLogistic = async ({ hd_id, user_id }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const payload = {
                cur_pos: "FINA",
                update_by: user_id,
            };
            const [upQue, upVal] = crud.updateItem("multi_ln_hd", payload, {
                hd_id: hd_id,
            });
            await client.query(upQue, upVal);
            const { rows: data_send } = await client.query(
                `
                select 
                mlh.tanggal_surat_jalan,
                mlh.tanggal_pembuatan,
                mlh.vehicle_id, 
                mlh.driver_name,
                mlh.driver_id,
                mld.plant,
                mld.company,
                mld.material, 
                mld.desc_mat,
                mld.planned_qty
                from multi_ln_hd mlh
                left join multi_ln_det mld on mlh.hd_id = mld.hd_id
                where mlh.hd_id = $1
                `,
                [hd_id]
            );
            await client.query(TRANS.COMMIT);
            return data_send;
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

MultiLoadingNoteModel.GetOSPushReq = async () => {
    try {
        const client = await db.connect();
        try {
            const q = `
            select
                mlh.hd_id,
                mlh.driver_id ,
                mlh.driver_name ,
                mlh.vehicle_id ,
                mlh.media_tp,
                mlh.tanggal_surat_jalan ,
                mlh.tanggal_pembuatan ,
                mlh.ticket_no,
                array_agg(mld.det_id) as det_id,
                array_agg(mld.id_do) as id_do,
                array_agg(mld.id_so) as id_so,
                array_agg(mld.id_sto) as id_sto,
                array_agg(mld.plant) as plant,
                array_agg(mld.company) as company,
                array_agg(mld.material) as material,
                array_agg(mld.desc_mat) as desc_mat,
                array_agg(mld.inco_1 || ' - ' || mld.inco_2) as incoterm,
                array_agg(mld.inco_1) as inco_1,
                array_agg(mld.planned_qty) as planned_qty,
                array_agg(mld.uom) as uom,
                array_agg(mld.fac_plant) as fac_plant,
                array_agg(coalesce(mld.fac_sloc,
                msp_fac.sloc)) as fac_sloc,
                array_agg(coalesce(mld.fac_valtype,
                mvp_fac.valtype)) as fac_valtype ,
                array_agg(mld.fac_batch) as fac_batch,
                array_agg(mld.oth_plant) as oth_plant,
                array_agg(coalesce(mld.oth_sloc,
                msp_oth.sloc)) as oth_sloc,
                array_agg(coalesce(mld.oth_valtype,
                mvp_oth.valtype)) as oth_valtype,
                array_agg(mld.rules) as item_rule,
                array_agg(mld.oth_batch) as oth_batch,
                array_agg(mld.trans_type) as trans_type,
                array_agg(mc.group_comp) as cgrp,
                array_agg(mbc.kunnr) as cust_code,
                array_agg(mbc.category) as req_cat 
            from
                multi_ln_det mld
            left join multi_ln_hd mlh on
                mld.hd_id = mlh.hd_id
            left join mst_sloc_plant msp_fac on 
                msp_fac.plant = mld.plant
                and msp_fac.material = mld.material
                and msp_fac.facoth = 'FAC'
                and ((msp_fac.incoterm is not null
                    and msp_fac.incoterm = mld.inco_1)
                or msp_fac.incoterm is null)
            left join mst_sloc_plant msp_oth on 
                msp_oth.plant = mld.plant
                and msp_oth.material = mld.material
                and msp_oth.facoth = 'OTH'
                and ((msp_oth.incoterm is not null
                    and msp_oth.incoterm = mld.inco_1)
                or msp_oth.incoterm is null)
            left join mst_valtype_plant mvp_fac on 
                mvp_fac.plant = mld.plant
                and mvp_fac.material = mld.material
                and mvp_fac.facoth = 'FAC'
                and ((mvp_fac.incoterm is not null
                    and mvp_fac.incoterm = mld.inco_1)
                or mvp_fac.incoterm is null)
            left join mst_valtype_plant mvp_oth on 
                mvp_oth.plant = mld.plant
                and mvp_oth.material = mld.material
                and mvp_oth.facoth = 'OTH'
                and ((mvp_oth.incoterm is not null
                    and mvp_oth.incoterm = mld.inco_1)
                or mvp_oth.incoterm is null)
            left join mst_company mc on mc.sap_code = mld.company
            left join mst_user mu on mu.id_user = mlh.create_by 
            left join master_bp_code mbc on mbc.kunnr = mu.username 
            where mld.push_sap_date is null and mlh.cur_pos = 'FINA'
            group by
                mlh.hd_id ,
                mlh.driver_id,
                mlh.driver_name ,
                mlh.vehicle_id ,
                mlh.media_tp ,
                mlh.tanggal_surat_jalan ,
                mlh.tanggal_pembuatan
            order by mlh.tanggal_surat_jalan asc
            `;
            const { rows } = await client.query(q);
            let return_data = [];
            if (rows.length < 1) {
                return {
                    colspan_names: [],
                    pin_col: {
                        right: [
                            "fac_sloc",
                            "fac_valtype",
                            "fac_batch",
                            "oth_sloc",
                            "oth_valtype",
                            "oth_batch",
                        ],
                        left: [],
                    },
                    data: [],
                };
            }
            // get col that will span
            let colspan_names = new Set();
            Object.keys(rows[0]).map(key => {
                if (!Array.isArray(rows[0][key])) {
                    colspan_names.add(key);
                }
            });
            for (const dt of rows) {
                const span = dt.id_do.length;
                for (let i = 0; i < span; i++) {
                    // for index 0, row that come first will have spanning
                    let data_row = {};
                    Object.keys(dt).map(key => {
                        if (colspan_names.has(key)) {
                            data_row[key] = dt[key];
                            if (key == "hd_id") {
                                if (i == 0) {
                                    data_row["id"] = dt[key];
                                } else {
                                    data_row["id"] = dt["det_id"][i];
                                }
                            }
                        } else {
                            data_row[key] = dt[key][i];
                        }
                    });
                    if (i == 0) {
                        data_row["span"] = span;
                        data_row["is_header"] = true;
                    } else {
                        data_row["span"] = 1;
                        data_row["is_header"] = false;
                    }
                    return_data.push(data_row);
                }
            }
            return {
                colspan_names: Array.from(colspan_names.keys()),
                pin_col: {
                    right: [
                        "fac_sloc",
                        "fac_valtype",
                        "fac_batch",
                        "oth_sloc",
                        "oth_valtype",
                        "oth_batch",
                    ],
                    left: [],
                },
                data: return_data,
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

MultiLoadingNoteModel.GetPrintReq = async ({ user_id }) => {
    try {
        const client = await db.connect();
        try {
            const q = `
            select
                mlh.hd_id,
                mlh.driver_id ,
                mlh.driver_name ,
                mlh.vehicle_id ,
                mlh.media_tp,
                mlh.tanggal_surat_jalan ,
                mlh.tanggal_pembuatan ,
                count(mld.ln_num) as count_lnnum,
                count(mld.det_id) as count_req,
                array_agg(mld.det_id) as det_id,
                array_agg(mld.ln_num) as ln_num,
                array_agg(mld.id_do) as id_do,
                array_agg(mld.id_so) as id_so,
                array_agg(mld.id_sto) as id_sto,
                array_agg(mld.plant) as plant,
                array_agg(mld.company) as company,
                array_agg(mld.material) as material,
                array_agg(mld.desc_mat) as desc_mat,
                array_agg(mld.inco_1 || ' - ' || mld.inco_2) as incoterm,
                array_agg(mld.inco_1) as inco_1,
                array_agg(mld.planned_qty) as planned_qty,
                array_agg(mld.uom) as uom,
                array_agg(mld.fac_plant) as fac_plant,
                array_agg(mc.group_comp) as cgrp,
                array_agg(mbc.kunnr) as cust_code,
                array_agg(mbc.name) as name_1,
                array_agg(mbc.category) as req_cat 
            from
                multi_ln_det mld
            left join multi_ln_hd mlh on
                mld.hd_id = mlh.hd_id
            left join mst_company mc on mc.sap_code = mld.company
            left join mst_user mu on mu.id_user = mlh.create_by 
            left join master_bp_code mbc on mbc.kunnr = mu.username 
            where mld.push_sap_date is not null and mlh.create_by = $1
            group by
                mlh.hd_id ,
                mlh.driver_id,
                mlh.driver_name ,
                mlh.vehicle_id ,
                mlh.media_tp ,
                mlh.tanggal_surat_jalan ,
                mlh.tanggal_pembuatan
            order by mlh.tanggal_surat_jalan asc
            `;
            const { rows } = await client.query(q, [user_id]);
            let return_data = [];
            if (rows.length < 1) {
                return {
                    colspan_names: [],
                    pin_col: {
                        left: [
                            "hd_id",
                            "ln_num",
                            "driver_id",
                            "vehicle_id",
                            "tanggal_surat_jalan",
                            "material",
                            "planned_qty",
                        ],
                        right: [],
                    },
                    data: [],
                };
            }
            // get col that will span
            let colspan_names = new Set();
            Object.keys(rows[0]).map(key => {
                if (!Array.isArray(rows[0][key])) {
                    colspan_names.add(key);
                }
            });
            for (const dt of rows) {
                const span = dt.id_do.length;
                for (let i = 0; i < span; i++) {
                    // for index 0, row that come first will have spanning
                    let data_row = {};
                    Object.keys(dt).map(key => {
                        if (colspan_names.has(key)) {
                            data_row[key] = dt[key];
                            if (key == "hd_id") {
                                if (i == 0) {
                                    data_row["id"] = dt[key];
                                } else {
                                    data_row["id"] = dt["det_id"][i];
                                }
                            }
                        } else {
                            data_row[key] = dt[key][i];
                        }
                    });
                    if (i == 0) {
                        data_row["span"] = span;
                        data_row["is_header"] = true;
                    } else {
                        data_row["span"] = 1;
                        data_row["is_header"] = false;
                    }
                    return_data.push(data_row);
                }
            }
            return {
                colspan_names: Array.from(colspan_names.keys()),
                pin_col: {
                    right: [],
                    left: [
                        "hd_id",
                        "driver_id",
                        "vehicle_id",
                        "tanggal_surat_jalan",
                        "ln_num",
                        "material",
                        "planned_qty",
                    ],
                },
                data: return_data,
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

MultiLoadingNoteModel.PushSAPMulti = async ({ data_req, session }) => {
    try {
        const client = await db.connect();
        const oraclient = await getConnection();
        const today = new Date();
        let do_pushed = [];
        try {
            await client.query(TRANS.BEGIN);
            for (const item of data_req) {
                let method = "insert";
                const { rowCount } = await client.query(
                    `
                    SELECT * FROM loading_note_det WHERE det_id = $1 and push_sap_date is not null
                    `,
                    [item.det_id]
                );
                if (rowCount > 0) {
                    method = "update";
                }
                let itemrule = item.item_rule;
                if (item.id_sto && item?.trans_type == "M") {
                    itemrule = "6A";
                }
                const param = {
                    HEAD_ID: item.hd_id,
                    DET_ID: item.det_id,
                    BUKRS: item.company,
                    UPLOADID: "1",
                    DOTYPE: item?.trans_type === "M" ? "T" : "S",
                    ITEMRULE: itemrule,
                    VBELN_REF: item.id_do,
                    EBELN_REF: item.id_sto,
                    POSNR: "000010",
                    // CREDAT: moment(item.create_date).format("DD.MM.YYYY"),
                    CREDAT: new Date(
                        `${moment(item.tanggal_surat_jalan).format("YYYY-MM-DD")}T00:00:00`
                    ),
                    MATNR: item.material,
                    PLN_LFIMG: parseInt(item.planned_qty),
                    DWERKS: item.fac_plant,
                    DLGORT: item.fac_sloc,
                    RWERKS: item.oth_plant,
                    RLGORT: item.oth_sloc,
                    ZZTRANSP_TYPE: item.media_tp,
                    WANGKUTAN: "",
                    WNOSIM: item.driver_id,
                    WNOPOLISI: item.vehicle_id,
                    L_LFIMG: 0,
                    OP_LFIMG: 0,
                    DOPLINE: "0000",
                    VSLCD: "",
                    VOYNR: "",
                    DCHARG_1: item.fac_batch,
                    RCHARG_1: item.oth_batch,
                    RBWTAR_1: item.oth_valtype,
                    DBWTAR: item.fac_valtype,
                    CREATE_BY: session.id_user,
                    CREATE_AT: today,
                    ISACTIVE: "TRUE",
                    FLAG: "I",
                    ISRETRIVEDBYSAP: "FALSE",
                    USERSAP: session.username,
                    IS_MULTI: 1,
                };
                let que, val;
                if (method == "update") {
                    [que, val] = crud.updateItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        param,
                        {
                            DET_ID: item.det_id,
                        }
                    );
                } else {
                    [que, val] = crud.insertItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        param
                    );
                }
                await oraclient.execute(que, val);

                const up_maindb = {
                    push_sap_date: today,
                    update_at: today,
                    update_by: session.id_user,
                    fac_sloc: item.fac_sloc,
                    oth_sloc: item.oth_sloc,
                    fac_valtype: item.fac_valtype,
                    oth_valtype: item.oth_valtype,
                    fac_batch: item.fac_batch,
                    oth_batch: item.oth_batch,
                };

                const [upDb, valDb] = crud.updateItem(
                    "multi_ln_det",
                    up_maindb,
                    {
                        det_id: item.det_id,
                    }
                );
                await client.query(upDb, valDb);
                do_pushed.push(item.id_do);
            }
            await client.query(TRANS.COMMIT);
            await oraclient.commit();
            return do_pushed;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            if (client) {
                client.release();
            }
            if (oraclient) {
                oraclient.release();
            }
        }
    } catch (error) {
        throw error;
    }
};

MultiLoadingNoteModel.ApproveMultiSAP = async (lnreq, session) => {
    try {
        const client = await db.connect();
        const oraclient = await getConnection();
        const id_user = session.id_user;
        const username = session.username;
        const today = new Date();
        try {
            await client.query(TRANS.BEGIN);
            const { rows: materialMst } = await client.query(`
                select material_code, material_cat from mst_material                 
                `);
            let material_mst = new Map();
            let head_notick = new Map();
            materialMst.forEach((item, index) => {
                material_mst.set(item.material_code, item.material_cat);
            });
            for (const ln of lnreq) {
                if (!head_notick.get(ln.ticket_no)) {
                    head_notick.set(ln.ticket_no, 0);
                }
            }
            for (const ln of lnreq) {
                if (ln.cgrp != "UPSTREAM") {
                    continue;
                }

                if (head_notick.get(ln.ticket_no) == 0) {
                    const payload_head = {
                        HEAD_SJ: ln.ticket_no,
                        PLATE_NUM: ln.vehicle_id,
                        DRIVER_ID: ln.driver_id,
                        DRIVER_NAME: ln.driver_name,
                        TANGGAL_SJ: new Date(
                            moment(ln.tanggal_pembuatan).format("YYYY-MM-DD") +
                                "T00:00:00"
                        ),
                        TANGGAL_LOADING: new Date(
                            moment(ln.tanggal_surat_jalan).format(
                                "YYYY-MM-DD"
                            ) + "T00:00:00"
                        ),
                    };
                    const [queHD, valHD] = crud.insertItemOra(
                        "PRG_LOADING_NOTE_SAP_UPS_HD",
                        payload_head
                    );
                    await oraclient.execute(queHD, valHD);
                    head_notick.set(
                        ln.ticket_no,
                        head_notick.get(ln.ticket_no) + 1
                    );
                }
                let cust_code = ln.cust_code;
                let role = ln.req_cat;
                const { rows: lnnum_data } = await oraclient.execute(
                    `
                    SELECT LOADING_NOTE_NUM FROM PREREG_LOADING_NOTE_SAP WHERE DET_ID = :0
                    `,
                    [ln.det_id]
                );
                const NUMLN = lnnum_data[0][0];
                if (!NUMLN) {
                    continue;
                }
                const payload = {
                    ID_SJ: NUMLN,
                    DO_NO: ln.id_do,
                    STONO: ln.id_sto,
                    INCO1: ln.inco_1,
                    ID_CUSTOMER: ln?.trg_cust,
                    PLANNING_QTY: ln.planned_qty,
                    UOM: ln.uom,
                    CREATE_BY: username,
                    PLANT: ln.plant,
                    COMPANY: ln.company,
                    CTR_NO: ln.id_so,
                    ISACTIVE: "TRUE",
                    MAT_DESC: ln.desc_mat,
                    MAT_CODE: ln.material,
                    MAT_CAT: material_mst.get(ln.material),
                    HEAD_SJ: ln.ticket_no,
                };
                if (role === "CUSTOMER" || role === "INTERCO") {
                    payload.ID_CUSTOMER = cust_code;
                } else if (role === "VENDOR") {
                    payload.ID_TRANSPORTER = cust_code;
                }
                const [queIns, valIns] = crud.insertItemOra(
                    "PREREG_LOADING_NOTE_SAP_UPS",
                    payload
                );
                await oraclient.execute(queIns, valIns);
            }
            await client.query(TRANS.COMMIT);
            await oraclient.commit();
            return true;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            client.release();
            oraclient.release();
        }
    } catch (error) {
        throw error;
    }
};
module.exports = MultiLoadingNoteModel;
