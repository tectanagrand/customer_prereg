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
const TicketGen = require("../helper/TicketGen");

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
        // console.log(items);
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

FileUploadModel.newReqDrvVeh = async (driverData, vehData, id_user) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            let id_req = uuid.uuid();
            let today = moment();
            let driverHTML = [];
            let driverAtth = [];
            let vehHTML = [];
            let vehAtth = [];
            let { rows: latSerial } = await client.query(
                `select last_value from req_drvr_vhcl_id_seq`
            );
            let ticketNum = TicketGen.genApprovalDrvVhc(
                parseInt(latSerial[0].last_value) + 1
            );

            let insertData = {
                uuid: id_req,
                request_id: ticketNum,
                position: "LOG",
                create_by: id_user,
                create_at: today.format(),
                expired_at: today.add(3, "days").format(),
            };
            const [queIns, valIns] = crud.insertItem(
                "req_drvr_vhcl",
                insertData,
                "request_id"
            );
            await client.query(queIns, valIns);
            if (driverData.length > 0) {
                for (const d of driverData) {
                    let idDriver = d.id;
                    const [que, val] = crud.updateItem(
                        "mst_driver",
                        { is_send: true, req_uuid: id_req },
                        { uuid: idDriver },
                        "driver_id"
                    );
                    await client.query(que, val);
                    driverHTML.push(`
                        <tr>
                            <td>${d.driver_id}</td>
                            <td>${d.driver_name}</td>
                            <td>${d.tempat_lahir}</td>
                            <td>${d.tanggal_lahir}</td>
                            <td>${d.no_telp}</td>
                            <td>${d.alamat}</td>
                        </tr>
                        `);
                    let pathStream = "";
                    if (os.platform() === "win32") {
                        pathStream =
                            path.join(path.resolve(), "public\\license") +
                            "\\" +
                            d.foto_sim;
                    } else {
                        pathStream =
                            path.join(path.resolve(), "public/license") +
                            "/" +
                            d.foto_sim;
                    }
                    driverAtth.push({
                        filename: d.foto_sim,
                        content: fs.createReadStream(pathStream),
                    });
                }
            }
            if (vehData.length > 0) {
                for (const v of vehData) {
                    let idVeh = v.id;
                    const [que, val] = crud.updateItem(
                        "mst_vehicle",
                        { is_send: true, req_uuid: id_req },
                        { uuid: idVeh },
                        "vhcl_id"
                    );
                    await client.query(que, val);
                    vehHTML.push(`
                        <tr>
                            <td>${v.vhcl_id}</td>
                        </tr>
                        `);
                    let pathStream = "";
                    if (os.platform() === "win32") {
                        pathStream =
                            path.join(path.resolve(), "public\\stnk") +
                            "\\" +
                            v.foto_stnk;
                    } else {
                        pathStream =
                            path.join(path.resolve(), "public/stnk") +
                            "/" +
                            v.foto_stnk;
                    }
                    vehAtth.push({
                        filename: v.foto_stnk,
                        content: fs.createReadStream(pathStream),
                    });
                }
            }
            await client.query(TRANS.COMMIT);
            return {
                ticketNum: ticketNum,
                driverAtth: driverAtth,
                driverHTML: driverHTML,
                vehHTML: vehHTML,
                vehAtth: vehAtth,
                ticket_id: id_req,
            };
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

