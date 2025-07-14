const moment = require("moment");
const TicketGen = {};

TicketGen.genApprovalDrvVhc = serial => {
    const today = moment().format("YYYY-MM-DD").split("-");
    const year = today[0].slice(-2);
    return (
        "REG-" + year + today[1] + today[2] + serial.toString().padStart(4, "0")
    );
};

TicketGen.GenTollingReq = (plant, lasttolreq) => {
    //format UUUUMMYYXXX
    // UUU => plantcode
    let running_num = 1;
    const max_num = 999;
    let month = moment().format("MM");
    let year = moment().format("YY");
    let U = plant;

    if (lasttolreq) {
        let curmth = lasttolreq.slice(4, 6);
        let curyr = lasttolreq.slice(6, 8);
        if (year === curyr) {
            if (month === curmth) {
                running_num = parseInt(lasttolreq.slice(-3)) + 1;
                if (running_num > max_num) {
                    running_num = 1;
                }
            }
        }
    }
    return U + month + year + running_num.toString().padStart(3, "0");
};

TicketGen.genLoadingNoteUPS = (plant, lastlnnum) => {
    //LCO/UUUUMMYYXXX
    // U : Plant code
    // MM : month
    // Y : year
    // X : running num
    //LCO/PS211124001
    // Last 3 digit is running number
    console.log(lastlnnum);
    let running_num = 1;
    const max_num = 999;
    let month = moment().format("MM");
    let year = moment().format("YY");
    console.log(month);
    console.log(year);
    let U = plant;
    if (lastlnnum) {
        let curyr = lastlnnum.slice(-5, -3);
        let curmth = lastlnnum.slice(-7, -5);
        console.log(curmth, curyr);
        if (year === curyr) {
            if (month === curmth) {
                running_num = parseInt(lastlnnum.slice(-3)) + 1;
                if (running_num > max_num) {
                    running_num = 1;
                }
            }
        }
    }
    return "PRG/" + U + month + year + running_num.toString().padStart(3, "0");
};

module.exports = TicketGen;
