const OTPgen = require("otp-generator");
const bcrypt = require("bcryptjs");
const db = require("../config/connection");
const moment = require("moment");

const OTP = {
    createOTP: () => {
        try {
            const otpCode = OTPgen.generate(6, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });
            let validUntil = new Date();
            validUntil.setMinutes(validUntil.getMinutes() + 5);
            const salt = bcrypt.genSaltSync(10);
            const encodedOTP = bcrypt.hashSync(otpCode, salt);
            return [otpCode, encodedOTP, validUntil];
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    validateOTP: async (otpInput, email) => {
        const client = await db.connect();
        try {
            const getDataOTP = await client.query(
                `
        SELECT * from otp_transaction where email = $1
      `,
                [email]
            );
            const data = getDataOTP.rows;
            if (data.length == 0) {
                throw new Error("Not Requesting any OTP");
            }
            const otpHashed = data[0].otp_code;
            const otpTimelimit = new Date(data[0].valid_until);
            const now = new Date();
            if (now > otpTimelimit) {
                throw new Error("OTP Expired");
            }
            const compareOTP = bcrypt.compareSync(otpInput, otpHashed);
            if (!compareOTP) {
                throw new Error("OTP not valid");
            }
            return compareOTP;
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = OTP;
