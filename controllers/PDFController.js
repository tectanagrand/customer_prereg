const db = require("../config/connection");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const crud = require("../helper/crudquery");
const TRANS = require("../config/transaction");

const PDFController = {};

PDFController.exportSuratJalan = async (req, res) => {
    const load_noteid = req.body.loadnote;
    const doc = new PDFDocument({ size: "A4" });
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                `
                SELECT  
                DET.driver_id,
                DET.driver_name,
                DET.vhcl_id,
                DET.fac_plant,
                DET.ln_num,
                TO_CHAR(DET.cre_date, 'DD-MM-YYYY') as CRE_DATE,
                DET.plan_qty,
                HD.UOM,
                HD.DESC_CON,
                HD.ID_DO,
                HD.material,
                CO.name as comp_name,
                HD.company,
                CUST.NAME_1,
                CUST.KUNNR,
                PLT.ALAMAT,
                DET.print_count,
                DET.is_multi
                FROM LOADING_NOTE_DET DET
                LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
                LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
                LEFT JOIN MST_CUSTOMER CUST ON USR.USERNAME = CUST.KUNNR OR USR.SAP_CODE = CUST.KUNNR
                LEFT JOIN MST_COMPANY CO ON CO.SAP_CODE = HD.COMPANY
                LEFT JOIN MST_COMPANY_PLANT PLT ON PLT.PLANT_CODE = HD.PLANT         
                 WHERE DET.DET_ID = $1
                ORDER BY DET.ID DESC
      `,
                [load_noteid]
            );
            let watermark;
            const dt = rows[0];
            if (!dt.print_count) {
                watermark = "Original Document";
            } else {
                watermark = `Copy of original (${dt.print_count})`;
            }
            const [queUp, insUp] = crud.updateItem(
                "loading_note_det",
                {
                    print_count: dt.print_count
                        ? parseInt(dt.print_count) + 1
                        : 1,
                },
                { det_id: load_noteid },
                "det_id"
            );
            console.log(queUp);
            await client.query(queUp, insUp);
            doc.opacity(0.3);
            doc.rotate(-35);
            doc.fontSize(60).text(watermark, -200, 200);
            doc.text("KPN CORP", -200, 300);
            doc.fontSize(60).text(watermark, -200, 400);
            doc.text("KPN CORP", -200, 500);
            doc.fontSize(60).text(watermark, -200, 600);
            doc.text("KPN CORP", -200, 700);

            doc.save();
            doc.rotate(35);
            doc.opacity(1);
            doc.fontSize(20).text(`${dt.name_1} (${dt.kunnr})`, 100, 90);
            doc.fontSize(20).text("Surat Jalan", 400, 50);
            if (dt.is_multi) {
                doc.fontSize(10).text("(Multi Con.)", 400, 70);
            }
            // doc.fontSize(12).text("No LN :", 380, 120);
            // doc.fontSize(12).text(dt.ln_num, 420, 120);
            doc.fontSize(12).text("No LN :", 100, 140);
            doc.fontSize(12).text(dt.ln_num, 180, 140);

            doc.fontSize(12).text("Tgl. Pengambilan :", 300, 140);
            doc.fontSize(12).text(moment().format("DD-MM-YYYY"), 420, 140, {
                width: 120,
            });
            // doc.fontSize(12).text("Tanggal Pengambilan :", 100, 140);
            // doc.fontSize(12).text(moment().format("MM-DD-YYYY"), 230, 140, {
            //     width: 120,
            // });
            doc.fontSize(12).text("Nama Supir :", 100, 170);
            doc.fontSize(12).text(dt.driver_name, 180, 170, { width: 120 });
            doc.fontSize(12).text("No Polisi : ", 100, 200);
            doc.fontSize(12).text(dt.vhcl_id, 180, 200, { width: 120 });
            doc.fontSize(12).text("No Do :", 100, 230);
            doc.fontSize(12).text(dt.id_do, 180, 230, { width: 120 });
            doc.fontSize(12).text("Tanggal DO :", 300, 170);
            doc.fontSize(12).text(dt.cre_date, 390, 170, { width: 120 });
            doc.fontSize(12).text("Tujuan :", 300, 200);
            doc.fontSize(12).text(
                `${dt.comp_name}(${dt.fac_plant})`,
                390,
                200,
                { width: 120 }
            );
            doc.fontSize(12).text("Alamat :", 300, 230);
            doc.fontSize(12).text(dt.alamat, 355, 230, { width: 120 });

            var xline = 350;

            doc.moveTo(100, xline).lineTo(500, xline).stroke();
            doc.text("Material", 100, xline + 10);
            doc.text("Planned Qty", 350, xline + 10);
            doc.text("UOM", 450, xline + 10);
            doc.moveTo(100, xline + 30)
                .lineTo(500, xline + 30)
                .stroke();

            var lastRow = xline + 30;
            var col = [100, 350, 450];
            for (const data of rows) {
                lastRow += 30;
                doc.text(
                    `${data.desc_con}(${data.material})`,
                    col[0],
                    lastRow,
                    { width: 220 }
                );
                doc.text(data.plan_qty, col[1], lastRow, { width: 85 });
                doc.text(data.uom, col[2], lastRow, { width: 80 });
            }
            lastRow += 30;

            doc.moveTo(col[1] - 10, xline)
                .lineTo(col[1] - 10, lastRow)
                .stroke();
            doc.moveTo(col[2] - 10, xline)
                .lineTo(col[2] - 10, lastRow)
                .stroke();

            doc.fontSize(12).text("Hormat Kami", 100, lastRow + 80);
            doc.fontSize(12).text(dt.name_1, 100, lastRow + 160);
            doc.fontSize(12).text(dt.driver_name, 400, lastRow + 160);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="SuratJalan_DO-${rows[0].id_do}.pdf"`
            );
            doc.pipe(res);
            await client.query(TRANS.COMMIT);
            res.status(200);
            doc.end();
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

module.exports = PDFController;
