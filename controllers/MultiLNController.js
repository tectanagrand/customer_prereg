const MultiLoadingNoteModel = require("../models/MultiLoadingNoteModel");

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

module.exports = MultiLNController;
