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
module.exports = LoadingNoteController;
