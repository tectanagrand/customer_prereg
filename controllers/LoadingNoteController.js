const LoadNote = require("../models/LoadingNoteModel");
const db = require("../config/connection");

const LoadingNoteController = {};

LoadingNoteController.SaveLoadingNoteDB = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const insertData = await LoadNote.refSaveLoadingNoteDB(
            payload,
            session
        );
        const message = payload.is_draft
            ? "Draft Saved"
            : "Loading Note Requested";
        res.status(200).send({
            message: message,
            ...insertData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.sendToLogistic = async (req, res) => {
    try {
        const id_header = req.body.id_header;
        const insertData = await LoadNote.sendToLogistic(id_header);
        res.status(200).send({
            message: insertData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP = async (req, res) => {
    try {
        const payload = req.body;
        const isDraft = req.body.is_draft;
        const session = req.cookies;

        const insertSAP = await LoadNote.finalizeLoadingNote(payload, session);
        const message = !isDraft
            ? "Loading Note " + insertSAP + " is created"
            : "Draft Saved";
        res.status(200).send({
            message: message,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showAll = async (req, res) => {
    try {
        const data = await LoadNote.showAllLoadNote();
        res.status(200).send({
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: message,
        });
    }
};

LoadingNoteController.getById = async (req, res) => {
    const idloadnote = req.query.idloadnote;
    const client = await db.connect();
    try {
        const result = await LoadNote.getById(idloadnote);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

LoadingNoteController.showSLoc = async (req, res) => {
    try {
        const plant = req.query.plant;
        const sLoc = await LoadNote.showSLoc(plant);
        res.status(200).send(sLoc);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showOSReqLN = async (req, res) => {
    // filters :
    /*
   [
    id : <key>,
    value : value
   ]
    pagination : 
    {
       pageIndex :
       pageSize :
    }

    sorting : {
       id : <key> , desc : bool
    }
    */

    try {
        const filter = req.body.filter;
        const pagination = req.body.pagination;
        const sorting = req.body.sorting;
        const data = await LoadNote.getRequestedLoadNote(
            filter,
            pagination,
            sorting
        );
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.showOSReqLN2 = async (req, res) => {
    try {
        const filter = req.body.filters;
        const data = await LoadNote.getRequestedLoadNote2(filter);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getOSLoadingNoteNum = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const dataLN = await LoadNote.getOSLoadingNoteNum(limit, offset, q);
        res.status(200).send(dataLN);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP_2 = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const insertSAP = await LoadNote.finalizeLoadingNote_2(
            payload,
            session
        );
        res.status(200).send(insertSAP);
    } catch (error) {
        console.error(error.stack);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.SubmitSAP_3 = async (req, res) => {
    try {
        const payload = req.body;
        const session = req.cookies;
        const insertSAP = await LoadNote.finalizeLoadingNote_3(
            payload,
            session
        );
        res.status(200).send(insertSAP);
    } catch (error) {
        console.error(error.stack);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getAllDataLNbyUser = async (req, res) => {
    try {
        const session = req.cookies;
        const isallow = req.query.isallow === "true" ? true : false;
        const data = await LoadNote.getAllDataLNbyUser_2(session, isallow);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getDataOSUser = async (req, res) => {
    try {
        const session = req.cookies;
        const data = await LoadNote.getDataOSUser(session);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

LoadingNoteController.getDataLastReq = async (req, res) => {
    try {
        const data = await LoadNote.getDataLastReq();
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

LoadingNoteController.getDataRecap = async (req, res) => {
    try {
        const data = await LoadNote.getRecap();
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};
module.exports = LoadingNoteController;
