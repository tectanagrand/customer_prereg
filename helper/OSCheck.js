const db = require("../config/connection");
const axios = require("axios");

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
            ConQtySAP = parseFloat(I_ZSLIP.ZTTLPROF);
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
      `,
                [do_number]
            );
            if (qtyWeb[0].totaltemp_plan) {
                totaltemp_plan = parseFloat(qtyWeb[0].totaltemp_plan);
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

module.exports = OSCheck;
