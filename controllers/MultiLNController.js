const MultiLoadingNoteModel = require("../models/MultiLoadingNoteModel");
const q = require("../helper/Queue");
const moment = require("moment");
const axios = require("axios");

const MultiLNController = {};

MultiLNController.SaveMultiLNDB = async (req, res) => {
    try {
        const params = req.body;
        const session = req.cookies;
        const SaveMulti = await MultiLoadingNoteModel.SaveMultiDB({
            params,
            session,
        });
        res.status(200).send({
            data: SaveMulti,
            message: "Successfully Saved",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
    return;
};

MultiLNController.ShowDataUser = async (req, res) => {
    try {
        const { id_user } = req.cookies;
        const result = await MultiLoadingNoteModel.ShowDataUser({
            user_id: id_user,
        });
        res.status(200).send({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
    return;
};

MultiLNController.GetRequestsWB = async (req, res) => {
    try {
        const { id_user } = req.cookies;
        const result = await MultiLoadingNoteModel.GetRequestsWB({
            user_id: id_user,
        });
        res.status(200).send({
            data: result,
        });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MultiLNController.SendToLog = async (req, res) => {
    try {
        const { hd_id } = req.body;
        const { id_user } = req.cookies;
        const data = await MultiLoadingNoteModel.SendToLogistic({
            hd_id: hd_id,
            user_id: id_user,
        });
        res.status(200).send({
            message: "Request Sent Successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
    return;
};

MultiLNController.GetOSPushReq = async (req, res) => {
    try {
        const { prereg_type, cust } = req.query;
        const data = await MultiLoadingNoteModel.GetOSPushReq(
            prereg_type,
            cust
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MultiLNController.GetPrintReq = async (req, res) => {
    try {
        const id_user = req.cookies.id_user;
        const data = await MultiLoadingNoteModel.GetPrintReq({
            user_id: id_user,
        });
        res.status(200).send(data);
        return;
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MultiLNController.SubmitPushMultiLN = async (req, res) => {
    try {
        const { requests, password } = req.body;
        const session = req.cookies;
        // const data = await MultiLoadingNoteModel.PushSAPMulti({
        //     data_req: requests,
        //     session: session,
        // });
        MultiLNController.PushJobSAPTrigger(data, requests, session, password);
        res.status(200).send({ message: "Success push" });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
    return;
};

MultiLNController.ApprovalMultiLNWB = async (req, res) => {
    try {
        const session = req.cookies;
        const { requests } = req.body;
        const result = await MultiLoadingNoteModel.ApproveMultiWB(
            requests,
            session
        );
        res.status(200).send({
            message: "Successfully Approved",
            result: result,
        });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MultiLNController.PushJobSAPTrigger = (
    insertSAP,
    payload,
    session,
    password
) => {
    const promiseJob = new Promise(async (resolve, reject) => {
        try {
            await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/DOTRXSet?&$format=json`,
                {
                    auth: {
                        username: session.username,
                        password: password,
                    },
                }
            );
            await MultiLoadingNoteModel.ApproveMultiSAP(payload, session);
            resolve(
                "Success Push" +
                    moment().format("YYYY-MM-DD T HH:mm:ss") +
                    insertSAP.data
            );
        } catch (error) {
            reject(error);
        }
    });
    const jobQueue = () => {
        console.log(
            "Start new Job : " +
                moment().format("YYYY-MM-DD T HH:mm:ss") +
                insertSAP.data
        );
        return promiseJob
            .then(result => console.log(result))
            .catch(error => console.log(error));
    };
    q.push(jobQueue);
    return;
};

MultiLNController.GetReqbyID = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await MultiLoadingNoteModel.GetReqbyID({ id });
        res.status(200).send({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

MultiLNController.GetCustOSPush = async (req, res) => {
    try {
        const { prereg_type } = req.query;
        const result =
            await MultiLoadingNoteModel.GetCustomerOSAppr(prereg_type);
        res.status(200).send({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = MultiLNController;
