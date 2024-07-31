const express = require("express");
const router = express.Router();
const db = require("../config/connection");

const SubmissionLN = {};

SubmissionLN.checkSubmitValidity = async (req, res, next) => {
    const params = req.body;
    const cookies = req.cookies;
    try {
        if (params.id_header === "") {
            next();
            return;
        }
        const client = await db.connect();
        try {
            const { rows: curPos } = await client.query(
                "SELECT cur_pos, hd_id FROM loading_note_hd where hd_id = $1",
                [params.id_header]
            );
            const id_loadnote = curPos[0]?.hd_id;
            if (
                (id_loadnote !== null || id_loadnote !== "") &&
                params.cur_pos === "FINA"
            ) {
                res.status(400).send({
                    message: "Loading note already created",
                });
                return;
            } else if (
                cookies.role === "CUSTOMER" &&
                params.cur_pos === "FINA"
            ) {
                res.status(400).send({
                    message: "User not authorized",
                });
                return;
            } else if (
                cookies.role === "LOGISTIC" &&
                params.cur_pos === "INIT"
            ) {
                res.status(400).send({
                    message: "User not authorized",
                });
                return;
            } else {
                next();
                return;
            }
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
        return;
    }
};

module.exports = SubmissionLN;
