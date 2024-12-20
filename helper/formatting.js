const formatNumber = (number, uom) => {
    if (number) {
        return `${number?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${uom}`;
    } else {
        return "";
    }
};

module.exports = { formatNumber };
