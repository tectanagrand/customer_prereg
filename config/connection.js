const { Pool } = require("pg");

const prodSettings = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    ssl: {
        rejectUnauthorized: false,
    },
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 60000,
    allowExitOnIdle: true,
};

const devSettings = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 30000,
    // ssl: {
    //     rejectUnauthorized: false,
    // },
    allowExitOnIdle: true,
};

const pool = new Pool(
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "sandbox"
        ? prodSettings
        : devSettings
);

module.exports = pool;
