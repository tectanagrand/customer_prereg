const db = require("../config/connection");
// const noderfc = require("node-rfc");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const axios = require("axios");
const MappingKeys = require("../helper/MappingKeys");
// noderfc.setIniFileDirectory(process.env.SAPINIFILE);

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

MasterModel.getDriverData2 = async q => {
    try {
        let filter = "";
        if (isNaN(parseInt(q))) {
            filter = `Snama%20eq%20%27${q}%27`;
        } else {
            filter = `Snosim%20eq%20%27${q}%27`;
        }
        // console.log(filter);
        const { data: driverData } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/SIMSet?$filter=(${filter})&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const T_SIM = driverData.d.results.map(item =>
            MappingKeys.ToUpperKeys(item)
        );
        return {
            data: T_SIM,
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

MasterModel.getVehicleData2 = async q => {
    try {
        const { data: dataVehicle } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/TRUCKSet?$filter=(Nnopolisi eq '${q}')&$format=json
        `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const T_TRUCK = dataVehicle.d.results.map(item =>
            MappingKeys.ToUpperKeys(item)
        );
        return {
            data: T_TRUCK,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

MasterModel.getSOData = async do_num => {
    const psqlclient = await db.connect();
    try {
        let totalPay = 0;
        let totalFromSAP = 0;
        const param = {
            I_VBELN: do_num,
        };
        const { data: ZSLIP_get } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${do_num}')&$format=json
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
        const { data: ZPINO_get } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZPINOSet?$filter=(Vbeln eq '${do_num}')&$format=json
        `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const I_ZPINO = ZPINO_get.d.results.map(item => {
            const itemTemp = {};
            Object.keys(item).map(data => {
                if (data !== "__metadata") {
                    itemTemp[data.toUpperCase()] = item[data];
                }
            });
            return itemTemp;
        });
        const { rows: tempLoadingNote } = await psqlclient.query(
            `SELECT SUM(PLAN_QTY) AS plan_qty
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
        WHERE HD.ID_DO = $1
            AND DET.IS_ACTIVE = TRUE
            AND DET.LN_NUM IS NULL`,
            [do_num]
        );
        const qtyTemp = tempLoadingNote[0].plan_qty
            ? parseFloat(tempLoadingNote[0].plan_qty)
            : 0;
        const { data: I_OUTDELIVERY } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/OUTDELIVSet?$filter=(Vbeln%20eq%20%27${do_num}%27)&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        I_OUTDELIVERY.d.results.map(item => {
            // console.log(item);
            let planning = parseFloat(item.PlnLfimg);
            let real = parseFloat(item.LLfimg);
            // console.log(planning);
            // console.log(real);
            totalFromSAP += real === 0 ? planning : real;
        });

        const { data: DOTRXDELETE } = await axios.get(
            `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXDELETESet?$filter=(VbelnRef%20eq%20%27${do_num}%27)&$format=json`,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        if (DOTRXDELETE.d.results.length > 0) {
            DOTRXDELETE.d.results.map(item => {
                totalFromSAP -= parseFloat(item.PlnLfimg);
            });
        }

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
        const SLIPZ = I_ZSLIP;

        const SLIP = {
            ...SLIPZ,
            KWMENG: parseFloat(SLIPZ.KWMENG.split(".")[0]),
            ZTTLPROF: SLIPZ.ZTTLPROF.trim()
                .replace(/[.,]/g, "")
                .replace(",", "."),
        };
        return {
            SLIP: SLIP,
            PINO: PINO,
            OS: parseFloat(SLIP.ZTTLPROF) - totalPay,
            IS_PAID: parseFloat(SLIP.ZTTLPROF) - totalPay > 5000 ? false : true,
            TOTALSPEND: totalFromSAP + qtyTemp,
            TOTALTEMP: qtyTemp,
            TOTALSAP: totalFromSAP,
        };
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        psqlclient.release();
    }
};

MasterModel.getSOData2 = async do_num => {
    const client = new noderfc.Client({ dest: "Q13" });
    const psqlclient = await db.connect();
    await client.open();
    try {
        let totalPay = 0;
        let totalFromSAP = 0;
        const param = {
            I_VBELN: do_num,
        };
        const rfcResponse = await client.call("ZRFC_PRE_REGISTRA_SLIP", param);
        const { rows: tempLoadingNote } = await psqlclient.query(
            `SELECT SUM(PLAN_QTY) AS plan_qty
        FROM LOADING_NOTE_DET DET
        LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
        WHERE HD.ID_DO = $1
            AND DET.IS_ACTIVE = TRUE
            AND DET.LN_NUM IS NULL`,
            [do_num]
        );
        const qtyTemp = parseFloat(tempLoadingNote[0].plan_qty) ?? 0;
        let I_ZPINO = rfcResponse.I_ZPINO;
        let I_ZSLIP = rfcResponse.I_ZSLIP;
        rfcResponse.I_OUTDELIVERY.map(item => {
            let planning = parseFloat(item.PLN_LFIMG);
            let real = parseFloat(item.L_LFIMG);
            totalFromSAP += real === 0 ? planning : real;
        });
        // console.log(rfcResponse);
        // console.log(qtyTemp);
        // console.log(totalFromSAP);

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
            KWMENG: parseFloat(SLIPZ.KWMENG.split(".")[0]),
            ZTTLPROF: SLIPZ.ZTTLPROF.trim()
                .replace(/[.,]/g, "")
                .replace(",", "."),
        };
        return {
            SLIP: SLIP,
            PINO: PINO,
            OS: parseFloat(SLIP.ZTTLPROF) - totalPay,
            IS_PAID: parseFloat(SLIP.ZTTLPROF) - totalPay > 5000 ? false : true,
            TOTALSPEND: totalFromSAP + qtyTemp,
            TOTALTEMP: qtyTemp,
            TOTALSAP: totalFromSAP,
        };
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        psqlclient.release();
    }
};

// MasterModel.getCustData = async () => {
//     try {
//         const rfcclient = new noderfc.Client({ dest: "Q13" });
//         await rfcclient.open();
//         try {
//             const datarfc = rfcclient.call("ZRFC_PRE_REGISTRA_KUNNR", {
//                 I_ERDAT: "20220101", // YYYYMMDD
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

// MasterModel.getStoreLoc = async (plant, material) => {
//     try {
//         const rfcclient = new noderfc.Client({ dest: "Q13" });
//         await rfcclient.open();
//         try {
//             const { I_SLOC, I_VALTYPE } = await rfcclient.call(
//                 "ZRFC_PRE_REGISTRA_STORELOC",
//                 {
//                     I_PLANT: plant,
//                     I_MATERIAL: material,
//                 }
//             );
//             const dataSloc = I_SLOC.map(item => ({
//                 value: item.LGORT,
//                 label: item.LGORT + " - " + item.LGOBE,
//             }));
//             const dataVtype = I_VALTYPE.map(item => ({
//                 value: item.BWTAR,
//                 label: item.BWTAR,
//             }));

//             return { sloc: dataSloc, valtype: dataVtype };
//         } catch (error) {
//             throw error;
//         }
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// };

MasterModel.getStoreLoc2 = async (plant, itemrule) => {
    try {
        try {
            let factory = [];
            let other = [];
            // const { I_SLOC, I_VALTYPE } = await rfcclient.call(
            //     "ZRFC_PRE_REGISTRA_STORELOC",
            //     {
            //         I_PLANT: plant,
            //         I_MATERIAL: material,
            //     }
            // );

            const { data: dataIsloc } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/SLOCSet?$filter=(Plant eq '${plant}')and(Itemrule eq '${itemrule}')&$format=json
            `,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            console.log(dataIsloc);
            const I_SLOC = dataIsloc.d.results.map(item =>
                MappingKeys.ToUpperKeys(item)
            );
            const dataSloc = I_SLOC.map(item => {
                console.log(item);
                if (item.FACTORYIND === "X") {
                    factory.push({
                        value: item.LGORT,
                        label: item.LGORT + " - " + item.LGOBE,
                    });
                } else {
                    other.push({
                        value: item.LGORT,
                        label: item.LGORT + " - " + item.LGOBE,
                    });
                }
            });

            return {
                factory: factory,
                other: other,
            };
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.getValType = async (plant, material) => {
    try {
        const { data: dataValtype } = await axios.get(
            `
        http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/VALTYPESet?$filter=(Matnr eq '${material}')and(Plant eq '${plant}')&$format=json
        `,
            {
                auth: {
                    username: process.env.UNAMESAP,
                    password: process.env.PWDSAP,
                },
            }
        );
        const I_VALTYPE = dataValtype.d.results.map(item =>
            MappingKeys.ToUpperKeys(item)
        );
        const dataVtype = I_VALTYPE.map(item => ({
            value: item.BWTAR,
            label: item.BWTAR,
        }));
        return dataVtype;
    } catch (error) {
        throw error;
    }
};

MasterModel.seedMstCust2 = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            await client.query("DELETE FROM mst_customer");
            const { data: custData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/KUNNRSet?$filter=(Erdat eq datetime'1990-01-01T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            custData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    kunnr: item.Kunnr,
                    name_1: item.Name1,
                    ort_1: item.Ort01,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_customer",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
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

MasterModel.seedMstInterco = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            await client.query("DELETE FROM mst_customer");
            const { data: custData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/KUNNRCISet?$filter=(Erdat eq datetime'1990-01-01T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            custData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    kunnr: item.Kunnr,
                    name_1: item.Name1,
                    ort_1: item.Ort01,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_interco",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
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

MasterModel.updateMstInterco = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            const { rows: lastDate } = await client.query(
                `SELECT TO_CHAR(erdat, 'YYYY-MM-DD') as ERDAT from mst_interco ORDER BY ERDAT DESC LIMIT 1 ;`
            );
            let dateLast = lastDate[0]?.erdat;
            const { data: custData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/KUNNRCISet?$filter=(Erdat eq datetime'${dateLast ?? "1990-01-01"}T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            custData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    kunnr: item.Kunnr,
                    name_1: item.Name1,
                    ort_1: item.Ort01,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_interco",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.updateMstCust = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            const { rows: lastDate } = await client.query(
                `SELECT TO_CHAR(erdat, 'YYYY-MM-DD') as ERDAT from mst_customer ORDER BY ERDAT DESC LIMIT 1 ;`
            );
            let dateLast = lastDate[0].erdat;
            const { data: custData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/KUNNRSet?$filter=(Erdat eq datetime'${dateLast}T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            custData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    kunnr: item.Kunnr,
                    name_1: item.Name1,
                    ort_1: item.Ort01,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_customer",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.seedMstVen = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            await client.query("DELETE FROM mst_vendor");
            const { data: venData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/LIFNRSet?$filter=(Erdat eq datetime'1990-01-01T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            venData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    lifnr: item.Lifnr,
                    name_1: item.Name1,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_vendor",
                    payload,
                    "lifnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
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

MasterModel.updateMstVen = async () => {
    try {
        const client = await db.connect();
        let promises = [];
        try {
            await client.query(TRANS.BEGIN);
            const { rows: lastDate } = await client.query(
                `SELECT TO_CHAR(erdat, 'YYYY-MM-DD') as ERDAT from mst_vendor ORDER BY ERDAT DESC LIMIT 1 ;`
            );
            let dateLast = lastDate[0].erdat;
            const { data: custData } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/LIFNRSet?$filter=(Erdat eq datetime'${dateLast}T00:00:00')&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            custData.d.results.forEach(item => {
                const dte = item.Erdatshow.split(".");
                const payload = {
                    lifnr: item.Lifnr,
                    name_1: item.Name1,
                    erdat: dte[2] + "-" + dte[1] + "-" + dte[0],
                };
                const [que, val] = crud.insertItem(
                    "mst_vendor",
                    payload,
                    "kunnr"
                );
                promises.push(client.query(que, val));
            });
            const insertData = await Promise.all(promises);
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// MasterModel.updateCustData2 = async () => {
//     try {
//         const client = await db.connect();
//         let promises = [];
//         try {
//             const {rows : lastData} = await client.query(`SELECT TO_CHAR(erdat, 'YYYY-MM-DD' ) AS ERDAT FROM MST_CUSTOMER ORDER BY ERDAT DESC` ) ;
//             const lastDate = lastData[0].ERDAT ;
//             await client.query(TRANS.BEGIN);
//             await client.query("DELETE FROM mst_customer");
//             const { data: custData } = await axios.get(
//                 `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/KUNNRSet?$filter=(Erdat eq datetime'${lastDate}T00:00:00')&$format=json`,
//                 {
//                     auth: {
//                         username: process.env.UNAMESAP,
//                         password: process.env.PWDSAP,
//                     },
//                 }
//             );
//             custData.d.results.forEach(item => {
//                 const dte = item.Erdatshow.split(".");
//                 const payload = {
//                     kunnr: item.Kunnr,
//                     name_1: item.Name1,
//                     ort_1: item.Ort01,
//                     erdat: dte[1] + "-" + dte[0] + "-" + dte[2],
//                 };
//                 const [que, val] = crud.insertItem(
//                     "mst_customer",
//                     payload,
//                     "kunnr"
//                 );
//                 promises.push(client.query(que, val));
//             });
//             const insertData = await Promise.all(promises);
//             await client.query(TRANS.COMMIT);
//         } catch (error) {
//             await client.query(TRANS.ROLLBACK);
//             throw error;
//         }
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// };

MasterModel.getDOList = async (cust_id, type) => {
    try {
        try {
            let dolist = [];
            const { data } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOKUNNRSet?$filter=(Kunnr%20eq%20%27${cust_id}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );

            for (const d of data.d.results) {
                const { data } = await axios.get(
                    `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/ZSLIPSet?$filter=(Vbeln eq '${d.Vbeln}')&$format=json`,
                    {
                        auth: {
                            username: process.env.UNAMESAP,
                            password: process.env.PWDSAP,
                        },
                    }
                );
                if (data.d.results[0].Inco1 === type) {
                    dolist.push({
                        value: d.Vbeln,
                        label: d.Vbeln,
                    });
                }
            }
            return dolist;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

MasterModel.getSTOList = async (cust_id, do_num) => {
    try {
        try {
            const { data } = await axios.get(
                `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOKUNNRSTOSet?$filter=(Vbeln%20eq%20%27${do_num}%27)and(Kunnr%20eq%20%27${cust_id}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            const resultData = data.d.results.map(item => ({
                value: item.Ebeln,
                label: item.Ebeln,
            }));
            return resultData;
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

MasterModel.getInterDataDB = async (limit, offset, q) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `SELECT kunnr, CONCAT (name_1, ' - ', kunnr) as name FROM MST_INTERCO 
                WHERE (lower(name_1) like $1 or lower(kunnr) like $2) 
                AND kunnr like '%000'
                LIMIT $3 OFFSET $4`,
                [`%${q}%`, `%${q}%`, limit, offset]
            );
            const { rows } = await client.query(
                "SELECT COUNT(*) AS ctr FROM MST_INTERCO WHERE (lower(name_1) like $1 or lower(kunnr) like $2) AND kunnr like '%000'",
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

MasterModel.getVenDataDB = async (limit, offset, q) => {
    try {
        const client = await db.connect();

        try {
            const { rows: dataComp } = await client.query(
                `SELECT lifnr, CONCAT (name_1, ' - ', lifnr) as name FROM MST_VENDOR 
                WHERE (lower(name_1) like $1 or lower(lifnr) like $2) 
                LIMIT $3 OFFSET $4`,
                [`%${q}%`, `%${q}%`, limit, offset]
            );
            const { rows } = await client.query(
                "SELECT COUNT(*) AS ctr FROM MST_VENDOR WHERE (lower(name_1) like $1 or lower(lifnr) like $2)",
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

MasterModel.getOSDataCust2 = async (limit, offset, q) => {
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
                    end as name_1 FROM loading_note_det DET
                                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                 or mi.kunnr like $5 or mi.name_1 like $6)
                                AND DET.ln_num is null
                                AND DET.push_sap_date is null
                                AND hed.cur_pos = 'FINA'
                                AND det.is_active = true 
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
                    end as name_1 FROM loading_note_det DET
                                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                 or mi.kunnr like $5 or mi.name_1 like $6)
                                AND DET.ln_num is null
                                AND DET.push_sap_date is null
                                AND hed.cur_pos = 'FINA'
                                AND det.is_active = true `,
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

MasterModel.getOSDataCustWB = async (limit, offset, q) => {
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
                    end as name_1 FROM loading_note_det DET
                                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                 or mi.kunnr like $5 or mi.name_1 like $6)
                AND DET.PUSH_SAP_DATE IS NOT NULL 
                AND DET.LN_NUM IS NOT NULL
                AND hed.cur_pos = 'FINA'
                AND det.is_active = true 
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
                    end as name_1 FROM loading_note_det DET
                                LEFT JOIN mst_user USR ON DET.create_by = USR.id_user
                                LEFT JOIN loading_note_hd HED ON DET.hd_fk = HED.hd_id
                                LEFT JOIN mst_customer CUST ON CUST.kunnr = USR.username
                                left join mst_vendor mv on mv.lifnr = usr.username 
                                left join mst_interco mi on mi.kunnr = usr.username
                                WHERE( CUST.kunnr like $1 OR cust.name_1 like $2 or mv.lifnr like $3 or mv.name_1 like $4
                                or mi.kunnr like $5 or mi.name_1 like $6)
                AND DET.PUSH_SAP_DATE IS NOT NULL 
                AND DET.LN_NUM IS NOT NULL
                AND hed.cur_pos = 'FINA'
                AND det.is_active = true `,
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
