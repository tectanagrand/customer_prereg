const TRANS = require("../config/transaction");
const DBClientWrapper = require("../helper/DBClientWrapper");
const Crud = require("./crudquery");
const TransactionLock = {
    setLock: async (trans_id, user_id) => {
        return await DBClientWrapper(async client => {
            try {
                //check if trans_id exist
                await client.query(TRANS.BEGIN);
                const { rowCount: is_trans_exist } = await client.query(
                    `select uid from transaction_lock where transaction_id = $1`,
                    [trans_id]
                );
                if (rowCount) {
                    throw new Error(
                        "Current transaction is in used, please try again later"
                    );
                }
                //insert transactionlock
                const [insque, insval] = Crud.insertItem(
                    "transaction_lock",
                    { user_id: user_id, transaction_id: trans_id },
                    "uid"
                );
                const { rows: result_uid } = await client.query(insque, insval);
                await client.query(TRANS.COMMIT);
                return result_uid[0];
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            }
        });
    },
    releaseLock: async trans_id => {
        return await DBClientWrapper(async client => {
            try {
                //delete transactionlock
                await client.query(TRANS.BEGIN);
                const { rows: result_uid } = await client.query(
                    `
                  delete from transaction_lock where transaction_id = $1 returning uid
                  `,
                    [trans_id]
                );
                if (!result_uid[0].uid) {
                    throw new Error(`Transaction lock not exist : ${trans_id}`);
                }
                await client.query(TRANS.COMMIT);
                return result_uid[0];
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            }
        });
    },
};

module.exports = TransactionLock;
