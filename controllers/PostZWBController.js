const LoadingNoteModel = require("../models/LoadingNoteModel");
const PostZWBModel = require("../models/PostZWBModel");

const PostZWBController = {
    GetCurrentOS: async (req, res) => {
        try {
            const { cust_code } = req.query;
            const result = await PostZWBModel.getCurrentOSPost(cust_code);
            res.status(200).send({
                data: result,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    GetCustomers: async (req, res) => {
        try {
            const result = await PostZWBModel.getListCustOSPost();
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
    },
    PostZWBStart: async (req, res) => {
        try {
            const { loading_notes } = req.body;
            await PostZWBModel.StartPostZWB(loading_notes);
            const ZWBS_TRX = await LoadingNoteModel.PostZWBS_TRX();
            const ZWB_PARK = await LoadingNoteModel.PostZWB_PARK();
            const ZDO_TRX_DOPO = await LoadingNoteModel.PostZDO_TRXDOPO();
            const ZDO_TRX_PGIP = await LoadingNoteModel.PostZDO_TRXPGIP();
            res.status(200).send({
                data: {
                    ZWBS_TRX,
                    ZWB_PARK,
                    ZDO_TRX_DOPO,
                    ZDO_TRX_PGIP,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
};

module.exports = PostZWBController;
