const FileUploadModel = {};
const moment = require("moment");
const formidable = require("formidable");
const os = require("os");
const path = require("path");
const fs = require("fs");
const db = require("../config/connection");
const { PoolOra, ora } = require("../config/oracleconnection");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const TicketGen = require("../helper/TicketGen");
const { Pool, sqls } = require("../config/sqlservconn");
const ncrypt = require("ncrypt-js");
const axios = require("axios");

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
                path.join(path.resolve(), "public/" + pathtarget) +
                "/" +
                newName;
        }
        let rawData = fs.readFileSync(oldPath);
        await fs.promises.writeFile(newPath, rawData);
        return {
            plate_num: fields.plate_num[0],
            plant: fields.plant[0],
            // transportir: fields.transportir[0],
            // tp_name: fields.tp_name[0],
            // plant_name: fields.plant_name[0],
            filename: newName,
            id_row: fields.id_row[0],
        };
    } catch (error) {
        throw error;
    }
};

FileUploadModel.uploadSIM = async (req, pathtarget) => {
    try {
        const oraclient = await ora.getConnection();
        try {
            //allowed extensions
            const extensions = ["jpg", "jpeg", "png", "pneg"];
            const form = new formidable.IncomingForm();
            form.options.maxFileSize = 3 * 1024 * 1024;
            [fields, items] = await form.parse(req);
            //check if iddriver is exist
            const iddriver = fields.nomorsim[0].trim();
            const { metaData, rows } = await oraclient.execute(
                `SELECT LICENSENO FROM DRIVER 
            WHERE LICENSENO = :0`,
                [iddriver]
            );
            const { data } = await axios.get(
                `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZGW_REGISTRA_SRV/SIMSet?$filter=(Snosim%20eq%20%27${iddriver}%27)&$format=json`,
                {
                    auth: {
                        username: process.env.UNAMESAP,
                        password: process.env.PWDSAP,
                    },
                }
            );
            if (data.d.results.length > 0 || rows.length > 0) {
                throw new Error("Driver already exist");
            }
            // console.log(items);
            let files = items.file_atth[0];
            let photo = items.foto_driver[0];
            let newPath, newPathphoto;
            let fileName = files.originalFilename.split(".");
            let photoName = photo.originalFilename.split(".");
            if (
                !extensions.includes(
                    fileName[fileName.length - 1].toLowerCase()
                )
            ) {
                throw new Error("File Format invalid");
            }
            if (
                !extensions.includes(
                    photoName[photoName.length - 1].toLowerCase()
                )
            ) {
                throw new Error("File Format invalid");
            }
            let newName =
                "SIM " +
                fields.nomorsim[0] +
                "." +
                fileName[fileName.length - 1];
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
                    path.join(path.resolve(), "public/" + pathtarget) +
                    "/" +
                    newName;
                newPathphoto =
                    path.join(path.resolve(), "public/" + pathtarget) +
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
                alamat2: fields.alamat2[0],
                alamat3: fields.alamat3[0],
                kota_tinggal: fields.kota_tinggal[0],
                plant: fields.plant[0],
                filename: newName,
                photoname: newPhotoName,
                id_row: fields.id_row[0],
            };
        } catch (error) {
            throw error;
        } finally {
            oraclient.release();
        }
    } catch (error) {
        throw error;
    }
};

