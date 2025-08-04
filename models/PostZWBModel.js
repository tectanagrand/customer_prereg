const db = require("../config/connection");
const { getConnection } = require("../config/oracleconnectionv2");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");

const PostZWBModel = {
    getCurrentOSPost: async cust_code => {
        try {
            const pgclient = await db.connect();
            try {
                //get loading note det which zwbs_trx_stat is null and lnnum is not null
                // filter by cust_code
                // only loco and upstream
                const query = `
                    select
                        lnh.hd_id,
                        lnd.det_id,
                        mbc.kunnr as cust_code,
                        mbc."name" as cust_name,
                        lnd.ln_num,
                        lnd.driver_name,
                        lnd.vhcl_id,
                        lnd.tanggal_surat_jalan,
                        lnd.plan_qty,
                        lnh.uom,
                        lnh.desc_con,
                        lnd.zwbs_trx_stat,
                        lnd.zwbs_trx_desc,
                        lnd.zwb_park_stat,
                        lnd.zwb_park_desc,
                        lnd.zdo_trx_dopo_stat,
                        lnd.zdo_trx_dopo_desc ,
                        lnd.zdo_trx_pgip_stat,
                        lnd.zdo_trx_pgip_desc,
                        lnh.prereg_type,
                        'single' as ln_type,
                        case
                            when lnd.zwbs_trx_stat is null
                            or lnd.zwbs_trx_stat = 2 or lnd.zwbs_trx_stat =0  then 'zwbs_trx_stat'
                            when lnd.zwb_park_stat is null
                            or lnd.zwb_park_stat = 2 or lnd.zwb_park_stat = 0 then 'zwb_park_stat'
                            when lnd.zdo_trx_dopo_stat is null
                            or lnd.zdo_trx_dopo_stat = 2 or lnd.zdo_trx_dopo_stat = 0 then 'zwb_park_dopo_stat'
                            when lnd.zdo_trx_pgip_stat is null
                            or lnd.zdo_trx_pgip_stat = 2 or lnd.zdo_trx_pgip_stat = 0 then 'zwb_park_pgip_stat'
                            else 'END'
                        end as start_from
                    from
                        loading_note_det lnd
                    left join loading_note_hd lnh on
                        lnd.hd_fk = lnh.hd_id
                    left join mst_user mu on
                        lnh.create_by = mu.id_user
                    left join master_bp_code mbc on
                        mbc.kunnr = mu.username
                    left join mst_company mc on
                        mc.sap_code = lnh.company
                    where
                        lnd.ln_num is not null
                        and (lnd.zwbs_trx_stat <> -1 or lnd.zwbs_trx_stat is null)
                        and lnh.inco_1 = 'LCO'
                        and mc.group_comp = 'UPSTREAM'
                        and prereg_type = 'SAP'
                        and lnd.wb_ticket is not null
                        and mbc.kunnr = $1
                    union all
                    select
                        mlh.hd_id,
                        mld.det_id,
                        mbc.kunnr as cust_code,
                        mbc."name" as cust_name,
                        mld.ln_num,
                        mlh.driver_name,
                        mlh.vehicle_id as vhcl_id,
                        mlh.tanggal_surat_jalan,
                        mld.planned_qty as plan_qty,
                        mld.uom,
                        mld.desc_mat as desc_con,
                        mld.zwbs_trx_stat,
                        mld.zwbs_trx_desc,
                        mld.zwb_park_stat,
                        mld.zwb_park_desc,
                        mld.zdo_trx_dopo_stat,
                        mld.zdo_trx_dopo_desc ,
                        mld.zdo_trx_pgip_stat,
                        mld.zdo_trx_pgip_desc,
                        mlh.prereg_type,
                    'multi' as ln_type,
                        case
                            when mld.zwbs_trx_stat is null
                            or mld.zwbs_trx_stat = 2 or mld.zwbs_trx_stat = 0 then 'zwbs_trx_stat'
                            when mld.zwb_park_stat is null
                            or mld.zwb_park_stat = 2 or mld.zwb_park_stat = 0 then 'zwb_park_stat'
                            when mld.zdo_trx_dopo_stat is null
                            or mld.zdo_trx_dopo_stat = 2 or mld.zdo_trx_dopo_stat = 0 then 'zwb_park_dopo_stat'
                            when mld.zdo_trx_pgip_stat is null
                            or mld.zdo_trx_pgip_stat = 2 or mld.zdo_trx_pgip_stat = 0 then 'zwb_park_pgip_stat'
                            else 'END'
                        end as start_from
                    from
                        multi_ln_det mld
                    left join multi_ln_hd mlh on
                        mlh.hd_id = mld.hd_id
                    left join mst_user mu on
                        mlh.create_by = mu.id_user
                    left join master_bp_code mbc on
                        mbc.kunnr = mu.username
                    left join mst_company mc on
                        mc.sap_code = mld.company
                    where
                        mld.ln_num is not null
                        and mld.inco_1 = 'LCO'
                        and (mld.zwbs_trx_stat <> -1 or mld.zwbs_trx_stat is null)
                        and mc.group_comp = 'UPSTREAM'
                        and prereg_type = 'SAP'
                        and mld.wb_ticket is not null
                        and mbc.kunnr = $1
                `;
                const { rows } = await pgclient.query(query, [cust_code]);
                return rows;
            } catch (error) {
                console.error("error postZWBModel.getcurrentOSPost :", error);
                throw error;
            } finally {
                if (pgclient) {
                    pgclient.release();
                }
            }
        } catch (error) {
            throw error;
        }
    },
    getListCustOSPost: async () => {
        try {
            const pgclient = await db.connect();

            try {
                //get loading note det which zwbs_trx_stat is null and lnnum is not null
                // filter by cust_code
                // only loco and upstream
                const query = `
                    select
                        distinct mbc.kunnr as cust_code,
                        mbc."name" as cust_name
                    from
                        loading_note_det lnd
                    left join loading_note_hd lnh on
                        lnd.hd_fk = lnh.hd_id
                    left join mst_user mu on
                        lnh.create_by = mu.id_user
                    left join master_bp_code mbc on
                        mbc.kunnr = mu.username
                    left join mst_company mc on
                        mc.sap_code = lnh.company
                    where
                        lnd.ln_num is not null
                        and lnd.zwbs_trx_stat is null
                        and lnh.inco_1 = 'LCO'
                        and mc.group_comp = 'UPSTREAM'
                        and prereg_type = 'SAP'
                `;
                const { rows } = await pgclient.query(query);
                return rows;
            } catch (error) {
                console.error("error postZWBModel.getcurrentOSPost :", error);
                throw error;
            } finally {
                if (pgclient) {
                    pgclient.release();
                }
            }
        } catch (error) {
            throw error;
        }
    },
    /**
     *
     * @param {Array<{
     * ln_num : string,
     * is_multi : string,
     * start_from : string
     * }>} loading_note
     */
    StartPostZWB: async loading_note => {
        try {
            const pgclient = await db.connect();
            const oraclient = await getConnection();
            try {
                // iterate through loading_note
                for (const ln of loading_note) {
                    const key = ln.start_from;
                    const keyora = key.toUpperCase();
                    let update_val = {
                        [key]: 0,
                    };
                    let target_table = "loading_note_det";
                    if (ln.is_multi == "multi") {
                        target_table = "multi_ln_det";
                    }
                    const [upque, upval] = Crud.updateItem(
                        target_table,
                        update_val,
                        {
                            ln_num: ln.ln_num,
                        }
                    );
                    await pgclient.query(upque, upval);
                    // update oracle
                    console.log(keyora);
                    let updatevalora = {
                        [keyora]: 0,
                    };
                    const [oraque, oraval] = Crud.updateItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        updatevalora,
                        {
                            LOADING_NOTE_NUM: ln.ln_num,
                        }
                    );
                    await oraclient.execute(oraque, oraval);
                }
                await pgclient.query(TRANS.COMMIT);
                await oraclient.commit();
                return;
            } catch (error) {
                await pgclient.query(TRANS.ROLLBACK);
                await oraclient.rollback();
                throw error;
            } finally {
                if (pgclient) pgclient.release();
                if (oraclient) oraclient.release();
            }
        } catch (error) {
            throw error;
        }
    },
};

module.exports = PostZWBModel;
