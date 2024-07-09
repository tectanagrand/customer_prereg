const sqls = require("mssql");

const Pool = {};

//example config
/* 
const config = {
  user: 'your_username',
  password: 'your_password',
  server: 'your_server',
  database: 'your_database',
  options: {
    encrypt: true, // Use encryption
    enableArithAbort: true // Recommended by Microsoft
  }
};
*/

Pool.newPool = config => {
    const conf = {
        ...config,
        options: {
            encrypt: true, // Use encryption
            trustServerCertificate: true, // Disable SSL/TLS certificate verification
            enableArithAbort: true, // Recommended by Microsoft
        },
    };
    return new sqls.ConnectionPool(conf);
};

module.exports = { Pool, sqls };
