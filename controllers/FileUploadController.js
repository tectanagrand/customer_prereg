const formidable = require("formidable");
const FileUploadModel = require("../models/FileUploadModel");
const db = require("../config/connection");
const fs = require("fs");
const os = require("os");
const path = require("path");
const FileUploadController = {};
const TRANS = require("../config/transaction");

FileUploadController.uploadSTNK = async (req, res) => {
    try {
        const { plate_num, filename, id_row } =
            await FileUploadModel.uploadFile(req, "stnk");
        const nump = await FileUploadModel.submitSTNK(
            plate_num,
            filename,
            id_row
        );
        res.status(200).send({
            message: nump + " is Uploaded",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.uploadSIM = async (req, res) => {
    try {
        const dataUp = await FileUploadModel.uploadSIM(req, "license");
        const nump = await FileUploadModel.submitSIM(dataUp);
        res.status(200).send({
            message: nump + " is Uploaded",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.getFileSTNK = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, vhcl_id, foto_stnk FROM mst_vehicle WHERE uuid = $1",
                [id_row]
            );
            const file_name = rows[0].foto_stnk;
            let new_path = "";
            if (os.platform() === "win32") {
                new_path =
                    path.join(path.resolve(), "public\\" + "stnk") +
                    "\\" +
                    file_name;
            } else {
                new_path =
                    path.join(path.resolve(), "/public" + "stnk") +
                    "/" +
                    file_name;
            }
            const fileStream = fs.createReadStream(new_path);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file_name}"`
            );
            fileStream.pipe(res);
            res.status(200);
            fileStream.on("end", () => {
                res.end(); // End the response stream
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.getFileSIM = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, foto_sim FROM mst_driver WHERE uuid = $1",
                [id_row]
            );
            const file_name = rows[0].foto_sim;
            let new_path = "";
            if (os.platform() === "win32") {
                new_path =
                    path.join(path.resolve(), "public\\" + "license") +
                    "\\" +
                    file_name;
            } else {
                new_path =
                    path.join(path.resolve(), "/public" + "license") +
                    "/" +
                    file_name;
            }
            const fileStream = fs.createReadStream(new_path);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file_name}"`
            );
            fileStream.pipe(res);
            res.status(200);
            fileStream.on("end", () => {
                res.end(); // End the response stream
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.getDataSTNK = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                "SELECT uuid, vhcl_id, foto_stnk FROM mst_vehicle WHERE uuid = $1",
                [id_row]
            );
            res.status(200).send({
                vhcl_id: rows[0].vhcl_id,
                foto_stnk: rows[0].foto_stnk,
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.getDataSIM = async (req, res) => {
    try {
        const id_row = req.query.id;
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `SELECT uuid as id, driver_id, driver_name, alamat, tempat_lahir, ct.city, tanggal_lahir,
                no_telp, foto_sim, is_send
                 FROM mst_driver drv
                 LEFT JOIN mst_cities ct ON drv.tempat_lahir = ct.code 
                 WHERE uuid = $1`,
                [id_row]
            );

            res.status(200).send({
                ...rows[0],
            });
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.deleteDataSTNK = async (req, res) => {
    try {
        console.log(req.body);
        const id_row = req.body.id;
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                "DELETE FROM MST_VEHICLE WHERE uuid = $1 RETURNING foto_stnk, vhcl_id",
                [id_row]
            );
            const file_name = rows[0].foto_stnk;
            if (os.platform() == "linux") {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public/stnk") + "/" + file_name
                );
            } else {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public\\stnk") + "\\" + file_name
                );
            }
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: rows[0].vhcl_id + " Data Deleted",
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

FileUploadController.deleteDataSIM = async (req, res) => {
    try {
        // console.log(req.body);
        const id_row = req.body.id;
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                "DELETE FROM MST_DRIVER WHERE uuid = $1 RETURNING foto_sim, driver_id",
                [id_row]
            );
            const file_name = rows[0].foto_sim;
            if (os.platform() == "linux") {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public/license") +
                        "/" +
                        file_name
                );
            } else {
                await fs.promises.unlink(
                    path.join(path.resolve(), "public\\license") +
                        "\\" +
                        file_name
                );
            }
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: rows[0].driver_id + " Data Deleted",
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = FileUploadController;
