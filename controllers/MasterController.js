const Master = require("../models/MasterModel");
const db = require("../config/connection");
const axios = require("axios");

const MasterController = {};

MasterController.getComp = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const dataComp = await Master.getCompanyData(q, limit, offset);
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDriver = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const dataComp = await Master.getDriverData(q, limit, offset);
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDriver2 = async (req, res) => {
    try {
        const q = req.query.q;
        const dataComp = await Master.getDriverData2(q);
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getTruck = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const dataComp = await Master.getVehicleData(q, limit, offset);
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getTruck2 = async (req, res) => {
    try {
        const q = req.query.q;
        const dataComp = await Master.getVehicleData2(q);
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getSOData = async (req, res) => {
    try {
        const do_num = req.query.do_num;
        const dataComp = await Master.getSOData(do_num);
        // if (!dataComp.IS_PAID) {
        //     throw new Error("Order is Not Paid Yet");
        // }
        res.status(200).send(dataComp);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getSTOData = async (req, res) => {
    try {
        const userLog = req.cookies.username;
        const sto_num = req.query.sto;
        console.log(userLog);
        console.log(sto_num);
        const { data } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/LIFSTOSet?$filter=
        (Lifnr%20eq%20%27${userLog}%27)and(Ebeln%20eq%20%27${sto_num}%27)
        &$format=json&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        console.log(data);
        if (data.d.results.length > 0) {
            res.status(200).send({
                exist: true,
            });
        } else {
            res.status(400).send({
                message: "STO Number not found",
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataCust = async (req, res) => {
    try {
        const dataRFC = await Master.getCustData();
        res.status(200).send({
            count: dataRFC.T_KUNNR.length,
            raw: dataRFC,
            data: dataRFC.T_KUNNR,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
MasterController.getDataSLoc = async (req, res) => {
    const plant = req.query.plant;
    const material = req.query.material;
    try {
        const data = await Master.getStoreLoc2(plant, material);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

MasterController.getDataDOList = async (req, res) => {
    try {
        const cust_id = req.cookies.username;
        const dataRFC = await Master.getDOList(cust_id);
        if (dataRFC.length === 0) {
            throw new Error("NO DO");
        }
        res.status(200).send(dataRFC);
    } catch (error) {
        console.error(error);
        if (error.message === "NO DO") {
            res.status(400).send({
                message: "Not any DO exist, please contact administrator",
            });
        } else {
            res.status(500).send(error);
        }
    }
};

MasterController.getDataDOFrc = async (req, res) => {
    try {
        const cust_id = req.cookies.username;
        const { data } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOSTOSet?$filter=(Ebeln eq '${req.query.sto}')&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const DoList = data.d.results.map(item => ({
            value: item.ZzvbelnV1,
            label: item.ZzvbelnV1,
        }));
        if (DoList.length === 0) {
            throw new Error("NO DO");
        }
        res.status(200).send(DoList);
    } catch (error) {
        console.error(error);
        if (error.message === "NO DO") {
            res.status(400).send({
                message: "Not any DO exist, please contact administrator",
            });
        } else {
            res.status(500).send(error);
        }
    }
};

MasterController.getDataSTOList = async (req, res) => {
    try {
        const cust_id = req.cookies.username;
        const do_num = req.query.do_num;
        const dataRFC = await Master.getSTOList(cust_id, do_num);
        if (dataRFC.length === 0) {
            throw new Error("NO STO");
        }
        res.status(200).send(dataRFC);
    } catch (error) {
        console.error(error);
        if (error.message === "NO STO") {
            res.status(400).send({
                message: "Not any STO exist, please contact administrator",
            });
        } else {
            res.status(500).send(error);
        }
    }
};

MasterController.seedDataCust = async (req, res) => {
    try {
        const insertData = await Master.seedMstCust2();
        res.status(200).send({
            message: "Success Seeding Mst Customer",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.seedDataVen = async (req, res) => {
    try {
        const insertData = await Master.seedMstVen();
        res.status(200).send({
            message: "Success Seeding Mst Vendor",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.upDataVen = async (req, res) => {
    try {
        const insertData = await Master.updateMstVen();
        res.status(200).send({
            message: "Success Updating Mst Vendor",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.upDataCust = async (req, res) => {
    try {
        const insertData = await Master.updateMstCust();
        res.status(200).send({
            message: "Success Updating Mst Cust",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataCustDB = async (req, res) => {
    try {
        const limit = req.query.limit;
        const offset = req.query.offset;
        const q = req.query.q.toLowerCase();
        const dataComp = await Master.getCustDataDB(limit, offset, q);
        res.status(200).send(dataComp);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataVenDB = async (req, res) => {
    try {
        const limit = req.query.limit;
        const offset = req.query.offset;
        const q = req.query.q.toLowerCase();
        const dataComp = await Master.getVenDataDB(limit, offset, q);
        res.status(200).send(dataComp);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataTP = async (req, res) => {
    const rule = req.query.rule;
    try {
        const data = await Master.getDataTP(rule);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getOSDataCust = async (req, res) => {
    const q = req.query.q;
    const limit = req.query.limit;
    const offset = req.query.offset;
    try {
        const data = await Master.getOSDataCust2(limit, offset, q);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getOSDataCustWB = async (req, res) => {
    const q = req.query.q;
    const limit = req.query.limit;
    const offset = req.query.offset;
    try {
        const data = await Master.getOSDataCustWB(limit, offset, q);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataSLocDB = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `SELECT sloc as value, concat(sloc, '-', description) as label FROM mst_sloc`
            );
            res.status(200).send(rows);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataValTypeDB = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `SELECT valtype_id as value, valtype_desc as label FROM mst_valtype`
            );
            res.status(200).send(rows);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getVehicleDataDB = async (req, res) => {
    try {
        const is_send = req.query?.is_send;
        const client = await db.connect();
        let where = "";
        if (is_send) {
            where = " WHERE IS_SEND = false";
        }
        try {
            const { rows } = await client.query(
                `SELECT VHCL_ID, FOTO_STNK, UUID AS ID, IS_SEND  FROM MST_VEHICLE ${where} ORDER BY ID DESC`
            );
            res.status(200).send(rows);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDriverDataDB = async (req, res) => {
    const is_send = req.query?.is_send;
    let where = "";
    try {
        const client = await db.connect();
        if (is_send) {
            where = " WHERE IS_SEND = false";
        }
        try {
            const { rows } = await client.query(
                `SELECT DRIVER_ID, DRIVER_NAME, UUID AS ID,
                 IS_SEND,
                 ALAMAT, 
                 CT.city AS TEMPAT_LAHIR,
                 TO_CHAR(TANGGAL_LAHIR, 'DD-MM-YYYY') AS TANGGAL_LAHIR,
                 NO_TELP,
                 FOTO_SIM,
                 FOTO_DRIVER
                 FROM MST_DRIVER DRV
                 LEFT JOIN MST_CITIES CT ON CT.CODE = DRV.TEMPAT_LAHIR
                 ${where}
                 ORDER BY ID DESC`
            );
            const { rows: client_host } = await client.query(
                `SELECT hostname FROM hostname WHERE phase = 'server_dev'`
            );
            res.status(200).send({
                data: rows,
                source: `${client_host[0].hostname}/static/license/`,
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getDataCities = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT code, city FROM mst_cities"
            );
            res.status(200).send(
                rows.map(item => ({
                    value: item.code,
                    label: item.city,
                }))
            );
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getCompanyPlant = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } =
                await client.query(`SELECT plant_code as value, CONCAT(company_name, ' - ', plant_code) as label 
            FROM mst_company_plant 
            WHERE category = 'CHILD'`);
            res.status(200).send(rows);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getMediaTP = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(`
            SELECT key_item as value, key_desc as label
            FROM mst_key
            WHERE type = 'MEDTP' AND is_active = true`);
            res.status(200).send(rows);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = MasterController;
