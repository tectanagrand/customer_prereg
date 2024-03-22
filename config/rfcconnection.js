const noderfc = require("node-rfc");
noderfc.setIniFileDirectory("../customer_prereg");

const PoolRFC = new noderfc.Pool({ connectionParameters: { dest: "Q13" } });
module.exports = PoolRFC;
