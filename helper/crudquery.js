const Crud = {
    insertItem: (toTable, val, returning = null) => {
        let valFormat = [];
        let value = [];
        let insertCol = [];
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key);
            valFormat.push("$" + (ix + 1));
            value.push(val[key]);
        });
        // Object.values(val).forEach(v => {
        //     value.push(v);
        // });
        const qinsertCol = insertCol.join(", ");
        const qvalFormat = valFormat.join(", ");
        let query = `INSERT INTO ${toTable}(${qinsertCol}) values(${qvalFormat}) `;
        if (returning != null) {
            query += `RETURNING ${returning}`;
        } else {
            query += " ;";
        }

        return [query, value];
    },

    insertItemOra: (toTable, val) => {
        let valFormat = [];
        let value = [];
        let insertCol = [];
        let index = 1;
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key);
            valFormat.push(":" + index);
            value.push(val[key]);
            index++;
        });
        // Object.values(val).forEach(v => {
        //     value.push(v);
        // });
        const qinsertCol = insertCol.join(", ");
        const qvalFormat = valFormat.join(", ");
        let query = `INSERT INTO ${toTable}(${qinsertCol}) values(${qvalFormat}) `;

        return [query, value];
    },

    updateItem: (toTable, val, where, returning = null) => {
        let value = [];
        let insertCol = [];
        let whereCol = [];
        delete val[`${where.col}`];
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key + ` = $${ix + 1}`);
        });
        Object.values(val).forEach(v => {
            value.push(v);
        });
        Object.keys(where).forEach(key => {
            whereCol.push(key + `= '${where[key]}'`);
        });
        let whereScr = whereCol.join(" and ");
        const qinsertCol = insertCol.join(", ");
        let query = `UPDATE ${toTable} SET ${qinsertCol} WHERE ${whereScr}`;
        if (returning != null) {
            query += `RETURNING ${returning}`;
        } else {
            query += " ;";
        }
        return [query, value];
    },

    updateItemOra: (toTable, val, where) => {
        let value = [];
        let insertCol = [];
        let whereCol = [];
        delete val[`${where.col}`];
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key + ` = :${ix + 1}`);
        });
        Object.values(val).forEach(v => {
            value.push(v);
        });
        Object.keys(where).forEach(key => {
            whereCol.push(key + `= '${where[key]}'`);
        });
        let whereScr = whereCol.join(" and ");
        const qinsertCol = insertCol.join(", ");
        let query = `UPDATE ${toTable} SET ${qinsertCol} WHERE ${whereScr}`;
        return [query, value];
    },

    deleteItem: (fromTable, col, value) => {
        const q = `DELETE FROM ${fromTable} WHERE ${col} = '${value}'`;
        return q;
    },
};

module.exports = Crud;
