const db = require("../config/connection");
const cron = require("node-cron");
const TRANS = require("../config/transaction");
const EmailModel = require("../models/EmailModel");

const CleanUp = {};

CleanUp.loadingNoteClean = async () => {
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(`select
      cre_date,
      tanggal_surat_jalan,
      coalesce(tanggal_surat_jalan, cre_date) + interval '7' day as expired_date,
      det_id,
      ln_num,
      is_active
    from
      loading_note_det
    where
      ln_num is null
      and is_active = true
      and current_date > (coalesce(tanggal_surat_jalan, cre_date) + interval '7' day) `);
            await client.query(TRANS.BEGIN);
            for (const row of rows) {
                await client.query(
                    `update loading_note_det set is_active = false where det_id = $1 `,
                    [row.det_id]
                );
            }
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
    }
};

CleanUp.CronLNClean = async () => {
    try {
        cron.schedule("0 0 * * *", CleanUp.loadingNoteClean);
    } catch (error) {
        console.error();
    }
};

CleanUp.reminder = async () => {
    try {
        const client = await db.connect();
        try {
            const { rows: users_row } =
                await client.query(`select distinct create_by, em.email from loading_note_det lnd 
            left join (
                select string_agg(email, ',') as email , id_user from mst_email group by id_user
            ) em on lnd.create_by = em.id_user
            where TO_CHAR(lnd.tanggal_surat_jalan + interval '1' day, 'YYYY-MM-DD') = TO_CHAR(now(), 'YYYY-MM-DD') 
            and lnd.ln_num is not null`);
            if (users_row.length > 0) {
                const users_os = new Map();
                for (const d of users_row) {
                    users_os.set(d.create_by, d.email);
                }
                for (const [id_user, email] of users_os) {
                    // console.log(id_user);
                    const rowLN = [];
                    const { rows: dataLoadingNote } = await client.query(
                        `select
        ln_num,
        tanggal_surat_jalan,
        vhcl_id,
        driver_id,
        driver_name,
        plan_qty,
        lnh.uom
    from
        loading_note_det lnd
    left join loading_note_hd lnh on
        lnh.hd_id = lnd.hd_fk
    where
        lnd.create_by = $1 and TO_CHAR(lnd.tanggal_surat_jalan + interval '1' day, 'YYYY-MM-DD') = TO_CHAR(now(), 'YYYY-MM-DD')`,
                        [id_user]
                    );
                    for (const x of dataLoadingNote) {
                        rowLN.push(`
                            <tr>
                             <td>${x.ln_num}</td>
                             <td>${x.tanggal_surat_jalan}</td>
                             <td>${x.driver_id} - ${x.driver_name}</td>
                             <td>${x.vhcl_id}</td>
                             <td>${x.plan_qty.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${x.uom}</td>
                            </tr>
                            `);
                    }
                    // console.log(rowLN);
                    await EmailModel.ReminderDeadlinesLN(email, rowLN.join(""));
                }
                console.log("Success remind email");
            }
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
    }
};

CleanUp.CronLNReminder = async () => {
    try {
        cron.schedule("0 7 * * *", CleanUp.reminder);
    } catch (error) {
        console.error();
    }
};

module.exports = CleanUp;
