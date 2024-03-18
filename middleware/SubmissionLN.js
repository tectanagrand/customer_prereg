const express = require("express");
const router = express.Router();
const db = require("../config/connection");

const SubmissionLN = {};

SubmissionLN.checkSubmitValidity = async (req, res, next) => {
    const params = req.body;
    const cookies = req.cookies;
    try {
        if (params.uuid === "") {
            next();
        }
        const client = await db.connect();
        try {
            const { rows: curPos } = await client.query(
                "SELECT cur_pos, id_loadnote FROM loading_note where uuid = $1",
                [params.uuid]
            );
            const id_loadnote = curPos[0]?.id_loadnote;
            if (
                (id_loadnote !== null || id_loadnote !== "") &&
                params.cur_pos === "FINA"
            ) {
                res.status(400).send({
                    message: "Loading note already created",
                });
            } else if (
                cookies.role === "CUSTOMER" &&
                params.cur_pos === "FINA"
            ) {
                res.status(400).send({
                    message: "User not authorized",
                });
            } else if (
                cookies.role === "LOGISTIC" &&
                params.cur_pos === "INIT"
            ) {
                res.status(400).send({
                    message: "User not authorized",
                });
            } else {
                next();
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
    }
};

module.exports = SubmissionLN;
