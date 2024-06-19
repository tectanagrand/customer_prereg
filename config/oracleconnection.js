const ora = require("oracledb");

const PoolOra = (async () =>
    await ora.createPool({
        user: "SAPBRIDGE_S",
        password: "sacs123",
        connectionString: "172.22.3.94/SAPBRIDGE",
    }))();

module.exports = { PoolOra, ora };
