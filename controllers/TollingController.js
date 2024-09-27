const TicketGen = require("../helper/TicketGen");
const Tolling = require("../models/TollingModel");

const TollingController = {};

TollingController.getSTOTolling = async (req, res) => {
    try {
        const { sto } = req.query;
        const dataSTO = await Tolling.GetSTOTolling(sto);
        res.status(200).send({
            data: dataSTO,
        });
    } catch (error) {
        console.error(error);
        let err_msg = error.message.trim();
        if (err_msg === "Error") {
            err_msg = "STO is not Tolling";
        }
        res.status(500).send({
            message: err_msg,
        });
    }
};

TollingController.SaveRequestTolling = async (req, res) => {
    try {
        const { payload } = req.body;
        const session = req.cookies;
        const saveTolling = await Tolling.SaveRequestTolling(payload, session);
        res.status(200).send({
            message: "Data Saved Successfully",
            data: saveTolling,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.TestTollingGen = async (req, res) => {
    try {
        const { username, lasttolreq } = req.query;
        const tolling_req = TicketGen.GenTollingReq(username, lasttolreq);
        res.status(200).send(tolling_req);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.AllTollReq = async (req, res) => {
    try {
        const session = req.cookies;
        const c_grp = req.query.cgrp;
        const data_req = await Tolling.AllReqToll(session, c_grp);
        res.status(200).send({
            data: data_req,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetById = async (req, res) => {
    try {
        const { id } = req.query;
        const data = await Tolling.GetById(id);
        res.status(200).send({
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSReqTolling = async (req, res) => {
    try {
        const { filters } = req.body;
        const dataosreq = await Tolling.GetOSReqTolling(filters);
        res.status(200).send(dataosreq);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSCustTolling = async (req, res) => {
    const { limit, offset, q } = req.query;
    try {
        const data = await Tolling.GetOSCust(limit, offset, q);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.GetOSSTOTolling = async (req, res) => {
    const { limit, offset, cust } = req.query;
    try {
        if (!cust) {
            throw new Error("Please Provide Customer Code");
        }
        const data = await Tolling.GetOSSTOReq(limit, offset, cust);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TollingController.ApproveTollingReq = async (req, res) => {
    const { data_req } = req.body;
    const session = req.cookies;

    try {
        const created_ln = await Tolling.ApproveTollingReq(data_req, session);
        res.status(200).send({
            created: created_ln,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = TollingController;