FileUploadModel.processDrvVeh = async ({
    id,
    driverData,
    vehData,
    id_user,
    action,
    reject_remark,
    plant,
}) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            let id_req = id;
            let today = moment();
            let notDriver = [];
            let notVeh = [];

            //check position
            const { rows: dataReq } = await client.query(
                "select position from req_drvr_vhcl where uuid = $1",
                [id_req]
            );
            if (
                dataReq[0].position === "REJ" ||
                dataReq[0].position === "ADM"
            ) {
                throw new Error("Request already processed");
            }

            if (action === "REJECT") {
                let updateData = {
                    position: "REJ",
                    is_active: false,
                    update_at: moment().format(),
                    update_by: id_user,
                    remark_reject: reject_remark,
                };
                const [queRej, valRej] = crud.updateItem(
                    "req_drvr_vhcl",
                    updateData,
                    {
                        uuid: id_req,
                    },
                    "create_by, request_id"
                );

                const [queDeact, valDeact] = crud.updateItem(
                    "mst_driver",
                    {
                        is_active: false,
                    },
                    {
                        req_uuid: id_req,
                    },
                    "uuid"
                );
                const [queDeactV, valDeactV] = crud.updateItem(
                    "mst_vehicle",
                    {
                        is_active: false,
                    },
                    {
                        req_uuid: id_req,
                    },
                    "uuid"
                );
                const { rows: rejectDriver } = await client.query(
                    queDeact,
                    valDeact
                );
                if (rejectDriver.length > 0) {
                    const { rows: getNoDriver } = await client.query(`select
                        md.uuid as id,
                        md.driver_name,
                        md.driver_id,
                        mc.city as tempat_lahir,
                        md.tanggal_lahir ,
                        md.no_telp ,
                        md.alamat
                        from
                        mst_driver md
                        left join mst_cities mc on md.tempat_lahir = mc.code 
                        where md.uuid in (${rejectDriver.map(item => `'${item.uuid}'`).join(",")})`);

                    for (const d of getNoDriver) {
                        notDriver.push(`
                                        <tr>
                                            <td>${d.driver_id}</td>
                                            <td>${d.driver_name}</td>
                                            <td>${d.tempat_lahir}</td>
                                            <td>${d.tanggal_lahir}</td>
                                            <td>${d.no_telp}</td>
                                            <td>${d.alamat}</td>
                                        </tr>
                                        `);
                    }
                }

                const { rows: rejectVehicle } = await client.query(
                    queDeactV,
                    valDeactV
                );
                if (rejectVehicle.length > 0) {
                    const { rows: getNoVeh } = await client.query(`select
                        vhcl_id ,
                        uuid as id
                    from
                        mst_vehicle mv
                    where
                        uuid in (${rejectVehicle.map(item => `'${item.uuid}'`).join(",")})
                    `);
                    for (const v of getNoVeh) {
                        notVeh.push(`
                                <tr>
                                    <td>${v.vhcl_id}</td>
                                </tr>
                                `);
                    }
                }
                const { rows: setReject } = await client.query(queRej, valRej);
                await client.query(TRANS.COMMIT);
                return {
                    ticket_num: setReject[0].request_id,
                    create_by: setReject[0].create_by,
                    nodriver: notDriver.join(""),
                    noveh: notVeh.join(""),
                };
            } else if (action === "APPROVE") {
                let updateData = {
                    position: "ADM",
                    update_at: moment().format(),
                    update_by: id_user,
                    plant: plant,
                    remark_reject: reject_remark,
                };
                const [queRej, valRej] = crud.updateItem(
                    "req_drvr_vhcl",
                    updateData,
                    {
                        uuid: id_req,
                    },
                    "create_by, request_id"
                );
                const { rows: getCreateBy } = await client.query(
                    queRej,
                    valRej
                );
                let driverHTML = [];
                let driverAtth = [];
                let vehHTML = [];
                let vehAtth = [];
                let notDriver = [];
                let notVeh = [];
                let idDriver = [];
                let idVeh = [];
                let notDriverData = [];
                let notVehData = [];
                if (driverData.length > 0) {
                    for (const d of driverData) {
                        idDriver.push(`'${d.id}'`);
                        driverHTML.push(`
                            <tr>
                                <td>${d.driver_id}</td>
                                <td>${d.driver_name}</td>
                                <td>${d.tempat_lahir}</td>
                                <td>${d.tanggal_lahir}</td>
                                <td>${d.no_telp}</td>
                                <td>${d.alamat}</td>
                            </tr>
                            `);
                        let pathStream = "";
                        if (os.platform() === "win32") {
                            pathStream =
                                path.join(path.resolve(), "public\\license") +
                                "\\" +
                                d.foto_sim;
                        } else {
                            pathStream =
                                path.join(path.resolve(), "public/license") +
                                "/" +
                                d.foto_sim;
                        }
                        driverAtth.push({
                            filename: d.foto_sim,
                            content: fs.createReadStream(pathStream),
                        });
                    }
                    const { rows: getNoDriver } = await client.query(`select
                    md.uuid as id,
                    md.driver_name,
                    md.driver_id,
                    mc.city as tempat_lahir,
                    md.tanggal_lahir ,
                    md.no_telp ,
                    md.alamat
                    from
                    mst_driver md
                    left join mst_cities mc on md.tempat_lahir = mc.code 
                    where md.req_uuid = '${id_req}' 
                    and md.uuid not in (${idDriver.join(",")})`);
                    notDriverData = getNoDriver;
                }

                if (notDriverData.length > 0) {
                    for (const d of notDriverData) {
                        let idDriver = d.id;
                        const [que, val] = crud.updateItem(
                            "mst_driver",
                            { is_active: false },
                            { uuid: idDriver },
                            "driver_id"
                        );
                        await client.query(que, val);
                        notDriver.push(`
                            <tr>
                                <td>${d.driver_id}</td>
                                <td>${d.driver_name}</td>
                                <td>${d.tempat_lahir}</td>
                                <td>${d.tanggal_lahir}</td>
                                <td>${d.no_telp}</td>
                                <td>${d.alamat}</td>
                            </tr>
                            `);
                    }
                }
                if (vehData.length > 0) {
                    for (const v of vehData) {
                        idVeh.push(`'${v.id}'`);
                        vehHTML.push(`
                            <tr>
                                <td>${v.vhcl_id}</td>
                            </tr>
                            `);
                        let pathStream = "";
                        if (os.platform() === "win32") {
                            pathStream =
                                path.join(path.resolve(), "public\\stnk") +
                                "\\" +
                                v.foto_stnk;
                        } else {
                            pathStream =
                                path.join(path.resolve(), "public/stnk") +
                                "/" +
                                v.foto_stnk;
                        }
                        vehAtth.push({
                            filename: v.foto_stnk,
                            content: fs.createReadStream(pathStream),
                        });
                    }
                    const { rows: getNoVeh } = await client.query(`select
                        vhcl_id ,
                        uuid as id
                    from
                        mst_vehicle mv
                    where
                        req_uuid = '${id_req}'
                        and uuid not in (${idVeh.join(",")})
                    `);
                    notVehData = getNoVeh;
                }
                if (notVehData.length > 0) {
                    for (const v of notVehData) {
                        let idVeh = v.id;
                        const [que, val] = crud.updateItem(
                            "mst_vehicle",
                            { is_active: false },
                            { uuid: idVeh },
                            "vhcl_id"
                        );
                        await client.query(que, val);
                        notVeh.push(`
                            <tr>
                                <td>${v.vhcl_id}</td>
                            </tr>
                            `);
                    }
                }
                await client.query(TRANS.COMMIT);
                return {
                    create_by: getCreateBy[0].create_by,
                    ticketNum: getCreateBy[0].request_id,
                    driverAtth: driverAtth,
                    driverHTML: driverHTML,
                    vehHTML: vehHTML,
                    vehAtth: vehAtth,
                    notDriver: notDriver,
                    notVeh: notVeh,
                };
            }
            await client.query(TRANS.COMMIT);
            return false;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

