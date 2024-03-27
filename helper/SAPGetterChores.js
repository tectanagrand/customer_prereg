require("dotenv").config({ path: `.env.development` });

const psqlconn = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const EmailModel = require("../models/EmailModel");

const SAPGetterChores = {};

SAPGetterChores.LoadingNoteSync = async () => {
    try {
        const psqlclient = await psqlconn.connect();
        const oraclient = await ora.getConnection();
        const email_creator = new Map();
        const email_updater = new Map();
        try {
            // get data db psql
            await psqlclient.query(TRANS.BEGIN);
            const { rows } = await psqlclient.query(
                `SELECT DET.DET_ID,
                USR_CR.EMAIL AS EMAIL_CREATOR,
                USR_CR.id_user AS ID_CREATOR,
                USR_UP.EMAIL AS EMAIL_UPDATER,
                USR_UP.id_user AS ID_UPDATER,
                HD.ID_DO,
                USR_CR.SAP_CODE,
                TO_CHAR(DET.CRE_DATE, 'MM-DD-YYYY') AS CRE_DATE,
                CUS.NAME_1,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                DET.PLAN_QTY,
                HD.UOM
              FROM LOADING_NOTE_DET DET
              LEFT JOIN MST_USER USR_CR ON DET.CREATE_BY = USR_CR.ID_USER
              LEFT JOIN MST_USER USR_UP ON DET.UPDATE_BY = USR_UP.ID_USER
              LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
              LEFT JOIN MST_CUSTOMER CUS ON CUS.KUNNR = USR_CR.SAP_CODE 
              WHERE LN_NUM IS NULL`
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

                    const payloadEmail = `
                    <tr>
                      <td>
                       ${row.id_do}
                      </td>
                      <td>
                      ${row.sap_code + " - " + row.name_1}
                      </td>
                      <td>
                      ${row.cre_date}
                      </td>
                      <td>
                      ${row.plan_qty + " " + row.uom}
                      </td>
                      <td>
                      ${row.driver_id + " - " + row.driver_name}
                      </td>
                      <td>
                      ${row.vhcl_id}
                      </td>
                      <td>
                      ${rows[0][1] !== null ? rows[0][1] : ""}
                      </td>
                      <td>
                      ${rows[0][2] !== null ? rows[0][2] : ""}
                      </td>
                    </tr>
                    `;

                    if (!email_creator.has(row.email_creator)) {
                        email_creator.set(row.email_creator, [payloadEmail]);
                    } else {
                        email_creator.get(row.email_creator).push(payloadEmail);
                    }

                    if (!email_updater.has(row.email_updater)) {
                        email_updater.set(row.email_updater, [payloadEmail]);
                    } else {
                        email_updater.get(row.email_updater).push(payloadEmail);
                    }

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

            if (email_creator.size > 0) {
                await EmailModel.NotifyEmail(email_creator);
            }
            if (email_updater.size > 0) {
                await EmailModel.NotifyEmail(email_updater);
            }
            await psqlclient.query(TRANS.COMMIT);
            await oraclient.commit();
            return "SAP Data sync";
        } catch (error) {
            await psqlclient.query(TRANS.ROLLBACK);
            await oraclient.rollback();
            throw error;
        } finally {
            psqlclient.release();
            oraclient.close();
        }
    } catch (error) {
        console.error(error);
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
