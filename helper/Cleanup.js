const db = require("../config/connection");
const cron = require("node-cron");
const TRANS = require("../config/transaction");

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

module.exports = CleanUp;
