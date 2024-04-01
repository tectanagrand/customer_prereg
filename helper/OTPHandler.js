const OTPgen = require("otp-generator");
const bcrypt = require("bcryptjs");
const db = require("../config/connection");
const moment = require("moment");
const crud = require("./crudquery");
const TRANS = require("../config/transaction");
const jwt = require("jsonwebtoken");

const OTP = {
    createOTP: (length = 6, props) => {
        try {
            const otpCode = OTPgen.generate(
                length,
                props
                    ? { ...props }
                    : {
                          digits: true,
                          lowerCaseAlphabets: false,
                          upperCaseAlphabets: false,
                          specialChars: false,
                      }
            );
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
    validateNewOTP: async (otpInput, username) => {
        try {
            const client = await db.connect();
            const today = moment();
            try {
                await client.query(TRANS.BEGIN);
                const { rows, rowCount } = await client.query(
                    "SELECT otp_value, otp_validto FROM mst_user where username = $1",
                    [username]
                );
                if (rowCount < 0) {
                    throw new Error("Username not found");
                }
                if (moment(rows[0].otp_validto) < today) {
                    throw new Error("OTP expired");
                }
                if (!bcrypt.compareSync(otpInput, rows[0].otp_value)) {
                    throw new Error("OTP not valid");
                }
                const token = jwt.sign(
                    { username: username },
                    process.env.TOKEN_KEY,
                    { expiresIn: "5m" }
                );
                return token;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
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
