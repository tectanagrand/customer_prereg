const db = require("../config/connection");
const OSCheck = require("../helper/OSCheck");
const TicketGen = require("../helper/TicketGen");
const axios = require("axios");
const TollingModel = {};
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const crud = require("../helper/crudquery");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const EmailModel = require("../models/EmailModel");
const { ora } = require("../config/oracleconnection");

TollingModel.GetSTOTolling = async stonum => {
    try {
        const { data } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}//sap/opu/odata/sap/ZGW_REGISTRA_SRV/STOLANGSIRSet?$filter=(Ebeln eq '${stonum}')&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const dataSTO = data.d.results[0];
        const OSTol = await OSCheck.CheckOsToll(stonum);
        if (["Error", "STO Number not exist"].includes(dataSTO.Message)) {
            throw new Error(dataSTO.Message);
        }
        return {
            STO: dataSTO.Ebeln,
            Matdesc: dataSTO.Txz01,
            Ebelp: dataSTO.Ebelp,
            Matcode: dataSTO.Matnr,
            Company: dataSTO.Bukrs,
            Plant: dataSTO.Werks,
            Conqty: parseInt(dataSTO.Menge),
            UOM: dataSTO.Meins,
            OS: OSTol.OSTol,
            UsedQty: OSTol.UsedQTY,
        };
    } catch (error) {
        throw error;
    }
};

