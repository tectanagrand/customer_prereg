const db = require("../config/connection");
const { getConnection } = require("../config/oracleconnectionv2");
const TRANS = require("../config/transaction");
const LoadingNoteModel = require("./LoadingNoteModel");
const uuid = require("uuidv4");
const moment = require("moment");
const crud = require("../helper/crudquery");

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
            const header_data = {
                tanggal_surat_jalan: params.tanggal_surat_jalan,
                driver_id: params.driver_id,
                driver_name: params.driver_name,
                vehicle_id: params.vehicle_id,
                media_tp: params.media_tp,
                cur_pos: "INIT",
            };
            console.log(action_hd);
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
                cur_pos
            from
                multi_ln_hd mlh
            where
                ((mlh.cur_pos <> 'END')
                or (mlh.tanggal_surat_jalan + interval '7' day > now ()
                    and mlh.cur_pos = 'END')) AND create_by = $1`;
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
                mlh_driver_id,
                mld.plant,
                mld.company,
                mld.material, 
                mld.desc_mat,
                mld.planned_qty,
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
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

module.exports = MultiLoadingNoteModel;
