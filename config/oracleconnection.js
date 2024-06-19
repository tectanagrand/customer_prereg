const ora = require("oracledb");

const PoolOra = (async () =>
    await ora.createPool({
        user: process.env.ORAUSER,
        password: process.env.ORAPWD,
        connectionString: process.env.ORAHOST,
    }))();

module.exports = { PoolOra, ora };
