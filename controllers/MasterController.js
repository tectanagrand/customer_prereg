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
        const { data } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/LIFSTOSet?$filter=
        (Lifnr%20eq%20%27${userLog}%27)and(Ebeln%20eq%20%27${sto_num}%27)
        &$format=json&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const { data: ttype } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/STOTYPESet?$filter=(Ebeln%20eq%20%27${sto_num}%27)&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        if (data.d.results.length > 0) {
            res.status(200).send({
                exist: true,
                ttype: ttype.d.results[0].ZztransType,
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

MasterController.getSTOLCFRCData = async (req, res) => {
    try {
        const sto_num = req.query.sto;
        const { data } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOSTOSet?$filter=(Ebeln eq '${sto_num}')&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const { data: ttype } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/STOTYPESet?$filter=(Ebeln%20eq%20%27${sto_num}%27)&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        if (data.d.results.length > 0) {
            res.status(200).send({
                exist: true,
                ttype: ttype.d.results[0].ZztransType,
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
    const itemrule = req.query.itemrule;
    try {
        const data = await Master.getStoreLoc2(plant, itemrule);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

MasterController.getDataDOList = async (req, res) => {
    try {
        const cust_id = req.cookies.username;
        const type = req.query.type;
        const dataRFC = await Master.getDOList(cust_id, type);
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
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOSTOSet?$filter=(Ebeln eq '${req.query.sto}')&$format=json`,
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

MasterController.upDataInterco = async (req, res) => {
    try {
        const insertData = await Master.updateMstInterco();
        res.status(200).send({
            message: "Success Updating Mst Interco",
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

MasterController.getDataInterDB = async (req, res) => {
    try {
        const limit = req.query.limit;
        const offset = req.query.offset;
        const q = req.query.q.toLowerCase();
        const dataComp = await Master.getInterDataDB(limit, offset, q);
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
        const req_id = req.query?.req_id;
        let index = 1;
        let where = [];
        let val = [];
        const id_user = req.cookies.id_user;
        const role = req.cookies.role;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const id = req.query.id;
        const client = await db.connect();
        let envvar = "";
        if (process.env.NODE_ENV === "local") {
            envvar = "local";
        } else if (process.env.NODE_ENV === "development") {
            envvar = "server_dev";
        } else {
            envvar = "production";
        }
        if (is_send) {
            if (!req_id) {
                where.push("IS_SEND = false");
            } else {
                where.push("IS_SEND = true");
            }
        }

        if (role !== "ADMIN" && role !== "KRANIWB" && role !== "LOGISTIC") {
            if (!req_id) {
                where.push(`create_by = $` + index);
                val.push(id_user);
                index++;
            }
        }
        if (req_id) {
            where.push(`req_uuid = $` + index);
            val.push(req_id);
            index++;
        }
        if (id) {
            where.push(`uuid = $` + index);
            val.push(id);
            index++;
        }
        try {
            const { rows } = await client.query(
                `SELECT VHCL_ID, FOTO_STNK, UUID AS ID, ID as UUID, IS_SEND FROM MST_VEHICLE ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY UUID DESC ${limit ? `limit ${limit} offset ${offset}` : ""}`,
                val
            );
            const { rowCount } = await client.query(
                `SELECT vhcl_id FROM MST_VEHICLE ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ID DESC`,
                val
            );
            const { rows: hostname } = await client.query(
                `SELECT hostname FROM hostname WHERE phase = $1`,
                [envvar]
            );
            res.status(200).send({
                data: rows,
                count: rowCount,
                source: hostname[0].hostname + "/static/stnk",
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

MasterController.getDriverDataDB = async (req, res) => {
    const is_send = req.query?.is_send;
    const req_id = req.query?.req_id;
    const limit = req.query.limit;
    const offset = req.query.offset;
    const id_user = req.cookies.id_user;
    const id = req.query.id;
    const role = req.cookies.role;
    let index = 1;
    let where = [];
    let val = [];
    let envvar = "";
    if (process.env.NODE_ENV === "local") {
        envvar = "local";
    } else if (process.env.NODE_ENV === "development") {
        envvar = "server_dev";
    } else {
        envvar = "production";
    }
    try {
        const client = await db.connect();
        if (is_send) {
            if (!req_id) {
                where.push("IS_SEND = false");
            } else {
                where.push("IS_SEND = true");
            }
        }
        if (role !== "ADMIN" && role !== "KRANIWB") {
            if (!req_id) {
                where.push(`create_by = $` + index);
                val.push(id_user);
                index++;
            }
        }
        if (req_id) {
            where.push(`req_uuid = $` + index);
            val.push(req_id);
            index++;
        }
        if (id) {
            where.push(`uuid = $` + index);
            val.push(id);
            index++;
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
                LEFT JOIN MST_CITIES CT ON CT.CODE = DRV.TEMPAT_LAHIR ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
                ORDER BY DRV.ID DESC
                ${limit ? `limit ${limit} offset ${offset}` : ""}`,
                val
            );
            const { rowCount } = await client.query(
                `SELECT DRIVER_ID, DRIVER_NAME, UUID AS ID,
                IS_SEND,
                ALAMAT, 
                CT.city AS TEMPAT_LAHIR,
                TO_CHAR(TANGGAL_LAHIR, 'DD-MM-YYYY') AS TANGGAL_LAHIR,
                NO_TELP,
                FOTO_SIM,
                FOTO_DRIVER
                FROM MST_DRIVER DRV
                LEFT JOIN MST_CITIES CT ON CT.CODE = DRV.TEMPAT_LAHIR ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
                ORDER BY DRV.ID DESC`,
                val
            );
            const { rows: client_host } = await client.query(
                `SELECT hostname FROM hostname WHERE phase = $1`,
                [envvar]
            );
            res.status(200).send({
                data: rows,
                count: rowCount,
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
            const { rows } = await client.query(`select
                distinct mu.plant_code as value,
                concat (mcp.plant_code , ' - ',
                mcp.company_name , ' ',
                mcp.lokasi) as label
            from
                mst_user mu
            left join mst_role mr on
                mu.role = mr.role_id
            left join mst_company_plant mcp on
                mcp.plant_code = mu.plant_code
            where
                role_name = 'KRANIWB'`);
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

MasterController.getCompanyPlantMst = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(`select
                mcp.plant_code as value,
                concat (mcp.plant_code , ' - ',
                mcp.company_name , ' ',
                mcp.lokasi) as label
            from
                mst_company_plant mcp 
                where mcp.plant_code is not null`);
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

MasterController.SlocByComp = async (req, res) => {
    try {
        const client = await db.connect();
        const { company } = req.query;
        let result = { data: [], factory: {}, other: {} };
        try {
            const { rows } = await client.query(
                `select
            msc.company,
            msc.sloc_code,
            msc.default_val,
            ms.description
        from
            mst_sloc_comp msc
        left join mst_sloc ms on
            msc.sloc_code = ms.sloc
            where msc.company = $1`,
                [company]
            );
            for (const row of rows) {
                let data = {
                    code: row.sloc_code,
                    desc: row.description,
                };
                if (row.default_val === "FAC") {
                    result.factory = data;
                } else {
                    result.other = data;
                }
                result.data.push(data);
            }
            res.status(200).send(result);
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

MasterController.ValtypeByComp = async (req, res) => {
    try {
        const client = await db.connect();
        const { company } = req.query;
        let result = { data: [], factory: {}, other: {} };
        try {
            const { rows } = await client.query(
                `select valtype, company, default_val from mst_valtype_comp where company = $1`,
                [company]
            );
            for (const row of rows) {
                let data = {
                    code: row.valtype,
                    desc: row.valtype,
                };
                if (row.default_val === "FAC") {
                    result.factory = data;
                } else {
                    result.other = data;
                }
                result.data.push(data);
            }
            res.status(200).send(result);
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

MasterController.BatchByComp = async (req, res) => {
    try {
        const company = req.query.company;
        const client = await db.connect();
        let batch = [];
        // console.log(company);
        try {
            const { rows: batchData } = await client.query(
                `select
            comp_group,
            val_batch,
            mc.sap_code
        from
            mst_batch mb
        left join mst_company mc on
            mb.comp_group = mc.group_comp
        where
            mc.sap_code = $1`,
                [company]
            );
            // console.log(batchData);
            if (batchData.length > 0) {
                batch = batchData.map(item => item.val_batch);
            }
            res.status(200).send({
                group: batchData.length > 0 ? "UPSTREAM" : "DOWNSTREAM",
                batch: batch,
            });
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

MasterController.getDataValtype = async (req, res) => {
    try {
        const { plant, material } = req.query;
        const valType = await Master.getValType(plant, material);
        res.status(200).send(valType);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getReqDrvVehLog = async (req, res) => {
    try {
        const client = await db.connect();
        const role = req.cookies.role;
        try {
            let newTable = [];
            const { rows } = await client.query(`select
                    rdv.uuid,
                    request_id,
                    case
                        when rdv.position = 'SUC' then 'Completed'
                        when rdv.position = 'LOG' then 'On Logistic'
                        when rdv.position = 'ADM' then 'On Krani'
                        else 'Outstanding'
                    End as status,
                    string_agg(mv.vhcl_id, ',') as vehicle_id,
                    string_agg(mv.uuid, ',') as vehuuid,
                    case 
	                    when md.driver_id is not null then string_agg(concat(md.driver_id || ' - ' || md.driver_name), ',')
	                    else ''
	                end
	                as driver,
                    case when md.uuid is not null then string_agg(coalesce(md.uuid, ''),',') 
                    else ''
                    end
                    as drvuuid
                from
                    req_drvr_vhcl rdv
                left join mst_vehicle mv on
                    mv.req_uuid = rdv.uuid and mv.is_active = true
                left join mst_driver md on
                    md.req_uuid = rdv.uuid and md.is_active = true
                where rdv.position <> 'REJ' ${role === "LOGISTIC" ? `and rdv.position = 'LOG'` : role === "KRANIWB" ? `and rdv.position = 'ADM'` : ""} ${role === "CUSTOMER" ? `and rdv.create_by = '${req.cookies.id_user}'` : ""}
                and ((rdv.position = 'SUC' and (rdv.create_at <= now() and rdv.create_at >= now() - interval '3' day)) or rdv.position = 'LOG' or rdv.position = 'ADM')
                group by rdv.uuid, request_id, position, driver_id, md.uuid
                order by
                    request_id desc ;`);
            for (const data of rows) {
                let span = 0;
                let vehArr = Array.from(new Set(data.vehicle_id?.split(",")));
                let vehUUID = Array.from(new Set(data.vehuuid?.split(",")));
                let drvArr = Array.from(new Set(data.driver?.split(",")));
                let drvUUID = Array.from(new Set(data.drvuuid?.split(",")));
                //set span max
                if (vehArr.length > drvArr.length) {
                    span = vehArr.length;
                } else {
                    span = drvArr.length;
                }
                if (span > 0) {
                    for (let i = 0; i < span; i++) {
                        newTable.push({
                            uuid: i == 0 ? data.uuid : "",
                            request_id: i == 0 ? data.request_id : "",
                            status: i == 0 ? data.status : "",
                            vehicle: vehArr[i] ?? "",
                            vehuuid: vehUUID[i] ?? "",
                            driver: drvArr[i] ?? "",
                            drvuuid: drvUUID[i] ?? "",
                            span: span,
                        });
                    }
                } else {
                    newTable.push({
                        uuid: data.uuid,
                        request_id: data.request_id,
                        vehicle: data.vehicle_id,
                        driver: data.driver,
                    });
                }
            }
            res.status(200).send(newTable);
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

MasterController.getStobyDo = async (req, res) => {
    try {
        const do_num = req.query.do;

        const { data } = await axios.get(
            `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/SOSTOSet?$filter=(Bednr eq '${do_num}')&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const stolist = data.d.results.map(item => ({
            value: item.Ebeln,
            label: item.Ebeln,
        }));
        if (data.d.results.length > 0) {
            res.status(200).send({
                ebeln: stolist[0].value,
            });
        } else {
            throw new Error("STO not found");
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.getTransporterWBNET = async (req, res) => {
    try {
        const plantwbnet = req.query.plant;
        const { limit, offset, q } = req.query;
        const dataTp = await Master.getTransporterWB(
            plantwbnet,
            limit,
            offset,
            q
        );
        res.status(200).send(dataTp);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MasterController.plantWBNET = async (req, res) => {
    try {
        const { limit, offset, q } = req.query;
        const que = `%${q}%`;
        const client = await db.connect();
        try {
            const { rows: plant } = await client.query(
                `
                select
                    mwc.plant ,
                    CONCAT(mcp.company_name, ' - ', mcp.plant_name) as plant_name
                from
                    mst_wbnet_conn mwc
                left join mst_company_plant mcp on
                    mcp.plant_code = mwc.plant
                    where mwc.plant like $1 or mcp.plant_name like $2
                    limit $3 offset $4
                `,
                [que, que, limit, offset]
            );
            const { rows: countPlant } = await client.query(
                `
                    select
                       count(mwc.plant) as countdata 
                    from
                        mst_wbnet_conn mwc
                    left join mst_company_plant mcp on
                        mcp.plant_code = mwc.plant
                        where mwc.plant like $1 or mcp.plant_name like $2
                    `,
                [que, que]
            );
            res.status(200).send({
                data: plant,
                count: countPlant[0].countdata,
            });
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

MasterController.getDoDB = async (req, res) => {
    try {
        const client = await db.connect();
        const { id_user, role } = req.cookies;
        const { limit, offset } = req.query;
        try {
            if (
                role !== "LOGISTIC" &&
                role !== "ADMIN" &&
                role !== "COMMERCIAL" &&
                role
            ) {
                const query = `select distinct id_do from loading_note_hd where create_by = $1 and id_do like $2`;
                const { rows } = await client.query(
                    `${query} limit $3 offset $4`,
                    [id_user, `%${q}%`, limit, offset]
                );
                const { rowCount } = await client.query(
                    `select distinct id_do from loading_note_hd where create_by = $1 and id_do like $2`,
                    [id_user, `%${q}%`]
                );
                res.status(200).send({
                    data: rows,
                    count: rowCount,
                });
            } else {
                const query = `select distinct id_do from loading_note_hd where id_do like $1`;
                const { rows } = await client.query(
                    `${query} limit $2 offset $3`,
                    [`%${q}%`, limit, offset]
                );
                const { rowCount } = await client.query(
                    `select distinct id_do from loading_note_hd where id_do like $1`,
                    [`%${q}%`]
                );
                res.status(200).send({
                    data: rows,
                    count: rowCount,
                });
            }
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
