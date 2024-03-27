const { PoolOra, ora } = require("../config/oracleconnection");

const TestOraController = {};

TestOraController.getSample = async (req, res) => {
    try {
        const oraclient = await ora.getConnection();
        try {
            const dataTruck = await oraclient.execute(
                `SELECT * FROM TRUCK FETCH FIRST 100 ROWS ONLY`
            );
            res.status(200).send(dataTruck);
        } catch (error) {
            throw error;
        } finally {
            oraclient.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

TestOraController.insertData = async (req, res) => {
    try {
        const oraclient = await ora.getConnection();
        try {
            const insertData = await oraclient.execute(
                `INSERT INTO LOADING_NOTE(COMPANY, DET_ID, HEADER_ID) VALUES(:a, :b, :c)`,
                ["PS", "2", "3"]
            );
            throw new Error("rollback please");
            await oraclient.commit();
            res.status(200).send(insertData);
        } catch (error) {
            await oraclient.rollback();
            throw error;
        } finally {
            oraclient.release();
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
        console.log(error);
    }
};

module.exports = TestOraController;
