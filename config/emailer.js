const mailer = require("nodemailer");

const tp = mailer.createTransport({
    host: process.env.SMTP_HOST,
    secure: true,
    port: 465,
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
    auth: {
        user: `${process.env.SMTP_USERNAME}`,
        pass: `${process.env.SMTP_PASSWORD}`,
    },
});

module.exports = tp;
