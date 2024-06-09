const moment = require("moment");
const TicketGen = {};

TicketGen.genApprovalDrvVhc = serial => {
    const today = moment().format("YYYY-MM-DD").split("-");
    const year = today[0].slice(-2);
    return (
        "REG-" + year + today[1] + today[2] + serial.toString().padStart(4, "0")
    );
};

module.exports = TicketGen;
