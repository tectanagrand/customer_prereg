const moment = require("moment");
const TicketGen = {};

TicketGen.genApprovalDrvVhc = serial => {
    const today = moment().format("YYYY-MM-DD").split("-");
    const year = today[0].slice(-2);
    return (
        "REG-" + year + today[1] + today[2] + serial.toString().padStart(4, "0")
    );
};

TicketGen.genLoadingNoteUPS = (username, lastlnnum) => {
    // running number by id_user
    //all dummy ln using prefix P
    // U => last 4 digit of username (cust or interco cut last 3 digit first)
    //PUUUUMMYYYYXXXX
    //P20120820240001
    // Last 4 digit is running number
    let running_num = 1;
    const max_num = 9999;
    let month = moment().format("MM");
    let year = moment().format("YYYY");
    let U = username;
    if (U.slice(0, 2) == "LN") {
        U = U.slice(6, 10);
    } else {
        U = U.slice(3, 7);
    }
    if (lastlnnum) {
        let curmth = lastlnnum.slice(5, 7);
        let curyr = lastlnnum.slice(7, 11);
        if (year === curyr) {
            if (month === curmth) {
                running_num = parseInt(lastlnnum.slice(11, 15)) + 1;
                if (running_num > max_num) {
                    running_num = 1;
                }
            }
        }
    }
    return "P" + U + month + year + running_num.toString().padStart(4, "0");
};

module.exports = TicketGen;
