const Master = require("../models/MasterModel");

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
    const rule = req.query.rule;
    try {
        const { I_SLOC } = await Master.getStoreLoc(plant, rule);
        const dataRFC = I_SLOC.map(item => ({
            value: item.LGORT,
            label: item.LGORT + " - " + item.LGOBE,
        }));
        res.status(200).send(dataRFC);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

MasterController.getDataDOList = async (req, res) => {
    try {
        const cust_id = req.cookies.sap_code;
        const dataRFC = await Master.getDOList(cust_id);
        console.log(dataRFC);
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

MasterController.seedDataCust = async (req, res) => {
    try {
        const insertData = await Master.seedMstCust();
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
    const do_num = req.query.do_num;
    try {
        const data = await Master.getOSDataCust(limit, offset, q, do_num);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = MasterController;
