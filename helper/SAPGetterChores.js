require("dotenv").config({ path: `.env.development` });

const psqlconn = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");

const SAPGetterChores = {};

SAPGetterChores.LoadingNoteSync = async () => {
    try {
        const psqlclient = await psqlconn.connect();
        const oraclient = await ora.getConnection();
        try {
            // get data db psql
            await psqlclient.query(TRANS.BEGIN);
            const { rows } = await psqlclient.query(
                "SELECT det_id FROM loading_note_det WHERE ln_num is null"
            );

            for (const row of rows) {
                //check data db oracle
                let payload = {};
                let orapayload = {};
                const { metaData, rows } = await oraclient.execute(
                    `SELECT DET_ID, LOADING_NOTE_NUM, ERRORDESCRIPTION FROM PREREG_LOADING_NOTE_SAP 
            WHERE FLAG_WEB_PULL IS NULL AND ISRETRIVEDBYSAP = 'TRUE'
            AND DET_ID = :0`,
                    [row.det_id]
                );
                // console.log(row.det_id);
                // console.log(rows);
                if (rows.length > 0) {
                    if (rows[0][1] === null && rows[0][2] !== null) {
                        payload = {
                            error_msg: rows[0][2],
                        };
                        orapayload = {
                            ISRETRIVEDBYSAP: "FALSE",
                        };
                    } else if (rows[0][1] !== null) {
                        payload = {
                            ln_num: rows[0][1],
                        };
                        orapayload = {
                            FLAG_WEB_PULL: "T",
                        };
                    }
                    // console.log(payload);
                    // console.log(orapayload);
                    const id_db = row.det_id;
                    const [queW, valW] = crud.updateItem(
                        "loading_note_det",
                        payload,
                        { det_id: id_db },
                        "det_id"
                    );
                    const [queO, valO] = crud.updateItemOra(
                        "PREREG_LOADING_NOTE_SAP",
                        orapayload,
                        { DET_ID: id_db }
                    );
                    const updateData = await psqlclient.query(queW, valW);
                    const upDataSAP = await oraclient.execute(queO, valO);
                } else {
                    continue;
                }
            }
            await psqlclient.query(TRANS.COMMIT);
            await oraclient.commit();
            console.log("SAP Data LNNUM Synced");
            return "SAP Data LNNUM Synced";
        } catch (error) {
            await psqlclient.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            psqlclient.release();
            oraclient.close();
        }
    } catch (error) {
        throw error;
    }
};

setInterval(async () => {
    try {
        const result = await SAPGetterChores.LoadingNoteSync();
        console.log(result);
    } catch (error) {
        console.log(error);
    }
}, 60 * 1000);
