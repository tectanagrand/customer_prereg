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

module.exports = MasterController;
