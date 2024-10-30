const ora = require("oracledb");

let pool;

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

async function getConnection() {
    if (!pool) {
        await initPool();
    }
    return pool.getConnection();
}

module.exports = { initPool, getConnection, ora };
