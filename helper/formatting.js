const formatNumber = (number, uom) => {
    if (number) {
        return `${number?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${uom}`;
    } else {
        return "";
    }
};

const createInitial = user_name => {
    const splitted_uname = user_name
        .replace(/\b\w*PT\w*\b\.?\s*/gi, "")
        .trim()
        .split(" ");
    let initial = "";
    if (splitted_uname.length == 1) {
        initial = splitted_uname[0].slice(0, 3).toUpperCase();
    } else if (splitted_uname.length == 2) {
        initial =
            splitted_uname[0].slice(0, 2).toUpperCase() +
            splitted_uname[1].slice(0, 1).toUpperCase();
    } else {
        initial =
            splitted_uname[0].slice(0, 1).toUpperCase() +
            splitted_uname[1].slice(0, 1).toUpperCase() +
            splitted_uname[2].slice(0, 1).toUpperCase();
    }
    return initial;
};

module.exports = { formatNumber, createInitial };
