const noderfc = require("node-rfc");
noderfc.setIniFileDirectory(process.env.SAPINIFILE);

const PoolRFC = new noderfc.Pool({ connectionParameters: { dest: "Q13" } });
module.exports = PoolRFC;
