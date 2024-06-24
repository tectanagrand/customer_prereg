require("dotenv").config({ path: `.env.development` });

const psqlconn = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const EmailModel = require("../models/EmailModel");

const SAPGetterChores = {};

SAPGetterChores.LoadingNoteSync = async () => {
    let psqlclient;
    let oraclient;
    try {
        psqlclient = await psqlconn.connect();
        oraclient = await ora.getConnection();
        const email_creator = new Map();
        const email_updater = new Map();
        const email_wb = new Map();
        try {
            // get data db psql
            await psqlclient.query(TRANS.BEGIN);
            const { rows } = await psqlclient.query(
                `SELECT DET.DET_ID,
                EM_CR.EMAIL AS EMAIL_CREATOR,
                USR_CR.id_user AS ID_CREATOR,
                EM_UP.EMAIL AS EMAIL_UPDATER,
                USR_UP.id_user AS ID_UPDATER,
                EM_WB.EMAIL AS EMAIL_WB,
                HD.ID_DO,
                CUS.KUNNR,
                TO_CHAR(DET.CRE_DATE, 'DD-MM-YYYY') AS CRE_DATE,
                CUS.NAME_1,
                DET.DRIVER_ID,
                DET.DRIVER_NAME,
                DET.VHCL_ID,
                DET.PLAN_QTY,
                DET.FAC_SLOC,
                DET.FAC_SLOC_DESC,
                DET.FAC_VALTYPE,
                DET.OTH_SLOC,
                DET.OTH_SLOC_DESC,
                DET.OTH_VALTYPE,
                HD.UOM
              FROM LOADING_NOTE_DET DET
              LEFT JOIN MST_USER USR_CR ON DET.CREATE_BY = USR_CR.ID_USER
              LEFT JOIN MST_USER USR_UP ON DET.UPDATE_BY = USR_UP.ID_USER
              LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
			  LEFT JOIN (SELECT STRING_AGG(EM.EMAIL, ', ') AS EMAIL, US.id_user FROM MST_USER US
                LEFT JOIN MST_EMAIL EM ON EM.ID_USER = US.ID_USER
                GROUP BY US.id_user) EM_UP ON EM_UP.id_user = USR_UP.id_user
              LEFT JOIN (SELECT STRING_AGG(EM.EMAIL, ', ') AS EMAIL, US.id_user FROM MST_USER US
                LEFT JOIN MST_EMAIL EM ON EM.ID_USER = US.ID_USER
                GROUP BY US.id_user) EM_CR ON EM_CR.id_user = USR_CR.id_user
              LEFT JOIN (SELECT STRING_AGG(EM.EMAIL, ', ') AS EMAIL, RL.ROLE_NAME, US.PLANT_CODE FROM MST_USER US
                LEFT JOIN MST_EMAIL EM ON EM.ID_USER = US.ID_USER
                LEFT JOIN MST_ROLE RL ON RL.ROLE_ID = US.ROLE
                WHERE RL.ROLE_NAME = 'KRANIWB'
                GROUP BY RL.ROLE_NAME, US.PLANT_CODE) EM_WB ON EM_WB.plant_code = hd.plant
              LEFT JOIN MST_CUSTOMER CUS ON CUS.KUNNR = USR_CR.USERNAME
                WHERE LN_NUM IS NULL AND DET.IS_ACTIVE = TRUE`
            );

            for (const row of rows) {
                //check data db oracle
                let payload = {};
                let orapayload = {};
                const { metaData, rows } = await oraclient.execute(
                    `SELECT DET_ID, LOADING_NOTE_NUM, ERRORDESCRIPTION FROM PREREG_LOADING_NOTE_SAP 
                WHERE DET_ID = :0`,
                    [row.det_id]
                );
                // console.log(row.det_id);
                // console.log(rows);
                if (rows.length > 0) {
                    if (rows[0][1] === null && rows[0][2] !== null) {
                        if (
                            !(
                                rows[0][2].includes("processed by") ||
                                rows[0][2].includes("process by")
                            )
                        ) {
                            orapayload = {
                                FLAG_WEB_PULL: "T",
                                ISRETRIVEDBYSAP: "TRUE",
                            };
                            payload = {
                                error_msg:
                                    rows[0][2] + " , Please create new request",
                                is_active: false,
                            };
                        } else {
                            orapayload = {
                                FLAG_WEB_PULL: "T",
                            };
                            payload = {
                                error_msg: rows[0][2] + "",
                            };
                        }
                    } else if (rows[0][1] !== null) {
                        payload = {
                            ln_num: rows[0][1],
                            error_msg: "",
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
                      ${row.kunnr + " - " + row.name_1}
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
                      ${row.fac_sloc + " - " + row.fac_sloc_desc}
                      </td>
                      <td>
                      ${row.fac_valtype}
                      </td>
                      <td>
                      ${row.oth_sloc + " - " + row.oth_sloc_desc}
                      </td>
                      <td>
                      ${row.oth_valtype}
                      </td>
                      <td>
                      ${rows[0][1] !== null ? rows[0][1] : ""}
                      </td>
                      <td>
                      ${rows[0][2] !== null ? rows[0][2] : ""}
                      </td>
                    </tr>
                    `;
                    if (row.email_creator !== null) {
                        if (!email_creator.has(row.email_creator)) {
                            email_creator.set(row.email_creator, [
                                payloadEmail,
                            ]);
                        } else {
                            email_creator
                                .get(row.email_creator)
                                .push(payloadEmail);
                        }
                    }

                    if (row.email_updater !== null) {
                        if (!email_updater.has(row.email_updater)) {
                            email_updater.set(row.email_updater, [
                                payloadEmail,
                            ]);
                        } else {
                            email_updater
                                .get(row.email_updater)
                                .push(payloadEmail);
                        }
                    }

                    if (row.email_wb !== null) {
                        if (!email_wb.has(row.email_wb)) {
                            email_wb.set(row.email_wb, [payloadEmail]);
                        } else {
                            email_wb.get(row.email_wb).push(payloadEmail);
                        }
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
            if (email_wb.size > 0) {
                await EmailModel.NotifyEmail(email_wb);
            }
            await psqlclient.query(TRANS.COMMIT);
            await oraclient.commit();
            return "SAP Synced";
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
        if (psqlclient) {
            psqlclient.release();
        }
        if (oraclient) {
            oraclient.release();
        }
        throw error;
    }
};

module.exports = SAPGetterChores;

// setInterval(async () => {
//     try {
//         const result = await SAPGetterChores.LoadingNoteSync();
//     } catch (error) {
//         console.log(error);
//     }
// }, 60 * 1000);
