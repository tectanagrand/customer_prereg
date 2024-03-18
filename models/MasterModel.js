const db = require("../config/connection");
const noderfc = require("node-rfc");
noderfc.setIniFileDirectory("c:/customer_prereg");

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
            I_SEARCH: q,
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
            I_SEARCH: q,
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
        const { I_ZPINO, I_ZSLIP } = await client.call(
            "ZRFC_PRE_REGISTRA_SLIP",
            param
        );
        if (I_ZPINO.length === 0) {
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

module.exports = MasterModel;