FileUploadModel.submitSTNK = async (
    plate_num,
    plant,
    // transportir,
    // tp_name,
    // plant_name,
    stnk,
    id_row,
    id_session
) => {
    try {
        const client = await db.connect();
        let que, val;
        let id = id_row;
        try {
            await client.query(TRANS.BEGIN);
            let payload = {
                vhcl_id: plate_num,
                foto_stnk: stnk,
                plant: plant,
                // transportir: transportir,
                // tp_name: tp_name,
                // plant_name: plant_name,
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
    alamat2,
    alamat3,
    kota_tinggal,
    filename,
    photoname,
    plant,
    // plant_name,
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
                alamat2: alamat2,
                alamat3: alamat3,
                kota_tinggal: kota_tinggal,
                tempat_lahir: tempat_lahir,
                tanggal_lahir: moment(tanggal_lahir).format("YYYY-MM-DD"),
                no_telp: no_telp,
                foto_sim: filename,
                plant: plant,
                // plant_name: plant_name,
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
    // plant,
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
                try {
                    const oraclient = await ora.getConnection();
                    let plantList = new Set();
                    try {
                        let updateData = {
                            position: "ADM",
                            update_at: moment().format(),
                            update_by: id_user,
                            // plant: plant,
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
                        // const insertWBNET = await FileUploadModel.savetoWBNET({
                        //     req_id: id_req,
                        // });
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
                            //insert driverdata
                            for (const d of driverData) {
                                const tglr = d.tanggal_lahir.split("-");
                                let tanggallahirstg = new Date(
                                    `${tglr[2]}-${tglr[1]}-${tglr[0]}T00:00:00`
                                );
                                let driverPayload = {
                                    DRIVERNAME: d.driver_name,
                                    LICENSENO: d.driver_id,
                                    LOCATION: d.location_sap,
                                    STGLLAHIR: tanggallahirstg,
                                    STMPLAHIR: d.tempat_lahir,
                                    SALAMAT1: d.alamat,
                                    SALAMAT2: d.alamat2,
                                    SALAMAT3: d.alamat3,
                                    SKOTA: d.kota_tinggal,
                                };
                                plantList.add(d.plant);
                                const [queOra, valOra] = crud.insertItemOra(
                                    "DRIVER",
                                    driverPayload
                                );
                                await oraclient.execute(queOra, valOra);
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
                                        path.join(
                                            path.resolve(),
                                            "public\\license"
                                        ) +
                                        "\\" +
                                        d.foto_sim;
                                } else {
                                    pathStream =
                                        path.join(
                                            path.resolve(),
                                            "public/license"
                                        ) +
                                        "/" +
                                        d.foto_sim;
                                }
                                driverAtth.push({
                                    filename: d.foto_sim,
                                    content: fs.createReadStream(pathStream),
                                });
                            }
                            const { rows: getNoDriver } =
                                await client.query(`select
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
                            //insert vehicle data
                            for (const v of vehData) {
                                let vehiclePayload = {
                                    CARPLATE: v.vhcl_id,
                                    LOCATION: v.location_sap,
                                    FLAG: "U",
                                };
                                plantList.add(v.plant);
                                const [queOra, valOra] = crud.insertItemOra(
                                    "TRUCK",
                                    vehiclePayload
                                );
                                await oraclient.execute(queOra, valOra);
                                idVeh.push(`'${v.id}'`);
                                vehHTML.push(`
                                    <tr>
                                        <td>${v.vhcl_id}</td>
                                    </tr>
                                    `);
                                let pathStream = "";
                                if (os.platform() === "win32") {
                                    pathStream =
                                        path.join(
                                            path.resolve(),
                                            "public\\stnk"
                                        ) +
                                        "\\" +
                                        v.foto_stnk;
                                } else {
                                    pathStream =
                                        path.join(
                                            path.resolve(),
                                            "public/stnk"
                                        ) +
                                        "/" +
                                        v.foto_stnk;
                                }
                                vehAtth.push({
                                    filename: v.foto_stnk,
                                    content: fs.createReadStream(pathStream),
                                });
                            }
                            const { rows: getNoVeh } =
                                await client.query(`select
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
                        await oraclient.commit();
                        const plantResult = Array.from(plantList).map(
                            item => `'${item}'`
                        );
                        console.log(plantResult);
                        return {
                            create_by: getCreateBy[0].create_by,
                            ticketNum: getCreateBy[0].request_id,
                            driverAtth: driverAtth,
                            driverHTML: driverHTML,
                            vehHTML: vehHTML,
                            vehAtth: vehAtth,
                            notDriver: notDriver,
                            notVeh: notVeh,
                            plant: plantResult,
                        };
                    } catch (error) {
                        await oraclient.rollback();
                        throw error;
                    } finally {
                        oraclient.release();
                    }
                } catch (error) {
                    throw error;
                }
            }
            await client.query(TRANS.COMMIT);
            return false;
        } catch (error) {
            console.error(error);
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

FileUploadModel.savetoWBNET = async ({ req_id }) => {
    try {
        const client = await db.connect();
        const ncry = new ncrypt(process.env.TOKEN_KEY);
        try {
            let plant = new Map();
            const { rows: vehData } = await client.query(
                `
                select vhcl_id,
                transportir, plant, mu.username, mwc.location_code from mst_vehicle mv
                left join mst_user mu on mv.create_by = mu.id_user
                left join mst_wbnet_conn mwc on mwc.plant = mv.plant
                where req_uuid = $1
                `,
                [req_id]
            );
            const { rows: drvData } = await client.query(
                `
                select driver_name, driver_id, alamat,
                mc.city as tempat_lahir, tanggal_lahir, no_telp,
                mwc.location_code,
                plant, mu.username from mst_driver md
                left join mst_user mu on md.create_by = mu.id_user
                left join mst_cities mc on mc.code = md.tempat_lahir 
                left join mst_wbnet_conn mwc on mwc.plant = md.plant
                where req_uuid = $1
                `,
                [req_id]
            );
            for (const row of vehData) {
                if (!plant.get(row.plant)?.vehicle) {
                    plant.set(row.plant, {
                        vehicle: [
                            {
                                truck_number: row.vhcl_id,
                                create_by: row.username,
                                transporter_code: row.transportir,
                                coy: row.plant.slice(0, 2),
                                location_code: row.location_code,
                                black_list: "N",
                                tipe: "H",
                                create_date: moment().format("YYYY-MM-DD"),
                            },
                        ],
                        ...plant.get(row.plant),
                    });
                } else {
                    plant.set(row.plant, {
                        vehicle: [
                            ...plantVeh.get(row.plant).vehicle,
                            {
                                truck_number: row.vhcl_id,
                                create_by: row.username,
                                transporter_code: row.transportir,
                                coy: row.plant.slice(0, 2),
                                location_code: row.location_code,
                                black_list: "N",
                                tipe: "H",
                                create_date: moment().format("YYYY-MM-DD"),
                            },
                        ],
                        ...plant.get(row.plant),
                    });
                }
            }

            for (const row of drvData) {
                if (!plant.get(row.plant)?.driver) {
                    plant.set(row.plant, {
                        driver: [
                            {
                                coy: row.plant.slice(0, 2),
                                location_code: row.location_code,
                                black_list: "N",
                                license_no: row.driver_id,
                                name: row.driver_name,
                                address: row.alamat.toUpperCase(),
                                birth_place: row.tempat_lahir,
                                birth_date: moment(row.tanggal_lahir).format(
                                    "YYYY-MM-DD"
                                ),
                                create_by: row.username,
                                create_date: moment().format("YYYY-MM-DD"),
                            },
                        ],
                        ...plant.get(row.plant),
                    });
                } else {
                    plant.set(row.plant, {
                        driver: [
                            ...plantDrv.get(row.plant).driver,
                            {
                                coy: row.plant.slice(0, 2),
                                location_code: row.location_code,
                                black_list: "N",
                                license_no: row.driver_id,
                                name: row.driver_name,
                                address: row.alamat.toUpperCase(),
                                birth_place: row.tempat_lahir,
                                birth_date: moment(row.tanggal_lahir).format(
                                    "YYYY-MM-DD"
                                ),
                                create_by: row.username,
                                create_date: moment().format("YYYY-MM-DD"),
                            },
                        ],
                        ...plant.get(row.plant),
                    });
                }
            }

            for (let [key, value] of plant) {
                try {
                    const { rows: wbconf } = await client.query(
                        `select * from mst_wbnet_conn where plant = $1`,
                        [key]
                    );
                    const confData = wbconf[0];
                    const conf = {
                        user: confData.username,
                        password: ncry.decrypt(confData.password),
                        server: confData.ip_host,
                        database: confData.dbase,
                    };
                    const sqlsclient = await Pool.newPool(conf).connect();
                    try {
                        const transaction = new sqls.Transaction(sqlsclient);
                        await transaction.begin();
                        try {
                            if (value.vehicle.length > 0) {
                                for (const d of value.vehicle) {
                                    const request = new sqls.Request(
                                        transaction
                                    );
                                    const insertData = await request
                                        .input(
                                            "truck_number",
                                            sqls.VarChar,
                                            d.truck_number
                                        )
                                        .input(
                                            "create_by",
                                            sqls.VarChar,
                                            d.create_by
                                        )
                                        .input(
                                            "transporter_code",
                                            sqls.VarChar,
                                            d.transporter_code
                                        )
                                        .input("coy", sqls.VarChar, d.coy)
                                        .input(
                                            "location_code",
                                            sqls.VarChar,
                                            d.location_code
                                        )
                                        .input(
                                            "black_list",
                                            sqls.VarChar,
                                            d.black_list
                                        )
                                        .input("tipe", sqls.VarChar, d.tipe)
                                        .input(
                                            "create_date",
                                            sqls.Date,
                                            d.create_date
                                        )
                                        .query(`insert into dbo.wb_truck (Truck_Number, Create_By, Transporter_Code, Coy, Location_Code, Black_List, Tipe, Create_Date) values
                                    (
                                        @truck_number,
                                        @create_by,
                                        @transporter_code,
                                        @coy,
                                        @location_code,
                                        @black_list,
                                        @tipe,
                                        @create_date
                                    ) ;`);
                                }
                            }
                            if (value.driver.length > 0) {
                                for (const d of value.driver) {
                                    const request = new sqls.Request(
                                        transaction
                                    );
                                    const insertData = await request
                                        .input(
                                            "create_by",
                                            sqls.VarChar,
                                            d.create_by
                                        )
                                        .input(
                                            "transporter_code",
                                            sqls.VarChar,
                                            d.transporter_code
                                        )
                                        .input("coy", sqls.VarChar, d.coy)
                                        .input(
                                            "location_code",
                                            sqls.VarChar,
                                            d.location_code
                                        )
                                        .input(
                                            "black_list",
                                            sqls.VarChar,
                                            d.black_list
                                        )
                                        .input(
                                            "license_no",
                                            sqls.VarChar,
                                            d.license_no
                                        )
                                        .input("name", sqls.VarChar, d.name)
                                        .input(
                                            "address",
                                            sqls.VarChar,
                                            d.address
                                        )
                                        .input(
                                            "birth_place",
                                            sqls.VarChar,
                                            d.birth_place
                                        )
                                        .input(
                                            "birth_date",
                                            sqls.Date,
                                            d.birth_date
                                        )
                                        .input(
                                            "create_date",
                                            sqls.Date,
                                            d.create_date
                                        ).query(`insert into dbo.wb_driver (
                                        Create_By,
                                        Coy,
                                        Location_Code,
                                        Black_List,
                                        License_no,
                                        Name,
                                        Address, 
                                        Birth_Place,
                                        Birth_Date, 
                                        Create_Date    
                                        ) values
                                    (
                                        @create_by,
                                        @coy,
                                        @location_code,
                                        @black_list,
                                        @license_no,
                                        @name,
                                        @address, 
                                        @birth_place,
                                        @birth_date,
                                        @create_date
                                    ) ;`);
                                }
                            }
                            await transaction.commit();
                        } catch (error) {
                            await transaction.rollback();
                            throw error;
                        }
                    } catch (error) {
                        throw error;
                    } finally {
                        sqlsclient.close();
                    }
                } catch (error) {
                    throw error;
                }
            }
            return "Success insert wbnet";
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

// FileUploadModel.saveDrvtoWBNET = async ({req_id}) => {
//     try {
//         const client = await db.connect();
//         const ncry = new ncrypt(process.env.TOKEN_KEY);
//         try {
//             let plant = new Map();
//             const { rows } = await client.query(
//                 `
//                 select driver_name, driver_id, alamat,
//                 tempat_lahir, tanggal_lahir, no_telp,
//                 plant, mu.username from mst_driver
//                 left join mst_user mu on mv.create_by = mu.id_user
//                 where req_id = $1
//                 `,
//                 [req_id]
//             );
//             for (const row of rows) {
//                 if (!plant.get(row.plant)) {
//                     plant.set(row.plant, [
//                         {
//                             coy: row.plant.slice(0, 2),
//                             location_code: row.plant.slice(2, 4),
//                             black_list: "N",
//                             license_no : row.driver_id,
//                             name : row.driver_name,
//                             address : row.address.toUpperCase(),
//                             birth_place : row.tempat_lahir,
//                             birth_date : moment(row.tanggal_lahir).format('YYYY-MM-DD'),
//                             create_by : row.username
//                         },
//                     ]);
//                 } else {
//                     plant.set(row.plant, [
//                         ...plant.get(row.plant),
//                         {
//                             coy: row.plant.slice(0, 2),
//                             location_code: row.plant.slice(2, 4),
//                             black_list: "N",
//                             license_no : row.driver_id,
//                             name : row.driver_name,
//                             address : row.address.toUpperCase(),
//                             birth_place : row.tempat_lahir,
//                             birth_date : moment(row.tanggal_lahir).format('YYYY-MM-DD'),
//                             create_by : row.username
//                         },
//                     ]);
//                 }
//             }

//             for (let [key, value] of plant) {
//                 try {
//                     const { rows: wbconf } = await client.query(
//                         `select * from mst_wbnet_conn where plant = $1`,
//                         [key]
//                     );
//                     const confData = wbconf[0];
//                     const conf = {
//                         user: confData.username,
//                         password: ncry.decrypt(confData.password),
//                         server: confData.ip_host,
//                         database: confData.dbase,
//                     };
//                     const sqlsclient = await Pool.newPool(conf).connect();
//                     try {
//                         const transaction = new sqls.Transaction(sqlsclient);
//                         await transaction.begin();
//                         const { recordsets } = await sqlsclient.query(
//                             `select max(uniq) as last_id from dbo.wb_driver`
//                         );
//                         let last_id = recordsets[0][0].last_id;
//                         const request = new sqls.Request(transaction);
//                         try {

//                             for (const d of value) {
//                                 const insertData = await request
//                                     .input("create_by", sqls.VarChar, d.create_by)
//                                     .input(
//                                         "transporter_code",
//                                         sqls.VarChar,
//                                         d.transporter_code
//                                     )
//                                     .input("coy", sqls.VarChar, d.coy)
//                                     .input(
//                                         "location_code",
//                                         sqls.VarChar,
//                                         d.location_code
//                                     )
//                                     .input("black_list", sqls.VarChar, d.black_list)
//                                     .input("uniq", sqls.BigInt, last_id + 1)
//                                     .input('license_no', sqls.VarChar, d.license_no)
//                                     .input('name', sqls.VarChar, d.driver_name)
//                                     .input('address', sqls.VarChar, d.address)
//                                     .input('birth_place', sqls.VarChar, d.birth_place)
//                                     .input('birth_date', sqls.Date, d.birth_date)
//                                     .request(`insert into dbo.wb_driver set(
//                                     create_by,
//                                     transporter_code,
//                                     coy,
//                                     location_code,
//                                     black_list,
//                                     uniq,
//                                     license_no,
//                                     name,
//                                     address,
//                                     birth_place,
//                                     birth_date
//                                     ) values
//                                 (
//                                     @create_by,
//                                     @transporter_code,
//                                     @coy,
//                                     @location_code,
//                                     @black_list,
//                                     @uniq,
//                                     @license_no,
//                                     @name,
//                                     @address,
//                                     @birth_place,
//                                     @birth_date
//                                 ) ;`);
//                                 last_id = last_id + 1;
//                             }
//                             await transaction.commit() ;
//                         } catch (error) {
//                             await transaction.rollback() ;
//                             throw error ;
//                         }
//                     } catch (error) {
//                         throw error ;
//                     } finally {
//                         sqlsclient.close();
//                     }
//                 } catch (error) {
//                     throw error ;
//                 }
//             }
//         } catch (error) {
//             throw error ;
//         } finally {
//             client.release();
//         }
//     } catch (error) {
//         throw error ;
//     }
// }

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
