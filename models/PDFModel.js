const qrcode = require("qrcode");
const path = require("path");
const moment = require("moment");
const fs = require("fs");

const PDFModel = {
    GenerateSuratJalanQR: data => {
        return new Promise((resolve, reject) => {
            const qr_path = path.resolve(
                path.join(__dirname, "../public/qrcodetemp")
            );
            const unix = moment().unix();
            const filepath = path.join(qr_path, `${unix}_qr.png`);
            if (!fs.existsSync(qr_path)) {
                fs.mkdirSync(qr_path);
            }
            qrcode.toFile(filepath, JSON.stringify(data), err => {
                if (err) reject(err);
                resolve(filepath);
            });
        });
    },
};

module.exports = PDFModel;
