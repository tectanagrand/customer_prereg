const db = require("../config/connection");
const noderfc = require("node-rfc");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
noderfc.setIniFileDirectory("../customer_prereg");

const MasterModel = {};

MasterModel.getCompanyData = async (q, limit, offset) => {
    const client = await db.connect();

    try {
        const { rows: dataComp } = await client.query(
            `SELECT comp_id, CONCAT (name, ' - ', sap_code) as name FROM MST_COMPANY WHERE lower(name) like $1 and lower(code) like $2 LIMIT $3 OFFSET $4`,
            [`%${q}%`, `%${q}%`, limit, offset]
        );
        const { rows } = await client.query(
            "SELECT COUNT(*) AS ctr FROM MST_COMPANY LIMIT $1 OFFSET 0",
            [limit]
        );
        return {
            data: dataComp,
            count: rows[0].ctr,
        };
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        client.release();
    }
};

MasterModel.getDriverData = async (q, limit, offset) => {
    const client = new noderfc.Client({ dest: "Q13" });
    await client.open();
    try {
        const param = {
            I_LIMIT: parseInt(limit),
            I_OFFSET: parseInt(offset),
            I_SEARCH: q.toUpperCase(),
        };
        const rfcData = await client.call("ZRFC_PRE_REGISTRA_SIM", param);
        return {
            data: rfcData.T_SIM,
            count: limit,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

MasterModel.getVehicleData = async (q, limit, offset) => {
    const client = new noderfc.Client({ dest: "Q13" });
    await client.open();
    try {
        const param = {
            I_LIMIT: parseInt(limit),
            I_OFFSET: parseInt(offset),
            I_SEARCH: q.toUpperCase(),
        };
        const rfcData = await client.call("ZRFC_PRE_REGISTRA_TRUCK", param);
        return {
            data: rfcData.T_TRUCK,
            count: limit,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

MasterModel.getSOData = async do_num => {
    const client = new noderfc.Client({ dest: "Q13" });
    await client.open();
    try {
        let totalPay = 0;
        const param = {
            I_VBELN: do_num,
        };
        const { I_ZPINO, I_ZSLIP, RFC_TEXT } = await client.call(
            "ZRFC_PRE_REGISTRA_SLIP",
            param
        );
        const data = await client.call("ZRFC_PRE_REGISTRA_SLIP", param);
        console.log(data);
        if (I_ZSLIP.length === 0) {
            throw new Error("SO Not Found");
        }
        const PINO = I_ZPINO.map(item => ({
            ...item,
            WRBTR: item.WRBTR.trim().replace(/[.,]/g, "").replace(",", "."),
        }));
        PINO.forEach(item => {
            totalPay += parseFloat(item.WRBTR);
        });
        const SLIPZ = I_ZSLIP[0];

        const SLIP = {
            ...SLIPZ,
            ZTTLPROF: SLIPZ.ZTTLPROF.trim()
                .replace(/[.,]/g, "")
                .replace(",", "."),
        };
        return {
            SLIP: SLIP,
            PINO: PINO,
            OS: parseFloat(SLIP.ZTTLPROF) - totalPay,
            IS_PAID: parseFloat(SLIP.ZTTLPROF) - totalPay > 5000 ? false : true,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

MasterModel.getCustData = async () => {
    try {
        const rfcclient = new noderfc.Client({ dest: "Q13" });
        await rfcclient.open();
        try {
            const datarfc = rfcclient.call("ZRFC_PRE_REGISTRA_KUNNR", {
                I_ERDAT: "20220101", // YYYYMMDD
            });
            return datarfc;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// MasterModel.getStoreLoc = async (plant, rule) => {
//     console.log(plant, rule);
//     try {
//         const rfcclient = new noderfc.Client({ dest: "Q13" });
//         await rfcclient.open();
//         try {
//             const datarfc = await rfcclient.call("ZRFC_PRE_REGISTRA_STORELOC", {
//                 I_PLANT: "PS21",
//                 I_ITEMRULE: "1B",
//             });
//             return datarfc;
//         } catch (error) {
//             throw error;
//         }
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// };

MasterModel.getStoreLoc = async (plant, rule) => {
    console.log(plant, rule);
    try {
        const rfcclient = new noderfc.Client({ dest: "Q13" });
        await rfcclient.open();
        try {
            const datarfc = rfcclient.call("ZRFC_PRE_REGISTRA_STORELOC", {
                I_PLANT: plant,
                I_ITEMRULE: rule,
            });
            return datarfc;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.seedMstCust = async () => {
    try {
        const rfcclient = new noderfc.Client({ dest: "Q13" });
        await rfcclient.open();
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            await client.query("DELETE FROM mst_customer");
            const { T_KUNNR } = await rfcclient.call(
                "ZRFC_PRE_REGISTRA_KUNNR",
                {
                    I_ERDAT: "19900101", // YYYYMMDD
                }
            );
            T_KUNNR.forEach(item => {
                const payload = {
                    kunnr: item.KUNNR,
                    name_1: item.NAME1,
                    ort_1: item.ORT01,
                    erdat: item.ERDAT,
                };
                const [que, val] = crud.insertItem(
                    "mst_customer",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const dataInsert = Promise.all(promises);
            await client.query(TRANS.COMMIT);
        } catch (error) {
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

MasterModel.getDOList = async cust_id => {
    try {
        const rfcclient = new noderfc.Client({ dest: "Q13" });
        await rfcclient.open();
        try {
            const { T_DOKUNNR } = await rfcclient.call(
                "ZRFC_PRE_REGISTRA_DOKUNNR",
                {
                    I_KUNNR: cust_id,
                }
            );
            console.log(T_DOKUNNR);
            return T_DOKUNNR.map(item => ({
                value: item.VBELN,
                label: item.VBELN,
            }));
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.getCustDataDB = async (limit, offset, q) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `SELECT kunnr, CONCAT (name_1, ' - ', kunnr) as name FROM MST_CUSTOMER 
                WHERE (lower(name_1) like $1 or lower(kunnr) like $2) 
                AND kunnr like '%000'
                LIMIT $3 OFFSET $4`,
                [`%${q}%`, `%${q}%`, limit, offset]
            );
            const { rows } = await client.query(
                "SELECT COUNT(*) AS ctr FROM MST_CUSTOMER WHERE (lower(name_1) like $1 or lower(kunnr) like $2) AND kunnr like '%000'",
                [`%${q}%`, `%${q}%`]
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

MasterModel.getOSDataCust = async (limit, offset, q, do_num) => {
    console.log(do_num);
    try {
        const client = await db.connect();
        let do_numCheck = "";
        let do_numCheck2 = "";
        if (do_num !== "") {
            do_numCheck = "AND HED.id_do = $2";
            do_numCheck2 = "AND HED.id_do = $2";
        }

        try {
            const { rows: dataComp } = await client.query(
                `SELECT distinct USR.sap_code, cust.name_1 FROM loading_note_det DET
                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.sap_code 
                WHERE USR.sap_code like $1
                AND DET.ln_num is null
                AND DET.push_sap_date is null
                AND hed.cur_pos = 'FINA'
                ${do_numCheck}
                LIMIT $3 OFFSET $4`,
                do_numCheck !== ""
                    ? [`%${q}%`, do_num, limit, offset]
                    : [`%${q}%`, limit, offset]
            );
            const { rows, rowCount } = await client.query(
                `SELECT distinct USR.sap_code FROM loading_note_det DET
                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                 LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                WHERE USR.sap_code like $1
                AND DET.push_sap_date is null
                AND hed.cur_pos = 'FINA'
                ${do_numCheck2}
                AND DET.ln_num is null`,
                do_numCheck2 !== "" ? [`%${q}%`, do_num] : [`%${q}%`]
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

MasterModel.getDataTP = async rule => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT tp, tp_desc from master_tp where incoterm_rule = $1",
                [rule]
            );
            return rows;
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

module.exports = MasterModel;
