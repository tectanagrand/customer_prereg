const FileUploadModel = {};
const moment = require("moment");
const formidable = require("formidable");
const os = require("os");
const path = require("path");
const fs = require("fs");
const db = require("../config/connection");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");

FileUploadModel.uploadFile = async (req, pathtarget) => {
    try {
        //allowed extensions
        const extensions = ["jpg", "jpeg", "png", "pneg"];
        const form = new formidable.IncomingForm();
        form.options.maxFileSize = 3 * 1024 * 1024;
        [fields, items] = await form.parse(req);
        let files = items.file_atth[0];
        let fileName = files.originalFilename.split(".");
        if (!extensions.includes(fileName[fileName.length - 1].toLowerCase())) {
            throw new Error("File Format invalid");
        }
        let newName =
            "STNK " + fields.plate_num[0] + "." + fileName[fileName.length - 1];
        let oldPath = files.filepath;
        if (os.platform() === "win32") {
            newPath =
                path.join(path.resolve(), "public\\" + pathtarget) +
                "\\" +
                newName;
        } else {
            newPath =
                path.join(path.resolve(), "/public/" + pathtarget) +
                "/" +
                newName;
        }
        let rawData = fs.readFileSync(oldPath);
        await fs.promises.writeFile(newPath, rawData);
        return {
            plate_num: fields.plate_num[0],
            filename: newName,
            id_row: fields.id_row[0],
        };
    } catch (error) {
        throw error;
    }
};

FileUploadModel.uploadSIM = async (req, pathtarget) => {
    try {
        //allowed extensions
        const extensions = ["jpg", "jpeg", "png", "pneg"];
        const form = new formidable.IncomingForm();
        form.options.maxFileSize = 3 * 1024 * 1024;
        [fields, items] = await form.parse(req);
        console.log(items);
        let files = items.file_atth[0];
        let photo = items.foto_driver[0];
        let newPath, newPathphoto;
        let fileName = files.originalFilename.split(".");
        let photoName = photo.originalFilename.split(".");
        if (!extensions.includes(fileName[fileName.length - 1].toLowerCase())) {
            throw new Error("File Format invalid");
        }
        if (
            !extensions.includes(photoName[photoName.length - 1].toLowerCase())
        ) {
            throw new Error("File Format invalid");
        }
        let newName =
            "SIM " + fields.nomorsim[0] + "." + fileName[fileName.length - 1];
        let oldPath = files.filepath;
        let newPhotoName =
            "SIM " + fields.nama[0] + "." + fileName[fileName.length - 1];
        let oldPathPhotoName = photo.filepath;
        if (os.platform() === "win32") {
            newPath =
                path.join(path.resolve(), "public\\" + pathtarget) +
                "\\" +
                newName;
            newPathphoto =
                path.join(path.resolve(), "public\\" + pathtarget) +
                "\\" +
                newPhotoName;
        } else {
            newPath =
                path.join(path.resolve(), "/public/" + pathtarget) +
                "/" +
                newName;
            newPathphoto =
                path.join(path.resolve(), "/public/" + pathtarget) +
                "/" +
                newPhotoName;
        }
        let rawData = fs.readFileSync(oldPath);
        let rawPhotoData = fs.readFileSync(oldPathPhotoName);
        await fs.promises.writeFile(newPath, rawData);
        await fs.promises.writeFile(newPathphoto, rawPhotoData);
        return {
            nomorsim: fields.nomorsim[0].trim(),
            nama: fields.nama[0],
            no_telp: fields.no_telp[0].trim(),
            tempat_lahir: fields.tempat_lahir[0],
            tanggal_lahir: fields.tanggal_lahir[0],
            alamat: fields.alamat[0],
            filename: newName,
            photoname: newPhotoName,
            id_row: fields.id_row[0],
        };
    } catch (error) {
        throw error;
    }
};

FileUploadModel.submitSTNK = async (plate_num, stnk, id_row, id_session) => {
    try {
        const client = await db.connect();
        let que, val;
        let id = id_row;
        try {
            await client.query(TRANS.BEGIN);
            let payload = {
                vhcl_id: plate_num,
                foto_stnk: stnk,
                is_send: false,
                create_by: id_session,
            };
            if (id === "") {
                payload.uuid = uuid.uuid();
                [que, val] = crud.insertItem("mst_vehicle", payload, "id");
                const insertItem = await client.query(que, val);
            } else {
                [que, val] = crud.updateItem(
                    "mst_vehicle",
                    payload,
                    { uuid: id },
                    "id"
                );
                const updatetItem = await client.query(que, val);
            }
            await client.query(TRANS.COMMIT);
            return plate_num;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

FileUploadModel.submitSIM = async ({
    nomorsim,
    nama,
    no_telp,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    filename,
    photoname,
    id_row,
    id_session,
}) => {
    try {
        const client = await db.connect();
        let que, val;
        let id = id_row;
        try {
            await client.query(TRANS.BEGIN);
            let payload = {
                driver_id: nomorsim,
                driver_name: nama,
                alamat: alamat,
                tempat_lahir: tempat_lahir,
                tanggal_lahir: moment(tanggal_lahir).format("YYYY-MM-DD"),
                no_telp: no_telp,
                foto_sim: filename,
                foto_driver: photoname,
                create_by: id_session,
                is_send: false,
            };
            if (id === "") {
                payload.uuid = uuid.uuid();
                [que, val] = crud.insertItem("mst_driver", payload, "id");
                const insertItem = await client.query(que, val);
            } else {
                [que, val] = crud.updateItem(
                    "mst_driver",
                    payload,
                    { uuid: id },
                    "id"
                );
                const updatetItem = await client.query(que, val);
            }
            await client.query(TRANS.COMMIT);
            return nomorsim;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

module.exports = FileUploadModel;