FileUploadModel.CreatedKrani = async ({ req_uuid }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows: dataReq } = await client.query(
                "select position from req_drvr_vhcl where uuid = $1",
                [req_uuid]
            );
            if (dataReq[0].position === "SUC") {
                throw new Error("Request already processed");
            }
            let driver = [];
            let vehicle = [];
            //change position
            let updateData = {
                position: "SUC",
                is_active: false,
            };
            const [queSuc, valSuc] = crud.updateItem(
                "req_drvr_vhcl",
                updateData,
                { uuid: req_uuid },
                "create_by, request_id"
            );
            const { rows: dataTicket } = await client.query(queSuc, valSuc);
            const { rows: getVeh } = await client.query(
                `select
                vhcl_id ,
                uuid as id
            from
                mst_vehicle mv
            where req_uuid = $1 and is_active = true
            `,
                [req_uuid]
            );
            if (getVeh.length > 0) {
                for (const v of getVeh) {
                    vehicle.push(`
                        <tr>
                            <td>${v.vhcl_id}</td>
                        </tr>
                        `);
                }
            }
            const { rows: dataDrv } = await client.query(
                `select
                    md.uuid as id,
                    md.driver_name,
                    md.driver_id,
                    mc.city as tempat_lahir,
                    md.tanggal_lahir ,
                    md.no_telp ,
                    md.alamat
                    from
                    mst_driver md
                    left join mst_cities mc on md.tempat_lahir = mc.code  
                    where req_uuid = $1 and is_active = true`,
                [req_uuid]
            );
            if (dataDrv.length > 0) {
                for (const d of dataDrv) {
                    driver.push(`
                            <tr>
                                <td>${d.driver_id}</td>
                                <td>${d.driver_name}</td>
                                <td>${d.tempat_lahir}</td>
                                <td>${moment(d.tanggal_lahir).format("DD-MM-YYYY")}</td>
                                <td>${d.no_telp}</td>
                                <td>${d.alamat}</td>
                            </tr>
                            `);
                }
            }
            await client.query(TRANS.COMMIT);
            return {
                create_by: dataTicket[0].create_by,
                ticket_num: dataTicket[0].request_id,
                driver: driver.join(""),
                vehicle: vehicle.join(""),
            };
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
