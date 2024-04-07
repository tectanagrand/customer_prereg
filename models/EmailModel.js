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
            to: email.join(", "),
            subject: "New Account Prereg App Verification",
            text: `
            Dengan hormat Bapak/Ibu,
            Akun web app Customer Preregistration anda sudah dibuat dan perlu diverifikasi dengan credentials sebagai berikut :
            
            Username : ${username}
            OTP : ${pass}

            Mohon untuk dapat memverifikasi akun di ${url_web}
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

EmailModel.resetPasswordNotify = async (email, username, pass, url_web) => {
    try {
        console.log(email);
        const tp = EmailTP.Transporter();
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: email,
            subject: "Reset Password Account Prereg App Verification",
            text: `
            Dengan hormat Bapak/Ibu,
            Akun web app Customer Preregistration anda sudah direset dan perlu diverifikasi dengan credentials sebagai berikut :
            
            Username : ${username}
            OTP : ${pass}

            Mohon untuk dapat memverifikasi akun di ${url_web}
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
    table_det,
    email_target,
    email_cc,
    hostname
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.NotifyLogistic(
            id_do,
            customer,
            material,
            plant,
            table_det,
            hostname
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

EmailModel.NotifyCreateDriverNVehi = async (
    driver,
    vehicle,
    target,
    driver_atth,
    veh_atth
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.RequestDrivernVehic(driver, vehicle);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            subject: `Request Create New Driver / Vehicle`,
            html: EmailHTML,
            attachments: [...driver_atth, ...veh_atth],
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};
module.exports = EmailModel;
