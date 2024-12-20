require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const psqlconn = require("../config/connection");
const { getConnection } = require("../config/oracleconnectionv2");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const EmailModel = require("../models/EmailModel");
const moment = require("moment");

const SAPGetterChores = {};

SAPGetterChores.LoadingNoteSync = async () => {
    let psqlclient;
    let oraclient;
    try {
        console.log(
            "syncing ln_staging " + moment().format("YYYY-MM-DD T HH:mm:ss")
        );
        psqlclient = await psqlconn.connect();
        oraclient = await getConnection();
        const email_creator = new Map();
        const email_updater = new Map();
        const email_wb = new Map();
        try {
            // get data db psql
            const { rows } = await psqlclient.query(
                `SELECT DET.DET_ID,
                EM_CR.EMAIL AS EMAIL_CREATOR,
                USR_CR.id_user AS ID_CREATOR,
                EM_UP.EMAIL AS EMAIL_UPDATER,
                USR_UP.id_user AS ID_UPDATER,
                EM_WB.EMAIL AS EMAIL_WB,
                HD.ID_DO,
                mbc.KUNNR,
                TO_CHAR(DET.tanggal_surat_jalan , 'DD-MM-YYYY') AS CRE_DATE,
                mbc.NAME as name_1,
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
              LEFT JOIN master_bp_code mbc  ON mbc.KUNNR = USR_CR.USERNAME
                WHERE LN_NUM IS NULL AND DET.IS_ACTIVE = true and push_sap_date is not null
                union all
                SELECT DET.DET_ID,
                                EM_CR.EMAIL AS EMAIL_CREATOR,
                                USR_CR.id_user AS ID_CREATOR,
                                EM_UP.EMAIL AS EMAIL_UPDATER,
                                USR_UP.id_user AS ID_UPDATER,
                                EM_WB.EMAIL AS EMAIL_WB,
                                DET.ID_DO,
                                mbc.KUNNR,
                                TO_CHAR(HD.tanggal_surat_jalan, 'DD-MM-YYYY') AS CRE_DATE,
                                mbc.NAME as name_1,
                                HD.DRIVER_ID,
                                HD.DRIVER_NAME,
                                HD.VEHICLE_ID,
                                DET.PLANNED_QTY,
                                DET.FAC_SLOC,
                                ms_fac.description as FAC_SLOC_DESC,
                                DET.FAC_VALTYPE,
                                DET.OTH_SLOC,
                                ms_oth.description as OTH_SLOC_DESC,
                                DET.OTH_VALTYPE,
                                DET.UOM
                            FROM multi_ln_det DET
                            LEFT JOIN MST_USER USR_CR ON DET.CREATE_BY = USR_CR.ID_USER
                            LEFT JOIN MST_USER USR_UP ON DET.UPDATE_BY = USR_UP.ID_USER
                            LEFT JOIN multi_ln_hd HD ON DET.HD_ID = HD.HD_ID
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
                                GROUP BY RL.ROLE_NAME, US.PLANT_CODE) EM_WB ON EM_WB.plant_code = det.plant
                            LEFT JOIN master_bp_code mbc  ON mbc.KUNNR = USR_CR.USERNAME
                            left join mst_sloc ms_fac on ms_fac.sloc = det.fac_sloc
                            left join mst_sloc ms_oth on ms_oth.sloc = det.oth_sloc
                                WHERE LN_NUM IS NULL AND DET.IS_ACTIVE = true and push_sap_date is not null`
            );

            if (rows.length > 0) {
                await psqlclient.query(TRANS.BEGIN);

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
                                        rows[0][2] +
                                        " , Please create new request",
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
                        } else {
                            continue;
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
                        let queW, valW;
                        // console.log(id_db);
                        if (row.is_multi == 0) {
                            [queW, valW] = crud.updateItem(
                                "loading_note_det",
                                payload,
                                { det_id: id_db },
                                "det_id"
                            );
                        } else {
                            [queW, valW] = crud.updateItem(
                                "multi_ln_det",
                                payload,
                                { det_id: id_db },
                                "det_id"
                            );
                        }
                        // console.log(queW);
                        const [queO, valO] = crud.updateItemOra(
                            "PREREG_LOADING_NOTE_SAP",
                            orapayload,
                            { DET_ID: id_db }
                        );
                        const updateData = await psqlclient.query(queW, valW);
                        const upDataSAP = await oraclient.execute(queO, valO);
                        console.log(
                            `Loading Note Staging Pulled : ${rows[0][1]} ${moment().format("YYYY-MM-DD T HH:mm:ss")}`
                        );
                    } else {
                        continue;
                    }
                }
                try {
                    if (email_creator.size > 0) {
                        await EmailModel.NotifyEmail(email_creator);
                    }
                    if (email_updater.size > 0) {
                        await EmailModel.NotifyEmail(email_updater);
                    }
                    if (email_wb.size > 0) {
                        await EmailModel.NotifyEmail(email_wb);
                    }
                } catch (emailError) {
                    console.error("Error sending emails:", emailError);
                }
                await psqlclient.query(TRANS.COMMIT);
                await oraclient.commit();
                return "SAP Synced";
            } else {
                // console.log("no stage to be sync");
                return "no stage to be sync";
            }
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
            oraclient.close();
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
