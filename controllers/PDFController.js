const db = require("../config/connection");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const PDFController = {};

PDFController.exportSuratJalan = async (req, res) => {
    const load_noteid = req.body.loadnote;
    const doc = new PDFDocument({ size: "A4" });
    try {
        const client = await db.connect();
        try {
            const { rows } = await client.query(
                `
      SELECT  
      DET.driver_id,
      DET.driver_name,
      DET.vhcl_id,
      DET.fac_plant,
      DET.ln_num,
      TO_CHAR(DET.cre_date, 'MM-DD-YYYY') as CRE_DATE,
      DET.plan_qty,
      HD.UOM,
      HD.DESC_CON,
      HD.ID_DO,
      CUST.NAME_1
      FROM LOADING_NOTE_DET DET
      LEFT JOIN LOADING_NOTE_HD HD ON DET.HD_FK = HD.HD_ID
      LEFT JOIN MST_USER USR ON HD.CREATE_BY = USR.ID_USER
      LEFT JOIN MST_CUSTOMER CUST ON USR.SAP_CODE = CUST.KUNNR
      WHERE DET.DET_ID = $1
      `,
                [load_noteid]
            );
            const dt = rows[0];
            doc.fontSize(20).text(dt.name_1, 100, 80);
            doc.fontSize(20).text("Surat Jalan", 400, 80);
            doc.fontSize(12).text("No SJ", 380, 120);
            doc.fontSize(12).text(dt.ln_num, 420, 120);

            doc.fontSize(12).text("Tanggal Pengambilan :", 100, 140);
            doc.fontSize(12).text(moment().format("MM-DD-YYYY"), 230, 140, {
                width: 120,
            });
            doc.fontSize(12).text("Nama Supir :", 100, 170);
            doc.fontSize(12).text(dt.driver_name, 180, 170, { width: 120 });
            doc.fontSize(12).text("No Polisi : ", 100, 200);
            doc.fontSize(12).text(dt.vhcl_id, 180, 200, { width: 120 });
            doc.fontSize(12).text("No Do :", 100, 230);
            doc.fontSize(12).text(dt.id_do, 180, 230, { width: 120 });
            doc.fontSize(12).text("Tujuan :", 300, 170);
            doc.fontSize(12).text(dt.fac_plant, 390, 170, { width: 120 });
            doc.fontSize(12).text("Alamat :", 300, 200);
            doc.fontSize(12).text("XXXXXXXXXXXXX", 390, 200, { width: 120 });
            doc.fontSize(12).text("Tanggal DO :", 300, 230);
            doc.fontSize(12).text(dt.cre_date, 390, 230, { width: 120 });

            var xline = 260;

            doc.moveTo(100, xline).lineTo(500, xline).stroke();
            doc.text("Nama Barang", 100, xline + 10);
            doc.text("Jumlah", 350, xline + 10);
            doc.text("Satuan", 450, xline + 10);
            doc.moveTo(100, xline + 30)
                .lineTo(500, xline + 30)
                .stroke();

            var lastRow = xline + 30;
            var col = [100, 350, 450];
            for (const data of rows) {
                lastRow += 30;
                doc.text(data.desc_con, col[0], lastRow, { width: 220 });
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
            res.status(200);
            doc.end();
        } catch (error) {
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
