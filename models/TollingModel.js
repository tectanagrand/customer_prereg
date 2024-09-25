const db = require("../config/connection");
const OSCheck = require("../helper/OSCheck");
const TicketGen = require("../helper/TicketGen");
const axios = require("axios");
const TollingModel = {};
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const crud = require("../helper/crudquery");
const moment = require("moment");

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
                            "tolling",
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

module.exports = TollingModel;
