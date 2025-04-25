const db = require("../config/connection");

/**
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
const DBClientWrapper = async callback => {
    try {
        const client = await db.connect();
        try {
            return await callback(client);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

module.exports = DBClientWrapper;
