const EmailTP = require("../helper/Emailer");
const EmailGen = require("../helper/EmailGen");

const EmailModel = {};

EmailModel.NotifyEmail = async email_list => {
    try {
        const tp = EmailTP.Transporter();
        const em_ls = Object.fromEntries(email_list);
        if (email_list.size > 0) {
            for (const em in em_ls) {
                const EmailHTML = EmailGen.PushedSAP(em_ls[em].join(" "));
                const setup = {
                    from: process.env.SMTP_USERNAME,
                    to: em,
                    subject: "Notification Pushed Loading Note",
                    html: EmailHTML,
                };
                await tp.sendMail(setup);
            }
        }
    } catch (error) {
        throw error;
    }
};

EmailModel.newUserNotify = async (email, username, pass, url_web) => {
    try {
        const tp = EmailTP.Transporter();
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: email,
            subject: "New Logistic Account Prereg App Credentials",
            text: `
            Dengan hormat Bapak/Ibu,
            Akun web app Customer Preregistration anda sudah dibuat dengan credentials sebagai berikut :
            
            Email : ${email}
            Username : ${username}
            Password : ${pass}

            Mohon untuk dapat login dengan credential berikut :
            ${url_web}
            Terimakasih

            Hormat kami,

            KPN ERP
            `,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.notifyRequestSend = async (
    id_do,
    customer,
    material,
    plant,
    email_target,
    email_cc
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.NotifyLogistic(
            id_do,
            customer,
            material,
            plant
        );
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: email_target,
            cc: email_cc,
            subject: `Notification New Request ${id_do} - ${customer}`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};
module.exports = EmailModel;
