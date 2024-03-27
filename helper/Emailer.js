const mailer = require("nodemailer");

const Mailer = {};
Mailer.Transporter = () => {
    const tp = mailer.createTransport({
        host: process.env.SMTP_HOST,
        secure: true,
        port: process.env.SMPT_PORT,
        tls: {
            ciphers: "SSLv3",
            rejectUnauthorized: false,
        },
        auth: {
            user: `${process.env.SMTP_USERNAME}`,
            pass: `${process.env.SMTP_PASSWORD}`,
        },
    });
    return tp;
};
module.exports = Mailer;