TollingModel.SaveRequestTolling = async (params, session) => {
    try {
        const client = await db.connect();
        let que, val;
        const promises = [];
        let detailId = {};
        let deleteIdx = [];
        try {
            await client.query(TRANS.BEGIN);

            const today = new Date();
            const details = params.load_detail;
            const id_header =
                params.id_header !== "" ? params.id_header : uuid.uuid();
            let payloadHeader = {
                hd_id: id_header,
                material: params.material_code,
                desc_con: params.material,
                con_qty: params.con_qty,
                uom: params.uom,
                plant: params.plant,
                company: params.company,
                create_at: today,
                create_by: session.id_user,
                is_active: true,
                cur_pos: "INIT",
                id_sto: params.sto_num,
            };
            const { rows: user_data } = await client.query(
                `
                select
                    mpa.page_id,
                    mp.menu_page ,
                    mpa.fupdate,
                    mpa.fcreate
                from
                    mst_user mu
                left join mst_page_access mpa on
                    mu."role" = mpa.role_id
                left join mst_page mp on
                    mp.menu_id = mpa.page_id
                where
                    mu.id_user = $1
                    and mp.menu_id = '40'
                `,
                [session.id_user]
            );
            if (!user_data[0]?.fupdate || !user_data[0]?.fcreate) {
                throw new Error("Role not allowed to make request");
            }
            if (params.id_header === "") {
                const { rows } = await client.query(
                    `
            select batch_code from loading_note_hd 
            where batch_code is not null and create_by = $1
            order by id desc limit 1            
            `,
                    [session.id_user]
                );
                let last_batch_code = rows[0]?.batch_code ?? "";
                payloadHeader.batch_code = TicketGen.GenTollingReq(
                    session.username,
                    last_batch_code
                );
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
            let counterTruck = {};
            let index = 0;
            for (const rows of details) {
                if (counterTruck[rows.vehicle]) {
                    counterTruck[rows.vehicle] = counterTruck[rows.vehicle] + 1;
                } else {
                    counterTruck[rows.vehicle] = 1;
                }
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
                    create_at: today,
                    create_by: session.id_user,
                    is_active: true,
                    is_pushed: false,
                    is_multi: rows.is_multi,
                    multi_do: rows.multi_do,
                    remark_req: rows.remark,
                };
                if (rows.id_detail === "") {
                    [que, val] = crud.insertItem(
                        "tolling",
                        payloadDetail,
                        "det_id"
                    );
                    detailId[index] = id_detail;
                    await client.query(que, val);
                } else {
                    if (rows.method === "delete") {
                        deleteIdx.push(index);
                        await client.query(
                            "DELETE FROM loading_note_det WHERE det_id = $1",
                            [rows.id_detail]
                        );
                    } else {
                        [que, val] = crud.updateItem(
                            "tolling",
                            payloadDetail,
                            { det_id: id_detail },
                            "det_id"
                        );
                        await client.query(que, val);
                    }
                }
                index++;
            }
            let NumPlate = [];
            Object.keys(counterTruck).map(key => {
                if (counterTruck[key] > 1) {
                    NumPlate.push(key);
                }
            });
            if (NumPlate.length > 0) {
                throw new Error(
                    "Request denied, Multiple identical truck not allowed",
                    {
                        cause: {
                            code: "IdenticTruck",
                            value: NumPlate,
                        },
                    }
                );
            }
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

TollingModel.DeleteRequestTolling = async id => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const que = `delete from loading_note_hd where hd_id = $1`;
            await client.query(que, [id]);
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

TollingModel.AllReqToll = async (session, c_grp) => {
    try {
        const client = await db.connect();
        const id_user = session.id_user;
        try {
            const que_par = `SELECT HD.HD_ID,
            HD.ID_DO,
            HD.ID_STO,
            HD.RULES,
            HD.CON_NUM,
            HD.CON_QTY,
            HD.UOM,
            HD.PLANT,
            HD.COMPANY,
            HD.BATCH_CODE,
            DET.CTROS,
            HD.CUR_POS
        FROM LOADING_NOTE_HD HD`;
            let left_join;
            let where_clause;
            let comp_grp = "";
            let param = [id_user];
            if (c_grp) {
                param.push(c_grp);
                comp_grp = "AND C.group_comp = $2";
            }

            left_join = `LEFT JOIN (
                SELECT HD_FK, COUNT(DET_ID) AS CTROS FROM TOLLING DET
                LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                WHERE DET.LN_NUM IS NULL AND DET.PUSH_SAP_DATE IS NULL AND HD.CUR_POS <> 'FINA' AND DET.IS_ACTIVE = true
                GROUP BY HD_FK
            ) DET ON HD.HD_ID = DET.HD_FK
            LEFT JOIN (
                SELECT HD_FK, COUNT(DET_ID) AS CTRLN FROM TOLLING DET
                        LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                        WHERE DET.LN_NUM IS NOT NULL and DET.TANGGAL_SURAT_JALAN + interval '7' day > now () AND DET.IS_ACTIVE = true
                        GROUP BY HD_FK
            ) LNU ON HD.HD_ID = LNU.HD_FK 
             LEFT JOIN (
                SELECT HD_FK, COUNT(DET_ID) AS CTRLOG FROM TOLLING DET
                LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                WHERE DET.LN_NUM IS NULL  AND HD.CUR_POS = 'FINA' and DET.CREATE_AT + interval '7' day > now ()
                GROUP BY HD_FK
            ) LOG ON HD.HD_ID = LOG.HD_FK
             LEFT JOIN MST_COMPANY C ON HD.COMPANY = C.SAP_CODE`;
            where_clause = `WHERE HD.IS_ACTIVE = true AND HD.CREATE_BY = $1 ${comp_grp}  
            AND ( DET.CTROS IS NOT NULL OR LNU.CTRLN IS NOT NULL OR LOG.CTRLOG IS NOT NULL )
            ORDER BY DET.CTROS asc, HD.CREATE_AT desc ;`;
            const { rows: parent_row } = await client.query(
                `${que_par} ${left_join} ${where_clause}`,
                param
            );
            for (let i = 0; i < parent_row.length; i++) {
                const dt = parent_row[i];
                const que = `
                SELECT 
                TO_CHAR(DET.CRE_DATE,
                    'DD-MM-YYYY') AS CRE_DATE,
                TO_CHAR(DET.TANGGAL_SURAT_JALAN,
                    'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
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
                    WHEN HD.CUR_POS = 'FINA' AND (DET.LN_NUM IS NOT NULL OR DET.LN_NUM <> '') THEN 'SUCCESS'
                    ELSE ''
                END
                AS CURRENT_POS
            FROM LOADING_NOTE_HD HD
            LEFT JOIN TOLLING DET ON DET.HD_FK = HD.HD_ID
            LEFT JOIN MST_KEY MKY ON MKY.key_item = DET.media_tp
            where hd.hd_id = $1
                `;
                const { rows: childData } = await client.query(que, [dt.hd_id]);
                parent_row[i] = { ...parent_row[i], sub_rows: childData };
            }
            return parent_row;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

TollingModel.GetOSReqTolling = async (filters = []) => {
    try {
        const client = await db.connect();
        try {
            let filter_que = [];
            let filter_val = [];
            let filterStr = "";
            let whoFilter = `WHERE TOL.ln_num IS NULL AND HD.CUR_POS = 'FINA' AND TOL.IS_ACTIVE = true `;
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
            const baseQ = `SELECT TOL.det_id as id,
                HD.hd_id,
                HD.ID_STO,
                HD.TRANS_TYPE,
                HD.PLANT,
                HD.company,
                HD.material,
                HD.desc_con,
                HD.batch_code,
                TOL.media_tp,
                TOL.driver_id,
                TOL.create_by,
                TOL.ln_num,
                CUST.KUNNR as cust_code,
                CUST.name_1 as cust_name,
                VEN.LIFNR as ven_code,
                VEN.name_1 as ven_name,
                INT.kunnr as intr_code,
                INT.name_1 as intr_name,
                CONCAT(TOL.DRIVER_ID,
                    ' - ',
                    TOL.DRIVER_NAME) AS DRIVER,
                TOL.VHCL_ID,
                TO_CHAR(TOL.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
                TOL.cre_date as CREATE_DATE,
                TOL.PLAN_QTY,
                HD.UOM
            FROM LOADING_NOTE_HD HD
            LEFT JOIN TOLLING TOL ON HD.HD_ID = TOL.HD_FK
            LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
            LEFT JOIN MST_CUSTOMER CUST ON CUST.kunnr = USR.USERNAME
            LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
            LEFT JOIN MST_INTERCO INT ON INT.kunnr = USR.USERNAME
            LEFT JOIN MST_KEY MKY ON MKY.key_item = TOL.media_tp
            LEFT JOIN MST_COMPANY C ON C.SAP_CODE = HD.COMPANY 
            ${whoFilter}
            `;
            const que = `SELECT * FROM (${baseQ}) A ${filterStr} ;`;
            const { rows } = await client.query(que, filter_val);

            //get sto os
            let sto_data = {};
            let id_sto = filters.find(item => item.id === "id_sto");
            if (id_sto) {
                sto_data = await TollingModel.GetSTOTolling(id_sto.value);
            }
            return {
                data: rows,
                sto: sto_data,
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

TollingModel.GetById = async id => {
    try {
        const client = await db.connect();
        try {
            const que = `
                SELECT 
                lnh.hd_id,
                lnh.id_sto, 
                lnh.material,
                lnh.desc_con,
                lnh.plant, 
                lnh.company,
                lnh.con_qty,
                lnh.uom,
                lnh.cur_pos,
                TO_CHAR(lnh.create_at, 'yyyy-mm-dd') as create_at,
                tol.driver_id,
                tol.driver_name,
                tol.vhcl_id,
                tol.media_tp,
                tol.plan_qty,
                tol.det_id,
                tol.is_multi,
                tol.multi_do,
                tol.remark_req,
                TO_CHAR(tol.tanggal_surat_jalan, 'yyyy-mm-dd') as tanggal_surat_jalan
                FROM LOADING_NOTE_HD lnh 
                LEFT JOIN TOLLING tol ON lnh.HD_ID = tol.HD_FK
                where lnh.hd_id = $1
            `;
            const { rows: dttol } = await client.query(que, [id]);
            const tol = dttol[0];
            const OSTol = await OSCheck.CheckOsToll(tol.id_sto);
            const result_tolling = {
                header: {
                    hd_id: tol.hd_id,
                    id_sto: tol.id_sto,
                    material: tol.material,
                    desc_con: tol.desc_con,
                    plant: tol.plant,
                    company: tol.company,
                    con_qty: tol.con_qty,
                    uom: tol.uom,
                    cur_pos: tol.cur_pos,
                    create_date: tol.create_at,
                    loading_date: tol.tanggal_surat_jalan,
                    os_qty: OSTol.OSTol,
                    os_wb: OSTol.ConQTY - OSTol.UsedQTYWb,
                },
                load_detail: dttol.map(item => ({
                    det_id: item.det_id,
                    driver_id: item.driver_id,
                    driver_name: item.driver_name,
                    vhcl_id: item.vhcl_id,
                    media_tp: item.media_tp,
                    plan_qty: item.plan_qty,
                })),
            };
            return result_tolling;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

TollingModel.GetOSCust = async (limit, offset, q) => {
    try {
        const client = await db.connect();
        try {
            const { rows: dataComp } = await client.query(
                `SELECT distinct 
                case
                    when CUST.kunnr is not NUll then cust.kunnr
                    when mv.lifnr is not null then mv.lifnr
                    when mi.kunnr is not null then mi.kunnr
                    else ''
                    end as kunnr, 
                case
                    when CUST.name_1 is not null then cust.name_1
                    when mv.name_1 is not null then mv.name_1
                    when mi.name_1 is not null then mi.name_1
                    else ''
                    end as name_1 FROM tolling TOL
                                LEFT JOIN mst_user USR ON TOL.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON TOL.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                LEFT JOIN mst_company c on c.sap_code = HED.company
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                 or mi.kunnr like $5 or mi.name_1 like $6)
                                AND TOL.ln_num is null
                                AND TOL.push_sap_date is null
                                AND hed.cur_pos = 'FINA'
                                AND TOL.is_active = true
                LIMIT $7 OFFSET $8`,
                [
                    `%${q}%`,
                    `%${q}%`,
                    `%${q}%`,
                    `%${q}%`,
                    `%${q}%`,
                    `%${q}%`,
                    limit,
                    offset,
                ]
            );
            const { rows, rowCount } = await client.query(
                `SELECT distinct 
                case
                    when CUST.kunnr is not NUll then cust.kunnr
                    when mv.lifnr is not null then mv.lifnr
                     when mi.kunnr is not null then mi.kunnr
                    else ''
                    end as kunnr, 
                case
                    when CUST.name_1 is not null then cust.name_1
                    when mv.name_1 is not null then mv.name_1
                     when mi.name_1 is not null then mi.name_1
                    else ''
                    end as name_1 FROM tolling TOL
                                LEFT JOIN mst_user USR ON TOL.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON TOL.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                LEFT JOIN mst_company c on c.sap_code = HED.company
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                 or mi.kunnr like $5 or mi.name_1 like $6)
                                AND TOL.ln_num is null
                                AND TOL.push_sap_date is null
                                AND hed.cur_pos = 'FINA'
                                AND TOL.is_active = true`,
                [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
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

TollingModel.GetOSSTOReq = async (limit, offset, cust) => {
    try {
        const client = await db.connect();
        try {
            const { rows: dataComp } = await client.query(
                `
                SELECT distinct hd.id_sto FROM loading_note_hd hd
                LEFT JOIN tolling tol on hd.hd_id = tol.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_vendor mv on mv.lifnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE tol.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'
                AND( c.kunnr = $1 or mv.lifnr = $2 or mi.kunnr = $3) AND tol.is_active = true
                LIMIT $4 OFFSET $5
                `,
                [cust, cust, cust, limit, offset]
            );
            const { rows, rowCount } = await client.query(
                `SELECT distinct hd.id_sto FROM loading_note_hd hd
                LEFT JOIN tolling tol on hd.hd_id = tol.hd_fk
				LEFT JOIN mst_user u on u.id_user = hd.create_by
				LEFT JOIN mst_customer c on c.kunnr = u.username
                LEFT JOIN mst_vendor mv on mv.lifnr = u.username
                LEFT JOIN mst_interco mi on mi.kunnr = u.username
                WHERE tol.ln_num is null AND push_sap_date is null AND hd.cur_pos = 'FINA'
                AND( c.kunnr = $1 or mv.lifnr = $2 or mi.kunnr = $3) AND tol.is_active = true`,
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

TollingModel.ApproveTollingReq = async (data_req, session) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            let batch_code = new Map();
            let created_bcode = [];
            for (const data of data_req) {
                let count_bcode = batch_code.get(data.batch_code);
                if (!count_bcode) {
                    count_bcode = 1;
                    const { rows: last_bcode } = await client.query(
                        `
                        select ln_num from tolling t
                        left join loading_note_hd lnh on t.hd_fk = lnh.hd_id
                        where lnh.batch_code = $1 and ln_num is not null
                        order by ln_num asc
                        limit 1
                        `,
                        [data.batch_code]
                    );
                    let last_ln = last_bcode[0]?.ln_num;

                    if (last_ln) {
                        const last_rnum = parseInt(last_ln.split("/")[1]);
                        count_bcode = last_rnum + 1;
                    }
                    batch_code.set(data.batch_code, count_bcode);
                } else {
                    count_bcode += 1;
                    batch_code.set(data.batch_code, count_bcode);
                }
                const new_bcode =
                    data.batch_code +
                    "/" +
                    count_bcode.toString().padStart(2, "0");
                const payload_up = {
                    ln_num: new_bcode,
                    push_sap_date: moment().format("YYYY-MM-DDTHH:mm:ss"),
                    is_pushed: true,
                    update_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
                    update_by: session.id_user,
                };
                const [upQue, upVal] = crud.updateItem(
                    "tolling",
                    payload_up,
                    { det_id: data.id },
                    "ln_num"
                );
                await client.query(upQue, upVal);
                created_bcode.push(new_bcode);
            }
            await client.query(TRANS.COMMIT);
            return created_bcode;
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

TollingModel.GetPrintTol = async (filters, customer_id) => {
    try {
        const client = await db.connect();
        try {
            const baseq = `
                    SELECT
                    TOL.DET_ID AS ID,
                    TOL.LN_NUM,
                    HD.ID_DO,
                    HD.ID_STO,
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
                    TOL.DRIVER_ID,
                    TOL.DRIVER_NAME,
                    TOL.VHCL_ID,
                    TOL.PLAN_QTY,
                    TO_CHAR(TOL.CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE,
                    TO_CHAR(TOL.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
                    TO_CHAR(TOL.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE_MOMENT,
                    TO_CHAR(TOL.TANGGAL_SURAT_JALAN, 'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN_MOMENT,
                    HD.UOM,
                    TOL.BRUTO,
                    TOL.TARRA,
                    TOL.NETTO,
                    TOL.RECEIVE,
                    TOL.DEDUCTION,
                    COALESCE(TOL.print_count, 0) as print_count
                FROM TOLLING TOL
                LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = TOL.HD_FK
                LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
                LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
                LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
                LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
                WHERE TOL.LN_NUM IS NOT NULL
            `;
            let where = [];
            let whereVal = [];
            let ltindex = 0;
            filters.forEach(item => {
                let value = item.value;
                let id = item.id;
                let date = false;
                if (item.id === "Customer") {
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
                    id = "tanggal_surat_jalan";
                    date = true;
                } else if (item.id === "end_tsj") {
                    value = `<= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
                    id = "tanggal_surat_jalan";
                    date = true;
                } else if (item.id === "q") {
                    value = item.value;
                    id = ["tol.search_vector", "hd.search_vector"];
                }
                if (!date) {
                    if (item.id === "Customer") {
                        where.push(
                            `(${id[0]} = $${ltindex + 1} OR ${id[1]} = $${ltindex + 2} OR ${id[2]} = $${ltindex + 3})`
                        );
                        whereVal.push(...[value, value, value]);
                        ltindex += 3;
                    } else if (item.id === "q") {
                        where.push(
                            `(to_tsquery($${ltindex + 1}) @@ ${id[0]} OR to_tsquery($${ltindex + 2}) @@ ${id[1]} OR ln_num like $${ltindex + 3}  OR id_sto like $${ltindex + 4}) `
                        );
                        whereVal.push(
                            ...[
                                value + ":*",
                                value + ":*",
                                `%${value}%`,
                                `%${value}%`,
                            ]
                        );
                        ltindex += 4;
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
            let whereQue = "";
            if (where.length != 0) {
                whereQue = `AND ${where.join(" AND ")}`;
            }
            let que = `${baseq} ${whereQue} ORDER BY TOL.LN_NUM DESC`;
            const { rows } = await client.query(que, whereVal);
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

TollingModel.GetPrintTolv2 = async (filters, customer_id) => {
    try {
        const client = await db.connect();
        try {
            const baseq = `
                    SELECT
                    TOL.DET_ID AS ID,
                    TOL.LN_NUM,
                    HD.ID_STO,
                    HD.BATCH_CODE,
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
                    TOL.DRIVER_ID,
                    TOL.DRIVER_NAME,
                    TOL.VHCL_ID,
                    TOL.PLAN_QTY,
                    TOL.DELETE_REQ,
                    TO_CHAR(TOL.CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE,
                    TO_CHAR(TOL.TANGGAL_SURAT_JALAN, 'DD-MM-YYYY') AS TANGGAL_SURAT_JALAN,
                    TO_CHAR(TOL.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE_MOMENT,
                    TO_CHAR(TOL.TANGGAL_SURAT_JALAN, 'MM-DD-YYYY') AS TANGGAL_SURAT_JALAN_MOMENT,
                    HD.UOM,
                    COALESCE(TOL.print_count, 0) as print_count
                FROM TOLLING TOL
                LEFT JOIN LOADING_NOTE_HD HD ON HD.HD_ID = TOL.HD_FK
                LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
                LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR
                LEFT JOIN MST_VENDOR VEN ON VEN.LIFNR = USR.USERNAME
                LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME
                WHERE TOL.LN_NUM IS NOT NULL AND TOL.IS_ACTIVE = true
            `;
            let where = [];
            let whereVal = [];
            let ltindex = 0;
            filters.forEach(item => {
                let value = item.value;
                let id = item.id;
                let date = false;
                if (item.id === "Customer") {
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
                    id = "tanggal_surat_jalan";
                    date = true;
                } else if (item.id === "end_tsj") {
                    value = `<= TO_DATE('${item.value}', 'DD-MM-YYYY')`;
                    id = "tanggal_surat_jalan";
                    date = true;
                } else if (item.id === "q") {
                    value = item.value;
                    id = ["tol.search_vector", "hd.search_vector"];
                }
                if (!date) {
                    if (item.id === "Customer") {
                        where.push(
                            `(${id[0]} = $${ltindex + 1} OR ${id[1]} = $${ltindex + 2} OR ${id[2]} = $${ltindex + 3})`
                        );
                        whereVal.push(...[value, value, value]);
                        ltindex += 3;
                    } else if (item.id === "q") {
                        where.push(
                            `(to_tsquery($${ltindex + 1}) @@ ${id[0]} OR to_tsquery($${ltindex + 2}) @@ ${id[1]} OR ln_num like $${ltindex + 3}  OR id_sto like $${ltindex + 4}) `
                        );
                        whereVal.push(
                            ...[
                                value + ":*",
                                value + ":*",
                                `%${value}%`,
                                `%${value}%`,
                            ]
                        );
                        ltindex += 4;
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
            let whereQue = "";
            if (where.length != 0) {
                whereQue = `AND ${where.join(" AND ")}`;
            }
            let que = `${baseq} ${whereQue} ORDER BY HD.BATCH_CODE DESC`;
            const { rows } = await client.query(que, whereVal);

            //merging data
            let merged_code = "batch_code";
            let idx_merge = 0;
            let count_span = 1;
            let can_print = true;
            let merged = [];
            let idx = 0;
            let mod_rows = [...rows];
            for (let i = 0; i < rows.length; i++) {
                merged.push(rows[i].id);
                if (rows[i].delete_req) {
                    can_print = false;
                }
                if (rows[i + 1]) {
                    if (rows[i][merged_code] !== rows[i + 1][merged_code]) {
                        mod_rows[idx_merge] = {
                            ...rows[idx_merge],
                            span: count_span,
                            merged: merged,
                            can_print: can_print,
                        };
                        idx_merge = i + 1;
                        count_span = 1;
                        can_print = true;
                        merged = [];
                        continue;
                    }
                    count_span += 1;
                    mod_rows[i + 1] = { ...rows[i + 1], [merged_code]: "" };
                } else {
                    mod_rows[idx_merge] = {
                        ...rows[idx_merge],
                        span: count_span,
                        merged: merged,
                        can_print: can_print,
                    };
                    idx_merge = i + 1;
                    count_span = 1;
                    can_print = true;
                }
            }
            return {
                merged_code,
                data: mod_rows,
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

TollingModel.PrintTolling = async id_tol => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const doc = new PDFDocument({ size: "A4" });
            const baseQ = `
            SELECT  
                TOL.driver_id,
                TOL.driver_name,
                TOL.vhcl_id,
                HD.plant,
                TOL.ln_num,
                TO_CHAR(TOL.tanggal_surat_jalan, 'DD-MM-YYYY') as tanggal_surat_jalan,
                TO_CHAR(TOL.cre_date, 'DD-MM-YYYY') as cre_date,
                TOL.plan_qty,
                HD.UOM,
                HD.DESC_CON,
                HD.ID_STO,
                HD.material,
                CO.name as comp_name,
                HD.company,
                CASE 
                    WHEN CUST.NAME_1 IS NOT NULL THEN CUST.NAME_1
                    WHEN VEN.NAME_1 IS NOT NULL THEN VEN.NAME_1
                    WHEN INT.NAME_1 IS NOT NULL THEN INT.NAME_1
                    ELSE ''
                    END
                AS NAME_1,
                CASE 
                    WHEN CUST.KUNNR IS NOT NULL THEN CUST.KUNNR
                    WHEN VEN.LIFNR IS NOT NULL THEN VEN.LIFNR
                    WHEN INT.KUNNR IS NOT NULL THEN INT.KUNNR
                    ELSE ''
                    END
                AS KUNNR,
                PLT.ALAMAT,
                TOL.print_count,
                TOL.is_multi, 
                TOL.remark_req
                FROM TOLLING TOL
                LEFT JOIN LOADING_NOTE_HD HD ON TOL.HD_FK = HD.HD_ID
                LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
                LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR OR USR.SAP_CODE = CUST.KUNNR
                LEFT JOIN MST_VENDOR VEN ON USR.USERNAME = VEN.LIFNR OR USR.SAP_CODE = VEN.LIFNR
                LEFT JOIN MST_COMPANY CO ON CO.SAP_CODE = HD.COMPANY
                LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME       
                LEFT JOIN MST_COMPANY_PLANT PLT ON PLT.PLANT_CODE = HD.PLANT         
                WHERE TOL.DET_ID = $1
                ORDER BY TOL.ID DESC
            `;
            const { rows } = await client.query(baseQ, [id_tol]);
            let watermark = "";
            const dt = rows[0];
            if (!dt.print_count) {
                watermark = "Original Document";
            } else {
                watermark = `Copy of original (${dt.print_count})`;
            }

            doc.opacity(0.2);
            doc.rotate(-35);
            // doc.fontSize(60).text(watermark, -200, 200);
            // doc.text("KPN CORP", -200, 300);
            doc.fontSize(60).text(watermark, -200, 400);
            doc.text("KPN CORP", -200, 500);
            // doc.fontSize(60).text(watermark, -200, 600);
            // doc.text("KPN CORP", -200, 700);

            doc.save();
            doc.rotate(35);
            doc.opacity(1);
            doc.fontSize(20).text(`${dt.name_1} (${dt.kunnr})`, 100, 90);
            doc.fontSize(20).text("Surat Jalan", 400, 50);
            if (dt.is_multi) {
                doc.fontSize(10).text("(Multi Con.)", 400, 70);
            }
            // doc.fontSize(12).text("No LN :", 380, 120);
            // doc.fontSize(12).text(dt.ln_num, 420, 120);
            doc.fontSize(12).text("No LN :", 100, 140);
            doc.fontSize(12).text(dt.ln_num, 180, 140);

            doc.fontSize(12).text("Tgl. Request LN :", 300, 140);
            doc.fontSize(12).text(dt.cre_date, 420, 140, {
                width: 120,
            });
            // doc.fontSize(12).text("Tanggal Pengambilan :", 100, 140);
            // doc.fontSize(12).text(moment().format("MM-DD-YYYY"), 230, 140, {
            //     width: 120,
            // });
            doc.fontSize(12).text("Nama Supir :", 100, 170);
            doc.fontSize(12).text(dt.driver_name, 180, 170, { width: 120 });
            doc.fontSize(12).text("No Polisi : ", 100, 240);
            doc.fontSize(12).text(dt.vhcl_id, 180, 240, { width: 120 });
            doc.fontSize(12).text("No Do :", 100, 260);
            doc.fontSize(12).text(dt.id_do, 180, 260, { width: 120 });
            doc.fontSize(12).text("Tgl. Pengambilan / Muat :", 300, 170, {
                width: 120,
            });
            doc.fontSize(12).text(dt.tanggal_surat_jalan, 420, 170, {
                width: 120,
            });
            doc.fontSize(12).text("Tujuan :", 300, 240);
            doc.fontSize(12).text(`${dt.comp_name}(${dt.plant})`, 390, 240, {
                width: 120,
            });
            doc.fontSize(12).text("Alamat :", 300, 260);
            doc.fontSize(12).text(dt.alamat, 355, 260, { width: 120 });

            var xline = 350;

            doc.moveTo(100, xline).lineTo(500, xline).stroke();
            doc.text("Material", 100, xline + 10);
            doc.text("Planned Qty", 350, xline + 10);
            doc.text("UOM", 450, xline + 10);
            doc.moveTo(100, xline + 30)
                .lineTo(500, xline + 30)
                .stroke();

            var lastRow = xline + 30;
            var col = [100, 350, 450];
            for (const data of rows) {
                lastRow += 30;
                doc.text(
                    `${data.desc_con}(${data.material})`,
                    col[0],
                    lastRow,
                    { width: 220 }
                );
                doc.text(data.plan_qty, col[1], lastRow, { width: 85 });
                doc.text(data.uom, col[2], lastRow, { width: 80 });
            }
            lastRow += 30;

            doc.moveTo(col[1] - 10, xline)
                .lineTo(col[1] - 10, lastRow)
                .stroke();
            doc.moveTo(col[2] - 10, xline)
                .lineTo(col[2] - 10, lastRow)
                .stroke();

            doc.fontSize(12).text("Hormat Kami", 100, lastRow + 80);
            doc.fontSize(12).text(dt.name_1, 100, lastRow + 160);
            doc.fontSize(12).text(dt.driver_name, 400, lastRow + 160);
            doc.fontSize(12).text("Remark :", 100, lastRow + 200);
            doc.fontSize(12).text(dt.remark_req, 100, lastRow + 220);

            const [queUp, insUp] = crud.updateItem(
                "tolling",
                {
                    print_count: dt.print_count
                        ? parseInt(dt.print_count) + 1
                        : 1,
                },
                { det_id: id_tol },
                "det_id"
            );
            // console.log(queUp);
            await client.query(queUp, insUp);
            return {
                doc: doc,
                id_sto: dt.id_sto,
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

TollingModel.PrintTollingv2 = async id_tol => {
    try {
        const client = await db.connect();
        if (!id_tol.length > 0) {
            throw new Error("Please provide Array<id_tol>");
        }
        try {
            await client.query(TRANS.BEGIN);
            const whereParam = id_tol.map((_, index) => `$${index + 1}`);
            const { rows } = await client.query(
                `
                SELECT  
                TOL.driver_id,
                TOL.driver_name,
                TOL.vhcl_id,
                HD.plant,
                TOL.ln_num,
                hd.batch_code,
                TO_CHAR(TOL.tanggal_surat_jalan, 'DD-MM-YYYY') as tanggal_surat_jalan,
                TO_CHAR(TOL.cre_date, 'DD-MM-YYYY') as cre_date,
                TOL.plan_qty,
                HD.UOM,
                HD.DESC_CON,
                HD.ID_STO,
                HD.material,
                CO.name as comp_name,
                HD.company,
                CASE 
                    WHEN CUST.NAME_1 IS NOT NULL THEN CUST.NAME_1
                    WHEN VEN.NAME_1 IS NOT NULL THEN VEN.NAME_1
                    WHEN INT.NAME_1 IS NOT NULL THEN INT.NAME_1
                    ELSE ''
                    END
                AS NAME_1,
                CASE 
                    WHEN CUST.KUNNR IS NOT NULL THEN CUST.KUNNR
                    WHEN VEN.LIFNR IS NOT NULL THEN VEN.LIFNR
                    WHEN INT.KUNNR IS NOT NULL THEN INT.KUNNR
                    ELSE ''
                    END
                AS KUNNR,
                PLT.ALAMAT,
                TOL.print_count,
                TOL.is_multi, 
                TOL.remark_req
                FROM TOLLING TOL
                LEFT JOIN LOADING_NOTE_HD HD ON TOL.HD_FK = HD.HD_ID
                LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
                LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR OR USR.SAP_CODE = CUST.KUNNR
                LEFT JOIN MST_VENDOR VEN ON USR.USERNAME = VEN.LIFNR OR USR.SAP_CODE = VEN.LIFNR
                LEFT JOIN MST_COMPANY CO ON CO.SAP_CODE = HD.COMPANY
                LEFT JOIN MST_INTERCO INT ON INT.KUNNR = USR.USERNAME       
                LEFT JOIN MST_COMPANY_PLANT PLT ON PLT.PLANT_CODE = HD.PLANT         
                WHERE TOL.DET_ID in (${whereParam.join(", ")})
                ORDER BY TOL.ID DESC
                `,
                id_tol
            );
            const doc = new PDFDocument({ size: "A4" });
            let pageIndex = 0;
            let last_print_count = rows[0].print_count ?? 0;

            for (const dt of rows) {
                let watermark = "";
                if (!dt.print_count) {
                    watermark = "Original Document";
                } else {
                    watermark = `Copy of original (${dt.print_count})`;
                }

                doc.opacity(0.2);
                doc.rotate(-35);

                doc.fontSize(60).text(watermark, -200, 400);
                doc.text("KPN CORP", -200, 500);

                doc.save();
                doc.rotate(35);
                doc.opacity(1);
                doc.fontSize(20).text(`${dt.name_1} (${dt.kunnr})`, 100, 90);
                doc.fontSize(20).text("Surat Jalan", 400, 50);
                if (dt.is_multi) {
                    doc.fontSize(10).text("(Multi Con.)", 400, 70);
                }

                doc.fontSize(12).text("No Batch :", 100, 140);
                doc.fontSize(12).text(dt.batch_code, 180, 140);

                doc.fontSize(12).text("No LN :", 100, 160);
                doc.fontSize(12).text(dt.ln_num, 180, 160);

                doc.fontSize(12).text("Tgl. Request LN :", 300, 160);
                doc.fontSize(12).text(dt.cre_date, 420, 160, {
                    width: 120,
                });

                doc.fontSize(12).text("Nama Supir :", 100, 190);
                doc.fontSize(12).text(dt.driver_name, 180, 190, { width: 120 });
                doc.fontSize(12).text("No Polisi : ", 100, 240);
                doc.fontSize(12).text(dt.vhcl_id, 180, 240, { width: 120 });
                doc.fontSize(12).text("No STO :", 100, 260);
                doc.fontSize(12).text(dt.id_sto, 180, 260, { width: 120 });
                doc.fontSize(12).text("Tgl. Pengambilan / Muat :", 300, 190, {
                    width: 120,
                });
                doc.fontSize(12).text(dt.tanggal_surat_jalan, 420, 190, {
                    width: 120,
                });
                doc.fontSize(12).text("Tujuan :", 300, 240);
                doc.fontSize(12).text(
                    `${dt.comp_name}(${dt.plant})`,
                    390,
                    240,
                    {
                        width: 120,
                    }
                );
                doc.fontSize(12).text("Alamat :", 300, 260);
                doc.fontSize(12).text(dt.alamat, 355, 260, { width: 120 });

                let xline = 350;

                doc.moveTo(100, xline).lineTo(500, xline).stroke();
                doc.text("Material", 100, xline + 10);
                doc.text("Planned Qty", 350, xline + 10);
                doc.text("UOM", 450, xline + 10);
                doc.moveTo(100, xline + 30)
                    .lineTo(500, xline + 30)
                    .stroke();

                let lastRow = xline + 30;
                let col = [100, 350, 450];
                lastRow += 30;
                doc.text(`${dt.desc_con}(${dt.material})`, col[0], lastRow, {
                    width: 220,
                });
                doc.text(dt.plan_qty, col[1], lastRow, { width: 85 });
                doc.text(dt.uom, col[2], lastRow, { width: 80 });
                lastRow += 30;

                doc.moveTo(col[1] - 10, xline)
                    .lineTo(col[1] - 10, lastRow)
                    .stroke();
                doc.moveTo(col[2] - 10, xline)
                    .lineTo(col[2] - 10, lastRow)
                    .stroke();

                doc.fontSize(12).text("Hormat Kami", 100, lastRow + 80);
                doc.fontSize(12).text(dt.name_1, 100, lastRow + 160);
                doc.fontSize(12).text(dt.driver_name, 400, lastRow + 160);
                doc.fontSize(12).text("Remark :", 100, lastRow + 200);
                doc.fontSize(12).text(dt.remark_req, 100, lastRow + 220);
                pageIndex++;
                if (pageIndex < rows.length) {
                    doc.addPage();
                    doc.switchToPage(pageIndex);
                }
            }
            await client.query(
                `
                UPDATE TOLLING set print_count = ${parseInt(last_print_count) + 1} where det_id in (${whereParam.join(", ")})
                `,
                id_tol
            );
            await client.query(TRANS.COMMIT);
            return {
                doc: doc,
                batch_code: rows[0].batch_code,
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

TollingModel.requestDelete = async (selected, remark, id_user) => {
    try {
        const client = await db.connect();
        const loadNote = [];
        const phase =
            process.env.NODE_ENV === "production"
                ? "production"
                : "development";
        try {
            await client.query(TRANS.BEGIN);
            const { rows: hostname } = await client.query(
                `select hostname from hostname where phase = $1`,
                [phase]
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
            let link = hostname[0].hostname + `/dashboard/tolapprovedel`;
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
                    "tolling",
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
            return;
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

TollingModel.ShowCreatedLN = async (q, limit, offset, id_user, role) => {
    let whereVal = [];
    let whereQ = [];
    let index = 1;
    // console.log(role);
    if (role !== "ADMIN" && role !== "LOGISTIC") {
        whereVal.push(id_user);
        whereQ.push(`tol.create_by = $${index}`);
        index++;
    } else {
        whereVal.push(true);
        whereQ.push(
            `tol.delete_req = $${index} and tol.respon_del is null and tol.is_active = true `
        );
        index++;
    }
    if (q !== "" && q) {
        let que = "";
        whereVal.push(`${q}:*`);
        que += `( tol.search_vector @@ to_tsquery('english', $${index})`;
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
            tol.det_id as id,
            TO_CHAR(tol.cre_date, 'DD-MM-YYYY') AS cre_date,
            TO_CHAR(tanggal_surat_jalan, 'DD-MM-YYYY') as tanggal_surat_jalan,
            driver_id,
            driver_name,
            vhcl_id,
            mtp.tp_desc as media_tp,
            plan_qty,
            lnh.uom,
            lnh.plant,
            lnh.company,
            ln_num,
            lnh.batch_code, 
            lnh.desc_con,
            tol.is_active,
            tol.create_by,
            tol.delete_req,
            tol.remark_delete
                from
                    tolling tol
                left join loading_note_hd lnh on
                    lnh.hd_id = tol.hd_fk
                left join (select distinct tp, tp_desc from master_tp) mtp on mtp.tp = tol.media_tp
                where tol.tanggal_surat_jalan + interval '7' day > now() and tol.ln_num is not null ${whereQ.length > 0 && " and " + whereQ.join(" and ")}
                order by lnh.plant asc, tol.cre_date desc 
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
TollingModel.SyncTollingWBNET = async () => {
    try {
        const oraclient = await ora.getConnection();
        const client = await db.connect();
        const ColWBNET = Object.freeze({
            BATCH_CODE: 0,
            NET: 1,
            GROSS: 2,
            TARRA: 3,
            RECEIVED: 4,
            DEDUCTION: 5,
            TRUCK_NUMBER: 6,
            LICENSE_NO: 7,
            NAME: 8,
            NO_STO: 9,
            MAT_DOC: 10,
        });
        try {
            await client.query(TRANS.BEGIN);
            const queGetWBNET = `
                SELECT 
                    BATCH_CODE, 
                    NET, 
                    GROSS, 
                    TARE,
                    RECEIVED,
                    DEDUCTION,
                    TRUCK_NUMBER,
                    LICENSE_NO,
                    NAME, 
                    NO_STO,
                    MAT_DOC
                FROM
                WBNET_TOLLING
                WHERE TRANSACTION_CODE = 'LSK' AND IS_PULL_WEB = 0 
            `;
            const { rows: WBNetDt } = await oraclient.execute(queGetWBNET);
            if (!WBNetDt.length > 0) {
                return [];
            }
            const DataWBNet = {};
            WBNetDt.forEach(item => {
                if (!DataWBNet[item[ColWBNET.BATCH_CODE]]) {
                    DataWBNet[item[ColWBNET.BATCH_CODE]] = {
                        data: [item],
                        total: item[ColWBNET.NET],
                    };
                    return;
                }
                DataWBNet[item[ColWBNET.BATCH_CODE]].data.push(item);
                DataWBNet[item[ColWBNET.BATCH_CODE]].total +=
                    item[ColWBNET.NET];
                return;
            });
            const today = new Date();
            let created_matdoc = [];
            for (const keys of Object.keys(DataWBNet)) {
                const sto_num = DataWBNet[keys].data[0][ColWBNET.NO_STO];
                // console.log(sto_num);
                const { data } = await axios.get(
                    `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/STOCRTSet?$filter=(Sto eq '${sto_num}')and(Line eq '1')and(Qty eq ${DataWBNet[keys].total})&$format=json`,
                    {
                        auth: {
                            username: process.env.UNAMESAP,
                            password: process.env.PWDSAP,
                        },
                    }
                );
                const matdoc = data.d.results[0].Deliv;
                if (!matdoc) {
                    throw new Error("Failed to create matdoc");
                }
                created_matdoc.push(matdoc);
                const [queryora, valora] = crud.updateItemOra(
                    "WBNET_TOLLING",
                    {
                        MAT_DOC: matdoc,
                        IS_PULL_WEB: 1,
                        PULL_DATETIME: today,
                    },
                    { BATCH_CODE: keys }
                );
                await oraclient.execute(queryora, valora);
                for (const dt of DataWBNet[keys].data) {
                    await client.query(
                        `
                        update tolling set bruto = $1, tarra = $2, netto = $3, deduction = $4, receive = $5,
                        matdoc_code = $6
                        where ln_num like $7 and vhcl_id = $8                        
                        `,
                        [
                            dt[ColWBNET.GROSS],
                            dt[ColWBNET.TARRA],
                            dt[ColWBNET.NET],
                            dt[ColWBNET.DEDUCTION],
                            dt[ColWBNET.RECEIVED],
                            matdoc,
                            `${keys}%`,
                            dt[ColWBNET.TRUCK_NUMBER],
                        ]
                    );
                }
            }
            await client.query(TRANS.COMMIT);
            await oraclient.commit();
            return created_matdoc;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            if (oraclient) {
                oraclient.release();
            }
            if (client) {
                client.release();
            }
        }
    } catch (error) {
        throw error;
    }
};

module.exports = TollingModel;
