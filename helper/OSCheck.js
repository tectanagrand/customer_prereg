const db = require("../config/connection");
const axios = require("axios");
const { getConnection } = require("../config/oracleconnectionv2");

const OSCheck = {};

OSCheck.CheckOSCust = async do_number => {
    try {
        const client = await db.connect();
        try {
            let ConQtySAP = 0;
            let totalFromSAP = 0;
            let deletedLN = 0;
            let totaltemp_plan = 0;
            let hold_qty = 0;
            //get OS SAP, Temp Plan Qty, Holding Quantity
            //getContractQty
            const { data: ZSLIP_get } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${do_number}')&$format=json
    `,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            let I_ZSLIP = {};
            Object.keys(ZSLIP_get.d.results[0]).map(item => {
                if (item !== "__metadata") {
                    I_ZSLIP[item.toUpperCase()] = ZSLIP_get.d.results[0][item];
                }
            });
            ConQtySAP = parseFloat(I_ZSLIP.KWMENG);
            //get qty sap
            const { data: I_OUTDELIVERY } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/OUTDELIVSet?$filter=(Vbeln%20eq%20%27${do_number}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            if (I_OUTDELIVERY.d.results.length > 0) {
                I_OUTDELIVERY.d.results.map((item, index) => {
                    let planning = parseFloat(item.PlnLfimg);
                    let real = parseFloat(item.LLfimg);
                    totalFromSAP += real === 0 ? planning : real;
                });
            }
            //get qty sap ln deleted
            const { data: DOTRXDELETE } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELETESet?$filter=(VbelnRef%20eq%20%27${do_number}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            if (DOTRXDELETE.d.results.length > 0) {
                DOTRXDELETE.d.results.map(item => {
                    deletedLN += parseFloat(item.PlnLfimg);
                });
            }
            //get qty on web
            const { rows: qtyWeb } = await client.query(
                `
      select sum(plan_qty) as totaltemp_plan
      from loading_note_det lnd
      left join loading_note_hd lnh on lnh.hd_id = lnd.hd_fk
      where lnd.ln_num is null and lnh.id_do = $1 and lnd.is_active = true
      union all
      select sum(planned_qty) as totaltemp_plan
      from multi_ln_det mld
      where mld.ln_num is null and mld.id_do = $1 and mld.is_active = true
      `,
                [do_number]
            );
            for (const dt of qtyWeb) {
                totaltemp_plan += parseFloat(dt.totaltemp_plan ?? 0);
            }

            //get qty hold
            const { rows: qtyHold } = await client.query(
                `
      select hold_qty 
      from  mst_contract mc
      where mc.id_do = $1
      `,
                [do_number]
            );
            if (qtyHold.length > 0) {
                hold_qty = qtyHold[0].hold_qty;
            }
            return {
                ConQty: ConQtySAP,
                TotalSAP: totalFromSAP,
                TotalDeleted: deletedLN,
                TotalTemp: totaltemp_plan,
                HoldQty: hold_qty,
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

OSCheck.CheckOSUps = async do_number => {
    try {
        const client = await db.connect();
        const oraclient = await getConnection();
        try {
            let ConQtySAP = 0;
            let totalFromWB = 0;
            let hold_qty = 0;
            let totalFromSAP = 0;
            let deletedLN = 0;
            //get OS SAP, Temp Plan Qty, Holding Quantity
            //getContractQty
            const { data: ZSLIP_get } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${do_number}')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            let I_ZSLIP = {};
            Object.keys(ZSLIP_get.d.results[0]).map(item => {
                if (item !== "__metadata") {
                    I_ZSLIP[item.toUpperCase()] = ZSLIP_get.d.results[0][item];
                }
            });
            //get qty sap
            ConQtySAP = parseFloat(I_ZSLIP.KWMENG);

            //get used qty sap
            const { data: I_OUTDELIVERY } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/OUTDELIVSet?$filter=(Vbeln%20eq%20%27${do_number}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            if (I_OUTDELIVERY.d.results.length > 0) {
                I_OUTDELIVERY.d.results.map((item, index) => {
                    let planning = parseFloat(item.PlnLfimg);
                    let real = parseFloat(item.LLfimg);
                    totalFromSAP += real === 0 ? planning : real;
                });
            }

            //get qty sap ln deleted
            const { data: DOTRXDELETE } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELETESet?$filter=(VbelnRef%20eq%20%27${do_number}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            if (DOTRXDELETE.d.results.length > 0) {
                DOTRXDELETE.d.results.map(item => {
                    deletedLN += parseFloat(item.PlnLfimg);
                });
            }
            const { rows } = await oraclient.execute(
                `
                SELECT
                    SUM(COALESCE(zp.NETAG_QTY, plnsu.PLANNING_QTY)) AS TOTAL_NET
                FROM
                    PREREG_LOADING_NOTE_SAP_UPS plnsu
                LEFT JOIN ZWB_PARK zp ON
                    plnsu.ID_SJ = zp.WB_REF
                WHERE
                    PLNSU.DO_NO = :1 and PLNSU.ISACTIVE = 'TRUE'              
                `,
                [do_number]
            );
            if (rows.length > 0) {
                totalFromWB += parseFloat(rows[0][0] ?? 0);
            }
            //get qty on web
            const { rows: qtyWeb } = await client.query(
                `
                select
                    coalesce(sum(plan_qty),
                    0) as totaltemp_plan
                from
                    (
                    select
                        plan_qty
                    from
                        loading_note_det lnd
                    left join loading_note_hd lnh on
                        lnh.hd_id = lnd.hd_fk
                    where
                        lnd.ln_num is null
                        and lnh.id_do = $1
                        and lnd.is_active = true
                union all
                    select
                        planned_qty as plan_qty
                    from
                        multi_ln_det mld
                    left join multi_ln_hd mlh on
                        mld.hd_id = mlh.hd_id
                    where
                        mld.ln_num is null
                        and mld.id_do = $1
                        and mld.is_active = true) a
                `,
                [do_number]
            );

            //get qty hold
            const { rows: qtyHold } = await client.query(
                `
                select hold_qty 
                from  mst_contract mc
                where mc.id_do = $1
                `,
                [do_number]
            );
            if (qtyHold.length > 0) {
                hold_qty = qtyHold[0].hold_qty ?? 0;
            }
            return {
                ConQty: ConQtySAP,
                TotalWB: totalFromWB,
                TotalSAP: totalFromSAP,
                TotalDeleted: deletedLN,
                HoldQty: parseFloat(hold_qty),
                QtyWeb: parseFloat(qtyWeb[0]?.totaltemp_plan ?? 0),
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
            oraclient.release();
        }
    } catch (error) {
        throw error;
    }
};

OSCheck.CheckOsToll = async sto_number => {
    try {
        const client = await db.connect();
        try {
            const { data } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}//sap/opu/odata/sap/ZGW_REGISTRA_SRV/STOLANGSIRSet?$filter=(Ebeln eq '${sto_number}')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            const ContractQTY = parseInt(data.d.results[0].Menge);
            const { rows } = await client.query(
                `
                SELECT lnh.id_sto, SUM(plan_qty) as total_qty from tolling tol 
                left join loading_note_hd lnh on tol.hd_fk = lnh.hd_id
                where lnh.id_sto = $1 and tol.is_active = true
                group by lnh.id_sto`,
                [sto_number]
            );
            const { rows: wb_qty } = await client.query(
                `
                SELECT lnh.id_sto, SUM(netto) as total_qty from tolling tol 
                left join loading_note_hd lnh on tol.hd_fk = lnh.hd_id
                where lnh.id_sto = $1 and tol.is_active = true
                group by lnh.id_sto
                `,
                [sto_number]
            );
            return {
                ConQTY: ContractQTY,
                OSTol: ContractQTY - parseInt(rows[0]?.total_qty || 0),
                UsedQTY: parseInt(rows[0]?.total_qty || 0),
                UsedQTYWb: parseInt(wb_qty[0]?.total_qty || 0),
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

module.exports = OSCheck;
