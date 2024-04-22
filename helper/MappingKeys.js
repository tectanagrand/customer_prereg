const MappingKeys = {};

MappingKeys.ToUpperKeys = object => {
    let itemTemp = {};
    Object.keys(object).map(item => {
        if (item !== "__metadata") {
            itemTemp[item.toUpperCase()] = object[item];
        }
    });
    return itemTemp;
};

module.exports = MappingKeys;
