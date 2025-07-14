const ora = require("oracledb");

let pool;

/**
 * @async
 * @return {import("oracledb").Pool}
 *
 */
async function initPool() {
    if (!pool) {
        pool = await ora.createPool({
            user: process.env.ORAUSER,
            password: process.env.ORAPWD,
            connectionString: process.env.ORAHOST,
        });
    }
    return pool;
}

/**
 *
 * @async
 * @function getConnection
 * @returns {import("oracledb").Connection}
 */

async function getConnection() {
    if (!pool) {
        await initPool();
    }
    return pool.getConnection();
}

/**
 * @template T
 * @param {(client: import("oracledb").Connection) => Promise<T>} callback
 * @returns {Promise<T>}
 */

const OraClientWrapper = async callback => {
    const client = await getConnection();
    try {
        return callback(client);
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { initPool, getConnection, ora, OraClientWrapper };
