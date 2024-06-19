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
        // console.log(email);
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

EmailModel.ApprovalRequest = async (
    driver,
    vehicle,
    target,
    driver_atth,
    veh_atth,
    ticket_num,
    linkapprove,
    linkreject
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.ApprovalReqDrvVeh(
            vehicle,
            driver,
            ticket_num,
            linkapprove,
            linkreject
        );
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            subject: `Approval Request Create New Driver / Vehicle (${ticket_num})`,
            html: EmailHTML,
            attachments: [...driver_atth, ...veh_atth],
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.RequestCreateDrvVeh = async (
    driver,
    vehicle,
    cc,
    target,
    driver_atth,
    veh_atth,
    nodriver,
    novehicle,
    ticket_num,
    reason
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.SendToKrani(
            driver.join(""),
            vehicle.join(""),
            nodriver.join(""),
            novehicle.join(""),
            reason
        );
        const EmailReqHTML = EmailGen.RequestDrivernVehic(driver, vehicle);
        const setup2 = {
            from: process.env.SMTP_USERNAME,
            to: target,
            subject: `Request Create New Driver / Vehicle`,
            html: EmailReqHTML,
            attachments: [...driver_atth, ...veh_atth],
        };
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: cc,
            subject: `Approved Create New Driver / Vehicle (${ticket_num})`,
            html: EmailHTML,
            attachments: [...driver_atth, ...veh_atth],
        };
        await tp.sendMail(setup);
        await tp.sendMail(setup2);
    } catch (error) {
        throw error;
    }
};

EmailModel.RejectRequestDrvVeh = async (
    target,
    cc,
    remark_reject,
    nodriver,
    noveh,
    ticket_num
) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.RejectRequestDriver(
            remark_reject,
            nodriver,
            noveh
        );
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            cc: cc,
            subject: `Reject Request New Driver / Vehicle (${ticket_num})`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.CancelLoadingNote = async (remark, loadingnotereq, target) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.CancelLoadingNote(loadingnotereq, remark);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            subject: `Loading Note Request Canceled`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.ProcessedKrani = async (target, cc, driver, vehicle, ticket_num) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.ProcessedKrani(driver, vehicle);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            cc: cc,
            subject: `Processed New Driver / Vehicle ${ticket_num}`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.RequestDeleteLN = async (target, cc, reqrow, remark, link) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.DeleteRequest(remark, reqrow.join(""), link);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            cc: cc,
            subject: `Request Delete Loading Note`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.RejectDeleteReq = async (target, cc, reqrow, remark) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.RejectDeleteReq(reqrow.join(""), remark);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            cc: cc,
            subject: `Rejected Delete Request Loading Note`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.ApproveDeleteReq = async (target, cc, reqrow) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.ApprovedDeleteReq(reqrow.join(""));
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            cc: cc,
            subject: `Approved Delete Loading Note`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.ReminderDeadlinesLN = async (target, loadingnotes) => {
    try {
        const tp = EmailTP.Transporter();
        const EmailHTML = EmailGen.ReminderLN(loadingnotes);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: target,
            subject: `Reminder Loading Note`,
            html: EmailHTML,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};
module.exports = EmailModel;
